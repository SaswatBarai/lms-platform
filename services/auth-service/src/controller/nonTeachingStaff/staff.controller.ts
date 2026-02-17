import { Request, Response } from "express";
import { asyncHandler } from "@utils/asyncHandler.js";
import { prisma } from "@lib/prisma.js";
import { hashPassword, PasetoV4SecurityManager, validateEmail, verifyPassword } from "@utils/security.js";
import { KafkaProducer } from "@messaging/producer.js";
import { AddBatchInput, AddCourseInput, AddDepartmentInput, AddSectionInput, ForgotResetPasswordInput, LoginNonTeachingStaffInput, NonTeachingStaffRole, ResetPasswordInput } from "../../types/organization.js";
import * as crypto from "node:crypto";
import process from "node:process";
import { AppError } from "@utils/AppError.js";
import redisClient from "@config/redis.js";
import { resetPasswordService, ResetPasswordType } from "@services/organization.service.js";
import { PasswordService } from "../../services/password.service.js";
import { loginAttemptsTotal } from "../../config/metrics.js";
import pkg from "@prisma/client";

// The controller function for bulk staff creation
export const createNonTeachingStaffBulkController = asyncHandler(async (req: Request, res: Response) => {

    // 1. Get College ID from authenticated admin
    const { id: collegeId } = req.college; // From AuthenticatedUser.checkCollege middleware
    const college = await prisma.college.findUnique({
        where: {
            id: collegeId
        },
        select: {
            name: true
        }
    })
    if (!college) {
        throw new AppError("College not found", 404);
    }
    // 2. Get the array of staff from the validated body
    const staffArray: { name: string, email: string, phone: string, role: "studentsection" | "regestral" | "adminstractor" }[] = req.body;

    // 3. Check for duplicates in the database
    const emails = staffArray.map(staff => staff.email);
    const phones = staffArray.map(staff => staff.phone);

    const existingStaff = await prisma.nonTeachingStaff.findMany({
        where: {
            OR: [
                { email: { in: emails } },
                { phone: { in: phones } }
            ]
        },
        select: {
            email: true,
            phone: true
        }
    });

    // Create a set of existing emails and phones for quick lookup
    const existingEmails = new Set(existingStaff.map((s: { email: string; phone: string }) => s.email));
    const existingPhones = new Set(existingStaff.map((s: { email: string; phone: string }) => s.phone));

    // Validate and collect errors
    const errors: { index: number; field: string; value: string; message: string }[] = [];
    const validStaff: typeof staffArray = [];

    staffArray.forEach((staff, index) => {
        let hasError = false;

        // Check for duplicate email
        if (existingEmails.has(staff.email)) {
            errors.push({
                index,
                field: "email",
                value: staff.email,
                message: `Email '${staff.email}' already exists`
            });
            hasError = true;
        }

        // Check for duplicate phone
        if (existingPhones.has(staff.phone)) {
            errors.push({
                index,
                field: "phone",
                value: staff.phone,
                message: `Phone '${staff.phone}' already exists`
            });
            hasError = true;
        }

        // If no errors, add to valid staff
        if (!hasError) {
            validStaff.push(staff);
        }
    });

    // If there are any errors, return them
    if (errors.length > 0) {
        return res.status(400).json({
            success: false,
            message: "Some staff members could not be created due to duplicate email or phone",
            errors: errors,
            duplicateCount: errors.length,
            validCount: validStaff.length
        });
    }

    // 4. Generate passwords and prepare data for valid staff only
    const kafkaProducer = KafkaProducer.getInstance();
    const staffToCreate = [];
    const emailData: Array<{ email: string; name: string; tempPassword: string }> = [];

    for (const staff of validStaff) {
        // Generate a random temporary password
        const tempPassword = crypto.randomBytes(8).toString('hex');
        const hashedPassword = await hashPassword(tempPassword);

        // Prepare data for Prisma create
        staffToCreate.push({
            ...staff,
            password: hashedPassword,
            collegeId: collegeId,
        });

        // Store email data for later
        emailData.push({
            email: staff.email,
            name: staff.name,
            tempPassword: tempPassword
        });
    }

    // 5. Insert all valid users into the database
    if (staffToCreate.length > 0) {
        await prisma.nonTeachingStaff.createMany({
            data: staffToCreate,
            skipDuplicates: false // We already checked for duplicates
        });

        // 6. Publish all email jobs to Kafka
        for (const data of emailData) {
            await kafkaProducer.sendStaffWelcomeEmail(
                data.email,
                data.name,
                data.tempPassword,
                college.name,
                "http://localhost:8000/auth/api/login-staff"
            );
        }
    }

    // 7. Send success response
    res.status(201).json({
        success: true,
        message: `${staffToCreate.length} staff account(s) created successfully. Welcome emails will be sent shortly.`,
        created: staffToCreate.length,
        total: staffArray.length
    });
});

