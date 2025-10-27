import { prisma } from "@lib/prisma.js";
import { AppError } from "@utils/AppError.js";
import {Request,Response,NextFunction} from "express"
import { OrganizationContext} from "../types/express.js"



class AuthenticatedUser {

    //meethod to check Oranganiza
    public async checkOrganization(req:Request,res:Response,next:NextFunction) {
        const userId = req.headers['x-user-id'] as string;
        const userEmail = req.headers['x-user-email'] as string;
        const userRole = req.headers['x-user-role'] as string;
        const userType = req.headers['x-user-type'] as string;

        const user = await prisma.organization.findUnique({
            where:{
                id:userId
            }
        })
        if(!user){
            throw new AppError("User not found",404);
        }

        const organization:OrganizationContext = {
            id:user.id,
            name:user.name,
            email:user.email,
            role:userRole,
            type:userType,
        }
        req.organization = organization;

        return next();

    }
}