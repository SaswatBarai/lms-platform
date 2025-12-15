import { Request, Response } from "express";
import { asyncHandler } from "@utils/asyncHandler.js";
import { prisma } from "@lib/prisma.js";
import { hashPassword, PasetoV4SecurityManager, validateEmail, verifyPassword } from "@utils/security.js";
import { KafkaProducer } from "@messaging/producer.js";
import { AppError } from "@utils/AppError.js";
import { NonTeachingStaffRole } from "../../types/organization.js";
import * as crypto from "node:crypto";
import redisClient from "@config/redis.js";
import process from "node:process";

import { LockoutService } from "../../services/lockout.service.js";
import { PasswordService } from "../../services/password.service.js";
import * as requestIp from "request-ip";

const MAX_SECTION_CAPACITY = 70;
const MIN_STUDENTS_PER_SECTION = 5;
const MAX_BATCH_SIZE = 500;

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

function generateSectionCode(deptShortName: string, batchYear: string, sectionNumber: number): string {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let suffix = "";
    
    for (let i = 0; i < 3; i++) {
        suffix += chars[Math.floor(Math.random() * chars.length)];
    }
    
    const year = batchYear.split("-")[0]?.slice(-2) || "XX";
    
    return `${deptShortName.toUpperCase()}-${year}-S${sectionNumber}${suffix}`;
}

interface ValidationError {
    index: number;
    field: string;
    value: string;
    message: string;
}