export const login = asyncHandler(
    async (req: Request, res: Response) => {
        const { email, password }: LoginNonTeachingStaffInput = req.body;
        const existingStaff = await prisma.nonTeachingStaff.findUnique({
            where: {
                email
            },
            include: {
                college: {
                    select: {
                        id: true,
                        name: true,
                        organizationId: true
                    }
                }
            }
        })

        if (!existingStaff) {
            loginAttemptsTotal.inc({ status: 'failure' });
            throw new AppError("Invalid email or password", 401);
        }

        const isPasswordValid = await verifyPassword(existingStaff.password, password);
        if (!isPasswordValid) {
            loginAttemptsTotal.inc({ status: 'failure' });
            throw new AppError("Invalid email or password", 401);
        }

        // Get Device Info
        const { DeviceService } = await import("../../services/device.service.js");
        const { SessionService } = await import("../../services/session.service.js");
        const deviceInfo = DeviceService.getDeviceInfo(req);

        // Generate Session ID
        const accessSessionId = crypto.randomBytes(16).toString('hex');
        const accessTokenExpires = new Date(Date.now() + 1 * 24 * 60 * 60 * 1000); // 1 day

        // Handle Session Enforcement (Lock, Invalidate Old, Create New)
        await SessionService.handleLoginSession(
            existingStaff.id,
            "nonTeachingStaff",
            accessSessionId,
            deviceInfo,
            accessTokenExpires,
            {
                email: existingStaff.email,
                name: existingStaff.name,
                collegeName: existingStaff.college.name
            }
        );

        const tokenPaylaod = {
            id: existingStaff.id,
            email: existingStaff.email,
            name: existingStaff.name,
            role: existingStaff.role,
            type: "non-teaching-staff",
            collegeId: existingStaff.collegeId,
            organizationId: existingStaff.college.organizationId,
            sessionId: accessSessionId
        }

        // Keep Redis session key for backward compatibility
        const key = `activeSession:non-teaching-staff:${existingStaff.id}`;
        await redisClient.hset(key, {
            sessionId: accessSessionId,
            nonTeachingStaffId: existingStaff.id,
            organizationId: existingStaff.college.organizationId,
            active: 'true',
        });

        await redisClient.expire(key, 1 * 24 * 60 * 60); // 1 day
        const securityManager = PasetoV4SecurityManager.getInstance();

        const accessToken = await securityManager.generateAccessToken(tokenPaylaod);
        const sessionId = crypto.randomBytes(16).toString('hex'); // Generate unique session ID for refresh token
        const refreshToken = await securityManager.generateRefreshToken(existingStaff.id, sessionId);

        // Track successful login attempt
        loginAttemptsTotal.inc({ status: 'success' });

        const isProduction = process?.env?.NODE_ENV === "production";
        res.cookie("accessToken", accessToken, {
            httpOnly: true,
            secure: isProduction,
            maxAge: 1 * 24 * 60 * 60 * 1000 // 1 day
        });
        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: isProduction,
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        return res.status(200).json({
            success: true,
            message: "Login successful",
            data: {
                accessToken
            }
        });
    }
)

