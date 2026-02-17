
import { Request, Response } from "express";
import { createOrganizationService, resetPasswordService, ResetPasswordType } from "@services/organization.service.js"
import { asyncHandler } from "@utils/asyncHandler.js";
import { type verifyOrganizationOtpInput, type CreateOrganizationInput, type LoginOrganizationInput, ResetPasswordInput, ServiceResult, ForgotResetPasswordInput } from "../../types/organization.js";
import { generateOtp, hashOtp, verifyOtp } from "@utils/otp.js"
import { KafkaProducer } from "@messaging/producer.js"
import redisClient from "@config/redis.js"
import { hashPassword, PasetoV4SecurityManager, validateEmail, verifyPassword } from "@utils/security.js"
import crypto from "crypto"
import { AppError } from "@utils/AppError.js"
import { prisma } from "@lib/prisma.js"
import { LockoutService } from "../../services/lockout.service.js";
import { PasswordService } from "../../services/password.service.js";
import * as requestIp from "request-ip";
import { loginAttemptsTotal } from "../../config/metrics.js";



export const createOrganizationController = asyncHandler(async (req: Request, res: Response) => {
    const { name, email, password, phone, recoveryEmail, address }: CreateOrganizationInput = req.body;

    const existingOrg = await prisma.organization.findFirst({
        where: {
            OR: [
                { email },
                { phone }
            ]
        }
    });
    if (existingOrg) {
        throw new AppError("Organization with this email or phone already exists", 409);
    }
    const otp = generateOtp();
    const kafkaProducer = KafkaProducer.getInstance();
    const sessionToken = crypto.randomBytes(32).toString("hex");
    //check the details already exist or not 
    if (await redisClient.exists(`org-auth-${email}`)) {
        throw new AppError("Already details are present", 400);
    }

    const redisResult = await redisClient.hset(`org-auth-${email}`, {
        name,
        email,
        password: password, // Store plain password, will be hashed in service
        phone,
        recoveryEmail,
        address: address,
        sessionToken
    })
    if (redisResult === 0) {
        throw new AppError("Failed to save organization details", 500);
    }
    //expire in 24 hours
    await redisClient.expire(`org-auth-${email}`, 24 * 60 * 60);
    //cool down for 1 minute
    const coolDownKey = `org-auth-otp-cooldown-${email}`;
    await redisClient.setex(coolDownKey, 60, "1");

    //save otp in redis with 10 minutes expiry
    const hashedOTP = await hashOtp(otp, sessionToken);
    await redisClient.setex(`org-auth-otp-${email}`, 10 * 60, hashedOTP);

    const isPublished = await kafkaProducer.sendOTP(email, otp);
    if (isPublished) {
        return res.status(200).json({
            success: true,
            message: "OTP sent successfully",
            data: {
                email,
                sessionToken
            }
        })
    } else {
        return res.status(500).json({
            success: false,
            message: "Failed to send OTP"
        })
    }
})

