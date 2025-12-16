import { prisma } from "@lib/prisma.js";
import { CreateHodInput, ForgotResetPasswordInput, LoginHodInput, ResetPasswordInput } from "../../types/organization.js";
import { AppError } from "@utils/AppError.js";
import { asyncHandler } from "@utils/asyncHandler.js";
import { Request, Response } from "express";
import crypto from "crypto";
import { hashPassword, PasetoV4SecurityManager, validateEmail, verifyPassword } from "@utils/security.js";
import { KafkaProducer } from "@messaging/producer.js";
import redisClient from "@config/redis.js";
import { LockoutService } from "../../services/lockout.service.js";
import { PasswordService } from "../../services/password.service.js";
import * as requestIp from "request-ip";

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
        const ip = requestIp.getClientIp(req) || "unknown";
        const userAgent = req.headers['user-agent'] || "unknown";

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

        // Phase 1: Lockout Check
        await LockoutService.checkLockout(hod.id, "hod");

        const isPasswordValid = await verifyPassword(hod.password, password);
        if (!isPasswordValid) {
            // Phase 1: Handle Failed Attempt
            await LockoutService.handleFailedAttempt(hod.id, "hod", hod.email);
            
            // Phase 1: Audit Log Failure
            const kafka = KafkaProducer.getInstance();
            // await kafka.sendAuditLog({ userId: hod.id, action: "LOGIN_FAILED", ip, userAgent, success: false });

            throw new AppError("Invalid email or password", 401);
        }

        // Phase 1: Reset Lockout on Success
        await LockoutService.resetAttempts(hod.id, "hod");

        // Get Device Info
        const { DeviceService } = await import("../../services/device.service.js");
        const { SessionService } = await import("../../services/session.service.js");
        const deviceInfo = DeviceService.getDeviceInfo(req);

        // Generate Session ID
        const accessSessionId = crypto.randomBytes(16).toString("hex");
        const accessTokenExpires = new Date(Date.now() + 1 * 24 * 60 * 60 * 1000); // 1 day

        // Handle Session Enforcement (Lock, Invalidate Old, Create New)
        await SessionService.handleLoginSession(
            hod.id,
            "hod",
            accessSessionId,
            deviceInfo,
            accessTokenExpires
        );
        
        // Phase 1: Token Family for Rotation
        const tokenFamily = crypto.randomUUID();

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

        // Keep Redis session key for backward compatibility
        const key = `activeSession:hod:${hod.id}`;
        await redisClient.hset(key, {
            sessionId: accessSessionId,
            hodId: hod.id,
            organizationId: hod.college.organizationId,
            active: 'true',
        })
        await redisClient.expire(key, 1 * 24 * 60 * 60); // 1 day
        const securityManager = PasetoV4SecurityManager.getInstance();
        const accessToken = await securityManager.generateAccessToken(tokenPayload);
        const sessionId = crypto.randomBytes(16).toString('hex'); // Generate unique session ID for refresh token
        const refreshToken = await securityManager.generateRefreshToken(hod.id, sessionId);

        // Phase 1: Audit Log Success
        const kafka = KafkaProducer.getInstance();
        // await kafka.sendAuditLog({ userId: hod.id, action: "LOGIN_SUCCESS", ip, userAgent, success: true });

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

