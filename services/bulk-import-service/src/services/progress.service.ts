import Redis from "ioredis";
import { env } from "../config/env";
import { producer } from "../config/kafka";
import { logger } from "../config/logger";

const redis = new Redis(env.REDIS_URL);
// @ts-ignore - Prisma client import for commonjs
const { PrismaClient } = require("@prisma/client");

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
             // @ts-ignore - BulkImportJob model exists in shared database
             await prisma.bulkImportJob.update({
                where: { id: jobId },
                data: { status, completedAt: new Date() }
             });
        }
    }

    static async updateStats(jobId: string, successCount: number, failureCount: number) {
        // @ts-ignore - BulkImportJob model exists in shared database
        await prisma.bulkImportJob.update({
            where: { id: jobId },
            data: { successRows: successCount, failedRows: failureCount }
        });
    }

    /**
     * Send completion notification via Kafka
     */
    static async sendCompletionNotification(jobId: string, successCount: number, failureCount: number, errorReportUrl?: string) {
        try {
            // @ts-ignore - BulkImportJob model exists in shared database
            const job = await prisma.bulkImportJob.findUnique({
                where: { id: jobId },
                select: {
                    uploadedBy: true,
                    uploadedByType: true,
                    type: true,
                    fileName: true
                }
            });

            if (!job) {
                logger.error(`[ProgressService] Job ${jobId} not found for notification`);
                return;
            }

            // Send notification via Kafka
            await producer.send({
                topic: 'bulk.import.notifications',
                messages: [{
                    value: JSON.stringify({
                        jobId,
                        userId: job.uploadedBy,
                        userType: job.uploadedByType,
                        importType: job.type,
                        fileName: job.fileName,
                        successCount,
                        failureCount,
                        totalCount: successCount + failureCount,
                        errorReportUrl,
                        timestamp: new Date().toISOString()
                    })
                }]
            });

            logger.info(`[ProgressService] Completion notification sent for job ${jobId}`);
        } catch (error) {
            logger.error(`[ProgressService] Failed to send completion notification for job ${jobId}:`, error);
        }
    }
}
