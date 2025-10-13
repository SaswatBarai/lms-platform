
import { Request, Response } from "express";
import {createOrganizationService} from "@services/organization.service.js"
import { asyncHandler } from "@utils/asyncHandler.js";
import { type CreateOrganizationInput } from "../../types/organization.js";


export const createOrganizationController = asyncHandler(async(req:Request,res:Response)=>{
    const {name,email,password,phone,recoveryEmail,address}:CreateOrganizationInput = req.body;
    const result = await createOrganizationService({name,email,password,phone,recoveryEmail,address});
    if(result.success){
        return res.status(201).json({
            success:true,
            message:result.message,
            data:result.data
        })
    }else{
        return res.status(400).json({
            success:false,
            message:result.message,
            errors:result.errors
        })
    }
})