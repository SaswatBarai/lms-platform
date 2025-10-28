import { CreateCollegeInput, LoginCollegeInput } from "../../types/organization.js"
import { AppError } from "@utils/AppError.js";
import { asyncHandler } from "@utils/asyncHandler.js";
import { Request, Response } from "express";
import { createCollegeService } from "@services/organization.service.js";
import { prisma } from "@lib/prisma.js";
import redisClient from "@config/redis.js";
import crypto from "crypto";




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
        }
        
        // Create new session ID (this will replace any existing session)
        accessSessionId = crypto.randomBytes(16).toString('hex');

        // Create payload for tokens
        const tokenPayload = {
            id: college.id,
            email: college.email,
            name: college.name,
            organizationId: college.organizationId,
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
                    refreshToken
                }
            }
        });
    }
)


