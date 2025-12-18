import { BaseWorker } from "./base.worker";
import { z } from "zod";
import { BulkImportJobPayload } from "../types/job.types";
import { hashPassword } from "../utils/password";
import { ImporterService } from "../services/importer.service";
import * as crypto from "node:crypto";

const MAX_SECTION_CAPACITY = 70;

interface SectionTrack {
    id: string;
    sectionNo: string;
    currentCount: number;
    existingMaleCount: number;
    existingFemaleCount: number;
    existingOtherCount: number;
    newMaleCount: number;
    newFemaleCount: number;
    newOtherCount: number;
    maxCapacity: number;
}

function generateRegNo(): string {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    const length = Math.random() < 0.5 ? 7 : 8;
    let regNo = "";
    
    for (let i = 0; i < length; i++) {
        regNo += chars[Math.floor(Math.random() * chars.length)];
    }
    
    return regNo;
}

function generateRandomPassword(): string {
    return crypto.randomBytes(8).toString("hex");
}

export class StudentImportWorker extends BaseWorker {
    getValidationSchema() {
        return z.object({
            name: z.string().min(2),
            email: z.string().email(),
            phone: z.string().optional(),
            gender: z.enum(["MALE", "FEMALE", "OTHER"]),
            batchId: z.string(),
            departmentId: z.string(),
            // sectionId is now optional - will be auto-assigned if not provided
            sectionId: z.string().optional()
        });
    }

