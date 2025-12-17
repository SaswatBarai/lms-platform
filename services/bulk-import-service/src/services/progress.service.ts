import Redis from "ioredis";
import { env } from "../config/env";
import { PrismaClient } from "@prisma/client";

const redis = new Redis(env.REDIS_URL);
const prisma = new PrismaClient();

export class ProgressService {
    static async updateProgress(jobId: string, processed: number, total: number, status: string) {
        // Update Redis for Real-time polling
        await redis.set(`bulk:job:${jobId}:progress`, JSON.stringify({
            status,
            processed,
            total,
            timestamp: new Date().toISOString()
        }));

        // Persist to DB periodically or on completion
        if (status === 'completed' || status === 'failed') {
             await prisma.bulkImportJob.update({
                where: { id: jobId },
                data: { status, completedAt: new Date() }
             });
        }
    }

    static async updateStats(jobId: string, successCount: number, failureCount: number) {
        await prisma.bulkImportJob.update({
            where: { id: jobId },
            data: { successRows: successCount, failedRows: failureCount }
        });
    }
}