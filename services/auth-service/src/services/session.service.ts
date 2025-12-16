// import redisClient from "@config/redis.js";
import { prisma } from "@lib/prisma.js";
import Redlock from "redlock";
import { DeviceInfo } from "./device.service.js";
import { KafkaProducer } from "@messaging/producer.js";
import redisClient from "@config/redis.js";

// Initialize Redlock for race condition handling
// Cast redisClient to any to work around type incompatibility between ioredis and redlock
const redlock = new Redlock([redisClient as any], {
    retryCount: 3,
    retryDelay: 100 // ms
});

export class SessionService {
    /**
     * Enforces Single Device Login:
     * 1. Acquires a lock for the user.
     * 2. Checks for ANY existing active session.
     * 3. If found, invalidates it (DB + Redis) and sends a notification.
     * 4. Creates the new session.
     */
    static async handleLoginSession(
        userId: string, 
        userType: string, 
        sessionId: string, 
        device: DeviceInfo,
        expiresAt: Date,
        userInfo?: {
            email: string;
            name: string;
            collegeName?: string;
            departmentName?: string;
            regNo?: string;
            employeeNo?: string;
        }
    ) {
        const lockKey = `lock:session:${userType}:${userId}`;
        let lock;

        try {
            // 1. Acquire Lock (Critical for FR2.4 Race Conditions)
            lock = await redlock.acquire([lockKey], 5000); // 5s lock

            // 2. Find Active Session
            const activeSession = await prisma.userSession.findFirst({
                where: { userId, userType, isActive: true }
            });

            if (activeSession) {
                // 3. Invalidate Old Session
                await this.invalidateSession(activeSession.id, activeSession.sessionToken);

                // Notify User of new device login (if device is different)
                if (activeSession.deviceId !== device.deviceId && userInfo) {
                    const kafka = KafkaProducer.getInstance();
                    try {
                        // Send new device login notification based on user type
                        switch (userType) {
                            case "organization":
                                await kafka.sendNewDeviceLoginOrganization(
                                    userInfo.email,
                                    userInfo.name,
                                    device.deviceType,
                                    device.browser,
                                    device.os,
                                    device.ipAddress,
                                    device.location
                                );
                                break;
                            case "college":
                                await kafka.sendNewDeviceLoginCollege(
                                    userInfo.email,
                                    userInfo.name,
                                    device.deviceType,
                                    device.browser,
                                    device.os,
                                    device.ipAddress,
                                    device.location,
                                    userInfo.collegeName || ""
                                );
                                break;
                            case "student":
                                await kafka.sendNewDeviceLoginStudent(
                                    userInfo.email,
                                    userInfo.name,
                                    device.deviceType,
                                    device.browser,
                                    device.os,
                                    device.ipAddress,
                                    device.location,
                                    userInfo.collegeName || "",
                                    userInfo.departmentName || "",
                                    userInfo.regNo || ""
                                );
                                break;
                            case "teacher":
                                await kafka.sendNewDeviceLoginTeacher(
                                    userInfo.email,
                                    userInfo.name,
                                    device.deviceType,
                                    device.browser,
                                    device.os,
                                    device.ipAddress,
                                    device.location,
                                    userInfo.collegeName || "",
                                    userInfo.departmentName || "",
                                    userInfo.employeeNo || ""
                                );
                                break;
                            case "hod":
                                await kafka.sendNewDeviceLoginHod(
                                    userInfo.email,
                                    userInfo.name,
                                    device.deviceType,
                                    device.browser,
                                    device.os,
                                    device.ipAddress,
                                    device.location,
                                    userInfo.collegeName || "",
                                    userInfo.departmentName || ""
                                );
                                break;
                            case "dean":
                                await kafka.sendNewDeviceLoginDean(
                                    userInfo.email,
                                    userInfo.name,
                                    device.deviceType,
                                    device.browser,
                                    device.os,
                                    device.ipAddress,
                                    device.location,
                                    userInfo.collegeName || ""
                                );
                                break;
                            case "nonTeachingStaff":
                                await kafka.sendNewDeviceLoginNonTeachingStaff(
                                    userInfo.email,
                                    userInfo.name,
                                    device.deviceType,
                                    device.browser,
                                    device.os,
                                    device.ipAddress,
                                    device.location,
                                    userInfo.collegeName || ""
                                );
                                break;
                            default:
                                console.log(`[SessionService] Unknown user type for new device notification: ${userType}`);
                        }
                    } catch (error) {
                        console.error(`[SessionService] Failed to send new device login notification:`, error);
                        // Don't throw - notification failure shouldn't break login
                    }
                }
            }

            // 4. Create New Session (DB)
            await prisma.userSession.create({
                data: {
                    userId,
                    userType,
                    sessionToken: sessionId,
                    deviceId: device.deviceId,
                    deviceType: device.deviceType,
                    browser: device.browser,
                    os: device.os,
                    ipAddress: device.ipAddress,
                    location: device.location,
                    expiresAt,
                    isActive: true
                }
            });

            // 5. Cache Active Session ID in Redis for fast validation
            await redisClient.set(`user:active:session:${userType}:${userId}`, sessionId, 'EX', 24 * 60 * 60);

        } catch (err) {
            console.error("Session handling failed", err);
            throw err; 
        } finally {
            // Release Lock
            if (lock) {
                try {
                    await redlock.release(lock);
                } catch (err) {
                    console.error("Failed to release lock", err);
                }
            }
        }
    }

    static async invalidateSession(dbSessionId: string, sessionToken: string) {
        // DB Update
        await prisma.userSession.update({
            where: { id: dbSessionId },
            data: { isActive: false, invalidatedAt: new Date() }
        });

        // Redis Pub/Sub for Real-time Invalidation (FR2.3)
        // This tells all instances (and potentially the Gateway) to kill this session
        await redisClient.publish('session:invalidate', JSON.stringify({ sessionToken }));
        
        // Remove from Redis Cache
        // Note: We use the sessionToken (from PASETO) as part of the key if needed, 
        // or simply delete the user's active session pointer.
        // Assuming your auth middleware checks `activeSession:student:{id}`
        // We need to verify if the token matches, but for single device, we just wipe the user's key.
    }
}