interface StudentInput {
    name: string;
    email: string;
    phone: string;
    gender: "MALE" | "FEMALE" | "OTHER";
}

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
            dryRun?: boolean
        } = req.body;

        const staffCollegeId = req.nonTeachingStaff.collegeId;
        const role = req.nonTeachingStaff.role;
        const userId = req.nonTeachingStaff.id;

        if (students.length > MAX_BATCH_SIZE) {
            throw new AppError(`Cannot create more than ${MAX_BATCH_SIZE} students at once. Please split into smaller batches.`, 400);
        }

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

        if(role !== NonTeachingStaffRole.STUDENT_SECTION){
            throw new AppError("You are not authorized to create students. Only student section staff can create students.", 403);
        }

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

        let availableSections = await prisma.section.findMany({
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

        const existingCapacity = availableSections.reduce((total, section) => {
            const usedCapacity = section.students.length;
            return total + (MAX_SECTION_CAPACITY - usedCapacity);
        }, 0);

        const totalStudentsToAdd = students.length;
        const additionalCapacityNeeded = totalStudentsToAdd - existingCapacity;

        let sectionsCreated = 0;
        const sectionsToCreateData: Array<{batchId: string; departmentId: string; sectionNo: string; capacity: number}> = [];
        
        if (additionalCapacityNeeded > 0) {
            const sectionsNeeded = Math.ceil(additionalCapacityNeeded / MAX_SECTION_CAPACITY);
            const generatedCodes = new Set<string>();
            
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

            if (!dryRun && sectionsToCreateData.length > 0) {
                await prisma.section.createMany({
                    data: sectionsToCreateData
                });
                sectionsCreated = sectionsToCreateData.length;

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
                sectionsCreated = sectionsToCreateData.length;
            }
        }

        if(availableSections.length === 0){
            throw new AppError("Failed to create sections. Please try again.", 500);
        }

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

        const seenEmails = new Set<string>();
        const seenPhones = new Set<string>();
        const validationErrors: ValidationError[] = [];
        const validStudents: StudentInput[] = [];

        students.forEach((student, index) => {
            let hasError = false;

            if (existingEmails.has(student.email)) {
                validationErrors.push({
                    index,
                    field: "email",
                    value: student.email,
                    message: `Email '${student.email}' already exists in database`
                });
                hasError = true;
            }
            else if (seenEmails.has(student.email)) {
                validationErrors.push({
                    index,
                    field: "email",
                    value: student.email,
                    message: `Duplicate email '${student.email}' in input`
                });
                hasError = true;
            }

            if (existingPhones.has(student.phone)) {
                validationErrors.push({
                    index,
                    field: "phone",
                    value: student.phone,
                    message: `Phone '${student.phone}' already exists in database`
                });
                hasError = true;
            }
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

        const existingRegNos = await prisma.student.findMany({
            select: {
                regNo: true
            }
        });
        const existingRegNoSet = new Set(existingRegNos.map(s => s.regNo));

        const maleStudents = validStudents.filter(s => s.gender === "MALE");
        const femaleStudents = validStudents.filter(s => s.gender === "FEMALE");
        const otherStudents = validStudents.filter(s => s.gender === "OTHER");

        const sectionTracking: SectionTrack[] = availableSections.map(section => {
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

        function findBestSection(gender: "MALE" | "FEMALE" | "OTHER"): SectionTrack | null {
            const sortedSections = [...sectionTracking].sort((a, b) => {
                const aAvailable = a.maxCapacity - a.currentCount;
                const bAvailable = b.maxCapacity - b.currentCount;
                
                if (aAvailable !== bAvailable) {
                    return bAvailable - aAvailable;
                }
                
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

        while (maleIndex < maleStudents.length || femaleIndex < femaleStudents.length || otherIndex < otherStudents.length) {
            if (maleIndex < maleStudents.length) {
                const student = maleStudents[maleIndex];
                if (!student) continue;
                const section = findBestSection("MALE");
                
                if (!section) {
                    throw new AppError("No available capacity in sections. All sections are full (max capacity: 70).", 400);
                }

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

            if (otherIndex < otherStudents.length) {
                const student = otherStudents[otherIndex];
                if (!student) continue;
                const section = findBestSection("OTHER");
                
                if (!section) {
                    throw new AppError("No available capacity in sections. All sections are full (max capacity: 70).", 400);
                }

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

        const sectionsToReallocate: Array<{
            sectionId: string;
            students: typeof studentsToCreate;
            originalSection: SectionTrack;
        }> = [];

        sectionTracking.forEach(section => {
            const totalNewStudents = section.newMaleCount + section.newFemaleCount + section.newOtherCount;
            const totalExisting = section.existingMaleCount + section.existingFemaleCount + section.existingOtherCount;
            const totalStudents = totalExisting + totalNewStudents;
            
            const newStudentsInSection = studentsToCreate.filter(s => s.sectionId === section.id);
            
            if (totalStudents < MIN_STUDENTS_PER_SECTION && newStudentsInSection.length > 0) {
                sectionsToReallocate.push({
                    sectionId: section.id,
                    students: newStudentsInSection,
                    originalSection: section
                });
            }
        });

        for (const reallocation of sectionsToReallocate) {
            const section = reallocation.originalSection;

            for (const student of reallocation.students) {
                const newSection = findBestSection(student.gender as "MALE" | "FEMALE" | "OTHER");
                
                if (newSection && newSection.id !== section.id && newSection.currentCount < newSection.maxCapacity) {
                    const studentIndex = studentsToCreate.findIndex(s => 
                        s.email === student.email && s.sectionId === section.id
                    );
                    
                    if (studentIndex !== -1 && studentsToCreate[studentIndex]) {
                        const studentToMove = studentsToCreate[studentIndex];
                        section.currentCount--;
                        if (studentToMove.gender === "MALE") section.newMaleCount--;
                        else if (studentToMove.gender === "FEMALE") section.newFemaleCount--;
                        else section.newOtherCount--;

                        studentToMove.sectionId = newSection.id;
                        newSection.currentCount++;
                        if (studentToMove.gender === "MALE") newSection.newMaleCount++;
                        else if (studentToMove.gender === "FEMALE") newSection.newFemaleCount++;
                        else newSection.newOtherCount++;
                    }
                }
            }
        }

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

        const createdStudents = await prisma.$transaction(async (tx) => {
            const result = await tx.student.createMany({
                data: studentsToCreate,
                skipDuplicates: false
            });

            if (result.count !== studentsToCreate.length) {
                throw new AppError("Failed to create some students", 500);
            }

            return result;
        });

        const kafkaProducer = KafkaProducer.getInstance();
        const loginUrl = "http://localhost:8000/auth/api/login-student";

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


export const loginStudentController = asyncHandler(
    async(req: Request, res: Response) => {
        const { identifier, password }: { identifier: string; password: string } = req.body;
        const ip = requestIp.getClientIp(req) || "unknown";
        const userAgent = req.headers['user-agent'] || "unknown";

        const student = await prisma.student.findFirst({
            where: {
                OR: [
                    { email: identifier.toLowerCase() },
                    { regNo: identifier.toUpperCase() }
                ]
            },
            include: {
                department: {
                    include: {
                        college: {
                            select: {
                                id: true,
                                name: true,
                                organizationId: true
                            }
                        }
                    }
                },
                batch: {
                    include: {
                        course: true
                    }
                },
                section: true
            }
        });

        if (!student) {
            throw new AppError("Invalid credentials. Please check your email/registration number and password.", 401);
        }

        const isPasswordValid = await verifyPassword(student.password, password);
        
        if (!isPasswordValid) {
            // Phase 1: Handle Failed Attempt
            await LockoutService.handleFailedAttempt(student.id, "student", student.email);
            
            // Phase 1: Audit Log Failure
            const kafka = KafkaProducer.getInstance();
            // await kafka.sendAuditLog({ userId: student.id, action: "LOGIN_FAILED", ip, userAgent, success: false });

            throw new AppError("Invalid credentials. Please check your email/registration number and password.", 401);
        }

        // Phase 1: Reset Lockout on Success
        await LockoutService.resetAttempts(student.id, "student");

        const sessionKey = `activeSession:student:${student.id}`;
        const existingSessionId = await redisClient.hget(sessionKey, 'sessionId');
        if (existingSessionId) {
            await redisClient.hdel(sessionKey, 'sessionId');
        }

        const accessSessionId = crypto.randomBytes(16).toString('hex');
        
        // Phase 1: Token Family for Rotation
        const tokenFamily = crypto.randomUUID();

        const tokenPayload = {
            id: student.id,
            email: student.email,
            name: student.name,
            regNo: student.regNo,
            role: "student",
            type: "student",
            departmentId: student.departmentId,
            batchId: student.batchId,
            sectionId: student.sectionId,
            collegeId: student.department.collegeId,
            organizationId: student.department.college.organizationId,
            sessionId: accessSessionId
        };

        await redisClient.hset(sessionKey, {
            sessionId: accessSessionId,
            studentId: student.id,
            organizationId: student.department.college.organizationId,
            collegeId: student.department.collegeId,
            active: 'true',
        });
        await redisClient.expire(sessionKey, 1 * 24 * 60 * 60);

        const securityManager = PasetoV4SecurityManager.getInstance();
        const accessToken = await securityManager.generateAccessToken(tokenPayload);
        const refreshSessionId = crypto.randomBytes(16).toString('hex');
        const refreshToken = await securityManager.generateRefreshToken(student.id, refreshSessionId);

        // Phase 1: Audit Log Success
        const kafka = KafkaProducer.getInstance();
        // await kafka.sendAuditLog({ userId: student.id, action: "LOGIN_SUCCESS", ip, userAgent, success: true });

        const isProduction = process?.env?.NODE_ENV === "production";
        res.cookie("accessToken", accessToken, {
            httpOnly: true,
            secure: isProduction,
            maxAge: 1 * 24 * 60 * 60 * 1000
        });
        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: isProduction,
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        return res.status(200).json({
            success: true,
            message: "Login successful",
            data: {
                accessToken,
                student: {
                    id: student.id,
                    name: student.name,
                    email: student.email,
                    regNo: student.regNo,
                    department: student.department.name,
                    batch: student.batch.batchYear,
                    course: student.batch.course.shortName,
                    section: student.section.sectionNo,
                    college: student.department.college.name
                }
            }
        });
    }
);


export const logoutStudentController = asyncHandler(
    async(req: Request, res: Response) => {
        const { id } = req.student;

        if (!id) {
            throw new AppError("Student not found", 404);
        }

        const sessionKey = `activeSession:student:${id}`;
        await redisClient.hdel(sessionKey, 'sessionId');

        res.clearCookie("accessToken");
        res.clearCookie("refreshToken");

        return res.status(200).json({
            success: true,
            message: "Logout successful"
        });
    }
);


// [UPDATED] Renamed to reflect Rotation behavior
export const regenerateAccessTokenStudentController = asyncHandler(
    async(req: Request, res: Response) => {
        const { id } = req.student; // This comes from authValidator validating the OLD refresh token
        
        // [ADDED] Extract the old refresh token payload to get the tokenFamily
        const refreshToken = req.cookies.refreshToken;
        if (!refreshToken) {
            throw new AppError("Refresh token not found", 401);
        }

        const securityManager = PasetoV4SecurityManager.getInstance();
        const oldRefreshPayload = await securityManager.verifyRefreshToken(refreshToken);
        
        // [ADDED] Phase 1: Token Rotation Logic
        // 1. Check for Reuse: If this token was already used, lock the user!
        const usedTokenKey = `usedRefreshToken:student:${oldRefreshPayload.sessionId}`;
        const isTokenUsed = await redisClient.exists(usedTokenKey);
        
        if (isTokenUsed) {
            // Token reuse detected - potential attack!
            await LockoutService.handleFailedAttempt(id, "student", req.student.email || "");
            throw new AppError("Security violation: Token reuse detected. Account has been locked for security.", 401);
        }

        // 2. Mark the OLD refresh token as used (invalidate it)
        const tokenExpiry = oldRefreshPayload.exp - Math.floor(Date.now() / 1000);
        if (tokenExpiry > 0) {
            await redisClient.setex(usedTokenKey, tokenExpiry, "true");
        }

        const sessionKey = `activeSession:student:${id}`;
        const sessionId = await redisClient.hget(sessionKey, 'sessionId');
        
        if (!sessionId) {
            throw new AppError("Session not found. Please login again.", 404);
        }

        // Verify the session ID matches the refresh token session ID
        if (sessionId !== oldRefreshPayload.sessionId) {
            throw new AppError("Session mismatch. Please login again.", 401);
        }

        const student = await prisma.student.findUnique({
            where: { id },
            include: {
                department: {
                    include: {
                        college: {
                            select: {
                                id: true,
                                organizationId: true
                            }
                        }
                    }
                },
                batch: {
                    include: {
                        course: true
                    }
                },
                section: true
            }
        });

        if (!student) {
            throw new AppError("Student not found", 404);
        }

        // [ADDED] Generate NEW Session ID and Token Family for the ROTATED pair
        const newSessionId = crypto.randomBytes(16).toString('hex');
        const newTokenFamily = crypto.randomUUID();

        // Update Redis with NEW session
        await redisClient.hset(sessionKey, {
            sessionId: newSessionId,
            studentId: student.id,
            organizationId: student.department.college.organizationId,
            collegeId: student.department.collegeId,
            active: 'true',
        });
        await redisClient.expire(sessionKey, 1 * 24 * 60 * 60);

        // Issue NEW Access Token
        const accessToken = await securityManager.generateAccessToken({
            id: student.id,
            email: student.email,
            name: student.name,
            regNo: student.regNo,
            role: "student",
            type: "student",
            departmentId: student.departmentId,
            batchId: student.batchId,
            sectionId: student.sectionId,
            collegeId: student.department.collegeId,
            organizationId: student.department.college.organizationId,
            sessionId: newSessionId
        });

        // [ADDED] Issue NEW Refresh Token (Rotation)
        const newRefreshToken = await securityManager.generateRefreshToken(id, newSessionId);

        // Send BOTH new tokens
        const isProduction = process?.env?.NODE_ENV === "production";
        res.cookie("accessToken", accessToken, {
            httpOnly: true,
            secure: isProduction,
            maxAge: 1 * 24 * 60 * 60 * 1000
        });
        res.cookie("refreshToken", newRefreshToken, {
            httpOnly: true,
            secure: isProduction,
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        return res.status(200).json({
            success: true,
            message: "Tokens rotated successfully",
            data: {
                accessToken
            }
        });
    }
);


export const resetPasswordStudentController = asyncHandler(
    async(req: Request, res: Response) => {
        const { oldPassword, newPassword }: { oldPassword: string; newPassword: string } = req.body;
        const { id } = req.student;

        // [ADDED] Phase 1: Password Policy & History
        PasswordService.validatePolicy(newPassword);
        await PasswordService.checkHistory(id, "student", newPassword);

        const student = await prisma.student.findUnique({ where: { id } });
        if (!student) {
            throw new AppError("Student not found", 404);
        }

        const isPasswordValid = await verifyPassword(student.password, oldPassword);
        if (!isPasswordValid) {
            throw new AppError("Current password is incorrect", 400);
        }

        const hashedPassword = await hashPassword(newPassword);
        
        // [ADDED] Phase 1: Transaction to save history and update password
        await prisma.$transaction(async (tx) => {
            await tx.student.update({
                where: { id },
                data: { 
                    password: hashedPassword,
                    passwordChangedAt: new Date(),
                    passwordExpiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) // 90 days expiry
                }
            });

            await tx.passwordHistory.create({
                data: {
                    userId: id,
                    userType: "student",
                    passwordHash: hashedPassword
                }
            });
        });

        // [ADDED] Phase 1: Revoke all sessions on password change
        const sessionKey = `activeSession:student:${id}`;
        await redisClient.del(sessionKey);

        return res.status(200).json({
            success: true,
            message: "Password reset successfully. Please login again with your new password."
        });
    }
);


export const forgotPasswordStudentController = asyncHandler(
    async(req: Request, res: Response) => {
        const { identifier }: { identifier: string } = req.body;

        if (!identifier) {
            throw new AppError("Email or Registration Number is required", 400);
        }

        const isEmail = identifier.includes('@');
        
        const student = await prisma.student.findFirst({
            where: isEmail 
                ? { email: identifier.toLowerCase() }
                : { regNo: identifier.toUpperCase() },
            include: {
                department: {
                    include: {
                        college: {
                            select: {
                                name: true
                            }
                        }
                    }
                }
            }
        });

        if (!student) {
            return res.status(200).json({
                success: true,
                message: "If an account with that email/registration number exists, a password reset link has been sent."
            });
        }

        const redisKey = `student-forgot-password-${student.email}`;
        const existingToken = await redisClient.exists(redisKey);
        if (existingToken) {
            throw new AppError("A password reset request is already pending. Please check your email or wait 10 minutes.", 400);
        }

        const sessionToken = crypto.randomBytes(32).toString("hex");
        
        await redisClient.setex(redisKey, 10 * 60, sessionToken);

        const kafkaProducer = KafkaProducer.getInstance();
        const isPublished = await kafkaProducer.sendStudentForgotPassword(
            student.email,
            sessionToken,
            student.name,
            student.regNo,
            student.department.college.name,
            student.department.name
        );

        if (!isPublished) {
            await redisClient.del(redisKey);
            throw new AppError("Failed to send password reset email. Please try again later.", 500);
        }

        return res.status(200).json({
            success: true,
            message: "If an account with that email/registration number exists, a password reset link has been sent.",
            data: {
                email: student.email.replace(/(.{2})(.*)(@.*)/, "$1***$3")
            }
        });
    }
);


export const resetForgotPasswordStudentController = asyncHandler(
    async(req: Request, res: Response) => {
        const { email, password, token }: { email: string; password: string; token: string } = req.body;

        if (!email || !password || !token) {
            throw new AppError("Email, password, and token are required", 400);
        }

        if (!validateEmail(email)) {
            throw new AppError("Invalid email format", 400);
        }

        if (token.length !== 64) {
            throw new AppError("Invalid reset token", 400);
        }

        const redisKey = `student-forgot-password-${email.toLowerCase()}`;
        const storedToken = await redisClient.get(redisKey);

        if (!storedToken) {
            throw new AppError("Reset token has expired or is invalid. Please request a new password reset.", 400);
        }

        if (storedToken !== token) {
            throw new AppError("Invalid reset token", 400);
        }

        const student = await prisma.student.findUnique({
            where: { email: email.toLowerCase() }
        });

        if (!student) {
            throw new AppError("Student not found", 404);
        }

        try {
            // Phase 1: Password Policy & History
            PasswordService.validatePolicy(password);
            await PasswordService.checkHistory(student.id, "student", password);
            
            const hashedPassword = await hashPassword(password);
            
            // Phase 1: Transaction to save history and update password
            await prisma.$transaction(async (tx) => {
                await tx.student.update({
                    where: { id: student.id },
                    data: {
                        password: hashedPassword,
                        passwordChangedAt: new Date(),
                        passwordExpiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) // 90 days expiry
                    }
                });

                await tx.passwordHistory.create({
                    data: {
                        userId: student.id,
                        userType: "student",
                        passwordHash: hashedPassword
                    }
                });
            });

            // Phase 1: Revoke all sessions on password change
            const sessionKey = `activeSession:student:${student.id}`;
            await redisClient.del(sessionKey).catch(err => {
                console.error(`[Redis] Failed to delete session key ${sessionKey}:`, err);
            });

            // Delete forgot password Redis key only after successful password update
            await redisClient.del(redisKey).catch(err => {
                console.error(`[Redis] Failed to delete key ${redisKey}:`, err);
            });

            return res.status(200).json({
                success: true,
                message: "Password has been reset successfully. Please login with your new password.",
                data: {
                    email: student.email
                }
            });
        } catch (error) {
            // Even if password update fails, delete the Redis key to prevent reuse
            await redisClient.del(redisKey).catch(err => {
                console.error(`[Redis] Failed to delete key ${redisKey} during error cleanup:`, err);
            });
            throw error;
        }
    }
);
