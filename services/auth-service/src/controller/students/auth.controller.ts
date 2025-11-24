import { Request, Response } from "express";
import { asyncHandler } from "@utils/asyncHandler.js";
import { prisma } from "@lib/prisma.js";
import { hashPassword } from "@utils/security.js";
import { KafkaProducer } from "@messaging/producer.js";
import { AppError } from "@utils/AppError.js";
import { NonTeachingStaffRole } from "../../types/organization.js";
import * as crypto from "node:crypto";

// ==================== CONFIGURATION ====================
const MAX_SECTION_CAPACITY = 70;
const MIN_STUDENTS_PER_SECTION = 5;
const MAX_BATCH_SIZE = 500; // Maximum students per API call

// ==================== HELPER FUNCTIONS ====================

// Helper function to generate unique alphanumeric registration number
function generateRegNo(): string {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    const length = Math.random() < 0.5 ? 7 : 8;
    let regNo = "";
    
    for (let i = 0; i < length; i++) {
        regNo += chars[Math.floor(Math.random() * chars.length)];
    }
    
    return regNo;
}

// Helper function to generate random password
function generateRandomPassword(): string {
    return crypto.randomBytes(8).toString("hex");
}

// Helper function to generate meaningful section codes
// Format: DEPT-BATCH-XXX (e.g., CSE-2024-A1B)
function generateSectionCode(deptShortName: string, batchYear: string, sectionNumber: number): string {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let suffix = "";
    
    // Generate 3 random characters
    for (let i = 0; i < 3; i++) {
        suffix += chars[Math.floor(Math.random() * chars.length)];
    }
    
    // Extract year (e.g., "2024-2028" -> "24")
    const year = batchYear.split("-")[0]?.slice(-2) || "XX";
    
    return `${deptShortName.toUpperCase()}-${year}-S${sectionNumber}${suffix}`;
}

// Interface for validation errors
interface ValidationError {
    index: number;
    field: string;
    value: string;
    message: string;
}

// Interface for student input
interface StudentInput {
    name: string;
    email: string;
    phone: string;
    gender: "MALE" | "FEMALE" | "OTHER";
}

// Interface for section tracking
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