    async processBatch(rows: any[], payload: BulkImportJobPayload) {
        if (rows.length === 0) return;

        // Get unique batch/department combinations
        const batchId = rows[0].batchId;
        const departmentId = rows[0].departmentId;

        // Fetch existing sections for this batch/department
        const availableSections = await this.prisma.section.findMany({
            where: {
                batchId,
                departmentId
            },
            include: {
                students: {
                    select: {
                        id: true,
                        gender: true
                    }
                }
            }
        });

        if (availableSections.length === 0) {
            throw new Error(`No sections found for batch ${batchId} and department ${departmentId}. Please create sections first.`);
        }

        // Get existing registration numbers to avoid duplicates
        const existingRegNos = await this.prisma.student.findMany({
            select: { regNo: true }
        });
        const existingRegNoSet = new Set(existingRegNos.map((s: { regNo: string }) => s.regNo));

        // Separate students by gender for balanced allocation
        const maleStudents = rows.filter((s: any) => s.gender === "MALE");
        const femaleStudents = rows.filter((s: any) => s.gender === "FEMALE");
        const otherStudents = rows.filter((s: any) => s.gender === "OTHER");

        // Initialize section tracking
        const sectionTracking: SectionTrack[] = availableSections.map((section: any) => {
            const existingMale = section.students.filter((s: any) => s.gender === "MALE").length;
            const existingFemale = section.students.filter((s: any) => s.gender === "FEMALE").length;
            const existingOther = section.students.filter((s: any) => s.gender === "OTHER").length;
            
            return {
                id: section.id,
                sectionNo: section.sectionNo,
                currentCount: section.students.length,
                existingMaleCount: existingMale,
                existingFemaleCount: existingFemale,
                existingOtherCount: existingOther,
                newMaleCount: 0,
                newFemaleCount: 0,
                newOtherCount: 0,
                maxCapacity: MAX_SECTION_CAPACITY
            };
        });

        // Find best section for a student based on gender
        function findBestSection(gender: "MALE" | "FEMALE" | "OTHER"): SectionTrack | null {
            const sortedSections = [...sectionTracking].sort((a, b) => {
                const aAvailable = a.maxCapacity - a.currentCount;
                const bAvailable = b.maxCapacity - b.currentCount;
                
                // First priority: most available capacity
                if (aAvailable !== bAvailable) {
                    return bAvailable - aAvailable;
                }
                
                // Second priority: balance gender distribution
                const aTotalMale = a.existingMaleCount + a.newMaleCount;
                const aTotalFemale = a.existingFemaleCount + a.newFemaleCount;
                const aTotalOther = a.existingOtherCount + a.newOtherCount;
                
                const bTotalMale = b.existingMaleCount + b.newMaleCount;
                const bTotalFemale = b.existingFemaleCount + b.newFemaleCount;
                const bTotalOther = b.existingOtherCount + b.newOtherCount;
                
                if (gender === "MALE") {
                    return aTotalMale - bTotalMale;
                } else if (gender === "FEMALE") {
                    return aTotalFemale - bTotalFemale;
                } else {
                    return aTotalOther - bTotalOther;
                }
            });

            return sortedSections.find(s => s.currentCount < s.maxCapacity) || null;
        }

        const studentsToCreate: Array<{
            name: string;
            email: string;
            phone: string;
            gender: "MALE" | "FEMALE" | "OTHER";
            password: string;
            regNo: string;
            departmentId: string;
            batchId: string;
            sectionId: string;
            isLocked: boolean;
        }> = [];

        // Process students in round-robin by gender for balanced distribution
        let maleIndex = 0;
        let femaleIndex = 0;
        let otherIndex = 0;

        while (maleIndex < maleStudents.length || femaleIndex < femaleStudents.length || otherIndex < otherStudents.length) {
            // Process male student
            if (maleIndex < maleStudents.length) {
                const student = maleStudents[maleIndex];
                // Use provided sectionId or auto-assign
                let sectionId = student.sectionId;
                
                if (!sectionId) {
                    const section = findBestSection("MALE");
                    if (!section) {
                        throw new Error("No available capacity in sections. All sections are full (max capacity: 70).");
                    }
                    sectionId = section.id;
                    section.currentCount++;
                    section.newMaleCount++;
                }

                // Generate unique regNo
                let regNo: string;
                let attempts = 0;
                do {
                    regNo = generateRegNo();
                    attempts++;
                } while (existingRegNoSet.has(regNo) && attempts < 1000);
                
                if (attempts >= 1000) {
                    throw new Error("Failed to generate unique registration number.");
                }
                existingRegNoSet.add(regNo);

                const tempPassword = generateRandomPassword();
                const hashedPassword = await hashPassword(tempPassword);

                studentsToCreate.push({
                    name: student.name,
                    email: student.email,
                    phone: student.phone || `+91${Math.floor(1000000000 + Math.random() * 9000000000)}`,
                    gender: student.gender,
                    password: hashedPassword,
                    regNo,
                    departmentId,
                    batchId,
                    sectionId,
                    isLocked: false
                });

                maleIndex++;
            }

            // Process female student
            if (femaleIndex < femaleStudents.length) {
                const student = femaleStudents[femaleIndex];
                let sectionId = student.sectionId;
                
                if (!sectionId) {
                    const section = findBestSection("FEMALE");
                    if (!section) {
                        throw new Error("No available capacity in sections. All sections are full (max capacity: 70).");
                    }
                    sectionId = section.id;
                    section.currentCount++;
                    section.newFemaleCount++;
                }

                let regNo: string;
                let attempts = 0;
                do {
                    regNo = generateRegNo();
                    attempts++;
                } while (existingRegNoSet.has(regNo) && attempts < 1000);
                
                if (attempts >= 1000) {
                    throw new Error("Failed to generate unique registration number.");
                }
                existingRegNoSet.add(regNo);

                const tempPassword = generateRandomPassword();
                const hashedPassword = await hashPassword(tempPassword);

                studentsToCreate.push({
                    name: student.name,
                    email: student.email,
                    phone: student.phone || `+91${Math.floor(1000000000 + Math.random() * 9000000000)}`,
                    gender: student.gender,
                    password: hashedPassword,
                    regNo,
                    departmentId,
                    batchId,
                    sectionId,
                    isLocked: false
                });

                femaleIndex++;
            }

            // Process other gender student
            if (otherIndex < otherStudents.length) {
                const student = otherStudents[otherIndex];
                let sectionId = student.sectionId;
                
                if (!sectionId) {
                    const section = findBestSection("OTHER");
                    if (!section) {
                        throw new Error("No available capacity in sections. All sections are full (max capacity: 70).");
                    }
                    sectionId = section.id;
                    section.currentCount++;
                    section.newOtherCount++;
                }

                let regNo: string;
                let attempts = 0;
                do {
                    regNo = generateRegNo();
                    attempts++;
                } while (existingRegNoSet.has(regNo) && attempts < 1000);
                
                if (attempts >= 1000) {
                    throw new Error("Failed to generate unique registration number.");
                }
                existingRegNoSet.add(regNo);

                const tempPassword = generateRandomPassword();
                const hashedPassword = await hashPassword(tempPassword);

                studentsToCreate.push({
                    name: student.name,
                    email: student.email,
                    phone: student.phone || `+91${Math.floor(1000000000 + Math.random() * 9000000000)}`,
                    gender: student.gender,
                    password: hashedPassword,
                    regNo,
                    departmentId,
                    batchId,
                    sectionId,
                    isLocked: false
                });

                otherIndex++;
            }
        }

        // Batch insert all students
        await this.prisma.student.createMany({
            data: studentsToCreate,
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

        console.log(`[StudentImportWorker] Created ${studentsToCreate.length} students with section allocation`);
    }
}
