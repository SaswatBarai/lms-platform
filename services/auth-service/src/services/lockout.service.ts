import redisClient from "@config/redis.js";
import { prisma } from "@lib/prisma.js";
import { AppError } from "@utils/AppError.js";
import { KafkaProducer } from "@messaging/producer.js";

const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60; // 15 minutes

export class LockoutService {
    private static getUserModel(userType: string) {
        const modelMap: Record<string, any> = {
            student: prisma.student,
            teacher: prisma.teacher,
            organization: prisma.organization,
            college: prisma.college,
            dean: prisma.dean,
            hod: prisma.hod,
            staff: prisma.nonTeachingStaff
        };
        return modelMap[userType];
    }

    static async checkLockout(userId: string, userType: string) {
        // Check Redis Lock Flag
        const isLockedRedis = await redisClient.get(`auth:locked:${userType}:${userId}`);
        if (isLockedRedis) {
             throw new AppError("Account is temporarily locked due to multiple failed login attempts. Please try again later.", 423);
        }

        // Check DB Lock Flag (Persistent)
        const model = this.getUserModel(userType);
        if (!model) {
            return; // If model not found, skip DB check
        }

        const user = await model.findUnique({
            where: { id: userId },
            select: { isLocked: true }
        });

        if (user?.isLocked) {
            throw new AppError("Account is locked. Please contact support.", 423);
        }
    }

    static async handleFailedAttempt(userId: string, userType: string, email: string) {
        const key = `auth:failed:${userType}:${userId}`;
        const attempts = await redisClient.incr(key);
        
        if (attempts === 1) {
            await redisClient.expire(key, LOCKOUT_DURATION);
        }

        if (attempts >= MAX_ATTEMPTS) {
            // Lock Account
            await redisClient.setex(`auth:locked:${userType}:${userId}`, LOCKOUT_DURATION, "true");
            
            const model = this.getUserModel(userType);
            if (model) {
                await model.update({
                    where: { id: userId },
                    data: { isLocked: true, lockReason: "brute_force" }
                });
            }

            // Send Notification
            const kafka = KafkaProducer.getInstance();
            // Implement sendAccountLockedEmail in producer...
            // await kafka.sendAccountLockedEmail(email); 
            
            // Clear attempts
            await redisClient.del(key);
            
            throw new AppError("Account locked due to too many failed attempts.", 423);
        }
    }

    static async resetAttempts(userId: string, userType: string) {
        await redisClient.del(`auth:failed:${userType}:${userId}`);
    }
}