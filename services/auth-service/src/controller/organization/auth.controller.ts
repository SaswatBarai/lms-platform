
import { Request, Response } from "express";
import { createOrganizationService } from "@services/organization.service.js"
import { asyncHandler } from "@utils/asyncHandler.js";
import { ProducerPayload, type verifyOrganizationOtpInput, type CreateOrganizationInput } from "../../types/organization.js";
import { generateOtp, hashOtp, verifyOtp } from "@utils/otp.js"
import { KafkaProducer } from "@messaging/producer.js"
import redisClient from "@config/redis.js"
import { hashPassword } from "@utils/security.js"
import crypto from "crypto"
import { AppError } from "@utils/AppError.js"



export const createOrganizationController = asyncHandler(async (req: Request, res: Response) => {
    const { name, email, password, phone, recoveryEmail, address }: CreateOrganizationInput = req.body;
    const otp = generateOtp();
    const kafkaProducer = new KafkaProducer();
    const message: ProducerPayload = {
        action: "auth-otp",
        type: "org-otp",
        subType: "create-account",
        data: {
            email,
            otp
        }
    }
    const hashedPassword = await hashPassword(password);
    const sessionToken = crypto.randomBytes(32).toString("hex"); 4
    //check the details already exist or not 
    if (await redisClient.exists(`org-auth-${email}`)) {
        return new AppError("Already details are present", 400);
    }

    const redisResult = await redisClient.hset(`org-auth-${email}`, {
        name,
        email,
        password: hashedPassword,
        phone,
        recoveryEmail,
        address: address,
        sessionToken
    })
    if (redisResult === 0) {
        return new AppError("Failed to save organization details", 500);
    }
    //expire in 24 hours
    await redisClient.expire(`org-auth-${email}`, 24 * 60 * 60);
    //cool down for 1 minute
    const coolDownKey = `org-auth-otp-cooldown-${email}`;
    await redisClient.setex(coolDownKey, 60, "1");

    //save otp in redis with 10 minutes expiry
    const hashedOTP = await hashOtp(otp);
    await redisClient.setex(`org-auth-otp-${email}`, 10 * 60, hashedOTP);

    const isPublished = await kafkaProducer.publishOTP(message);
    if (isPublished) {
        return res.status(200).json({
            success: true,
            message: "OTP sent successfully",
            data: {
                email,
                sessionToken
            }
        })
    } else {
        return res.status(500).json({
            success: false,
            message: "Failed to send OTP"
        })
    }
})

export const verifyOrganizationOtpController = asyncHandler(async (req: Request, res: Response) => {
    const { email, otp, sessionToken }: verifyOrganizationOtpInput = req.body;
    const storedHash = await redisClient.get(`org-auth-otp-${email}`);
    if (!storedHash) {
        return new AppError("OTP has expired or is invalid", 400);
    }
    const isValid = await verifyOtp(otp, sessionToken, storedHash);
    if (!isValid) {
        return new AppError("Invalid OTP", 400);
    }
    //delete the hashed otp from redis
    await redisClient.del(`org-auth-otp-${email}`);
    //create organization account'
    const orgData = await redisClient.hgetall(`org-auth-${email}`);
    if (!orgData || Object.keys(orgData).length === 0) {
        return new AppError("Organization data not found. Please register again.", 400);
    }

    // Validate all required fields exist
    const requiredFields = ['name', 'email', 'password', 'phone', 'recoveryEmail'];
    for (const field of requiredFields) {
        if (!orgData[field]) {
            throw new AppError(`Missing required field: ${field}`, 400);
        }
    }

    const createOrgResult = await createOrganizationService({
        name: orgData.name!,
        email: orgData.email!,
        password: orgData.password!,
        phone: orgData.phone!,
        recoveryEmail: orgData.recoveryEmail!,
        address: orgData.address || '' // address is optional
    })
    if (!createOrgResult.success) {
        return new AppError(createOrgResult.message, 500);
    }
    //delete the org data from redis
    await redisClient.del(`org-auth-${email}`);

    return res.status(200).json({
        success: true,
        message: createOrgResult?.message,
        data: createOrgResult.data
    })
})


const validateEmail = (email:string) => {
  return String(email)
    .toLowerCase()
    .match(
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    );
};


export const resendOrganizationOtpController = asyncHandler(async (req:Request,res:Response) => {
    const { email }: { email: string } = req.body;
    if (!validateEmail(email)) {
        return new AppError("Invalid email format", 400);
    }
    const coolDownKey = `org-auth-otp-cooldown-${email}`;
    const isInCoolDown = await redisClient.exists(coolDownKey);
    if (isInCoolDown) {
        return new AppError("Please wait before requesting a new OTP", 429);
    }
    const otp = generateOtp();
    const kafkaProducer = new KafkaProducer();
    const message: ProducerPayload = {
        action: "auth-otp",
        type: "org-otp",
        subType: "create-account",
        data: {
            email,
            otp
        }
    }
    //save otp in redis with 10 minutes expiry
    const hashedOTP = await hashOtp(otp);
    await redisClient.setex(`org-auth-otp-${email}`, 10 * 60, hashedOTP);
    //set cool down for 1 minute
    await redisClient.setex(coolDownKey, 60, "1");

    const isPublished = await kafkaProducer.publishOTP(message);
    if (isPublished) {
        return res.status(200).json({
            success: true,
            message: "OTP resent successfully",
        })
    } else {
        return res.status(500).json({
            success: false,
            message: "Failed to resend OTP"
        })
    }
})