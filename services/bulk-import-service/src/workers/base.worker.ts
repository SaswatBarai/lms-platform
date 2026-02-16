import { BulkImportJobPayload } from "../types/job.types";
import { ParserService } from "../services/parser.service";
import { ProgressService } from "../services/progress.service";
import { CleanupService } from "../services/cleanup.service";
import { ErrorReporter } from "../utils/errorReporter";
import { ImportError } from "../types/import.types";
import { ZodSchema } from "zod";
import { logger } from "../config/logger";
// @ts-ignore - Prisma client import for commonjs
const { PrismaClient } = require("@prisma/client");

export abstract class BaseWorker {
    protected prisma = new PrismaClient();

    // Abstract methods children must implement
    abstract getValidationSchema(): ZodSchema;
    abstract processBatch(rows: any[], payload: BulkImportJobPayload): Promise<void>;

    async execute(payload: BulkImportJobPayload) {
        const { jobId, bucket, s3Key } = payload;
        logger.info(`[Worker] Starting job ${jobId}`);

        try {
            await ProgressService.updateProgress(jobId, 0, 0, "processing");

            // Fetch job options from database
            // @ts-ignore - BulkImportJob model exists in shared database
            const job = await this.prisma.bulkImportJob.findUnique({
                where: { id: jobId },
                select: { options: true, collegeId: true }
            });

            // Merge options into payload
            const payloadWithOptions: BulkImportJobPayload = {
                ...payload,
                options: job?.options as any || {},
                collegeId: payload.collegeId || job?.collegeId || undefined
            };

            // 1. Parse
            const rows = await ParserService.parseFile(bucket, s3Key);
            const total = rows.length;

            // 2. Validate & Filter
            const validRows: any[] = [];
            const errors: ImportError[] = [];
            const schema = this.getValidationSchema();

            rows.forEach((row, index) => {
                const { valid, error } = this.validateRow(row, index, schema);
                if (valid) validRows.push(row);
                else errors.push(error!);
            });

            // 3. Process Valid Rows (Batch Insert)
            // Note: In production, do this in chunks (e.g., 100)
            if (validRows.length > 0) {
                await this.processBatch(validRows, payloadWithOptions);
            }

            // 4. Handle Errors
            let errorUrl = undefined;
            if (errors.length > 0) {
                errorUrl = await ErrorReporter.generateAndUpload(jobId, errors);
                // Update DB with error URL
                // @ts-ignore - BulkImportJob model exists in shared database
                await this.prisma.bulkImportJob.update({
                    where: { id: jobId },
                    data: { errorReportUrl: errorUrl }
                });
            }

            // 5. Finalize
            await ProgressService.updateStats(jobId, validRows.length, errors.length);
            await ProgressService.updateProgress(jobId, total, total, "completed");
            
            // 6. Cleanup: Delete the source CSV/JSON file from S3
            const cleanupResult = await CleanupService.cleanupJobFiles(bucket, s3Key);
            if (cleanupResult.sourceDeleted) {
                logger.info(`[Worker] Job ${jobId} source file deleted from S3: ${s3Key}`);
            } else {
                logger.warn(`[Worker] Job ${jobId} failed to delete source file from S3: ${s3Key}`);
            }
            
            // 7. Send completion notification
            await ProgressService.sendCompletionNotification(jobId, validRows.length, errors.length, errorUrl);
            
            logger.info(`[Worker] Job ${jobId} completed. Success: ${validRows.length}, Failed: ${errors.length}`);

        } catch (error) {
            logger.error(`[Worker] Job ${jobId} failed`, error);
            await ProgressService.updateProgress(jobId, 0, 0, "failed");
        }
    }

    private validateRow(row: any, index: number, schema: ZodSchema) {
        const result = schema.safeParse(row);
        if (!result.success) {
            return {
                valid: false,
                error: {
                    row: index + 1,
                    error: result.error.errors.map(e => e.message).join(", "),
                    data: row
                }
            };
        }
        return { valid: true };
    }
}