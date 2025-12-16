import { Request, Response } from "express";
import { asyncHandler } from "@utils/asyncHandler.js";
import { prisma } from "@lib/prisma.js";
import { AppError } from "@utils/AppError.js";
import redisClient from "@config/redis.js";

// V2.7: Get Current Session Details
export const getCurrentSession = asyncHandler(async (req: Request, res: Response) => {
    // Determine user (student, teacher, etc.) from request context
    const user = req.student || req.teacher || req.dean || req.hod || req.nonTeachingStaff;
    const sessionId = req.headers['x-user-session-id'] as string; // From Token

    if (!user || !sessionId) throw new AppError("User not authenticated", 401);

    const session = await prisma.userSession.findUnique({
        where: { sessionToken: sessionId }
    });

    if (!session || !session.isActive) {
        throw new AppError("Session is invalid or expired", 401);
    }

    return res.status(200).json({
        success: true,
        data: {
            sessionId: session.sessionToken,
            deviceId: session.deviceId,
            deviceType: session.deviceType,
            browser: session.browser,
            os: session.os,
            ipAddress: session.ipAddress,
            location: session.location,
            loginAt: session.createdAt,
            expiresAt: session.expiresAt
        }
    });
});

// V2.7: Logout from All Devices
export const logoutAllSessions = asyncHandler(async (req: Request, res: Response) => {
    const user = req.student || req.teacher || req.dean || req.hod || req.nonTeachingStaff;
    if (!user) throw new AppError("User not authenticated", 401);

    // 1. Invalidate in DB
    await prisma.userSession.updateMany({
        where: { userId: user.id, isActive: true },
        data: { isActive: false, invalidatedAt: new Date() }
    });

    // 2. Clear Active Session Pointer in Redis
    // This effectively logs out ALL devices because the middleware checks this key
    const userType = req.student ? 'student' : req.teacher ? 'teacher' : 'staff'; 
    await redisClient.del(`user:active:session:${userType}:${user.id}`);

    return res.status(200).json({
        success: true,
        message: "Logged out from all devices successfully."
    });
});

// V2.6: Admin Force Logout
export const forceLogoutUser = asyncHandler(async (req: Request, res: Response) => {
    const { userId, userType } = req.body; // e.g., { userId: "...", userType: "student" }
    
    // Check if requester is Admin/College Admin (implied by route protection)

    // 1. Invalidate in DB
    await prisma.userSession.updateMany({
        where: { userId: userId, userType: userType, isActive: true },
        data: { isActive: false, invalidatedAt: new Date() }
    });

    // 2. Kill in Redis
    await redisClient.del(`user:active:session:${userType}:${userId}`);

    // 3. Publish Event (Optional: for realtime disconnect)
    await redisClient.publish('session:invalidate', JSON.stringify({ userId }));

    return res.status(200).json({
        success: true,
        message: `User ${userId} has been forced logged out.`
    });
});