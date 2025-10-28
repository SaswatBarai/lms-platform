
import { Request, Response } from "express";
import { createOrganizationService } from "@services/organization.service.js"
import { asyncHandler } from "@utils/asyncHandler.js";
import { ProducerPayload, type verifyOrganizationOtpInput, type CreateOrganizationInput, type LoginOrganizationInput } from "../../types/organization.js";
import { generateOtp, hashOtp, verifyOtp } from "@utils/otp.js"
import { KafkaProducer } from "@messaging/producer.js"
import redisClient from "@config/redis.js"
import { hashPassword, PasetoV4SecurityManager, validateEmail } from "@utils/security.js"
import crypto from "crypto"
import { AppError } from "@utils/AppError.js"
import {prisma} from "@lib/prisma.js"



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
    const kafkaProducer = new KafkaProducer();
    const message: ProducerPayload = {
        action: "auth-otp",
        type: "org-otp",
        subType: "create-account",
        data: {
            email,
            otp
        }
    }
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

    const isPublished = await kafkaProducer.publishOTP(message);
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
    //create organization account'
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
    //delete the org data from redis
    await redisClient.del(`org-auth-${email}`);

    return res.status(200).json({
        success: true,
        message: createOrgResult?.message,
        data: createOrgResult.data
    })
})



export const resendOrganizationOtpController = asyncHandler(async (req:Request,res:Response) => {
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
    const kafkaProducer = new KafkaProducer();
    const message: ProducerPayload = {
        action: "auth-otp",
        type: "org-otp",
        subType: "create-account",
        data: {
            email,
            otp
        }
    }
    //save otp in redis with 10 minutes expiry
    const hashedOTP = await hashOtp(otp, orgData.sessionToken);
    await redisClient.setex(`org-auth-otp-${email}`, 10 * 60, hashedOTP);
    //set cool down for 1 minute
    await redisClient.setex(coolDownKey, 60, "1");

    const isPublished = await kafkaProducer.publishOTP(message);
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
    
    // Find organization by email
    const organization = await prisma.organization.findUnique({
        where: { email }
    });
    
    if (!organization) {
        throw new AppError("Invalid email or password", 401);
    }
    
    // Verify password
    const { verifyPassword } = await import("@utils/security.js");
    const isPasswordValid = await verifyPassword(organization.password, password);
    
    if (!isPasswordValid) {
        throw new AppError("Invalid email or password", 401);
    }
    
    // Generate PASETO tokens
    const { PasetoV4SecurityManager } = await import("@utils/security.js");
    const securityManager = PasetoV4SecurityManager.getInstance();

    
    let accesssSessionId;

    // Single device login: Always create a new session ID
    // This invalidates any previous session for this organization
    const key = `activeSession:org:${organization.id}`;
    
    // Check if there's an existing session
    const existingSessionId = await redisClient.hget(key, 'sessionId');
    if (existingSessionId) {
        console.log(`Invalidating existing session for org ${organization.id}: ${existingSessionId}`);
    }
    
    // Create new session ID (this will replace any existing session)
    accesssSessionId = crypto.randomBytes(16).toString('hex');

    // Create payload for tokens
    const tokenPayload = {
        id: organization.id,
        email: organization.email,
        name: organization.name,
        role: "org-admin", // Organizations are org-admin by default
        type: "organization",
        sessionId: accesssSessionId
    };

    // Store the new session in Redis
    // This will overwrite any existing session, effectively logging out other devices
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
    const {id} = req.organization
    if(!id){
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


export const regenerateAccessTokenOrganization = asyncHandler(
    async(req:Request, res:Response) => {
        const {id} = req.organization;
        if(!id){
            throw new AppError("Organization not found", 404);
        }
        const key = `activeSession:org:${id}`;
        const sessionId = await redisClient.hget(key, 'sessionId');
        if(!sessionId){
            throw new AppError("Session not found", 404);
        }
        const organization = await prisma.organization.findUnique({
            where:{
                id
            }
        })
        if(!organization){
            throw new AppError("Organization not found", 404);
        }
        const securityManager = PasetoV4SecurityManager.getInstance();
        const accessToken = await securityManager.generateAccessToken({
            id: organization.id,
            email: organization.email,
            name: organization.name,
            role: "org-admin",
            type: "organization",
            sessionId
        });
        res.cookie("accessToken", accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            maxAge: 1 * 24 * 60 * 60 * 1000 // 1 day
        });
        res.status(200).json({
            success: true,
            message: "Access token regenerated successfully",
        });
    }
)

export const forgotPasswordOrganization = asyncHandler(async (req:Request, res:Response) => {
    const {email} = req.body;
    if(!email){
        throw new AppError("Email is required", 400);
    }
    if(!validateEmail(email)){
        throw new AppError("Invalid email", 400);
    }
    const organization = await prisma.organization.findUnique({
        where:{
            email
        }
    })
    if(!organization){
        throw new AppError("Organization not found", 404);
    }
    const sessionToken = crypto.randomBytes(32).toString("hex");
    await redisClient.setex(`org-auth-${email}`, 10 * 60, sessionToken);
    const kafkaProducer = new KafkaProducer();
    const message:ProducerPayload = {
        action: "forgot-password",
        type: "org-forgot-password",
        data: {
            email,
            sessionToken
        }
    }
    const isPublished = await kafkaProducer.publishForgotPassword(message);
    if(isPublished){
        return res.status(200).json({
            success: true,
            message: "Forgot password email sent successfully"
        })
    }
    else {
        throw new AppError("Failed to send forgot password email", 500);
    }
})

export const resetPasswordOrganization = asyncHandler(async (req:Request, res:Response) => {
    const {email, token, password}:{email:string, token:string, password:string} = req.body;
    if(!email || !token){
        throw new AppError("Email and token are required", 400);
    }
    if(!validateEmail(email)){
        throw new AppError("Invalid email", 400);
    }
    if(token.length !== 64){
        throw new AppError("Invalid token", 400);
    }
    const sessionToken = await redisClient.get(`org-auth-${email}`);
    if(!sessionToken){
        throw new AppError("Invalid token", 400);
    }
    if(sessionToken !== token){
        throw new AppError("Invalid token", 400);
    }
    await redisClient.del(`org-auth-${email}`);
    const hashedPassword = await hashPassword(password);
    await prisma.organization.update({
        where:{
            email
        },
        data:{
            password:hashedPassword
        }
    })
    return res.status(200).json({
        success: true,
        message: "Password reset successfully"
    })
})