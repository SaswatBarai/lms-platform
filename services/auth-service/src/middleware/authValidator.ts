import { prisma } from "@lib/prisma.js";
import { AppError } from "@utils/AppError.js";
import {Request,Response,NextFunction} from "express"
import { CollegeContext, OrganizationContext} from "../types/express.js"
import { PasetoRefreshPayload, PasetoV4SecurityManager } from "@utils/security.js";



export class AuthenticatedUser {

    //meethod to check Oranganiza
    public static async checkOrganization(req:Request,res:Response,next:NextFunction) {
        const userId = req.headers['x-user-id'] as string;
        const userEmail = req.headers['x-user-email'] as string;
        const userRole = req.headers['x-user-role'] as string;
        const organizationId = req.headers['x-user-organization-id'] as string;

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
            email:user.email,
            role:userRole,
            organizationId: organizationId,
        }
        req.organization = organization;

        return next();

    }

    //method to check College
    public static async checkCollege(req:Request,res:Response,next:NextFunction) {
        const userId = req.headers['x-user-id'] as string;
        const userEmail = req.headers['x-user-email'] as string;
        const userRole = req.headers['x-user-role'] as string;
        const organizationId = req.headers['x-user-organization-id'] as string;
        const collegeId = req.headers['x-user-college-id'] as string;

        if (!collegeId) {
            throw new AppError("College ID is required - Please login as college admin", 401);
        }

        const college = await prisma.college.findUnique({
            where:{
                id:collegeId
            }
        })
        console.log(college);
        if(!college){
            throw new AppError("College not found",404);
        }
        const collegeContext:CollegeContext = {
            id:college.id,
            email:college.email,
            role:userRole,
            organizationId: organizationId,
            collegeId: collegeId,
        }
        req.college = collegeContext;
        return next();
    }

    public static async refreshTokenCollege(req:Request,res:Response,next:NextFunction) {
        const refreshToken = req.cookies.refreshToken;
        if(!refreshToken){
            throw new AppError("Refresh token not found", 401);
        }
        const securityManager = PasetoV4SecurityManager.getInstance();
        const payload:PasetoRefreshPayload = await securityManager.verifyRefreshToken(refreshToken);
        if(!payload){
            throw new AppError("Invalid refresh token", 401);
        }
        const college = await prisma.college.findUnique({
            where:{
                id:payload.userId
            }
        })
        if(!college){
            throw new AppError("College not found", 404);
        }
        const collegeContext:CollegeContext = {
            id:college.id,
            email:college.email,
            role:"college-admin" as const,
            collegeId: college.id,
            organizationId: college.organizationId,
        }
        req.college = collegeContext;
        return next();
    }

    public static async refreshTokenOrganization(req:Request, res:Response, next:NextFunction){
        const refreshToken = req.cookies.refreshToken;
        if(!refreshToken){
            throw new AppError("Refresh token not found", 401);
        }
        const securityManager = PasetoV4SecurityManager.getInstance();
        const payload:PasetoRefreshPayload = await securityManager.verifyRefreshToken(refreshToken);
        if(!payload){
            throw new AppError("Invalid refresh token", 401);
        }
        const organization = await prisma.organization.findUnique({
            where:{
                id:payload.userId
            }
        })
        if(!organization){
            throw new AppError("Organization not found", 404);
        }
        const organizationContext:OrganizationContext = {
            id:organization.id,
            email:organization.email,
            role:"organization-admin" as const,
            organizationId: organization.id,
        }
        req.organization = organizationContext;
        return next();
    }

    
}