export const verifyOrganizationOtpController = asyncHandler(async (req: Request, res: Response) => {
    const { email, otp, sessionToken }: verifyOrganizationOtpInput = req.body;
    const storedHash = await redisClient.get(`org-auth-otp-${email}`);
    if (!storedHash) {
        throw new AppError("OTP has expired or is invalid", 400);
    }
    const isValid = await verifyOtp(otp, sessionToken, storedHash);
    if (!isValid) {
        throw new AppError("Invalid OTP", 400);
    }
    //delete the hashed otp from redis
    await redisClient.del(`org-auth-otp-${email}`);

    //create organization account
    const orgData = await redisClient.hgetall(`org-auth-${email}`);
    if (!orgData || Object.keys(orgData).length === 0) {
        throw new AppError("Organization data not found. Please register again.", 400);
    }

    // Validate all required fields exist
    const requiredFields = ['name', 'email', 'password', 'phone', 'recoveryEmail'];
    for (const field of requiredFields) {
        if (!orgData[field]) {
            throw new AppError(`Missing required field: ${field}`, 400);
        }
    }

    try {
        const createOrgResult = await createOrganizationService({
            name: orgData.name!,
            email: orgData.email!,
            password: orgData.password!,
            phone: orgData.phone!,
            recoveryEmail: orgData.recoveryEmail!,
            address: orgData.address || '' // address is optional
        })

        if (!createOrgResult.success) {
            throw new AppError(createOrgResult.message, 500);
        }

        // Clean up all Redis keys after successful creation
        const keysToDelete = [
            `org-auth-${email}`,
            `org-auth-otp-cooldown-${email}`
        ];

        // Delete all keys in parallel
        await Promise.all(keysToDelete.map(key => redisClient.del(key).catch(err => {
            console.error(`[Redis] Failed to delete key ${key}:`, err);
        })));

        return res.status(200).json({
            success: true,
            message: createOrgResult?.message,
            data: createOrgResult.data
        });
    } catch (error) {
        // Even if creation fails, clean up Redis keys to prevent stale data
        const keysToDelete = [
            `org-auth-${email}`,
            `org-auth-otp-cooldown-${email}`
        ];

        // Delete all keys in parallel (don't wait for errors)
        Promise.all(keysToDelete.map(key => redisClient.del(key).catch(err => {
            console.error(`[Redis] Failed to delete key ${key} during error cleanup:`, err);
        }))).catch(() => {
            // Ignore cleanup errors
        });

        // Re-throw the original error
        throw error;
    }
})


export const resendOrganizationOtpController = asyncHandler(async (req: Request, res: Response) => {
    const { email }: { email: string } = req.body;
    if (!validateEmail(email)) {
        throw new AppError("Invalid email format", 400);
    }

    // Check if organization data exists in Redis to get session token
    const orgData = await redisClient.hgetall(`org-auth-${email}`);
    if (!orgData || !orgData.sessionToken) {
        throw new AppError("Session not found. Please restart the registration process.", 400);
    }

    const coolDownKey = `org-auth-otp-cooldown-${email}`;
    const isInCoolDown = await redisClient.exists(coolDownKey);
    if (isInCoolDown) {
        throw new AppError("Please wait before requesting a new OTP", 429);
    }
    const otp = generateOtp();
    const kafkaProducer = KafkaProducer.getInstance();

    //save otp in redis with 10 minutes expiry
    const hashedOTP = await hashOtp(otp, orgData.sessionToken);
    await redisClient.setex(`org-auth-otp-${email}`, 10 * 60, hashedOTP);
    //set cool down for 1 minute
    await redisClient.setex(coolDownKey, 60, "1");

    const isPublished = await kafkaProducer.sendOTP(email, otp);
    if (isPublished) {
        return res.status(200).json({
            success: true,
            message: "OTP resent successfully",
        })
    } else {
        return res.status(500).json({
            success: false,
            message: "Failed to resend OTP"
        })
    }
})