// [UPDATED] Renamed to reflect Rotation behavior
export const regenerateAccessTokenHod = asyncHandler(
    async(req:Request, res:Response) => {
        const {id} = req.hod; // This comes from authValidator validating the OLD refresh token

        // [ADDED] Extract the old refresh token payload to get the tokenFamily
        const refreshToken = req.cookies.refreshToken;
        if (!refreshToken) {
            throw new AppError("Refresh token not found", 401);
        }

        const securityManager = PasetoV4SecurityManager.getInstance();
        const oldRefreshPayload = await securityManager.verifyRefreshToken(refreshToken);
        
        // [ADDED] Phase 1: Token Rotation Logic
        // 1. Check for Reuse: If this token was already used, lock the user!
        const usedTokenKey = `usedRefreshToken:hod:${oldRefreshPayload.sessionId}`;
        const isTokenUsed = await redisClient.exists(usedTokenKey);
        
        if (isTokenUsed) {
            // Token reuse detected - potential attack!
            const hod = await prisma.hod.findUnique({ where: { id }, select: { email: true } });
            await LockoutService.handleFailedAttempt(id, "hod", hod?.email || "");
            throw new AppError("Security violation: Token reuse detected. Account has been locked for security.", 401);
        }

        // 2. Mark the OLD refresh token as used (invalidate it)
        const tokenExpiry = oldRefreshPayload.exp - Math.floor(Date.now() / 1000);
        if (tokenExpiry > 0) {
            await redisClient.setex(usedTokenKey, tokenExpiry, "true");
        }

        const key = `activeSession:hod:${id}`;
        const sessionId = await redisClient.hget(key, 'sessionId');
        if(!sessionId){
            throw new AppError("Session not found", 404);
        }

        // Verify the session ID matches the refresh token session ID
        if (sessionId !== oldRefreshPayload.sessionId) {
            throw new AppError("Session mismatch. Please login again.", 401);
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

        // [ADDED] Generate NEW Session ID and Token Family for the ROTATED pair
        const newSessionId = crypto.randomBytes(16).toString('hex');
        const newTokenFamily = crypto.randomUUID();

        // Update Redis with NEW session
        await redisClient.hset(key, {
            sessionId: newSessionId,
            hodId: hod.id,
            organizationId: hod.college.organizationId,
            active: 'true',
        });
        await redisClient.expire(key, 1 * 24 * 60 * 60);

        // Issue NEW Access Token
        const accessToken = await securityManager.generateAccessToken({
            id: hod.id,
            email: hod.email,
            name: hod.name,
            role: "hod",
            type: "hod",
            collegeId: hod.college.id,
            organizationId: hod.college.organizationId,
            sessionId: newSessionId
        });

        // [ADDED] Issue NEW Refresh Token (Rotation)
        const newRefreshToken = await securityManager.generateRefreshToken(id, newSessionId);

        // Send BOTH new tokens
        const isProduction = process.env.NODE_ENV === "production";
        res.cookie("accessToken", accessToken, {
            httpOnly: true,
            secure: isProduction,
            maxAge: 1 * 24 * 60 * 60 * 1000 // 1 day
        });
        res.cookie("refreshToken", newRefreshToken, {
            httpOnly: true,
            secure: isProduction,
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        res.status(200).json({
            success: true,
            message: "Tokens rotated successfully",
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
        const redisKey = `hod-auth-${email}`;
        const sessionToken = await redisClient.get(redisKey);
        if(!sessionToken){
            throw new AppError("Session token not found", 404);
        }
        if(sessionToken !== token){
            throw new AppError("Invalid session token", 400);
        }
        
        try {
            // Phase 1: Password Policy & History
            PasswordService.validatePolicy(password);
            
            const hod = await prisma.hod.findUnique({
                where: { email }
            });
            
            if (!hod) {
                throw new AppError("HOD not found", 404);
            }

            await PasswordService.checkHistory(hod.id, "hod", password);
            
            const hashedPassword = await hashPassword(password);
            
            // Phase 1: Transaction to save history and update password
            await prisma.$transaction(async (tx) => {
                await tx.hod.update({
                    where: { id: hod.id },
                    data: {
                        password: hashedPassword,
                        passwordChangedAt: new Date(),
                        passwordExpiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) // 90 days expiry
                    }
                });

                await tx.passwordHistory.create({
                    data: {
                        userId: hod.id,
                        userType: "hod",
                        passwordHash: hashedPassword
                    }
                });
            });

            // Delete Redis key only after successful password update
            await redisClient.del(redisKey).catch(err => {
                console.error(`[Redis] Failed to delete key ${redisKey}:`, err);
            });

            return res.status(200).json({
                success: true,
                message: "Password reset successfully",
            });
        } catch (error) {
            // Even if password update fails, delete the Redis key to prevent reuse
            await redisClient.del(redisKey).catch(err => {
                console.error(`[Redis] Failed to delete key ${redisKey} during error cleanup:`, err);
            });
            throw error;
        }
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

        // Phase 1: Password Policy & History
        PasswordService.validatePolicy(newPassword);

        const hod = await prisma.hod.findUnique({
            where:{
                email
            }
        })
        if(!hod){
            throw new AppError("Hod not found", 404);
        }

        await PasswordService.checkHistory(hod.id, "hod", newPassword);

        const isPasswordValid = await verifyPassword(hod.password, oldPassword);
        if(!isPasswordValid){
            throw new AppError("Invalid old password", 400);
        }
        const hashedPassword = await hashPassword(newPassword);
        
        // Phase 1: Transaction to save history and update password
        await prisma.$transaction(async (tx) => {
            await tx.hod.update({
                where: { id: hod.id },
                data: {
                    password: hashedPassword,
                    passwordChangedAt: new Date(),
                    passwordExpiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) // 90 days expiry
                }
            });

            await tx.passwordHistory.create({
                data: {
                    userId: hod.id,
                    userType: "hod",
                    passwordHash: hashedPassword
                }
            });
        });

        // Phase 1: Revoke all sessions on password change
        const sessionKey = `activeSession:hod:${hod.id}`;
        await redisClient.del(sessionKey);

        return res.status(200).json({
            success: true,
            message: "Password reset successfully. Please login again with your new password.",
        })
    }
)







