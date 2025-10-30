import { Request, Response } from "express";
import { asyncHandler } from "@utils/asyncHandler.js";
import { prisma } from "@lib/prisma.js";
import { hashPassword } from "@utils/security.js";
import { KafkaProducer } from "@messaging/producer.js";
import { ProducerPayload } from "../../types/organization.js";
import crypto from "crypto";

// The controller function for bulk staff creation
export const createNonTeachingStaffBulkController = asyncHandler(async (req: Request, res: Response) => {
    
    // 1. Get College ID from authenticated admin
    const { id: collegeId } = req.college; // From AuthenticatedUser.checkCollege middleware

    // 2. Get the array of staff from the validated body
    const staffArray: { name: string, email: string, phone: string, role: "studentsection" | "regestral" | "adminstractor" }[] = req.body;

    const kafkaProducer = new KafkaProducer();
    const staffToCreate = [];
    const emailPayloads = [];

    // 3. Loop through, generate passwords, and prepare data
    for (const staff of staffArray) {
        // Generate a random temporary password
        const tempPassword = crypto.randomBytes(8).toString('hex');
        const hashedPassword = await hashPassword(tempPassword);

        // Prepare data for Prisma createMany
        staffToCreate.push({
            ...staff,
            password: hashedPassword,
            collegeId: collegeId,
        });

        // Prepare data for Kafka message
        const message: ProducerPayload = {
            action: "email-notification",
            type: "staff-welcome-email", // We will add this new type
            subType: "create-account",
            data: {
                email: staff.email,
                name: staff.name,
                tempPassword: tempPassword, // Send the plain-text password to the email service
                loginUrl: "http://localhost:8000/auth/api/login-staff" // Change to your actual login URL
            }
        };
        emailPayloads.push(message);
        
    }

    // 4. Insert all users into the database in a single batch
    await prisma.nonTeachingStaff.createMany({
        data: staffToCreate,
        skipDuplicates: true // Skip if an email or phone already exists
    });

    // 5. Publish all email jobs to Kafka
    for (const payload of emailPayloads) {
        await kafkaProducer.publishEmailNotification(payload);
    }

    // 6. Send immediate success response to the frontend
    res.status(201).json({
        success: true,
        message: `${staffToCreate.length} staff accounts are being created. Welcome emails will be sent shortly.`
    });
});