export const loginOrganizationController = asyncHandler(async (req: Request, res: Response) => {
    const { email, password }: LoginOrganizationInput = req.body;
    const ip = requestIp.getClientIp(req) || "unknown";
    const userAgent = req.headers['user-agent'] || "unknown";

    // Find organization by email
    const organization = await prisma.organization.findUnique({
        where: { email }
    });

    if (!organization) {
        loginAttemptsTotal.inc({ status: 'failure' });
        throw new AppError("Invalid email or password", 401);
    }

    // Phase 1: Lockout Check
    await LockoutService.checkLockout(organization.id, "organization");

    // Verify password
    const isPasswordValid = await verifyPassword(organization.password, password);

    if (!isPasswordValid) {
        // Track failed login attempt
        loginAttemptsTotal.inc({ status: 'failure' });

        // Phase 1: Handle Failed Attempt
        await LockoutService.handleFailedAttempt(organization.id, "organization", organization.email);

        // Phase 1: Audit Log Failure
        const kafka = KafkaProducer.getInstance();
        // await kafka.sendAuditLog({ userId: organization.id, action: "LOGIN_FAILED", ip, userAgent, success: false });

        throw new AppError("Invalid email or password", 401);
    }

    // Phase 1: Reset Lockout on Success
    await LockoutService.resetAttempts(organization.id, "organization");

    // Get Device Info
    const { DeviceService } = await import("../../services/device.service.js");
    const { SessionService } = await import("../../services/session.service.js");
    const deviceInfo = DeviceService.getDeviceInfo(req);

    // Generate Session ID
    const accesssSessionId = crypto.randomBytes(16).toString('hex');
    const accessTokenExpires = new Date(Date.now() + 1 * 24 * 60 * 60 * 1000); // 1 day

    // Handle Session Enforcement (Lock, Invalidate Old, Create New)
    await SessionService.handleLoginSession(
        organization.id,
        "organization",
        accesssSessionId,
        deviceInfo,
        accessTokenExpires,
        {
            email: organization.email,
            name: organization.name
        }
    );

    // Generate PASETO tokens
    const { PasetoV4SecurityManager } = await import("@utils/security.js");
    const securityManager = PasetoV4SecurityManager.getInstance();

    // Phase 1: Token Family for Rotation
    const tokenFamily = crypto.randomUUID();

    // Create payload for tokens
    const tokenPayload = {
        id: organization.id,
        email: organization.email,
        name: organization.name,
        organizationId: organization.id,
        role: "org-admin", // Organizations are org-admin by default
        type: "organization",
        sessionId: accesssSessionId
    };

    // Keep Redis session key for backward compatibility
    const key = `activeSession:org:${organization.id}`;
    await redisClient.hset(key, {
        sessionId: accesssSessionId,
        organizationId: organization.id,
        active: 'true',
    });

    await redisClient.expire(`activeSession:org:${organization.id}`, 1 * 24 * 60 * 60); // 1 day

    // Generate access and refresh tokens
    const accessToken = await securityManager.generateAccessToken(tokenPayload);
    const sessionId = crypto.randomBytes(16).toString('hex'); // Generate unique session ID
    const refreshToken = await securityManager.generateRefreshToken(organization.id, sessionId);

    // Track successful login attempt
    loginAttemptsTotal.inc({ status: 'success' });

    // Phase 1: Audit Log Success
    const kafka = KafkaProducer.getInstance();
    // await kafka.sendAuditLog({ userId: organization.id, action: "LOGIN_SUCCESS", ip, userAgent, success: true });

    // Store refresh token in database (optional - you might want to add a refreshToken field to Organization model)
    // For now, we'll just return both tokens

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
            organization: {
                id: organization.id,
                name: organization.name,
                email: organization.email,
                phone: organization.phone,
                address: organization.address,
                recoveryEmail: organization.recoveryEmail,
                totalStudents: organization.totalStudents,
                totalTeachers: organization.totalTeachers,
                totalDeans: organization.totalDeans,
                totalNonTeachingStaff: organization.totalNonTeachingStaff,
                createdAt: organization.createdAt,
                updatedAt: organization.updatedAt
            },
            tokens: {
                accessToken,
            }
        }
    });
})


export const logoutOrganization = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.organization
    if (!id) {
        throw new AppError("Organization not found", 404);
    }
    const key = `activeSession:org:${id}`;
    await redisClient.hdel(key, 'sessionId');
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");
    return res.status(200).json({
        success: true,
        message: "Logout successful",
    });
})


