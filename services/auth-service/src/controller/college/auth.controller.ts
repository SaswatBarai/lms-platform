import { CreateCollegeInput, LoginCollegeInput } from "../../types/organization.js"
import { AppError } from "@utils/AppError.js";
import { asyncHandler } from "@utils/asyncHandler.js";
import { Request, Response } from "express";
import { createCollegeService } from "@services/organization.service.js";
import { prisma } from "@lib/prisma.js";
import redisClient from "@config/redis.js";
import crypto from "crypto";
import { hashPassword, PasetoV4SecurityManager, validateEmail } from "@utils/security.js";
import { KafkaProducer } from "@messaging/producer.js";




export const createCollegeController = asyncHandler(
    async(req:Request, res:Response) => {
        const {name,email,password,organizationId,recoveryEmail,phone}:CreateCollegeInput = req.body;
        if(!name || !email || !phone || !password || !organizationId || !recoveryEmail){
            throw new AppError("Missing required fields",400);
        }
        const result = await createCollegeService({
            name,
            email,
            password,
            organizationId,
            recoveryEmail,
            phone
        });

        // Send welcome email notification via Kafka
        if (result.success && result.data) {
            try {
                const kafkaProducer = KafkaProducer.getInstance();
                
                await kafkaProducer.sendCollegeWelcomeEmail(
                    result.data.email,
                    result.data.name,
                    "http://localhost:8000/auth/api/login-college"
                );
                console.log(`[auth] Welcome email queued for college: ${result.data.email}`);
            } catch (emailError) {
                // Log error but don't fail the college creation
                console.error(`[auth] Failed to queue welcome email:`, emailError);
            }
        }

        res.status(201).json({
            success: result.success,
            data: result.data,
            message: result.message
        });

    }
)

export const loginCollegeController = asyncHandler(
    async(req:Request, res:Response) => {
        const { email, password }: LoginCollegeInput = req.body;
        
        // Find college by email
        const college = await prisma.college.findUnique({
            where: { email },
            include: {
                organization: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            }
        });
        
        if (!college) {
            throw new AppError("Invalid email or password", 401);
        }
        
        // Verify password
        const { verifyPassword } = await import("@utils/security.js");
        const isPasswordValid = await verifyPassword(college.password, password);
        
        if (!isPasswordValid) {
            throw new AppError("Invalid email or password", 401);
        }
        
        // Generate PASETO tokens
        const { PasetoV4SecurityManager } = await import("@utils/security.js");
        const securityManager = PasetoV4SecurityManager.getInstance();

        
        let accessSessionId;

        // Single device login: Always create a new session ID
        // This invalidates any previous session for this college
        const key = `activeSession:college:${college.id}`;
        
        // Check if there's an existing session
        const existingSessionId = await redisClient.hget(key, 'sessionId');
        if (existingSessionId) {
            console.log(`Invalidating existing session for college ${college.id}: ${existingSessionId}`);
            await redisClient.hdel(key, 'sessionId');
            
        }
        
        // Create new session ID (this will replace any existing session)
        accessSessionId = crypto.randomBytes(16).toString('hex');

        // Create payload for tokens
        const tokenPayload = {
            id: college.id,
            email: college.email,
            name: college.name,
            organizationId: college.organizationId,
            collegeId: college.id,
            role: "college-admin", // Colleges are college-admin by default
            type: "college",
            sessionId: accessSessionId
        };

        // Store the new session in Redis
        // This will overwrite any existing session, effectively logging out other devices
        await redisClient.hset(key, {
            sessionId: accessSessionId,
            collegeId: college.id,
            organizationId: college.organizationId,
            active: 'true',
        });

        await redisClient.expire(key, 1 * 24 * 60 * 60); // 1 day

        // Generate access and refresh tokens
        const accessToken = await securityManager.generateAccessToken(tokenPayload);
        const sessionId = crypto.randomBytes(16).toString('hex'); // Generate unique session ID for refresh token
        const refreshToken = await securityManager.generateRefreshToken(college.id, sessionId);
        

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
                college: {
                    id: college.id,
                    name: college.name,
                    email: college.email,
                    phone: college.phone,
                    organizationId: college.organizationId,
                    organizationName: college.organization.name,
                    recoveryEmail: college.recoveryEmail,
                    deanId: college.deanId,
                    createdAt: college.createdAt,
                    updatedAt: college.updatedAt
                },
                tokens: {
                    accessToken,
                }
            }
        });
    }
)