export const resetPasswordNonTeachingStaffController = asyncHandler(
    async (req: Request, res: Response) => {
        const { email, oldPassword, newPassword }: ResetPasswordInput = req.body;
        const { success, message } = await resetPasswordService({ oldPassword, newPassword, type: ResetPasswordType.NON_TEACHING_STAFF, email });
        if (!success) {
            throw new AppError(message, 400);
        }
        return res.status(200).json({
            success: true,
            message: message
        });

    }
)

export const addCourseNonTeachingStaffController = asyncHandler(
    async (req: Request, res: Response) => {
        const courseArrray: AddCourseInput[] = req.body;
        const collegeId = req.nonTeachingStaff.collegeId;
        const role = req.nonTeachingStaff.role;
        const userId = req.nonTeachingStaff.id;

        //let us check first is this staff is part of the college or not 
        const staff = await prisma.nonTeachingStaff.findUnique({
            where: {
                id: userId
            },
            include: {
                college: {
                    select: {
                        id: true
                    }
                }
            }
        })
        if (!staff) {
            throw new AppError("Staff not found", 404);
        }
        if (staff.collegeId != collegeId) {
            throw new AppError("Staff is not part of the college", 403);
        }

        if (role != NonTeachingStaffRole.REGISTRAR) {
            throw new AppError("You are not authorized to add courses as you are not a registrar", 403);
        }

        //now we will check is the courses already exist or not 
        const coursename = courseArrray.map(course => course.name);
        const courseshortName = courseArrray.map(course => course.shortName);
        const existingCourses = await prisma.course.findMany({
            where: {
                OR: [
                    { name: { in: coursename } },
                    { shortName: { in: courseshortName } },
                ]
            }
        })
        const existingCourseName = new Set(existingCourses.map((course: { name: string; }) => course.name));
        const existingCourseShortName = new Set(existingCourses.map((course: { shortName: string; }) => course.shortName));
        const validCourses: typeof courseArrray = [];
        const errors: {
            index: number;
            field: string;
            value: string;
            message: string;
        }[] = [];
        // Define valid course name and shortName combinations
        const validCourseCombinations: Record<string, string> = {
            "BTECH": "BACHELOR_OF_TECHNOLOGY",
            "MTECH": "MASTER_OF_TECHNOLOGY",
            "BCA": "BACHELOR_OF_COMPUTER_APPLICATIONS",
            "MCA": "MASTER_OF_COMPUTER_APPLICATIONS"
        };

        courseArrray.forEach((course, index) => {
            let hasError = false;

            // Validate that shortName and name combination is valid
            const expectedName = validCourseCombinations[course.shortName];
            if (!expectedName) {
                errors.push({
                    index,
                    field: "shortName",
                    value: course.shortName,
                    message: `Invalid course short name '${course.shortName}'. Must be one of: BTECH, MTECH, BCA, MCA`
                });
                hasError = true;
            } else if (expectedName !== course.name) {
                errors.push({
                    index,
                    field: "name",
                    value: course.name,
                    message: `Course name '${course.name}' does not match short name '${course.shortName}'. Expected: ${expectedName}`
                });
                hasError = true;
            }

            if (existingCourseName.has(course.name)) {
                errors.push({
                    index,
                    field: "name",
                    value: course.name,
                    message: `Course name '${course.name}' already exists`
                })
                hasError = true;
            }
            if (existingCourseShortName.has(course.shortName)) {
                errors.push({
                    index,
                    field: "shortName",
                    value: course.shortName,
                    message: `Course short name '${course.shortName}' already exists`
                })
                hasError = true;
            }

            if (!hasError) {
                validCourses.push(course);
            }

        })
        if (errors.length > 0) {
            return res.status(400).json({
                success: false,
                message: "Some courses could not be added due to duplicate name or short name",
                errors: errors,
                duplicateCount: errors.length,
                validCount: validCourses.length
            });
        }
        //now we will add the courses to the database
        const courses = await prisma.course.createMany({
            data: validCourses.map(course => {
                return {
                    name: course.name,
                    shortName: course.shortName,
                    collegeId: collegeId
                }
            })
        })
        if (courses.count !== validCourses.length) {
            throw new AppError("Failed to add courses", 400);
        }
        return res.status(200).json({
            success: true,
            message: "Courses added successfully",
            data: courses
        });
    }
)

