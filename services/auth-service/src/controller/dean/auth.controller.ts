import { prisma } from "@lib/prisma.js";
import { CreateDeanInput, LoginDeanInput, ForgotPasswordDeanInput, ResetForgotPasswordDeanInput, ResetPasswordDeanInput } from "../../types/organization.js";
import { AppError } from "@utils/AppError.js";
import { asyncHandler } from "@utils/asyncHandler.js";
import { Request, Response } from "express";
import * as crypto from "node:crypto";
import { hashPassword, verifyPassword, PasetoV4SecurityManager, validateEmail } from "@utils/security.js";
import { KafkaProducer } from "@messaging/producer.js";
import redisClient from "@config/redis.js";
import process from "node:process";

export const createDeanController = asyncHandler(
    async(req:Request, res:Response) => {
        const {id: collegeId, organizationId} = req.college;
        
        if (!collegeId || !organizationId) {
            throw new AppError("College information not found", 404);
        }

        const {mailId}: CreateDeanInput = req.body;

        if (!mailId || !validateEmail(mailId)) {
            throw new AppError("Valid email is required", 400);
        }

        // Check if dean already exists for this college
        const existingDean = await prisma.dean.findUnique({
            where: { mailId: mailId.toLowerCase() }
        });

        if (existingDean) {
            throw new AppError("Dean with this email already exists", 400);
        }

        // Check if college already has a dean
        const collegeDean = await prisma.dean.findFirst({
            where: { collegeId }
        });

        if (collegeDean) {
            throw new AppError("This college already has a dean", 400);
        }

        // Generate random password
        const tempPassword = crypto.randomBytes(8).toString("hex");
        const hashedPassword = await hashPassword(tempPassword);

        // Get college name first
        const college = await prisma.college.findUnique({
            where: { id: collegeId },
            select: { name: true }
        });

        if (!college || !college.name) {
            throw new AppError("College not found", 404);
        }
        
        const collegeName: string = college.name;

        // Create dean
        const dean = await prisma.dean.create({
            data: {
                mailId: mailId.toLowerCase(),
                password: hashedPassword,
                collegeId
            }
        });

        // Send welcome email via Kafka
        const kafkaProducer = KafkaProducer.getInstance();
        const deanName = dean.mailId.split('@')[0] || dean.mailId;
        try {
            await kafkaProducer.sendDeanWelcomeEmail(
                dean.mailId,
                deanName,
                tempPassword,
                collegeName,
                "http://localhost:8000/auth/api/login-dean"
            );
        } catch (error) {
            console.error(`[auth] Failed to queue welcome email for ${dean.mailId}:`, error);
        }

        return res.status(201).json({
            success: true,
            message: "Dean created successfully. Welcome email will be sent shortly.",
            data: {
                id: dean.id,
                mailId: dean.mailId,
                collegeId: dean.collegeId
            }
        });
    }
)

export const loginDeanController = asyncHandler(
    async(req:Request, res:Response) => {
        const {mailId, password}: LoginDeanInput = req.body;

        if (!mailId || !password) {
            throw new AppError("Email and password are required", 400);
        }

        const dean = await prisma.dean.findUnique({
            where: { mailId: mailId.toLowerCase() },
            include: {
                college: {
                    select: {
                        id: true,
                        name: true,
                        organizationId: true
                    }
                }
            }
        });

        if (!dean) {
            throw new AppError("Invalid credentials. Please check your email and password.", 401);
        }

        const isPasswordValid = await verifyPassword(dean.password, password);
        if (!isPasswordValid) {
            throw new AppError("Invalid credentials. Please check your email and password.", 401);
        }

        // Single device login: Handle session management
        const sessionKey = `activeSession:dean:${dean.id}`;
        const existingSessionId = await redisClient.hget(sessionKey, 'sessionId');
        if (existingSessionId) {
            await redisClient.hdel(sessionKey, 'sessionId');
        }

        const accessSessionId = crypto.randomBytes(16).toString('hex');

        // Create token payload
        const tokenPayload = {
            id: dean.id,
            email: dean.mailId,
            mailId: dean.mailId,
            role: "dean",
            type: "dean",
            collegeId: dean.collegeId,
            organizationId: dean.college.organizationId,
            sessionId: accessSessionId
        };

        // Store session in Redis
        await redisClient.hset(sessionKey, {
            sessionId: accessSessionId,
            deanId: dean.id,
            organizationId: dean.college.organizationId,
            collegeId: dean.collegeId,
            active: 'true',
        });
        await redisClient.expire(sessionKey, 1 * 24 * 60 * 60); // 1 day

        // Generate tokens
        const securityManager = PasetoV4SecurityManager.getInstance();
        const accessToken = await securityManager.generateAccessToken(tokenPayload);
        const refreshSessionId = crypto.randomBytes(16).toString('hex');
        const refreshToken = await securityManager.generateRefreshToken(dean.id, refreshSessionId);

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
                dean: {
                    id: dean.id,
                    mailId: dean.mailId,
                    college: dean.college.name
                }
            }
        });
    }
)

