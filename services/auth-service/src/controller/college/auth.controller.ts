import { CreateCollegeInput } from "../../types/organization.js"
import { AppError } from "@utils/AppError.js";
import { asyncHandler } from "@utils/asyncHandler.js";
import { Request, Response } from "express";
import { createCollegeService } from "@services/organization.service.js";




export const createCollegeController = asyncHandler(
    async(req:Request, res:Response) => {
        const {name,email,password,organizationId,recoveryEmail,phone}:CreateCollegeInput = req.body;
        if(!name || !email || !phone || !password || !organizationId || !recoveryEmail){
            throw new AppError("Missing required fields",400);
        }
        const result = await createCollegeService({
            name,
            email,
            password,
            organizationId,
            recoveryEmail,
            phone
        });
        res.status(201).json({
            success: result.success,
            data: result.data,
            message: result.message
        });

    }
)

export const loginCollege = asyncHandler(
    async(req:Request, res:Response) => {
        
    }
)


