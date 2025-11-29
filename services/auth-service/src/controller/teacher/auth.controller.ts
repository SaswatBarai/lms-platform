import { prisma } from "@lib/prisma.js";
import { CreateTeacherBulkInput, NonTeachingStaffRole, UpdatePasswordTeacherInput, ResetForgotPasswordTeacherInput } from "../../types/organization.js";
import { AppError } from "@utils/AppError.js";
import { asyncHandler } from "@utils/asyncHandler.js";
import { Request, Response } from "express";
import * as crypto from "node:crypto";
import { hashPassword, verifyPassword, PasetoV4SecurityManager, validateEmail } from "@utils/security.js";
import { KafkaProducer } from "@messaging/producer.js";
import redisClient from "@config/redis.js";
import process from "node:process";

interface ValidationError {
    index: number;
    field: string;
    value: string;
    message: string;
}

const generateEmployeeNo = async():Promise<string> => {
    const prefix = "SOA";
    function randomAlphaNumeric(length:number = 5):string {
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        let result = "";
        for(let i =0; i<length; i++){
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }
    let exist = true;
    let attempts = 0;
    const MAX_ATTEMPTS = 10;
    let employeeNo = "";
    
    do {
        const randomAlpha = randomAlphaNumeric();
        employeeNo = `${prefix}${randomAlpha}`;
        const existing = await prisma.teacher.findUnique({
            where: { employeeNo },
            select: { employeeNo: true }
        });
        if (!existing) {
            exist = false;
        }
        attempts++;
    }while(exist && attempts < MAX_ATTEMPTS);

    return employeeNo;
}

export const createBulkTeacherController = asyncHandler(
    async(req:Request, res:Response) => {
        const {role,collegeId:NonTeachingStaffCollegeId} = req.nonTeachingStaff;
        const {collegeId,teachers}:CreateTeacherBulkInput = req.body;
        
        if(role !== NonTeachingStaffRole.STUDENT_SECTION){
            throw new AppError("You are not authorized to create teachers. Only student section staff can create teachers.", 403);
        }
        if(collegeId !== NonTeachingStaffCollegeId){
            throw new AppError("You are not authorized to create teachers for this college.", 403);
        }
        if(teachers.length === 0){
            throw new AppError("Must provide at least one teacher.", 400);
        }
        if(teachers.length > 500){
            throw new AppError("Cannot create more than 500 teachers at once.", 400);
        }

        // Check for existing teachers in database
        const existingTeachers = await prisma.teacher.findMany({
                where:{
                OR:[
                    {
                        email:{
                            in:teachers.map(teacher => teacher.email)
                        }
                    },
                    {
                        phone:{
                            in:teachers.map(teacher => teacher.phone)
                        }
                    }
                ]
            },
            select: {
                email: true,
                phone: true
            }
        });

        // Create Sets for fast lookup
        const existingEmails = new Set(existingTeachers.map(t => t.email));
        const existingPhones = new Set(existingTeachers.map(t => t.phone));

        // Track duplicates within the input array
        const seenEmails = new Set<string>();
        const seenPhones = new Set<string>();
        const validationErrors: ValidationError[] = [];
        const validTeachers: typeof teachers = [];

        // Validate each teacher and collect errors with indices
        teachers.forEach((teacher, index) => {
            let hasError = false;

            // Check if email already exists in database
            if (existingEmails.has(teacher.email)) {
                validationErrors.push({
                    index,
                    field: "email",
                    value: teacher.email,
                    message: `Email '${teacher.email}' already exists in database`
                });
                hasError = true;
            }
            // Check if email is duplicate within the input
            else if (seenEmails.has(teacher.email)) {
                validationErrors.push({
                    index,
                    field: "email",
                    value: teacher.email,
                    message: `Duplicate email '${teacher.email}' in input`
                });
                hasError = true;
            }

            // Check if phone already exists in database
            if (existingPhones.has(teacher.phone)) {
                validationErrors.push({
                    index,
                    field: "phone",
                    value: teacher.phone,
                    message: `Phone '${teacher.phone}' already exists in database`
                });
                hasError = true;
            }
            // Check if phone is duplicate within the input
            else if (seenPhones.has(teacher.phone)) {
                validationErrors.push({
                    index,
                    field: "phone",
                    value: teacher.phone,
                    message: `Duplicate phone '${teacher.phone}' in input`
                });
                hasError = true;
            }

            // If no errors, add to valid teachers and track seen values
            if (!hasError) {
                validTeachers.push(teacher);
                seenEmails.add(teacher.email);
                seenPhones.add(teacher.phone);
            }
        });

        // Return error response if there are validation errors
        if (validationErrors.length > 0) {
            return res.status(400).json({
                success: false,
                message: "Some teachers could not be created due to validation errors",
                errors: validationErrors,
                invalidCount: validationErrors.length,
                validCount: validTeachers.length,
                totalSubmitted: teachers.length
            });
        }

        if(validTeachers.length === 0){
            throw new AppError("No valid teachers to create after validation", 400);
        }

        // Get college name for email
        const college = await prisma.college.findUnique({
            where: { id: collegeId },
            select: { name: true }
        });

        if (!college) {
            throw new AppError("College not found", 404);
        }

        interface TeacherMessage {
            email: string;
            name: string;
            password: string;
            employeeNo: string;
        }
        const teacherMessages: TeacherMessage[] = [];
        const teachersToCreate: Array<{
            departmentId: string;
            name: string;
            email: string;
            phone: string;
            gender: "MALE" | "FEMALE" | "OTHER";
            password: string;
            employeeNo: string;
        }> = [];

        // Prepare teachers for database insertion
        for(const teacher of validTeachers){
            const {departmentId, email, phone, name, gender} = teacher;
            
            // Generate a random password 
            const password = crypto.randomBytes(8).toString("hex");
            const hashedPassword = await hashPassword(password);
            const employeeNo = await generateEmployeeNo();
            
            // Add to teachers to create
            teachersToCreate.push({
                departmentId,
                name,
                email,
                phone,
                gender,
                password: hashedPassword,
                employeeNo
            });
            
            // Store for email notification
            teacherMessages.push({
                email,
                name,
                password,
                employeeNo
            });
        }

        // Database insertion
        const createdTeachers = await prisma.teacher.createMany({
            data: teachersToCreate,
            skipDuplicates: false
        });

        // Send welcome emails via Kafka
        const kafkaProducer = KafkaProducer.getInstance();
        for (const teacherData of teacherMessages) {
            try {
                await kafkaProducer.sendTeacherWelcomeEmail(
                    teacherData.email,
                    teacherData.name,
                    teacherData.password,
                    teacherData.employeeNo,
                    college.name,
                    "http://localhost:8000/auth/api/login-teacher"
                );
            } catch (emailError) {
                // Log error but don't fail the request
                console.error(`[auth] Failed to queue welcome email for ${teacherData.email}:`, emailError);
            }
        }

        res.status(201).json({
            success: true,
            message: `${createdTeachers.count} teacher(s) created successfully. Welcome emails will be sent shortly.`,
            created: createdTeachers.count,
            total: teachers.length
        });
    }
)

export const loginTeacherController = asyncHandler(
    async(req:Request,res:Response) => {
        const { identifier, password }: { identifier: string; password: string } = req.body;

        if(!identifier || !password){
            throw new AppError("Email/Employee number and password are required", 400);
        }

        // Find teacher by email or employeeNo
        const teacher = await prisma.teacher.findFirst({
            where: {
                OR: [
                    { email: identifier.toLowerCase() },
                    { employeeNo: identifier.toUpperCase() }
                ]
            },
            include: {
                department: {
                    include: {
                        college: {
                            select: {
                                id: true,
                                name: true,
                                organizationId: true
                            }
                        }
                    }
                }
            }
        });

        if (!teacher) {
            throw new AppError("Invalid credentials. Please check your email/employee number and password.", 401);
        }

        // Verify password
        const isPasswordValid = await verifyPassword(teacher.password, password);
        if (!isPasswordValid) {
            throw new AppError("Invalid credentials. Please check your email/employee number and password.", 401);
        }

        // Single device login: Handle session management
        const sessionKey = `activeSession:teacher:${teacher.id}`;
        const existingSessionId = await redisClient.hget(sessionKey, 'sessionId');
        if (existingSessionId) {
            await redisClient.hdel(sessionKey, 'sessionId');
        }

        const accessSessionId = crypto.randomBytes(16).toString('hex');

        // Create token payload
        const tokenPayload = {
            id: teacher.id,
            email: teacher.email,
            name: teacher.name,
            employeeNo: teacher.employeeNo,
            role: "teacher",
            type: "teacher",
            departmentId: teacher.departmentId,
            collegeId: teacher.department.collegeId,
            organizationId: teacher.department.college.organizationId,
            sessionId: accessSessionId
        };

        // Store session in Redis
        await redisClient.hset(sessionKey, {
            sessionId: accessSessionId,
            teacherId: teacher.id,
            organizationId: teacher.department.college.organizationId,
            collegeId: teacher.department.collegeId,
            active: 'true',
        });
        await redisClient.expire(sessionKey, 1 * 24 * 60 * 60); // 1 day

        // Generate tokens
        const securityManager = PasetoV4SecurityManager.getInstance();
        const accessToken = await securityManager.generateAccessToken(tokenPayload);
        const refreshSessionId = crypto.randomBytes(16).toString('hex');
        const refreshToken = await securityManager.generateRefreshToken(teacher.id, refreshSessionId);

        // Set cookies
        const isProduction = process?.env?.NODE_ENV === "production";
        res.cookie("accessToken", accessToken, {
            httpOnly: true,
            secure: isProduction,
            maxAge: 1 * 24 * 60 * 60 * 1000 // 1 day
        });
        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: isProduction,
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        return res.status(200).json({
            success: true,
            message: "Login successful",
            data: {
                accessToken,
                teacher: {
                    id: teacher.id,
                    name: teacher.name,
                    email: teacher.email,
                    employeeNo: teacher.employeeNo,
                    department: teacher.department.name,
                    college: teacher.department.college.name
                }
            }
        });
    } 
)

export const forgotPasswordTeacherController = asyncHandler(
    async(req:Request, res:Response) => {
        const {email} = req.body;

        if (!email || !validateEmail(email)) {
            throw new AppError("Valid email is required", 400);
        }

        const teacher = await prisma.teacher.findUnique({
            where: { email: email.toLowerCase() },
            include: {
                department: {
                    include: {
                        college: {
                            select: {
                                name: true
                            }
                        }
                    }
                }
            }
        });

        if (!teacher) {
            // Don't reveal if email exists or not for security
            return res.status(200).json({
                success: true,
                message: "If an account with this email exists, a password reset link has been sent."
            });
        }

        const sessionToken = crypto.randomBytes(32).toString("hex");
        await redisClient.setex(`teacher-forgot-password-${email.toLowerCase()}`, 10 * 60, sessionToken);

        // Send forgot password email via Kafka
        const kafkaProducer = KafkaProducer.getInstance();
        try {
            await kafkaProducer.sendTeacherForgotPassword(
                teacher.email,
                sessionToken,
                teacher.name,
                teacher.employeeNo,
                teacher.department.college.name,
                teacher.department.name
            );
        } catch (error) {
            console.error(`[auth] Failed to send forgot password email for ${teacher.email}:`, error);
        }

        return res.status(200).json({
            success: true,
            message: "If an account with this email exists, a password reset link has been sent."
        });
    }
)

export const resetForgotPasswordTeacherController = asyncHandler(
    async(req:Request, res:Response) => {
        const {email, sessionToken, newPassword}:ResetForgotPasswordTeacherInput = req.body;

        if (!email || !sessionToken || !newPassword) {
            throw new AppError("Email, session token, and new password are required", 400);
        }

        if (newPassword.length < 8) {
            throw new AppError("Password must be at least 8 characters", 400);
        }

        const storedToken = await redisClient.get(`teacher-forgot-password-${email.toLowerCase()}`);
        if (!storedToken || storedToken !== sessionToken) {
            throw new AppError("Invalid or expired session token", 400);
        }

        const teacher = await prisma.teacher.findUnique({
            where: { email: email.toLowerCase() }
        });

        if (!teacher) {
            throw new AppError("Teacher not found", 404);
        }

        const hashedPassword = await hashPassword(newPassword);
        await prisma.teacher.update({
            where: { id: teacher.id },
            data: { password: hashedPassword }
        });

        // Clear the session token
        await redisClient.del(`teacher-forgot-password-${email.toLowerCase()}`);

        return res.status(200).json({
            success: true,
            message: "Password reset successfully. You can now login with your new password."
        });
    }
)






//Authenticated Routes 

export const logoutTeacherController = asyncHandler(
    async(req:Request, res:Response) => {
        const {id} = req.teacher;
        if(!id){
            throw new AppError("Teacher not found", 404);
        }
        const sessionKey = `activeSession:teacher:${id}`;
        await redisClient.hdel(sessionKey, 'sessionId');
        res.clearCookie("accessToken");
        res.clearCookie("refreshToken");
        return res.status(200).json({
            success: true,
            message: "Logout successful"
        });
    }
)


export const raiseUpdatePasswordTeacherController = asyncHandler(
    async(req:Request, res:Response) => {
        const {oldPassword, newPassword}:UpdatePasswordTeacherInput = req.body;
        if([oldPassword, newPassword].every(password => !password)){
            throw new AppError("Old password and new password are required", 400);
        }
        if(newPassword.length < 8){
            throw new AppError("New password must be at least 8 characters", 400);
        }

        const {id} = req.teacher;
        if(!id){
            throw new AppError("Teacher not found", 404);
        }
        const teacher = await prisma.teacher.findUnique({
            where: { id },
            select: { password: true }
        });
        if(!teacher){
            throw new AppError("Teacher not found", 404);
        }
        const isPasswordValid = await verifyPassword(teacher.password, oldPassword);
        if(!isPasswordValid){
            throw new AppError("Invalid old password", 400);
        }
        const hashedNewPassword = await hashPassword(newPassword);
        await prisma.teacher.update({
            where:{id},
            data:{
                password:hashedNewPassword
            }
        })
        return res.status(200).json({
            success: true,
            message: "Password updated successfully"
        });
    }
)

export const regenerateAccessTokenTeacherController = asyncHandler(
    async(req: Request, res: Response) => {
        const { id } = req.teacher;

        const sessionKey = `activeSession:teacher:${id}`;
        const sessionId = await redisClient.hget(sessionKey, 'sessionId');
        
        if (!sessionId) {
            throw new AppError("Session not found. Please login again.", 404);
        }

        const teacher = await prisma.teacher.findUnique({
            where: { id },
            include: {
                department: {
                    include: {
                        college: {
                            select: {
                                id: true,
                                organizationId: true
                            }
                        }
                    }
                }
            }
        });

        if (!teacher) {
            throw new AppError("Teacher not found", 404);
        }

        const securityManager = PasetoV4SecurityManager.getInstance();
        const accessToken = await securityManager.generateAccessToken({
            id: teacher.id,
            email: teacher.email,
            name: teacher.name,
            employeeNo: teacher.employeeNo,
            role: "teacher",
            type: "teacher",
            departmentId: teacher.departmentId,
            collegeId: teacher.department.collegeId,
            organizationId: teacher.department.college.organizationId,
            sessionId: sessionId
        });

        res.cookie("accessToken", accessToken, {
            httpOnly: true,
            secure: process?.env?.NODE_ENV === "production",
            maxAge: 1 * 24 * 60 * 60 * 1000
        });

        return res.status(200).json({
            success: true,
            message: "Access token regenerated successfully",
            data: {
                accessToken
            }
        });
    }
)