export const logoutDeanController = asyncHandler(
    async(req:Request, res:Response) => {
        const {id} = req.dean;
        if(!id){
            throw new AppError("Dean not found", 404);
        }
        const sessionKey = `activeSession:dean:${id}`;
        await redisClient.hdel(sessionKey, 'sessionId');
        res.clearCookie("accessToken");
        res.clearCookie("refreshToken");
        return res.status(200).json({
            success: true,
            message: "Logout successful"
        });
    }
)

export const regenerateAccessTokenDeanController = asyncHandler(
    async(req: Request, res: Response) => {
        const { id } = req.dean;

        const sessionKey = `activeSession:dean:${id}`;
        const sessionId = await redisClient.hget(sessionKey, 'sessionId');
        
        if (!sessionId) {
            throw new AppError("Session not found. Please login again.", 404);
        }

        const dean = await prisma.dean.findUnique({
            where: { id },
            include: {
                college: {
                    select: {
                        id: true,
                        organizationId: true
                    }
                }
            }
        });

        if (!dean) {
            throw new AppError("Dean not found", 404);
        }

        const securityManager = PasetoV4SecurityManager.getInstance();
        const accessToken = await securityManager.generateAccessToken({
            id: dean.id,
            email: dean.mailId,
            mailId: dean.mailId,
            role: "dean",
            type: "dean",
            collegeId: dean.collegeId,
            organizationId: dean.college.organizationId,
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

export const forgotPasswordDeanController = asyncHandler(
    async(req:Request, res:Response) => {
        const {mailId}: ForgotPasswordDeanInput = req.body;

        if (!mailId || !validateEmail(mailId)) {
            throw new AppError("Valid email is required", 400);
        }

        const dean = await prisma.dean.findUnique({
            where: { mailId: mailId.toLowerCase() },
            include: {
                college: {
                    select: {
                        name: true
                    }
                }
            }
        });

        if (!dean) {
            // Don't reveal if email exists or not for security
            return res.status(200).json({
                success: true,
                message: "If an account with this email exists, a password reset link has been sent."
            });
        }

        const sessionToken = crypto.randomBytes(32).toString("hex");
        await redisClient.setex(`dean-forgot-password-${mailId.toLowerCase()}`, 10 * 60, sessionToken);

        // Send forgot password email via Kafka
        const kafkaProducer = KafkaProducer.getInstance();
        try {
            await kafkaProducer.sendDeanForgotPassword(
                dean.mailId,
                sessionToken,
                dean.college.name
            );
        } catch (error) {
            console.error(`[auth] Failed to send forgot password email for ${dean.mailId}:`, error);
        }

        return res.status(200).json({
            success: true,
            message: "If an account with this email exists, a password reset link has been sent."
        });
    }
)

export const resetForgotPasswordDeanController = asyncHandler(
    async(req:Request, res:Response) => {
        const {mailId, sessionToken, newPassword}: ResetForgotPasswordDeanInput = req.body;

        if (!mailId || !sessionToken || !newPassword) {
            throw new AppError("Email, session token, and new password are required", 400);
        }

        if (newPassword.length < 8) {
            throw new AppError("Password must be at least 8 characters", 400);
        }

        const storedToken = await redisClient.get(`dean-forgot-password-${mailId.toLowerCase()}`);
        if (!storedToken || storedToken !== sessionToken) {
            throw new AppError("Invalid or expired session token", 400);
        }

        const dean = await prisma.dean.findUnique({
            where: { mailId: mailId.toLowerCase() }
        });

        if (!dean) {
            throw new AppError("Dean not found", 404);
        }

        const hashedPassword = await hashPassword(newPassword);
        await prisma.dean.update({
            where: { id: dean.id },
            data: { password: hashedPassword }
        });

        // Clear the session token
        await redisClient.del(`dean-forgot-password-${mailId.toLowerCase()}`);

        return res.status(200).json({
            success: true,
            message: "Password reset successfully. You can now login with your new password."
        });
    }
)

export const resetPasswordDeanController = asyncHandler(
    async(req:Request, res:Response) => {
        const {oldPassword, newPassword}: ResetPasswordDeanInput = req.body;
        
        if (!oldPassword || !newPassword) {
            throw new AppError("Old password and new password are required", 400);
        }
        
        if (newPassword.length < 8) {
            throw new AppError("New password must be at least 8 characters", 400);
        }

        const {id} = req.dean;
        if(!id){
            throw new AppError("Dean not found", 404);
        }
        
        const dean = await prisma.dean.findUnique({
            where: { id },
            select: { password: true }
        });
        
        if(!dean){
            throw new AppError("Dean not found", 404);
        }
        
        const isPasswordValid = await verifyPassword(dean.password, oldPassword);
        if(!isPasswordValid){
            throw new AppError("Invalid old password", 400);
        }
        
        const hashedNewPassword = await hashPassword(newPassword);
        await prisma.dean.update({
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
