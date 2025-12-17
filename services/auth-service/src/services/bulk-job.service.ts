import { prisma } from "../lib/prisma.js";
import { ImporterService } from "./bulk-importer.service.js";

export class BulkJobService {
    /**
     * Rollback a bulk import job by deleting all imported records
     */
    static async rollbackJob(jobId: string): Promise<{ recordsDeleted: number }> {
        // Get all records for this job
        const records = await ImporterService.getJobRecords(jobId);

        let deletedCount = 0;

        // Delete records by type
        for (const record of records) {
            try {
                if (record.recordType === "student") {
                    await prisma.student.delete({
                        where: { id: record.recordId }
                    });
                    deletedCount++;
                } else if (record.recordType === "teacher") {
                    await prisma.teacher.delete({
                        where: { id: record.recordId }
                    });
                    deletedCount++;
                }
            } catch (error) {
                // Record might already be deleted, continue
                console.warn(`Failed to delete record ${record.recordId}:`, error);
            }
        }

        // Update job status
        // @ts-ignore - BulkImportJob model exists in shared database
        await prisma.bulkImportJob.update({
            where: { id: jobId },
            data: {
                status: "rolled_back"
            }
        });

        // Delete tracking records
        await ImporterService.deleteJobRecords(jobId);

        return { recordsDeleted: deletedCount };
    }
}

