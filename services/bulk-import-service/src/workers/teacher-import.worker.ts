import { BaseWorker } from "./base.worker";
import { z } from "zod";
import { BulkImportJobPayload } from "../types/job.types";
import { hashPassword } from "../utils/password";
import { ImporterService } from "../services/importer.service";

export class TeacherImportWorker extends BaseWorker {
    getValidationSchema() {
        return z.object({
            name: z.string().min(2),
            email: z.string().email(),
            phone: z.string().min(10),
            gender: z.enum(["MALE", "FEMALE", "OTHER"]),
            departmentId: z.string(),
            employeeNo: z.string().min(1)
        });
    }

    async processBatch(rows: any[], payload: BulkImportJobPayload) {
        // Generate default password hash for all teachers
        const defaultPasswordHash = await hashPassword();

        const data = rows.map(row => ({
            name: row.name,
            email: row.email,
            phone: row.phone,
            gender: row.gender,
            departmentId: row.departmentId,
            employeeNo: row.employeeNo,
            password: defaultPasswordHash,
            isLocked: false
        }));

        await this.prisma.teacher.createMany({
            data,
            skipDuplicates: true
        });

        // Track records for rollback - fetch created teachers by email
        const emails = rows.map((r: any) => r.email);
        const createdTeachers = await this.prisma.teacher.findMany({
            where: {
                email: { in: emails }
            },
            select: { id: true }
        });

        // Track records for rollback
        await ImporterService.trackRecords(
            payload.jobId,
            createdTeachers.map((t: { id: string }) => ({
                recordId: t.id,
                recordType: "teacher" as const
            }))
        );
    }
}

