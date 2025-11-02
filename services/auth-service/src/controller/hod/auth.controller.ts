import { prisma } from "@lib/prisma.js";
import { CreateHodInput, ForgotResetPasswordInput, LoginHodInput, ResetPasswordInput } from "../../types/organization.js";
import { AppError } from "@utils/AppError.js";
import { asyncHandler } from "@utils/asyncHandler.js";
import { Request, Response } from "express";
import crypto from "crypto";
import { hashPassword, PasetoV4SecurityManager, validateEmail, verifyPassword } from "@utils/security.js";
import { KafkaProducer } from "@messaging/producer.js";
import redisClient from "@config/redis.js";

export const createHodController = asyncHandler(
    async (req: Request, res: Response) => {
        const nonTeachingStaff = req.nonTeachingStaff;

        if (!nonTeachingStaff) {
            throw new AppError("Non-teaching staff not found", 404);
        }
        const { collegeId } = nonTeachingStaff;

        //let us check the staff is from that college or not 
        const staff = await prisma.nonTeachingStaff.findUnique({
            where: {
                id: nonTeachingStaff.id
            },
            include: {
                college: {
                    select: {
                        id: true
                    }
                }
            }
        })
        if (!staff) {
            throw new AppError("Staff not found", 404);
        }
        if (staff.collegeId !== collegeId) {
            throw new AppError("Staff is not part of the college", 403);
        }
        //let us check the staff is hod or not 
        const hod = await prisma.hod.findUnique({
            where: {
                id: nonTeachingStaff.id
            }
        })
        if (hod) {
            throw new AppError("Staff is already a hod", 400);
        }

        const { name, email, departmentId }: CreateHodInput = req.body;
        if (!name || !email || !departmentId) {
            throw new AppError("Missing required fields", 400);
        }

        //let us check the department is from that college or not 
        const department = await prisma.department.findUnique({
            where: {
                id: departmentId,
                collegeId: collegeId
            },
            include: {
                college: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            }
        })
        if (!department) {
            throw new AppError("Department not found", 404);
        }
        if (department.collegeId !== collegeId) {
            throw new AppError("Department is not part of the college", 403);
        }
        if (department.hodId) {
            throw new AppError("Department already has a hod", 400);
        }
        //let us check the email is already in use or not 
        const existingHod = await prisma.hod.findUnique({
            where: {
                email: email
            }
        })
        if (existingHod) {
            throw new AppError("Email is already in use", 400);
        }
        //let us create the password and send the email to the hod
        const password = crypto.randomBytes(16).toString("hex");
        const hashedPassword = await hashPassword(password);
        const newHod = await prisma.hod.create({
            data: {
                name,
                email,
                password: hashedPassword,
                collegeId: collegeId
            }
        })

        // Update the department to link it to the new Hod
        await prisma.department.update({
            where: { id: departmentId },
            data: { hodId: newHod.id }
        })

        //now send the email to the hod
        const kafkaProducer = KafkaProducer.getInstance();
        const isPublished = await kafkaProducer.sendHodWelcomeEmail(
            email,
            name,
            password,
            department.college.name,
            "http://localhost:8000/auth/api/login-hod"
        )
        if (!isPublished) {
            throw new AppError("Failed to send welcome email", 500);
        }
        res.status(201).json({
            success: true,
            message: "HOD created successfully",
            data: {
                id: newHod.id,
                name: newHod.name,
                email: newHod.email,
                collegeId: newHod.collegeId,
                departmentId: departmentId
            }
        })

    }
)

export const loginHodCOntroller = asyncHandler(
    async (req: Request, res: Response) => {
        const { email, password }: LoginHodInput = req.body;
        if (!email || !password) {
            throw new AppError("Missing required fields", 400);
        }

        const hod = await prisma.hod.findUnique({
            where: {
                email: email
            },
            include: {
                college: {
                    select: {
                        id: true,
                        organizationId: true
                    }
                }
            }
        });

        if (!hod) {
            throw new AppError("Invalid email or password", 401);
        }

        const isPasswordValid = await verifyPassword(hod.password, password);
        if (!isPasswordValid) {
            throw new AppError("Invalid email or password", 401);
        }

        const key = `activeSession:hod:${hod.id}`;
        const existingSessionId = await redisClient.hget(key, 'sessionId');
        if (existingSessionId) {
            await redisClient.hdel(key, 'sessionId');
        }

        const accessSessionId = crypto.randomBytes(16).toString("hex");
        const tokenPayload = {
            id: hod.id,
            email: hod.email,
            name: hod.name,
            role: "hod",
            type: "hod",
            collegeId: hod.collegeId,
            organizationId: hod.college.organizationId,
            sessionId: accessSessionId
        }

        await redisClient.hset(key, {
            sessionId: accessSessionId,
            hodId: hod.id,
            organizationId: hod.college.organizationId,
            active: 'true',
        })
        await redisClient.expire(key, 1 * 24 * 60 * 60); // 1 day
        const securityManager = PasetoV4SecurityManager.getInstance();
        const accessToken = securityManager.generateAccessToken(tokenPayload);
        const sessionId = crypto.randomBytes(16).toString('hex'); // Generate unique session ID for refresh token
        const refreshToken = securityManager.generateRefreshToken(hod.id, sessionId);

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
        })
    }
)