export const logoutCollege = asyncHandler(
    async(req:Request, res:Response) => {
        const {id} =  req.college;
        if(!id){
            return res.status(400).json({
                success:false,
                message:"Bad Request"
            })
        }
        
        await redisClient.hdel(`activeSession:college:${id}`, 'sessionId');
        res.clearCookie("accessToken");
        res.clearCookie("refreshToken");
        res.status(200).json({
            success: true,
            message: "Logout successful"
        });
    }
)


//regenrate the accessToken
export const regenerateAccessTokenCollege = asyncHandler(
    async(req:Request, res:Response) => {
        const {id} = req.college;
        if(!id){
            throw new AppError("College not found", 404);
        }
        const key = `activeSession:college:${id}`;
        const sessionId = await redisClient.hget(key, 'sessionId');
        if(!sessionId){
            throw new AppError("Session not found", 404);
        }
        const college = await prisma.college.findUnique({
            where:{
                id
            }
        })
        if(!college){
            throw new AppError("College not found", 404);
        }
        const securityManager = PasetoV4SecurityManager.getInstance();
        const accessToken = await securityManager.generateAccessToken({
            id: college.id,
            email: college.email,
            name: college.name,
            organizationId: college.organizationId,
            collegeId: college.id,
            role: "college-admin",
            type: "college",
            sessionId
        });
        res.cookie("accessToken", accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            maxAge: 1 * 24 * 60 * 60 * 1000 // 1 day
        });
        res.status(200).json({
            success: true,
            message: "Access token regenerated successfully"
        });
    }
)


export const forgotPasswordCollege = asyncHandler(
    async(req:Request, res:Response) => {
        const {email} = req.body;
        if(!email){
            throw new AppError("Email is required", 400);
        }
        if(!validateEmail(email)){
            throw new AppError("Invalid email", 400);
        }
        const college = await prisma.college.findUnique({
            where:{
                email
            }
        })
        if(!college){
            throw new AppError("College not found", 404);
        }
        const sessionToken = crypto.randomBytes(32).toString("hex");
        await redisClient.setex(`college-auth-${email}`, 10 * 60, sessionToken);

        const kafkaProducer = KafkaProducer.getInstance();
        
        const isPublished = await kafkaProducer.sendCollegeForgotPassword(email, sessionToken);
        if(isPublished){
            return res.status(200).json({
                success: true,
                message: "Forgot password email sent successfully"
            })
        }
        else {
            throw new AppError("Failed to send forgot password email", 500);
        }
    }
)

export const resetPasswordCollege = asyncHandler(
    async(req:Request, res:Response) => {
        const {email, token, password}:{email:string, token:string, password:string} = req.body;
        console.log(email, token, password);
        if(!email || !token){
            throw new AppError("Email and token are required", 400);
        }
        if(!validateEmail(email)){
            throw new AppError("Invalid email", 400);
        }
        if(token.length !== 64){
            throw new AppError("Invalid token", 400);
        }

        const sessionToken = await redisClient.get(`college-auth-${email}`);
        if(!sessionToken){
            throw new AppError("Invalid token", 400);
        }
        if(sessionToken !== token){
            throw new AppError("Invalid token", 400);
        }
        await redisClient.del(`college-auth-${email}`);
        const hashedPassword = await hashPassword(password);
        await prisma.college.update({
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
    }
)
