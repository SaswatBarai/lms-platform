// @ts-ignore - Prisma client import for commonjs
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

export interface ImportOptions {
    skipDuplicates?: boolean;
    sendWelcomeEmails?: boolean;
}

export class ImporterService {
    /**
     * Track imported records for rollback capability
     */
    static async trackRecord(
        jobId: string,
        recordId: string,
        recordType: "student" | "teacher"
    ): Promise<void> {
        await prisma.bulkImportRecord.create({
            data: {
                jobId,
                recordId,
                recordType
            }
        });
    }

    /**
     * Track multiple records in batch
     */
    static async trackRecords(
        jobId: string,
        records: Array<{ recordId: string; recordType: "student" | "teacher" }>
    ): Promise<void> {
        if (records.length === 0) return;

        await prisma.bulkImportRecord.createMany({
            data: records.map(r => ({
                jobId,
                recordId: r.recordId,
                recordType: r.recordType
            })),
            skipDuplicates: true
        });
    }

    /**
     * Get all records for a job (for rollback)
     */
    static async getJobRecords(jobId: string): Promise<Array<{ recordId: string; recordType: string }>> {
        return await prisma.bulkImportRecord.findMany({
            where: { jobId },
            select: {
                recordId: true,
                recordType: true
            }
        });
    }

    /**
     * Delete tracking records after successful rollback
     */
    static async deleteJobRecords(jobId: string): Promise<void> {
        await prisma.bulkImportRecord.deleteMany({
            where: { jobId }
        });
    }
}

