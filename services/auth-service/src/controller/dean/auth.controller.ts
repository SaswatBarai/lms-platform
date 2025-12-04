import { prisma } from "@lib/prisma.js";
import { AppError } from "@utils/AppError.js";
import { asyncHandler } from "@utils/asyncHandler.js";
import { Request, Response } from "express";


export const createDeanController = asyncHandler(
    async(req:Request, res:Response) => {
        const {email,collegeId,organizationId} = req.college;
        if(!email || !collegeId || !organizationId){
            throw new AppError("Missing required fields",400);
        }
        
    }
)