export const addDepartmentNonTeachingStaffController = asyncHandler(
    async (req: Request, res: Response) => {
        const deapartmentsArray: AddDepartmentInput[] = req.body;
        const collegeId = req.nonTeachingStaff.collegeId;
        const role = req.nonTeachingStaff.role;
        const userId = req.nonTeachingStaff.id;

        //let us check first is this staff is part of the college or not 
        const staff = await prisma.nonTeachingStaff.findUnique({
            where: {
                id: userId
            }
        })
        if (!staff) {
            throw new AppError("Staff not found", 404);
        }
        if (staff.collegeId !== collegeId) {
            throw new AppError("Staff is not part of the college", 403);
        }
        if (role !== NonTeachingStaffRole.REGISTRAR) {
            throw new AppError("You are not authorized to add departments as you are not a registrar", 403);
        }
        //now we will check is the departments already exist or not 
        const deptname = deapartmentsArray.map((dep) => dep.name);
        const deptshortName = deapartmentsArray.map((dep) => dep.shortName);
        const existingDepartments = await prisma.department.findMany({
            where: {
                OR: [
                    { name: { in: deptname } },
                    { shortName: { in: deptshortName } },
                ]
            }
        })

        const existingDeptName = new Set(existingDepartments.map((dep: { name: string; shortName: string }) => dep.name));
        const existingDeptShortName = new Set(existingDepartments.map((dep: { name: string; shortName: string }) => dep.shortName));
        const validDepartments: typeof deapartmentsArray = [];
        const errors: { index: number; field: string; value: string; message: string }[] = [];
        deapartmentsArray.forEach((department, index) => {
            let hasError = false;
            if (existingDeptName.has(department.name)) {
                errors.push({
                    index,
                    field: "name",
                    value: department.name,
                    message: `Department name '${department.name}' already exists`
                })
                hasError = true;
            }
            if (existingDeptShortName.has(department.shortName)) {
                errors.push({
                    index,
                    field: "shortName",
                    value: department.shortName,
                    message: `Department short name '${department.shortName}' already exists`
                })
            }
            if (!hasError) {
                validDepartments.push(department);
            }
        })
        if (errors.length > 0) {
            return res.status(400).json({
                success: false,
                message: "Some departments could not be added due to duplicate name or short name",
                errors: errors,
                duplicateCount: errors.length,
                validCount: validDepartments.length
            });
        }
        //now we will add the departments to the database
        const departments = await prisma.department.createMany({
            data: validDepartments.map(dep => {
                return {
                    name: dep.name,
                    shortName: dep.shortName,
                    collegeId: collegeId
                }
            })
        })
        if (departments.count !== validDepartments.length) {
            throw new AppError("Failed to add departments", 400);
        }
        return res.status(200).json({
            success: true,
            message: "Departments added successfully",
            data: departments
        });

    }
)


export const regenerateAccessTokenNonTeachingStaff = asyncHandler(
    async (req: Request, res: Response) => {
        const { id } = req.nonTeachingStaff;
        const key = `activeSession:non-teaching-staff:${id}`;
        const sessionId = await redisClient.hget(key, 'sessionId');
        if (!sessionId) {
            throw new AppError("Session not found", 404);
        }
        const nonTeachingStaff = await prisma.nonTeachingStaff.findUnique({
            where: {
                id
            }
        })
        if (!nonTeachingStaff) {
            throw new AppError("Non-teaching staff not found", 404);
        }
        const securityManager = PasetoV4SecurityManager.getInstance();
        const accessToken = await securityManager.generateAccessToken({
            id: nonTeachingStaff.id,
            email: nonTeachingStaff.email,
            name: nonTeachingStaff.name,
            role: nonTeachingStaff.role,
            type: "non-teaching-staff",
        })
        res.cookie("accessToken", accessToken, {
            httpOnly: true,
            secure: process?.env?.NODE_ENV === "production",
            maxAge: 1 * 24 * 60 * 60 * 1000 // 1 day
        });
        return res.status(200).json({
            success: true,
            message: "Access token regenerated successfully",
            data: {
                accessToken
            }
        });
    }
)


