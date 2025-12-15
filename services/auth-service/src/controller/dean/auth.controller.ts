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
import { LockoutService } from "../../services/lockout.service.js";
import { PasswordService } from "../../services/password.service.js";
import * as requestIp from "request-ip";

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
        const ip = requestIp.getClientIp(req) || "unknown";
        const userAgent = req.headers['user-agent'] || "unknown";

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

        // Phase 1: Lockout Check
        await LockoutService.checkLockout(dean.id, "dean");

        const isPasswordValid = await verifyPassword(dean.password, password);
        if (!isPasswordValid) {
            // Phase 1: Handle Failed Attempt
            await LockoutService.handleFailedAttempt(dean.id, "dean", dean.mailId);
            
            // Phase 1: Audit Log Failure
            const kafka = KafkaProducer.getInstance();
            // await kafka.sendAuditLog({ userId: dean.id, action: "LOGIN_FAILED", ip, userAgent, success: false });

            throw new AppError("Invalid credentials. Please check your email and password.", 401);
        }

        // Phase 1: Reset Lockout on Success
        await LockoutService.resetAttempts(dean.id, "dean");

        // Single device login: Handle session management
        const sessionKey = `activeSession:dean:${dean.id}`;
        const existingSessionId = await redisClient.hget(sessionKey, 'sessionId');
        if (existingSessionId) {
            await redisClient.hdel(sessionKey, 'sessionId');
        }

        const accessSessionId = crypto.randomBytes(16).toString('hex');
        
        // Phase 1: Token Family for Rotation
        const tokenFamily = crypto.randomUUID();

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

        // Phase 1: Audit Log Success
        const kafka = KafkaProducer.getInstance();
        // await kafka.sendAuditLog({ userId: dean.id, action: "LOGIN_SUCCESS", ip, userAgent, success: true });

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

// [UPDATED] Renamed to reflect Rotation behavior
export const regenerateAccessTokenDeanController = asyncHandler(
    async(req: Request, res: Response) => {
        const { id } = req.dean; // This comes from authValidator validating the OLD refresh token

        // [ADDED] Extract the old refresh token payload to get the tokenFamily
        const refreshToken = req.cookies.refreshToken;
        if (!refreshToken) {
            throw new AppError("Refresh token not found", 401);
        }

        const securityManager = PasetoV4SecurityManager.getInstance();
        const oldRefreshPayload = await securityManager.verifyRefreshToken(refreshToken);
        
        // [ADDED] Phase 1: Token Rotation Logic
        // 1. Check for Reuse: If this token was already used, lock the user!
        const usedTokenKey = `usedRefreshToken:dean:${oldRefreshPayload.sessionId}`;
        const isTokenUsed = await redisClient.exists(usedTokenKey);
        
        if (isTokenUsed) {
            // Token reuse detected - potential attack!
            const dean = await prisma.dean.findUnique({ where: { id }, select: { mailId: true } });
            await LockoutService.handleFailedAttempt(id, "dean", dean?.mailId || "");
            throw new AppError("Security violation: Token reuse detected. Account has been locked for security.", 401);
        }

        // 2. Mark the OLD refresh token as used (invalidate it)
        const tokenExpiry = oldRefreshPayload.exp - Math.floor(Date.now() / 1000);
        if (tokenExpiry > 0) {
            await redisClient.setex(usedTokenKey, tokenExpiry, "true");
        }

        const sessionKey = `activeSession:dean:${id}`;
        const sessionId = await redisClient.hget(sessionKey, 'sessionId');
        
        if (!sessionId) {
            throw new AppError("Session not found. Please login again.", 404);
        }

        // Verify the session ID matches the refresh token session ID
        if (sessionId !== oldRefreshPayload.sessionId) {
            throw new AppError("Session mismatch. Please login again.", 401);
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

        // [ADDED] Generate NEW Session ID and Token Family for the ROTATED pair
        const newSessionId = crypto.randomBytes(16).toString('hex');
        const newTokenFamily = crypto.randomUUID();

        // Update Redis with NEW session
        await redisClient.hset(sessionKey, {
            sessionId: newSessionId,
            deanId: dean.id,
            organizationId: dean.college.organizationId,
            collegeId: dean.collegeId,
            active: 'true',
        });
        await redisClient.expire(sessionKey, 1 * 24 * 60 * 60);

        // Issue NEW Access Token
        const accessToken = await securityManager.generateAccessToken({
            id: dean.id,
            email: dean.mailId,
            mailId: dean.mailId,
            role: "dean",
            type: "dean",
            collegeId: dean.collegeId,
            organizationId: dean.college.organizationId,
            sessionId: newSessionId
        });

        // [ADDED] Issue NEW Refresh Token (Rotation)
        const newRefreshToken = await securityManager.generateRefreshToken(id, newSessionId);

        // Send BOTH new tokens
        const isProduction = process?.env?.NODE_ENV === "production";
        res.cookie("accessToken", accessToken, {
            httpOnly: true,
            secure: isProduction,
            maxAge: 1 * 24 * 60 * 60 * 1000
        });
        res.cookie("refreshToken", newRefreshToken, {
            httpOnly: true,
            secure: isProduction,
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        return res.status(200).json({
            success: true,
            message: "Tokens rotated successfully",
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

        // Phase 1: Password Policy & History
        PasswordService.validatePolicy(newPassword);

        const {id} = req.dean;
        if(!id){
            throw new AppError("Dean not found", 404);
        }

        await PasswordService.checkHistory(id, "dean", newPassword);
        
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
        
        // Phase 1: Transaction to save history and update password
        await prisma.$transaction(async (tx) => {
            await tx.dean.update({
                where: { id },
                data: {
                    password: hashedNewPassword,
                    passwordChangedAt: new Date(),
                    passwordExpiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) // 90 days expiry
                }
            });

            await tx.passwordHistory.create({
                data: {
                    userId: id,
                    userType: "dean",
                    passwordHash: hashedNewPassword
                }
            });
        });

        // Phase 1: Revoke all sessions on password change
        const sessionKey = `activeSession:dean:${id}`;
        await redisClient.del(sessionKey);
        
        return res.status(200).json({
            success: true,
            message: "Password updated successfully. Please login again with your new password."
        });
    }
)