export const createStudentBulkController = asyncHandler(
    async(req:Request, res:Response) => {
        const {students, batchId, departmentId, dryRun = false}: {
            students: StudentInput[],
            batchId: string,
            departmentId: string,
            dryRun?: boolean  // Preview mode - don't actually create, just show what would happen
        } = req.body;

        const staffCollegeId = req.nonTeachingStaff.collegeId;
        const role = req.nonTeachingStaff.role;
        const userId = req.nonTeachingStaff.id;

        // Validate batch size
        if (students.length > MAX_BATCH_SIZE) {
            throw new AppError(`Cannot create more than ${MAX_BATCH_SIZE} students at once. Please split into smaller batches.`, 400);
        }

        // Check if staff is part of the college
        const staff = await prisma.nonTeachingStaff.findUnique({
            where:{
                id:userId
            },
            include:{
                college:{
                    select:{
                        id:true,
                        name:true
                    }
                }
            }
        });

        if(!staff){
            throw new AppError("Staff not found", 404);
        }

        if(staff.collegeId !== staffCollegeId){
            throw new AppError("Staff is not part of the college", 403);
        }

        // Check if staff has student section role
        if(role !== NonTeachingStaffRole.STUDENT_SECTION){
            throw new AppError("You are not authorized to create students. Only student section staff can create students.", 403);
        }

        // Validate that the batch exists and belongs to the college
        const batch = await prisma.batch.findUnique({
            where:{
                id: batchId
            },
            include:{
                course:{
                    include:{
                        college:{
                            select:{
                                id: true,
                                name: true
                            }
                        }
                    }
                }
            }
        });

        if(!batch){
            throw new AppError("Batch not found", 404);
        }

        if(batch.course.collegeId !== staffCollegeId){
            throw new AppError("Batch does not belong to your college", 403);
        }

        // Validate that the department exists and belongs to the college
        const department = await prisma.department.findUnique({
            where:{
                id: departmentId
            },
            include:{
                college:{
                    select:{
                        id: true,
                        name: true
                    }
                }
            }
        });

        if(!department){
            throw new AppError("Department not found", 404);
        }

        if(department.collegeId !== staffCollegeId){
            throw new AppError("Department does not belong to your college", 403);
        }

        // Get all existing sections for this batch and department (with gender info)
        let availableSections = await prisma.section.findMany({
            where:{
                batchId: batchId,
                departmentId: departmentId
            },
            include:{
                students: {
                    select: {
                        id: true,
                        gender: true  // Include gender for better ratio calculation
                    }
                }
            }
        });

        // Calculate total available capacity in existing sections
        const existingCapacity = availableSections.reduce((total, section) => {
            const usedCapacity = section.students.length;
            return total + (MAX_SECTION_CAPACITY - usedCapacity);
        }, 0);

        const totalStudentsToAdd = students.length;
        const additionalCapacityNeeded = totalStudentsToAdd - existingCapacity;

        // Calculate how many new sections we need to create
        let sectionsCreated = 0;
        const sectionsToCreateData: Array<{batchId: string; departmentId: string; sectionNo: string; capacity: number}> = [];
        
        if (additionalCapacityNeeded > 0) {
            const sectionsNeeded = Math.ceil(additionalCapacityNeeded / MAX_SECTION_CAPACITY);
            const generatedCodes = new Set<string>();
            
            // Get existing section codes to avoid duplicates
            const existingSectionCodes = new Set(availableSections.map(s => s.sectionNo));
            const existingSectionCount = availableSections.length;
            
            for (let i = 0; i < sectionsNeeded; i++) {
                let sectionCode: string;
                let attempts = 0;
                const maxAttempts = 100;
                const sectionNumber = existingSectionCount + i + 1;

                do {
                    sectionCode = generateSectionCode(department.shortName, batch.batchYear, sectionNumber);
                    attempts++;
                } while ((existingSectionCodes.has(sectionCode) || generatedCodes.has(sectionCode)) && attempts < maxAttempts);

                if (attempts >= maxAttempts) {
                    throw new AppError("Failed to generate unique section codes. Please try again.", 500);
                }

                generatedCodes.add(sectionCode);
                sectionsToCreateData.push({
                    batchId: batchId,
                    departmentId: departmentId,
                    sectionNo: sectionCode,
                    capacity: MAX_SECTION_CAPACITY
                });
            }

            // Only create sections if not in dry run mode
            if (!dryRun && sectionsToCreateData.length > 0) {
                await prisma.section.createMany({
                    data: sectionsToCreateData
                });
                sectionsCreated = sectionsToCreateData.length;

                // Refresh available sections list to include newly created ones
                availableSections = await prisma.section.findMany({
                    where:{
                        batchId: batchId,
                        departmentId: departmentId
                    },
                    include:{
                        students: {
                            select: {
                                id: true,
                                gender: true
                            }
                        }
                    }
                });
            } else if (dryRun) {
                // In dry run, simulate the sections for allocation preview
                sectionsCreated = sectionsToCreateData.length;
            }
        }

        // If still no sections (shouldn't happen but safety check)
        if(availableSections.length === 0){
            throw new AppError("Failed to create sections. Please try again.", 500);
        }

        // ==================== VALIDATION ====================
        // Check for duplicate emails AND phone numbers
        const emails = students.map(s => s.email);
        const phones = students.map(s => s.phone);

        const [existingByEmail, existingByPhone] = await Promise.all([
            prisma.student.findMany({
                where: { email: { in: emails } },
                select: { email: true }
            }),
            prisma.student.findMany({
                where: { phone: { in: phones } },
                select: { phone: true }
            })
        ]);

        const existingEmails = new Set(existingByEmail.map(s => s.email));
        const existingPhones = new Set(existingByPhone.map(s => s.phone));

        // Also check for duplicates within the input array itself
        const seenEmails = new Set<string>();
        const seenPhones = new Set<string>();
        const validationErrors: ValidationError[] = [];
        const validStudents: StudentInput[] = [];

        students.forEach((student, index) => {
            let hasError = false;

            // Check email duplicates in database
            if (existingEmails.has(student.email)) {
                validationErrors.push({
                    index,
                    field: "email",
                    value: student.email,
                    message: `Email '${student.email}' already exists in database`
                });
                hasError = true;
            }
            // Check email duplicates in input
            else if (seenEmails.has(student.email)) {
                validationErrors.push({
                    index,
                    field: "email",
                    value: student.email,
                    message: `Duplicate email '${student.email}' in input`
                });
                hasError = true;
            }

            // Check phone duplicates in database
            if (existingPhones.has(student.phone)) {
                validationErrors.push({
                    index,
                    field: "phone",
                    value: student.phone,
                    message: `Phone '${student.phone}' already exists in database`
                });
                hasError = true;
            }
            // Check phone duplicates in input
            else if (seenPhones.has(student.phone)) {
                validationErrors.push({
                    index,
                    field: "phone",
                    value: student.phone,
                    message: `Duplicate phone '${student.phone}' in input`
                });
                hasError = true;
            }

            if (!hasError) {
                validStudents.push(student);
                seenEmails.add(student.email);
                seenPhones.add(student.phone);
            }
        });

        // Return detailed validation errors if any
        if (validationErrors.length > 0) {
            return res.status(400).json({
                success: false,
                message: "Some students could not be created due to validation errors",
                errors: validationErrors,
                invalidCount: validationErrors.length,
                validCount: validStudents.length,
                totalSubmitted: students.length
            });
        }

        if (validStudents.length === 0) {
            throw new AppError("No valid students to create after validation", 400);
        }

        // Get all existing registration numbers to avoid duplicates
        const existingRegNos = await prisma.student.findMany({
            select: {
                regNo: true
            }
        });
        const existingRegNoSet = new Set(existingRegNos.map(s => s.regNo));

        // Step 1: Divide students into male and female groups
        const maleStudents = validStudents.filter(s => s.gender === "MALE");
        const femaleStudents = validStudents.filter(s => s.gender === "FEMALE");
        const otherStudents = validStudents.filter(s => s.gender === "OTHER");

        // Prepare section tracking with current capacity and EXISTING gender counts
        const sectionTracking: SectionTrack[] = availableSections.map(section => {
            // Count existing students by gender
            const existingMale = section.students.filter(s => s.gender === "MALE").length;
            const existingFemale = section.students.filter(s => s.gender === "FEMALE").length;
            const existingOther = section.students.filter(s => s.gender === "OTHER").length;
            
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

        // For dry run with new sections, add simulated sections to tracking
        if (dryRun && sectionsToCreateData.length > 0) {
            sectionsToCreateData.forEach((sectionData, index) => {
                sectionTracking.push({
                    id: `new-section-${index}`,
                    sectionNo: sectionData.sectionNo,
                    currentCount: 0,
                    existingMaleCount: 0,
                    existingFemaleCount: 0,
                    existingOtherCount: 0,
                    newMaleCount: 0,
                    newFemaleCount: 0,
                    newOtherCount: 0,
                    maxCapacity: MAX_SECTION_CAPACITY
                });
            });
        }

        // Helper function to find best section for a student based on gender ratio
        // Considers BOTH existing students AND newly allocated students
        function findBestSection(gender: "MALE" | "FEMALE" | "OTHER"): SectionTrack | null {
            const sortedSections = [...sectionTracking].sort((a, b) => {
                const aAvailable = a.maxCapacity - a.currentCount;
                const bAvailable = b.maxCapacity - b.currentCount;
                
                // Prioritize sections with more available capacity
                if (aAvailable !== bAvailable) {
                    return bAvailable - aAvailable;
                }
                
                // Calculate total gender counts (existing + new)
                const aTotalMale = a.existingMaleCount + a.newMaleCount;
                const aTotalFemale = a.existingFemaleCount + a.newFemaleCount;
                const aTotalOther = a.existingOtherCount + a.newOtherCount;
                
                const bTotalMale = b.existingMaleCount + b.newMaleCount;
                const bTotalFemale = b.existingFemaleCount + b.newFemaleCount;
                const bTotalOther = b.existingOtherCount + b.newOtherCount;
                
                // Then prioritize gender balance (prefer sections with fewer of this gender)
                if (gender === "MALE") {
                    return aTotalMale - bTotalMale;
                } else if (gender === "FEMALE") {
                    return aTotalFemale - bTotalFemale;
                } else {
                    return aTotalOther - bTotalOther;
                }
            });

            // Find first section with available capacity
            return sortedSections.find(s => s.currentCount < s.maxCapacity) || null;
        }

        // Step 2 & 3: Allocate students maintaining good gender ratio
        // Allocate male and female students alternately to maintain balance
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
        }> = [];
        
        const emailData: Array<{
            email: string;
            name: string;
            regNo: string;
            tempPassword: string;
            collegeName: string;
            departmentName: string;
        }> = [];

        let maleIndex = 0;
        let femaleIndex = 0;
        let otherIndex = 0;

        // Allocate students maintaining gender balance
        while (maleIndex < maleStudents.length || femaleIndex < femaleStudents.length || otherIndex < otherStudents.length) {
            // Alternate between male and female for better ratio
            if (maleIndex < maleStudents.length) {
                const student = maleStudents[maleIndex];
                if (!student) continue;
                const section = findBestSection("MALE");
                
                if (!section) {
                    throw new AppError("No available capacity in sections. All sections are full (max capacity: 70).", 400);
                }

                // Generate unique registration number
                let regNo: string;
                let regNoAttempts = 0;
                const maxRegNoAttempts = 1000;

                do {
                    regNo = generateRegNo();
                    regNoAttempts++;
                } while(existingRegNoSet.has(regNo) && regNoAttempts < maxRegNoAttempts);

                if(regNoAttempts >= maxRegNoAttempts){
                    throw new AppError("Failed to generate unique registration number. Please try again.", 500);
                }

                existingRegNoSet.add(regNo);
                const tempPassword = generateRandomPassword();
                const hashedPassword = await hashPassword(tempPassword);

                studentsToCreate.push({
                    name: student.name,
                    email: student.email,
                    phone: student.phone,
                    gender: student.gender,
                    password: hashedPassword,
                    regNo: regNo,
                    departmentId: departmentId,
                    batchId: batchId,
                    sectionId: section.id
                });

                emailData.push({
                    email: student.email,
                    name: student.name,
                    regNo: regNo,
                    tempPassword: tempPassword,
                    collegeName: staff.college.name,
                    departmentName: department.name
                });

                section.currentCount++;
                section.newMaleCount++;
                maleIndex++;
            }

            if (femaleIndex < femaleStudents.length) {
                const student = femaleStudents[femaleIndex];
                if (!student) continue;
                const section = findBestSection("FEMALE");
                
                if (!section) {
                    throw new AppError("No available capacity in sections. All sections are full (max capacity: 70).", 400);
                }

                // Generate unique registration number
                let regNo: string;
                let regNoAttempts = 0;
                const maxRegNoAttempts = 1000;

                do {
                    regNo = generateRegNo();
                    regNoAttempts++;
                } while(existingRegNoSet.has(regNo) && regNoAttempts < maxRegNoAttempts);

                if(regNoAttempts >= maxRegNoAttempts){
                    throw new AppError("Failed to generate unique registration number. Please try again.", 500);
                }

                existingRegNoSet.add(regNo);
                const tempPassword = generateRandomPassword();
                const hashedPassword = await hashPassword(tempPassword);

                studentsToCreate.push({
                    name: student.name,
                    email: student.email,
                    phone: student.phone,
                    gender: student.gender,
                    password: hashedPassword,
                    regNo: regNo,
                    departmentId: departmentId,
                    batchId: batchId,
                    sectionId: section.id
                });

                emailData.push({
                    email: student.email,
                    name: student.name,
                    regNo: regNo,
                    tempPassword: tempPassword,
                    collegeName: staff.college.name,
                    departmentName: department.name
                });

                section.currentCount++;
                section.newFemaleCount++;
                femaleIndex++;
            }

            // Allocate OTHER gender students
            if (otherIndex < otherStudents.length) {
                const student = otherStudents[otherIndex];
                if (!student) continue;
                const section = findBestSection("OTHER");
                
                if (!section) {
                    throw new AppError("No available capacity in sections. All sections are full (max capacity: 70).", 400);
                }

                // Generate unique registration number
                let regNo: string;
                let regNoAttempts = 0;
                const maxRegNoAttempts = 1000;

                do {
                    regNo = generateRegNo();
                    regNoAttempts++;
                } while(existingRegNoSet.has(regNo) && regNoAttempts < maxRegNoAttempts);

                if(regNoAttempts >= maxRegNoAttempts){
                    throw new AppError("Failed to generate unique registration number. Please try again.", 500);
                }

                existingRegNoSet.add(regNo);
                const tempPassword = generateRandomPassword();
                const hashedPassword = await hashPassword(tempPassword);

                studentsToCreate.push({
                    name: student.name,
                    email: student.email,
                    phone: student.phone,
                    gender: student.gender,
                    password: hashedPassword,
                    regNo: regNo,
                    departmentId: departmentId,
                    batchId: batchId,
                    sectionId: section.id
                });

                emailData.push({
                    email: student.email,
                    name: student.name,
                    regNo: regNo,
                    tempPassword: tempPassword,
                    collegeName: staff.college.name,
                    departmentName: department.name
                });

                section.currentCount++;
                section.newOtherCount++;
                otherIndex++;
            }
        }

        // Step 4 & 5: Check for sections with irregular/low student count and reallocate
        const sectionsToReallocate: Array<{
            sectionId: string;
            students: typeof studentsToCreate;
            originalSection: SectionTrack;
        }> = [];

        // Find sections with too few total students (existing + newly allocated)
        sectionTracking.forEach(section => {
            const totalNewStudents = section.newMaleCount + section.newFemaleCount + section.newOtherCount;
            const totalExisting = section.existingMaleCount + section.existingFemaleCount + section.existingOtherCount;
            const totalStudents = totalExisting + totalNewStudents;
            
            const newStudentsInSection = studentsToCreate.filter(s => s.sectionId === section.id);
            
            // If total students is less than minimum threshold and we have new students to reallocate
            if (totalStudents < MIN_STUDENTS_PER_SECTION && newStudentsInSection.length > 0) {
                sectionsToReallocate.push({
                    sectionId: section.id,
                    students: newStudentsInSection,
                    originalSection: section
                });
            }
        });

        // Reallocate students from sections with too few students
        for (const reallocation of sectionsToReallocate) {
            const section = reallocation.originalSection;

            for (const student of reallocation.students) {
                // Find a better section for this student (prefer sections with more capacity)
                const newSection = findBestSection(student.gender as "MALE" | "FEMALE" | "OTHER");
                
                if (newSection && newSection.id !== section.id && newSection.currentCount < newSection.maxCapacity) {
                    // Update student's section
                    const studentIndex = studentsToCreate.findIndex(s => 
                        s.email === student.email && s.sectionId === section.id
                    );
                    
                    if (studentIndex !== -1 && studentsToCreate[studentIndex]) {
                        const studentToMove = studentsToCreate[studentIndex];
                        // Remove from old section
                        section.currentCount--;
                        if (studentToMove.gender === "MALE") section.newMaleCount--;
                        else if (studentToMove.gender === "FEMALE") section.newFemaleCount--;
                        else section.newOtherCount--;

                        // Add to new section
                        studentToMove.sectionId = newSection.id;
                        newSection.currentCount++;
                        if (studentToMove.gender === "MALE") newSection.newMaleCount++;
                        else if (studentToMove.gender === "FEMALE") newSection.newFemaleCount++;
                        else newSection.newOtherCount++;
                    }
                }
            }
        }

        // Build section summary with gender distribution (for both dry run and actual)
        const sectionSummary = sectionTracking
            .filter(s => s.newMaleCount > 0 || s.newFemaleCount > 0 || s.newOtherCount > 0)
            .map(s => ({
                sectionNo: s.sectionNo,
                isNewSection: s.id.startsWith('new-section-'),
                existingStudents: s.existingMaleCount + s.existingFemaleCount + s.existingOtherCount,
                newlyAllocated: s.newMaleCount + s.newFemaleCount + s.newOtherCount,
                genderDistribution: {
                    existing: {
                        male: s.existingMaleCount,
                        female: s.existingFemaleCount,
                        other: s.existingOtherCount
                    },
                    new: {
                        male: s.newMaleCount,
                        female: s.newFemaleCount,
                        other: s.newOtherCount
                    },
                    total: {
                        male: s.existingMaleCount + s.newMaleCount,
                        female: s.existingFemaleCount + s.newFemaleCount,
                        other: s.existingOtherCount + s.newOtherCount
                    }
                },
                totalInSection: s.currentCount,
                availableCapacity: s.maxCapacity - s.currentCount
            }));

        // If dry run, return preview without creating anything
        if (dryRun) {
            return res.status(200).json({
                success: true,
                dryRun: true,
                message: "Dry run completed. No data was created. Review the allocation preview below.",
                preview: {
                    studentsToCreate: validStudents.length,
                    sectionsToCreate: sectionsCreated,
                    totalSectionsAfter: sectionTracking.length,
                    sectionCapacity: MAX_SECTION_CAPACITY,
                    genderBreakdown: {
                        male: maleStudents.length,
                        female: femaleStudents.length,
                        other: otherStudents.length
                    },
                    sectionAllocation: sectionSummary,
                    students: emailData.map(s => ({
                        name: s.name,
                        email: s.email,
                        regNo: s.regNo,
                        sectionNo: sectionTracking.find(sec => sec.id === studentsToCreate.find(st => st.email === s.email)?.sectionId)?.sectionNo
                    }))
                }
            });
        }

        // ==================== ACTUAL CREATION (with transaction) ====================
        const createdStudents = await prisma.$transaction(async (tx) => {
            // Create all students
            const result = await tx.student.createMany({
                data: studentsToCreate,
                skipDuplicates: false
            });

            if (result.count !== studentsToCreate.length) {
                throw new AppError("Failed to create some students", 500);
            }

            return result;
        });

        // Send welcome emails via Kafka (outside transaction - emails are async)
        const kafkaProducer = KafkaProducer.getInstance();
        const loginUrl = "http://localhost:8000/auth/api/login-student";

        // Send emails in parallel for better performance
        await Promise.all(emailData.map(data => 
            kafkaProducer.sendStudentWelcomeEmail(
                data.email,
                data.name,
                data.regNo,
                data.tempPassword,
                data.collegeName,
                data.departmentName,
                loginUrl
            )
        ));

        return res.status(201).json({
            success: true,
            message: `${createdStudents.count} student(s) created successfully. ${sectionsCreated > 0 ? `${sectionsCreated} new section(s) were automatically created.` : ''} Welcome emails will be sent shortly.`,
            data: {
                created: createdStudents.count,
                total: students.length,
                sectionsCreated: sectionsCreated,
                totalSections: sectionTracking.length,
                sectionCapacity: MAX_SECTION_CAPACITY,
                genderBreakdown: {
                    male: maleStudents.length,
                    female: femaleStudents.length,
                    other: otherStudents.length
                },
                sectionSummary: sectionSummary,
                students: emailData.map(s => ({
                    name: s.name,
                    email: s.email,
                    regNo: s.regNo
                }))
            }
        });
    }
)