export const forgotPasswordNonTeachingStaffController = asyncHandler(
    async (req: Request, res: Response) => {
        const { email } = req.body;
        if (!email) {
            throw new AppError("Email is required", 400);
        }
        if (!validateEmail(email)) {
            throw new AppError("Invalid email", 400);
        }

        // Email-based rate limiting: 3 requests per 15 minutes per email
        const emailRateLimitKey = `forgot-password:email:non-teaching-staff:${email.toLowerCase()}`;
        const emailRateLimitCount = await redisClient.get(emailRateLimitKey);
        if (emailRateLimitCount && parseInt(emailRateLimitCount) >= 3) {
            throw new AppError("Too many password reset requests for this email. Please wait 15 minutes before trying again.", 429);
        }

        // Check if a reset request is already pending
        if (await redisClient.exists(`non-teaching-staff-auth-${email}`)) {
            throw new AppError("A password reset request is already pending. Please check your email or wait 10 minutes.", 400);
        }

        const staff = await prisma.nonTeachingStaff.findUnique({
            where: {
                email
            },
            include: {
                college: {
                    select: {
                        name: true
                    }
                }
            }
        })
        if (!staff) {
            // Increment rate limit even for non-existent emails to prevent enumeration
            await redisClient.incr(emailRateLimitKey);
            await redisClient.expire(emailRateLimitKey, 15 * 60);
            return res.status(404).json({
                success: false,
                message: "Non-teaching staff not found",
            })
        }

        // Increment email rate limit
        await redisClient.incr(emailRateLimitKey);
        await redisClient.expire(emailRateLimitKey, 15 * 60);

        //let us create the session token 
        const sessionToken = crypto.randomBytes(32).toString("hex");
        await redisClient.setex(`non-teaching-staff-auth-${email}`, 10 * 60, sessionToken);//10 minutes
        const kafkaProducer = KafkaProducer.getInstance();
        const isPublished = await kafkaProducer.sendNonTeachingStaffForgotPassword(email, sessionToken, staff.name, staff.college.name);

        if (!isPublished) {
            throw new AppError("Failed to send forgot password email", 500);
        }
        return res.status(200).json({
            success: true,
            message: "Mail has been sent to your email, please check your email to reset your password",
            data: {
                email
            }
        })
    }
)


