import { Request, Response } from "express";
import { asyncHandler } from "@utils/asyncHandler.js";
import { prisma } from "@lib/prisma.js";
import { hashPassword, PasetoV4SecurityManager, verifyPassword } from "@utils/security.js";
import { KafkaProducer } from "@messaging/producer.js";
import { LoginNonTeachingStaffInput } from "../../types/organization.js";
import crypto from "crypto";
import { AppError } from "@utils/AppError.js";
import redisClient from "@config/redis.js";

// The controller function for bulk staff creation
export const createNonTeachingStaffBulkController = asyncHandler(async (req: Request, res: Response) => {
    
    // 1. Get College ID from authenticated admin
    const { id: collegeId } = req.college; // From AuthenticatedUser.checkCollege middleware

    // 2. Get the array of staff from the validated body
    const staffArray: { name: string, email: string, phone: string, role: "studentsection" | "regestral" | "adminstractor" }[] = req.body;

    // 3. Check for duplicates in the database
    const emails = staffArray.map(staff => staff.email);
    const phones = staffArray.map(staff => staff.phone);

    const existingStaff = await prisma.nonTeachingStaff.findMany({
        where: {
            OR: [
                { email: { in: emails } },
                { phone: { in: phones } }
            ]
        },
        select: {
            email: true,
            phone: true
        }
    });

    // Create a set of existing emails and phones for quick lookup
    const existingEmails = new Set(existingStaff.map(s => s.email));
    const existingPhones = new Set(existingStaff.map(s => s.phone));

    // Validate and collect errors
    const errors: { index: number; field: string; value: string; message: string }[] = [];
    const validStaff: typeof staffArray = [];

    staffArray.forEach((staff, index) => {
        let hasError = false;

        // Check for duplicate email
        if (existingEmails.has(staff.email)) {
            errors.push({
                index,
                field: "email",
                value: staff.email,
                message: `Email '${staff.email}' already exists`
            });
            hasError = true;
        }

        // Check for duplicate phone
        if (existingPhones.has(staff.phone)) {
            errors.push({
                index,
                field: "phone",
                value: staff.phone,
                message: `Phone '${staff.phone}' already exists`
            });
            hasError = true;
        }

        // If no errors, add to valid staff
        if (!hasError) {
            validStaff.push(staff);
        }
    });

    // If there are any errors, return them
    if (errors.length > 0) {
        return res.status(400).json({
            success: false,
            message: "Some staff members could not be created due to duplicate email or phone",
            errors: errors,
            duplicateCount: errors.length,
            validCount: validStaff.length
        });
    }

    // 4. Generate passwords and prepare data for valid staff only
    const kafkaProducer = KafkaProducer.getInstance();
    const staffToCreate = [];
    const emailData: Array<{ email: string; name: string; tempPassword: string }> = [];

    for (const staff of validStaff) {
        // Generate a random temporary password
        const tempPassword = crypto.randomBytes(8).toString('hex');
        const hashedPassword = await hashPassword(tempPassword);

        // Prepare data for Prisma create
        staffToCreate.push({
            ...staff,
            password: hashedPassword,
            collegeId: collegeId,
        });

        // Store email data for later
        emailData.push({
            email: staff.email,
            name: staff.name,
            tempPassword: tempPassword
        });
    }

    // 5. Insert all valid users into the database
    if (staffToCreate.length > 0) {
        await prisma.nonTeachingStaff.createMany({
            data: staffToCreate,
            skipDuplicates: false // We already checked for duplicates
        });

        // 6. Publish all email jobs to Kafka
        for (const data of emailData) {
            await kafkaProducer.sendStaffWelcomeEmail(
                data.email,
                data.name,
                data.tempPassword,
                "http://localhost:8000/auth/api/login-staff"
            );
        }
    }

    // 7. Send success response
    res.status(201).json({
        success: true,
        message: `${staffToCreate.length} staff account(s) created successfully. Welcome emails will be sent shortly.`,
        created: staffToCreate.length,
        total: staffArray.length
    });
});



export const login= asyncHandler(
    async(req:Request, res:Response) => {
        const {email,password}:LoginNonTeachingStaffInput = req.body;
        const existingStaff = await prisma.nonTeachingStaff.findUnique({
            where:{
                email
            },
            include: {
                college: {
                    select: {
                        id: true,
                        organizationId: true
                    }
                }
            }
        })

        if(!existingStaff){
            throw new AppError("Invalid email or password", 401);
        }

        const isPasswordValid = await verifyPassword(existingStaff.password, password);
        if(!isPasswordValid){
            throw new AppError("Invalid email or password", 401);
        }

        const key = `activeSession:non-teaching-staff:${existingStaff.id}`;
        const existingSessionId = await redisClient.hget(key, 'sessionId');
        if(existingSessionId){
            await redisClient.hdel(key, 'sessionId');
        }
        const accessSessionId = crypto.randomBytes(16).toString('hex');
        
        const tokenPaylaod = {
            id: existingStaff.id,
            email: existingStaff.email,
            name: existingStaff.name,
            role: existingStaff.role,
            type: existingStaff.role,
            collegeId: existingStaff.collegeId,
            organizationId: existingStaff.college.organizationId,
            sessionId: accessSessionId
        }

        await redisClient.hset(key, {
            sessionId: accessSessionId,
            nonTeachingStaffId: existingStaff.id,
            active: 'true',
        });

        await redisClient.expire(key, 1 * 24 * 60 * 60); // 1 day
        const securityManager = PasetoV4SecurityManager.getInstance();

        const accessToken = await securityManager.generateAccessToken(tokenPaylaod);
        const refreshToken = await securityManager.generateRefreshToken(existingStaff.id, accessSessionId);

        res.cookie("accessToken", accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            maxAge: 1 * 24 * 60 * 60 * 1000 // 1 day
        });
        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        res.status(200).json({
            success: true,
            message: "Login successful",
            data: {
                accessToken
            }
        });
    }
)

