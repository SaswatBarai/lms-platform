import { BaseWorker } from "./base.worker";
import { z } from "zod";
import { BulkImportJobPayload } from "../types/job.types";
// @ts-ignore - Module resolution
import { hashPassword } from "../utils/password";
import { ImporterService } from "../services/importer.service";

export class StudentImportWorker extends BaseWorker {
    getValidationSchema() {
        return z.object({
            name: z.string().min(2),
            email: z.string().email(),
            phone: z.string().optional(),
            gender: z.enum(["MALE", "FEMALE", "OTHER"]),
            batchId: z.string(),
            departmentId: z.string(),
            sectionId: z.string()
        });
    }

    async processBatch(rows: any[], payload: BulkImportJobPayload) {
        // Generate default password hash for all students
        const defaultPasswordHash = await hashPassword();

        const data = rows.map(row => ({
            name: row.name,
            email: row.email,
            phone: row.phone || `PHONE-${Math.random().toString(36).substr(2, 9)}`,
            gender: row.gender,
            batchId: row.batchId,
            departmentId: row.departmentId,
            sectionId: row.sectionId,
            password: defaultPasswordHash,
            regNo: row.regNo || `REG-${Math.floor(Math.random() * 10000)}`,
            isLocked: false
        }));

        // Use createMany and then fetch created records for tracking
        await this.prisma.student.createMany({
            data,
            skipDuplicates: true
        });

        // Track records for rollback - fetch created students by email
        const emails = rows.map((r: any) => r.email);
        const createdStudents = await this.prisma.student.findMany({
            where: {
                email: { in: emails }
            },
            select: { id: true }
        });

        // Track records for rollback
        await ImporterService.trackRecords(
            payload.jobId,
            createdStudents.map((s: { id: string }) => ({
                recordId: s.id,
                recordType: "student" as const
            }))
        );
    }
}