export const resetForgotPasswordNonTeachingStaffController = asyncHandler(
    async (req: Request, res: Response) => {
        const { email, password, token }: ForgotResetPasswordInput = req.body;
        if (!email || !password || !token) {
            throw new AppError("Missing required fields", 400);
        }
        if (!validateEmail(email)) {
            throw new AppError("Invalid email", 400);
        }
        if (token.length !== 64) {
            throw new AppError("Invalid token", 400);
        }
        const redisKey = `non-teaching-staff-auth-${email}`;
        const sessionToken = await redisClient.get(redisKey);
        if (!sessionToken) {
            throw new AppError("Invalid token", 400);
        }
        if (sessionToken !== token) {
            throw new AppError("Invalid token", 400);
        }

        try {
            // Phase 1: Password Policy & History
            PasswordService.validatePolicy(password);

            const staff = await prisma.nonTeachingStaff.findUnique({
                where: { email }
            });

            if (!staff) {
                throw new AppError("Non-teaching staff not found", 404);
            }

            await PasswordService.checkHistory(staff.id, "nonTeachingStaff", password);

            const hashedPassword = await hashPassword(password);

            // Phase 1: Transaction to save history and update password
            await prisma.$transaction(async (tx: any) => {
                await tx.nonTeachingStaff.update({
                    where: { id: staff.id },
                    data: {
                        password: hashedPassword,
                        passwordChangedAt: new Date(),
                        passwordExpiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) // 90 days expiry
                    }
                });

                await tx.passwordHistory.create({
                    data: {
                        userId: staff.id,
                        userType: "nonTeachingStaff",
                        passwordHash: hashedPassword
                    }
                });
            });

            // Phase 1: Revoke all sessions on password change
            const sessionKey = `activeSession:nonTeachingStaff:${staff.id}`;
            await redisClient.del(sessionKey).catch(err => {
                console.error(`[Redis] Failed to delete session key ${sessionKey}:`, err);
            });

            // Delete forgot password Redis key only after successful password update
            await redisClient.del(redisKey).catch(err => {
                console.error(`[Redis] Failed to delete key ${redisKey}:`, err);
            });

            return res.status(200).json({
                success: true,
                message: "Password reset successfully",
                data: {
                    email
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
)

export const logoutNonTeachingStaffController = asyncHandler(
    async (req: Request, res: Response) => {
        const { id } = req.nonTeachingStaff;
        if (!id) {
            throw new AppError("Non-teaching staff not found", 404);
        }
        const key = `activeSession:non-teaching-staff:${id}`;
        await redisClient.hdel(key, 'sessionId');
        res.clearCookie("accessToken");
        res.clearCookie("refreshToken");
        return res.status(200).json({
            success: true,
            message: "Logout successful"
        });
    }
)

export const addBatchNonTeachingStaffController = asyncHandler(
    async (req: Request, res: Response) => {
        const { courseId, batchYear }: AddBatchInput = req.body;
        const collegeId = req.nonTeachingStaff.collegeId;
        const role = req.nonTeachingStaff.role;
        const userId = req.nonTeachingStaff.id;

        // Check if staff is part of the college
        const staff = await prisma.nonTeachingStaff.findUnique({
            where: {
                id: userId
            },
            include: {
                college: {
                    select: {
                        id: true
                    }
                }
            }
        })
        if (!staff) {
            throw new AppError("Staff not found", 404);
        }
        if (staff.collegeId !== collegeId) {
            throw new AppError("Staff is not part of the college", 403);
        }

        // Check if staff is a registrar
        if (role !== NonTeachingStaffRole.REGISTRAR) {
            throw new AppError("You are not authorized to add batches as you are not a registrar", 403);
        }

        // Validate that the course exists and belongs to the college
        const course = await prisma.course.findUnique({
            where: {
                id: courseId
            },
            include: {
                college: {
                    select: {
                        id: true
                    }
                }
            }
        });

        if (!course) {
            throw new AppError("Course not found", 404);
        }

        if (course.collegeId !== collegeId) {
            throw new AppError("Course does not belong to your college", 403);
        }

        // Check if batch already exists for this course and batchYear
        const existingBatch = await prisma.batch.findFirst({
            where: {
                courseId: courseId,
                batchYear: batchYear
            }
        });

        if (existingBatch) {
            throw new AppError(`Batch with year '${batchYear}' already exists for this course`, 409);
        }

        // Create the batch
        const batch = await prisma.batch.create({
            data: {
                courseId: courseId,
                batchYear: batchYear
            }
        });

        return res.status(201).json({
            success: true,
            message: "Batch created successfully",
            data: batch
        });
    }
)

// Helper function to generate unique section codes
function generateSectionCode(): string {
    // Characters that are easy to read (excluding 0, O, I, 1 to avoid confusion)
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let part1 = "";
    let part2 = "";

    // First block (4 chars)
    for (let i = 0; i < 4; i++) {
        part1 += chars[Math.floor(Math.random() * chars.length)];
    }

    // Second block (4 chars)
    for (let i = 0; i < 4; i++) {
        part2 += chars[Math.floor(Math.random() * chars.length)];
    }

    // Random separator: "-" or "_"
    const sep = Math.random() < 0.5 ? "-" : "_";

    return `${part1}${sep}${part2}`;
}

export const addSectionNonTeachingStaffController = asyncHandler(
    async (req: Request, res: Response) => {
        /**
         * we will take input as 
         * {
         * no_of_section: number of section to be added 
         * department_id: id of the department to add the section to
         * batch_id: id of the batch to add the section to
         * }
         */
        const { batch_id, department_id, no_of_section }: AddSectionInput = req.body;
        const MAX_SECTION_CAPACITY = 70; // Default maximum capacity for all sections
        const collegeId = req.nonTeachingStaff.collegeId;
        const role = req.nonTeachingStaff.role;
        const userId = req.nonTeachingStaff.id;

        // Check if staff is part of the college
        const staff = await prisma.nonTeachingStaff.findUnique({
            where: {
                id: userId
            },
            include: {
                college: {
                    select: {
                        id: true
                    }
                }
            }
        })
        if (!staff) {
            throw new AppError("Staff not found", 404);
        }
        if (staff.collegeId !== collegeId) {
            throw new AppError("Staff is not part of the college", 403);
        }

        // Check if staff is a registrar
        if (role !== NonTeachingStaffRole.STUDENT_SECTION) {
            throw new AppError("You are not authorized to add sections as you are not a registrar", 403);
        }

        // Validate that the batch exists and belongs to the college
        const batch = await prisma.batch.findUnique({
            where: {
                id: batch_id
            },
            include: {
                course: {
                    include: {
                        college: {
                            select: {
                                id: true
                            }
                        }
                    }
                }
            }
        });

        if (!batch) {
            throw new AppError("Batch not found", 404);
        }

        if (batch.course.collegeId !== collegeId) {
            throw new AppError("Batch does not belong to your college", 403);
        }

        // Validate that the department exists and belongs to the college
        const department = await prisma.department.findUnique({
            where: {
                id: department_id
            },
            include: {
                college: {
                    select: {
                        id: true
                    }
                }
            }
        });

        if (!department) {
            throw new AppError("Department not found", 404);
        }

        if (department.collegeId !== collegeId) {
            throw new AppError("Department does not belong to your college", 403);
        }

        // Check if batch and department belong to the same college (already validated above, but double-check)
        if (batch.course.collegeId !== department.collegeId) {
            throw new AppError("Batch and department must belong to the same college", 400);
        }

        // Generate unique section codes
        const sectionsToCreate = [];
        const generatedCodes = new Set<string>();

        for (let i = 0; i < no_of_section; i++) {
            let sectionCode: string;
            let attempts = 0;
            const maxAttempts = 100;

            // Generate unique code (avoid duplicates)
            do {
                sectionCode = generateSectionCode();
                attempts++;

                // Check if code already exists in database
                const existingSection = await prisma.section.findFirst({
                    where: {
                        sectionNo: sectionCode,
                        batchId: batch_id,
                        departmentId: department_id
                    }
                });

                if (!existingSection && !generatedCodes.has(sectionCode)) {
                    generatedCodes.add(sectionCode);
                    break;
                }
            } while (attempts < maxAttempts);

            if (attempts >= maxAttempts) {
                throw new AppError("Failed to generate unique section codes. Please try again.", 500);
            }

            sectionsToCreate.push({
                batchId: batch_id,
                departmentId: department_id,
                sectionNo: sectionCode,
                capacity: MAX_SECTION_CAPACITY // Default capacity set to 70
            });
        }

        // Create all sections
        const createdSections = await prisma.section.createMany({
            data: sectionsToCreate
        });
        if (createdSections.count !== no_of_section) {
            throw new AppError("Failed to create sections", 500);
        }
        return res.status(201).json({
            success: true,
            message: `${createdSections.count} section(s) created successfully with capacity ${MAX_SECTION_CAPACITY}`,
            data: {
                count: createdSections.count,
                capacity: MAX_SECTION_CAPACITY,
                sections: sectionsToCreate.map(s => ({
                    sectionNo: s.sectionNo,
                    batchId: s.batchId,
                    departmentId: s.departmentId,
                    capacity: s.capacity
                }))
            }
        });
    }
)