import { BaseWorker } from "./base.worker";
import { z } from "zod";
import { BulkImportJobPayload } from "../types/job.types";
import { hashPassword } from "../utils/password";
import { ImporterService } from "../services/importer.service";
import { producer } from "../config/kafka";

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

/**
 * Generate a section code based on department short name, batch year, and section number
 * Format: DEPT-YY-S1ABC (e.g., CSE-24-S1XYZ)
 */
function generateSectionCode(deptShortName: string, batchYear: string, sectionNumber: number): string {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let suffix = "";
    
    for (let i = 0; i < 3; i++) {
        suffix += chars[Math.floor(Math.random() * chars.length)];
    }
    
    const year = batchYear.split("-")[0]?.slice(-2) || "XX";
    
    return `${deptShortName.toUpperCase()}-${year}-S${sectionNumber}${suffix}`;
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

        // Fetch batch and department details for section code generation
        const [batch, department] = await Promise.all([
            this.prisma.batch.findUnique({
                where: { id: batchId },
                select: { id: true, batchYear: true }
            }),
            this.prisma.department.findUnique({
                where: { id: departmentId },
                select: { id: true, shortName: true }
            })
        ]);

        if (!batch) {
            throw new Error(`Batch not found: ${batchId}`);
        }

        if (!department) {
            throw new Error(`Department not found: ${departmentId}`);
        }

        // Fetch existing sections for this batch/department
        let availableSections = await this.prisma.section.findMany({
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

        // Calculate existing capacity
        const existingCapacity = availableSections.reduce((total: number, section: any) => {
            const usedCapacity = section.students.length;
            return total + (MAX_SECTION_CAPACITY - usedCapacity);
        }, 0);

        const totalStudentsToAdd = rows.length;
        const additionalCapacityNeeded = totalStudentsToAdd - existingCapacity;

        let sectionsCreated = 0;

        // Auto-create sections if needed
        if (additionalCapacityNeeded > 0 || availableSections.length === 0) {
            const sectionsNeeded = availableSections.length === 0 
                ? Math.ceil(totalStudentsToAdd / MAX_SECTION_CAPACITY)
                : Math.ceil(additionalCapacityNeeded / MAX_SECTION_CAPACITY);

            if (sectionsNeeded > 0) {
                const generatedCodes = new Set<string>();
                const existingSectionCodes = new Set(availableSections.map((s: any) => s.sectionNo));
                const existingSectionCount = availableSections.length;
                
                const sectionsToCreateData: Array<{
                    batchId: string;
                    departmentId: string;
                    sectionNo: string;
                    capacity: number;
                }> = [];

                for (let i = 0; i < sectionsNeeded; i++) {
                    let sectionCode: string;
                    let attempts = 0;
                    const maxAttempts = 100;
                    const sectionNumber = existingSectionCount + i + 1;

                    do {
                        sectionCode = generateSectionCode(
                            department.shortName || "SEC",
                            batch.batchYear || "2024-2025",
                            sectionNumber
                        );
                        attempts++;
                    } while ((existingSectionCodes.has(sectionCode) || generatedCodes.has(sectionCode)) && attempts < maxAttempts);

                    if (attempts >= maxAttempts) {
                        throw new Error("Failed to generate unique section codes. Please try again.");
                    }

                    generatedCodes.add(sectionCode);
                    sectionsToCreateData.push({
                        batchId: batchId,
                        departmentId: departmentId,
                        sectionNo: sectionCode,
                        capacity: MAX_SECTION_CAPACITY
                    });
                }

                // Create the sections
                if (sectionsToCreateData.length > 0) {
                    await this.prisma.section.createMany({
                        data: sectionsToCreateData
                    });
                    sectionsCreated = sectionsToCreateData.length;
                    console.log(`[StudentImportWorker] Auto-created ${sectionsCreated} new sections for batch ${batchId}`);

                    // Refresh available sections
                    availableSections = await this.prisma.section.findMany({
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
                }
            }
        }

        if (availableSections.length === 0) {
            throw new Error("Failed to create sections. Please try again.");
        }

        // Get existing registration numbers to avoid duplicates
        const existingRegNos = await this.prisma.student.findMany({
            select: { regNo: true }
        });
        const existingRegNoSet = new Set(existingRegNos.map((s: { regNo: string }) => s.regNo));

        // Generate single default password hash for all students (same pattern as teacher import)
        // Students will be required to change password on first login
        console.log(`[StudentImportWorker] Generating default password hash...`);
        const defaultPasswordHash = await hashPassword();
        console.log(`[StudentImportWorker] Password hash generated.`);

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

                studentsToCreate.push({
                    name: student.name,
                    email: student.email,
                    phone: student.phone || `+91${Math.floor(1000000000 + Math.random() * 9000000000)}`,
                    gender: student.gender,
                    password: defaultPasswordHash,
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

                studentsToCreate.push({
                    name: student.name,
                    email: student.email,
                    phone: student.phone || `+91${Math.floor(1000000000 + Math.random() * 9000000000)}`,
                    gender: student.gender,
                    password: defaultPasswordHash,
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

                studentsToCreate.push({
                    name: student.name,
                    email: student.email,
                    phone: student.phone || `+91${Math.floor(1000000000 + Math.random() * 9000000000)}`,
                    gender: student.gender,
                    password: defaultPasswordHash,
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
            select: { 
                id: true,
                regNo: true,
                name: true,
                email: true
            }
        });

        // Track records for rollback
        await ImporterService.trackRecords(
            payload.jobId,
            createdStudents.map((s: { id: string }) => ({
                recordId: s.id,
                recordType: "student" as const
            }))
        );

        console.log(`[StudentImportWorker] Created ${studentsToCreate.length} students with section allocation${sectionsCreated > 0 ? ` (${sectionsCreated} new sections auto-created)` : ''}`);
        
        // Send welcome emails if enabled (opt-in)
        if (payload.options?.sendWelcomeEmails === true) {
            try {
                // Get college and department info for email
                const college = payload.collegeId ? await this.prisma.college.findUnique({
                    where: { id: payload.collegeId },
                    select: { name: true }
                }) : null;

                const department = await this.prisma.department.findUnique({
                    where: { id: departmentId },
                    select: { name: true }
                });

                const collegeName = college?.name || "College";
                const departmentName = department?.name || "Department";
                const loginUrl = process.env.STUDENT_LOGIN_URL || "http://localhost:8000/auth/api/login-student";

                // Send welcome emails via Kafka
                console.log(`[StudentImportWorker] Sending welcome emails to ${createdStudents.length} students...`);
                
                // Producer is already connected at service startup
                for (const student of createdStudents) {
                    try {
                        // Note: We don't send the actual password for security reasons
                        // Instead, students should use "Forgot Password" to set their password
                        // Or the system should require password change on first login
                        await producer.send({
                            topic: 'welcome-messages',
                            messages: [{
                                value: JSON.stringify({
                                    action: 'email-notification',
                                    type: 'student-welcome-email',
                                    data: {
                                        email: student.email,
                                        name: student.name,
                                        regNo: student.regNo,
                                        tempPassword: 'Please use "Forgot Password" to set your password', // Security: No password sent via email
                                        collegeName,
                                        departmentName,
                                        loginUrl
                                    }
                                })
                            }]
                        });
                    } catch (emailError) {
                        console.error(`[StudentImportWorker] Failed to send welcome email to ${student.email}:`, emailError);
                        // Continue with other students even if one fails
                    }
                }
                
                console.log(`[StudentImportWorker] ✅ Welcome emails queued for ${createdStudents.length} students`);
            } catch (emailError) {
                console.error(`[StudentImportWorker] Error sending welcome emails:`, emailError);
                // Don't fail the job if email sending fails
            }
        } else {
            console.log(`[StudentImportWorker] Welcome emails disabled (sendWelcomeEmails: false or not set)`);
        }
    }
}
