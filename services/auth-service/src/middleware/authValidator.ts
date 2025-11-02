import { prisma } from "@lib/prisma.js";
import { AppError } from "@utils/AppError.js";
import {Request,Response,NextFunction} from "express"
import { CollegeContext, HodContext, NonTeachingStaffContext, OrganizationContext} from "../types/express.js"
import { PasetoRefreshPayload, PasetoTokenPayload, PasetoV4SecurityManager } from "@utils/security.js";



export class AuthenticatedUser {

    // SECURITY: Verify request came through Kong gateway
    private static verifyKongHeaders(req: Request): void {
        const authenticated = req.headers['x-authenticated'];
        if (authenticated !== 'true') {
            throw new AppError("Unauthorized - Request must go through API gateway", 401);
        }
    }

    //meethod to check Oranganiza
    public static async checkOrganization(req:Request,res:Response,next:NextFunction) {
        // SECURITY: Verify request came through Kong
        AuthenticatedUser.verifyKongHeaders(req);

        const userId = req.headers['x-user-id'] as string;
        const userEmail = req.headers['x-user-email'] as string;
        const userRole = req.headers['x-user-role'] as string;
        const organizationId = req.headers['x-user-organization-id'] as string;

        // SECURITY: Validate all required headers exist
        if (!userId || !userEmail || !userRole || !organizationId) {
            throw new AppError("Missing required authentication headers", 401);
        }

        const user = await prisma.organization.findUnique({
            where:{
                id:userId
            }
        })
        if(!user){
            throw new AppError("User not found",404);
        }

        // SECURITY: Verify user owns the organization (prevent cross-organization access)
        if (user.id !== organizationId) {
            throw new AppError("Unauthorized - User does not belong to this organization", 403);
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
        // SECURITY: Verify request came through Kong
        AuthenticatedUser.verifyKongHeaders(req);

        const userId = req.headers['x-user-id'] as string;
        const userEmail = req.headers['x-user-email'] as string;
        const userRole = req.headers['x-user-role'] as string;
        const organizationId = req.headers['x-user-organization-id'] as string;
        const collegeId = req.headers['x-user-college-id'] as string;

        if (!collegeId) {
            throw new AppError("College ID is required - Please login as college admin", 401);
        }
        
        if (!userId || !userEmail || !userRole || !organizationId) {
            throw new AppError("Missing required authentication headers", 401);
        }

        const college = await prisma.college.findUnique({
            where:{
                id:collegeId
            }
        })
        
        if(!college){
            throw new AppError("College not found",404);
        }

        // SECURITY: Verify college belongs to the organization in the token
        if (college.organizationId !== organizationId) {
            throw new AppError("Unauthorized - College does not belong to this organization", 403);
        }

        // SECURITY: For college admins, verify the user ID matches the college ID
        // (College admins authenticate AS the college entity)
        if (userRole === "college-admin" && userId !== collegeId) {
            throw new AppError("Unauthorized - User does not match college identity", 403);
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

    public static async checkNonTeachingStaff(req:Request,res:Response,next:NextFunction) {
        // SECURITY: Verify request came through Kong
        AuthenticatedUser.verifyKongHeaders(req);
        
        const userId = req.headers['x-user-id'] as string;
        const userEmail = req.headers['x-user-email'] as string;
        const userRole = req.headers['x-user-role'] as string;
        const organizationId = req.headers['x-user-organization-id'] as string;
        const collegeId = req.headers['x-user-college-id'] as string;
        
        if (!collegeId) {
            throw new AppError("College ID is required - Please login as non-teaching staff", 401);
        }
        
        if (!userId || !userEmail || !userRole || !organizationId) {
            throw new AppError("Missing required authentication headers", 401);
        }
        
        const nonTeachingStaff = await prisma.nonTeachingStaff.findUnique({
            where:{
                id:userId
            },
            include: {
                college: {
                    select: {
                        organizationId: true
                    }
                }
            }
        })
        
        if(!nonTeachingStaff){
            throw new AppError("Non-teaching staff not found", 404);
        }
        
        // SECURITY: Verify non-teaching staff belongs to the college in the token
        if(nonTeachingStaff.collegeId !== collegeId){
            throw new AppError("Unauthorized - Non-teaching staff does not belong to this college", 403);
        }
        
        // SECURITY: Verify the college belongs to the organization in the token
        if(nonTeachingStaff.college.organizationId !== organizationId){
            throw new AppError("Unauthorized - Staff's college does not belong to this organization", 403);
        }
        
        const nonTeachingStaffContext:NonTeachingStaffContext = {
            id:nonTeachingStaff.id, 
            email:nonTeachingStaff.email,
            role:userRole,
            organizationId: organizationId,
            collegeId: collegeId,
        }
        req.nonTeachingStaff = nonTeachingStaffContext;
        return next();  
    }


    //Refresh Token Middleware

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

    public static async refreshTokenHod(req:Request, res:Response , next:NextFunction){
        const refreshToken = req.cookies.refreshToken;
        if(!refreshToken){
            throw new AppError("Refresh token not found", 401);
        }

        const securityManager = PasetoV4SecurityManager.getInstance();
        const payload:PasetoRefreshPayload = await securityManager.verifyRefreshToken(refreshToken);
        if(!payload){
            throw new AppError("Invalid refresh token", 401);
        }

        const hod = await prisma.hod.findUnique({
            where:{
                id:payload.userId
            },
            include:{
                college:{
                    select:{
                        id: true,
                        organizationId: true
                    }
                }
            }   
        })
        if(!hod){
            throw new AppError("Invalid refresh token", 401);
        }
        const hodContext:HodContext = {
            id:hod.id,
            email:hod.email,
            role:"hod" as const,
            collegeId: hod.collegeId,
            organizationId: hod.college.organizationId,
        }
        req.hod = hodContext;
        return next();
    }

    public static async refreshTokenNonTeachingStaff(req:Request, res:Response, next:NextFunction) {
        const refreshToken = req.cookies.refreshToken;
        if(!refreshToken) {
            throw new AppError("Refresh token not found", 401);
        }

        const securityManager = PasetoV4SecurityManager.getInstance();
        const payload:PasetoRefreshPayload = await securityManager.verifyRefreshToken(refreshToken);
        if(!payload){
            throw new AppError("Invalid refresh token", 401);
        }

        const nonTeachingStaff = await prisma.nonTeachingStaff.findUnique({
            where:{
                id:payload.userId
            },
            include:{
                college:{
                    select:{
                        id: true,
                        organizationId: true
                    }
                }
            }
        })

        if(!nonTeachingStaff){
            throw new AppError("Non-teaching staff not found", 404);
        }
        const nonTeachingStaffContext:NonTeachingStaffContext = {
            id:nonTeachingStaff.id,
            email:nonTeachingStaff.email,
            role:nonTeachingStaff.role,
            organizationId:nonTeachingStaff.college.organizationId,
            collegeId:nonTeachingStaff.collegeId,
        }
        req.nonTeachingStaff = nonTeachingStaffContext;
        return next();
    }
    
}