export const regenerateAccessTokenHod = asyncHandler(
    async(req:Request, res:Response) => {
        const {id} = req.hod;
        const ket = `activeSession:hod:${id}`;
        const sessionId = await redisClient.hget(ket, 'sessionId');
        if(!sessionId){
            throw new AppError("Session not found", 404);
        }
        const hod = await prisma.hod.findUnique({
            where:{
                id
            },
            include:{
                college:{
                    select:{
                        organizationId: true,
                        id: true
                    }
                }
            }   
        })

        if(!hod){
            throw new AppError("Hod not found", 404);
        }
        const securityManager = PasetoV4SecurityManager.getInstance();
        const accessToken = await securityManager.generateAccessToken({
            id: hod.id,
            email: hod.email,
            name: hod.name,
            role: "hod",
            type: "hod",
            collegeId: hod.college.id,
            organizationId: hod.college.organizationId,
            sessionId
        })
        res.cookie("accessToken", accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            maxAge: 1 * 24 * 60 * 60 * 1000 // 1 day
        });
        res.status(200).json({
            success: true,
            message: "Access token regenerated successfully",
            data: {
                accessToken
            }
        });
    }
)


export const logoutHodController = asyncHandler(
    async(req:Request, res:Response) => {
        const {id} = req.hod;
        if(!id){
            throw new AppError("Hod not found", 404);
        }
        const key = `activeSession:hod:${id}`;
        await redisClient.hdel(key, 'sessionId');
        res.clearCookie("accessToken");
        res.clearCookie("refreshToken");
        res.status(200).json({
            success: true,
            message: "Logout successful"
        });

    }
)

export const forgotPasswordConotroller = asyncHandler(
    async(req:Request, res:Response) => {
        const {email} = req.body;
        if(!email){
            throw new AppError("Email is required", 400);
        }
        if(!validateEmail(email)){
            throw new AppError("Invalid email", 400);
        }
        if(await redisClient.exists(`hod-auth-${email}`)){
            throw new AppError("Already details are present", 400);
        }

        //let us check the hod is already present or not 
        const hod = await prisma.hod.findUnique({
            where:{
                email
            },
            include:{
                college:{
                    select:{
                        id: true,
                        name: true
                    }
                }
            }
        });
        if(!hod){
            throw new AppError("Hod not found", 404);
        }
        //department name
        const department = await prisma.department.findFirst({
            where:{
                hodId:hod.id
            },
            select:{
                name: true,
                shortName: true
            }
        })
        if(!department){
            throw new AppError("Department not found", 404);
        }

        const sessionToken = crypto.randomBytes(32).toString("hex");
        await redisClient.setex(`hod-auth-${email}`, 10 * 60, sessionToken);//10 minutes
        const kafkaProducer = KafkaProducer.getInstance();
        
        const isPublished = await kafkaProducer.sendHodForgotPassword(email,sessionToken,hod.college.name,department.name, department.shortName, hod.name)
        if(!isPublished){
            throw new AppError("Failed to send forgot password email", 500);
        }
        return res.status(200).json({
            success: true,
            message: "Forgot password email sent successfully",
        })

    }
)


export const resetForgotPasswordHodController = asyncHandler(
    async(req:Request, res:Response) => {
        const {email, password, token}:ForgotResetPasswordInput = req.body;
        if(!email || !password || !token){
            throw new AppError("Missing required fields", 400);
        }
        if(!validateEmail(email)){
            throw new AppError("Invalid email", 400);
        }
        const sessionToken = await redisClient.get(`hod-auth-${email}`);
        if(!sessionToken){
            throw new AppError("Session token not found", 404);
        }
        if(sessionToken !== token){
            throw new AppError("Invalid session token", 400);
        }
        const hashedPassword = await hashPassword(password);
        await redisClient.del(`hod-auth-${email}`);
        await prisma.hod.update({
            where:{
                email
            },
            data:{
                password: hashedPassword
            }
        })
        return res.status(200).json({
            success: true,
            message: "Password reset successfully",
        })
    }
)

export const resetPasswordHodController = asyncHandler(
    async(req:Request, res:Response) => {
        const {email, newPassword,oldPassword}:ResetPasswordInput = req.body;
        if(!email || !newPassword || !oldPassword){
            throw new AppError("Missing required fields", 400);
        }
        if(!validateEmail(email)){
            throw new AppError("Invalid email", 400);
        }
        const hod = await prisma.hod.findUnique({
            where:{
                email
            }
        })
        if(!hod){
            throw new AppError("Hod not found", 404);
        }
        const isPasswordValid = await verifyPassword(hod.password, oldPassword);
        if(!isPasswordValid){
            throw new AppError("Invalid old password", 400);
        }
        const hashedPassword = await hashPassword(newPassword);
        await prisma.hod.update({
            where:{
                email
            },
            data:{
                password: hashedPassword
            }
        })
        return res.status(200).json({
            success: true,
            message: "Password reset successfully",
        })
    }
)







