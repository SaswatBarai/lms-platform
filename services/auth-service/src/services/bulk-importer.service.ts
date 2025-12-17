import { prisma } from "../lib/prisma.js";

export class ImporterService {
    /**
     * Track imported records for rollback capability
     */
    static async trackRecord(
        jobId: string,
        recordId: string,
        recordType: "student" | "teacher"
    ): Promise<void> {
        // @ts-ignore - BulkImportRecord model exists in shared database
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

        // @ts-ignore - BulkImportRecord model exists in shared database
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
        // @ts-ignore - BulkImportRecord model exists in shared database
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
        // @ts-ignore - BulkImportRecord model exists in shared database
        await prisma.bulkImportRecord.deleteMany({
            where: { jobId }
        });
    }
}