// [UPDATED] Renamed to reflect Rotation behavior
export const regenerateAccessTokenOrganization = asyncHandler(
    async (req: Request, res: Response) => {
        const { id } = req.organization; // This comes from authValidator validating the OLD refresh token
        if (!id) {
            throw new AppError("Organization not found", 404);
        }

        // [ADDED] Extract the old refresh token payload to get the tokenFamily
        const refreshToken = req.cookies.refreshToken;
        if (!refreshToken) {
            throw new AppError("Refresh token not found", 401);
        }

        const securityManager = PasetoV4SecurityManager.getInstance();
        const oldRefreshPayload = await securityManager.verifyRefreshToken(refreshToken);

        // [ADDED] Phase 1: Token Rotation Logic
        // 1. Check for Reuse: If this token was already used, lock the user!
        const usedTokenKey = `usedRefreshToken:organization:${oldRefreshPayload.sessionId}`;
        const isTokenUsed = await redisClient.exists(usedTokenKey);

        if (isTokenUsed) {
            // Token reuse detected - potential attack!
            const organization = await prisma.organization.findUnique({ where: { id }, select: { email: true } });
            await LockoutService.handleFailedAttempt(id, "organization", organization?.email || "");
            throw new AppError("Security violation: Token reuse detected. Account has been locked for security.", 401);
        }

        // 2. Mark the OLD refresh token as used (invalidate it)
        const tokenExpiry = oldRefreshPayload.exp - Math.floor(Date.now() / 1000);
        if (tokenExpiry > 0) {
            await redisClient.setex(usedTokenKey, tokenExpiry, "true");
        }

        const key = `activeSession:org:${id}`;
        const sessionId = await redisClient.hget(key, 'sessionId');
        if (!sessionId) {
            throw new AppError("Session not found", 404);
        }

        // Verify the session ID matches the refresh token session ID
        if (sessionId !== oldRefreshPayload.sessionId) {
            throw new AppError("Session mismatch. Please login again.", 401);
        }

        const organization = await prisma.organization.findUnique({
            where: {
                id
            }
        })
        if (!organization) {
            throw new AppError("Organization not found", 404);
        }

        // [ADDED] Generate NEW Session ID and Token Family for the ROTATED pair
        const newSessionId = crypto.randomBytes(16).toString('hex');
        const newTokenFamily = crypto.randomUUID();

        // Update Redis with NEW session
        await redisClient.hset(key, {
            sessionId: newSessionId,
            organizationId: organization.id,
            active: 'true',
        });
        await redisClient.expire(key, 1 * 24 * 60 * 60);

        // Issue NEW Access Token
        const accessToken = await securityManager.generateAccessToken({
            id: organization.id,
            email: organization.email,
            name: organization.name,
            organizationId: organization.id,
            role: "org-admin",
            type: "organization",
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

export const forgotPasswordOrganization = asyncHandler(async (req: Request, res: Response) => {
    const { email } = req.body;
    if (!email) {
        throw new AppError("Email is required", 400);
    }
    if (!validateEmail(email)) {
        throw new AppError("Invalid email", 400);
    }

    // Email-based rate limiting: 3 requests per 15 minutes per email
    const emailRateLimitKey = `forgot-password:email:org:${email.toLowerCase()}`;
    const emailRateLimitCount = await redisClient.get(emailRateLimitKey);
    if (emailRateLimitCount && parseInt(emailRateLimitCount) >= 3) {
        throw new AppError("Too many password reset requests for this email. Please wait 15 minutes before trying again.", 429);
    }

    // Check if a reset request is already pending
    const existingToken = await redisClient.exists(`org-auth-${email}`);
    if (existingToken) {
        throw new AppError("A password reset request is already pending. Please check your email or wait 10 minutes.", 400);
    }

    const organization = await prisma.organization.findUnique({
        where: {
            email
        }
    })
    if (!organization) {
        // Increment rate limit even for non-existent emails to prevent enumeration
        await redisClient.incr(emailRateLimitKey);
        await redisClient.expire(emailRateLimitKey, 15 * 60);
        throw new AppError("Organization not found", 404);
    }

    // Increment email rate limit
    await redisClient.incr(emailRateLimitKey);
    await redisClient.expire(emailRateLimitKey, 15 * 60);

    const sessionToken = crypto.randomBytes(32).toString("hex");
    await redisClient.setex(`org-auth-${email}`, 10 * 60, sessionToken);//10 minutes
    const kafkaProducer = KafkaProducer.getInstance();

    const isPublished = await kafkaProducer.sendOrganizationForgotPassword(email, sessionToken);
    if (isPublished) {
        return res.status(200).json({
            success: true,
            message: "Forgot password email sent successfully"
        })
    }
    else {
        throw new AppError("Failed to send forgot password email", 500);
    }
})

export const resetForgotPasswordOrganization = asyncHandler(async (req: Request, res: Response) => {
    const { email, token, password }: ForgotResetPasswordInput = req.body;
    if (!email || !token || !password) {
        throw new AppError("Email and token are required", 400);
    }
    if (!validateEmail(email)) {
        throw new AppError("Invalid email", 400);
    }
    if (token.length !== 64) {
        throw new AppError("Invalid token", 400);
    }
    const redisKey = `org-auth-${email}`;
    const sessionToken = await redisClient.get(redisKey);
    if (!sessionToken) {
        throw new AppError("Invalid token", 400);
    }
    if (sessionToken !== token) {
        throw new AppError("Invalid token", 400);
    }

    try {
        // Phase 1: Password Policy & History
        PasswordService.validatePolicy(password);

        const organization = await prisma.organization.findUnique({
            where: { email }
        });

        if (!organization) {
            throw new AppError("Organization not found", 404);
        }

        await PasswordService.checkHistory(organization.id, "organization", password);

        const hashedPassword = await hashPassword(password);

        // Phase 1: Transaction to save history and update password
        await prisma.$transaction(async (tx) => {
            await tx.organization.update({
                where: { id: organization.id },
                data: {
                    password: hashedPassword,
                    passwordChangedAt: new Date(),
                    passwordExpiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) // 90 days expiry
                }
            });

            await tx.passwordHistory.create({
                data: {
                    userId: organization.id,
                    userType: "organization",
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
            message: "Password reset successfully"
        });
    } catch (error) {
        // Even if password update fails, delete the Redis key to prevent reuse
        await redisClient.del(redisKey).catch(err => {
            console.error(`[Redis] Failed to delete key ${redisKey} during error cleanup:`, err);
        });
        throw error;
    }
})


export const resetPasswordOrganizationController = asyncHandler(async (req: Request, res: Response) => {
    const { email, oldPassword, newPassword }: ResetPasswordInput = req.body;

    // Phase 1: Password Policy & History
    PasswordService.validatePolicy(newPassword);

    const organization = await prisma.organization.findUnique({
        where: { email }
    });

    if (!organization) {
        throw new AppError("Organization not found", 404);
    }

    await PasswordService.checkHistory(organization.id, "organization", newPassword);

    const isPasswordValid = await verifyPassword(organization.password, oldPassword);
    if (!isPasswordValid) {
        throw new AppError("Current password is incorrect", 400);
    }

    const hashedPassword = await hashPassword(newPassword);

    // Phase 1: Transaction to save history and update password
    await prisma.$transaction(async (tx) => {
        await tx.organization.update({
            where: { id: organization.id },
            data: {
                password: hashedPassword,
                passwordChangedAt: new Date(),
                passwordExpiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) // 90 days expiry
            }
        });

        await tx.passwordHistory.create({
            data: {
                userId: organization.id,
                userType: "organization",
                passwordHash: hashedPassword
            }
        });
    });

    // Phase 1: Revoke all sessions on password change
    const sessionKey = `activeSession:org:${organization.id}`;
    await redisClient.del(sessionKey);

    return res.status(200).json({
        success: true,
        message: "Password reset successfully. Please login again with your new password."
    });
})