
import { Request, Response } from "express";
import {createOrganizationService} from "@services/organization.service.js"
import { asyncHandler } from "@utils/asyncHandler.js";
import { ProducerPayload, type CreateOrganizationInput } from "../../types/organization.js";
import {generateOtp,hashOtp} from "@utils/otp.js"
import {KafkaProducer} from "@messaging/producer.js"
import redisClient from "@config/redis.js"
import {hashPassword} from "@utils/security.js"
import crypto from "crypto"




export const createOrganizationController = asyncHandler(async(req:Request,res:Response)=>{
    const {name,email,password,phone,recoveryEmail,address}:CreateOrganizationInput = req.body;
    // const result = await createOrganizationService({name,email,password,phone,recoveryEmail,address});
    // if(result.success){
    //     return res.status(201).json({
    //         success:true,
    //         message:result.message,
    //         data:result.data
    //     })
    // }else{
    //     return res.status(400).json({
    //         success:false,
    //         message:result.message,
    //         errors:result.errors
    //     })
    // }

    const otp = generateOtp();
    const kafkaProducer = new KafkaProducer();
    const message:ProducerPayload = {
        action:"auth-otp",
        type:"org-otp",
        subType:"create-account",
        data:{
            email,
            otp
        }
    }
    const hashedPassword = await hashPassword(password);
    const sessionToken = crypto.randomBytes(32).toString("hex");


    const redisResult = await redisClient.hset(`org-auth-${email}`,{
        name,
        email,
        password:hashedPassword,
        phone,
        recoveryEmail,
        address:JSON.stringify(address),
        sessionToken 
    })

    //expire in 24 hours
    await redisClient.expire(`org-auth-${email}`,24*60*60);
    //cool down for 1 minute
    const coolDownKey = `org-auth-otp-cooldown-${email}`;
    await redisClient.setex(coolDownKey,60,"1");


    //save otp in redis with 10 minutes expiry
    const hashedOTP = await hashOtp(otp);
    await redisClient.setex(`org-auth-otp-${email}`,10*60,hashedOTP);

    const isPublished = await kafkaProducer.publishOTP(message);
    if(isPublished){
        return res.status(200).json({
            success:true,
            message:"OTP sent successfully",
            data:{
                email,
                sessionToken
            }
        })
    }else{
        return res.status(500).json({
            success:false,
            message:"Failed to send OTP"
        })
    }
})