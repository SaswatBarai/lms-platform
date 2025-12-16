import { prisma } from "@lib/prisma.js";
import { AppError } from "@utils/AppError.js";
import {Request,Response,NextFunction} from "express"
import { CollegeContext, DeanContext, HodContext, NonTeachingStaffContext, OrganizationContext, StudentContext, TeacherContext} from "../types/express.js"
import { PasetoRefreshPayload, PasetoTokenPayload, PasetoV4SecurityManager } from "@utils/security.js";
import redisClient from "@config/redis.js";



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
        const currentSessionId = req.headers['x-user-session-id'] as string;

        // SECURITY: Validate all required headers exist
        if (!userId || !userEmail || !userRole || !organizationId) {
            throw new AppError("Missing required authentication headers", 401);
        }

        // SECURITY: Validate session ID for single device login
        if (currentSessionId) {
            const activeSessionKey = `user:active:session:organization:${userId}`;
            const activeSessionId = await redisClient.get(activeSessionKey);
            if (!activeSessionId || activeSessionId !== currentSessionId) {
                throw new AppError("Session expired. You have logged in from another device.", 401);
            }
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
        const currentSessionId = req.headers['x-user-session-id'] as string;

        if (!collegeId) {
            throw new AppError("College ID is required - Please login as college admin", 401);
        }
        
        if (!userId || !userEmail || !userRole || !organizationId) {
            throw new AppError("Missing required authentication headers", 401);
        }

        // SECURITY: Validate session ID for single device login
        if (currentSessionId) {
            const activeSessionKey = `user:active:session:college:${userId}`;
            const activeSessionId = await redisClient.get(activeSessionKey);
            if (!activeSessionId || activeSessionId !== currentSessionId) {
                throw new AppError("Session expired. You have logged in from another device.", 401);
            }
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
        const currentSessionId = req.headers['x-user-session-id'] as string;
        
        if (!collegeId) {
            throw new AppError("College ID is required - Please login as non-teaching staff", 401);
        }
        
        if (!userId || !userEmail || !userRole || !organizationId) {
            throw new AppError("Missing required authentication headers", 401);
        }

        // SECURITY: Validate session ID for single device login
        if (currentSessionId) {
            const activeSessionKey = `user:active:session:nonTeachingStaff:${userId}`;
            const activeSessionId = await redisClient.get(activeSessionKey);
            if (!activeSessionId || activeSessionId !== currentSessionId) {
                throw new AppError("Session expired. You have logged in from another device.", 401);
            }
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

    public static async checkHod(req:Request, res:Response, next:NextFunction) {
        // SECURITY: Verify request came through Kong
        AuthenticatedUser.verifyKongHeaders(req);
        
        const userId = req.headers['x-user-id'] as string;
        const userEmail = req.headers['x-user-email'] as string;
        const userRole = req.headers['x-user-role'] as string;
        const organizationId = req.headers['x-user-organization-id'] as string;
        const collegeId = req.headers['x-user-college-id'] as string;
        const currentSessionId = req.headers['x-user-session-id'] as string;
        
        if (!collegeId) {
            throw new AppError("College ID is required - Please login as HOD", 401);
        }
        
        if (!userId || !userEmail || !userRole || !organizationId) {
            throw new AppError("Missing required authentication headers", 401);
        }

        // SECURITY: Validate session ID for single device login
        if (currentSessionId) {
            const activeSessionKey = `user:active:session:hod:${userId}`;
            const activeSessionId = await redisClient.get(activeSessionKey);
            if (!activeSessionId || activeSessionId !== currentSessionId) {
                throw new AppError("Session expired. You have logged in from another device.", 401);
            }
        }
        
        const hod = await prisma.hod.findUnique({
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
        
        if(!hod){
            throw new AppError("HOD not found", 404);
        }
        
        // SECURITY: Verify HOD belongs to the college in the token
        if(hod.collegeId !== collegeId){
            throw new AppError("Unauthorized - HOD does not belong to this college", 403);
        }
        
        // SECURITY: Verify the college belongs to the organization in the token
        if(hod.college.organizationId !== organizationId){
            throw new AppError("Unauthorized - HOD's college does not belong to this organization", 403);
        }
        
        const hodContext:HodContext = {
            id:hod.id, 
            email:hod.email,
            role:userRole,
            organizationId: organizationId,
            collegeId: collegeId,
        }
        req.hod = hodContext;
        return next();  
    }

    public static async checkTeacher(req:Request, res:Response, next:NextFunction){
        // SECURITY: Verify request came through Kong
        AuthenticatedUser.verifyKongHeaders(req);

        const userId = req.headers['x-user-id'] as string;
        const userEmail = req.headers['x-user-email'] as string;
        const userRole = req.headers['x-user-role'] as string;
        const organizationId = req.headers['x-user-organization-id'] as string;
        const collegeId = req.headers['x-user-college-id'] as string;
        const departmentId = req.headers['x-user-department-id'] as string;
        const employeeNo = req.headers['x-user-employee-no'] as string;
        const currentSessionId = req.headers['x-user-session-id'] as string;

        if(!userId || !userEmail || !userRole || !organizationId || !collegeId || !departmentId || !employeeNo){
            throw new AppError("Missing required authentication headers", 401);
        }

        // SECURITY: Validate session ID for single device login
        if (currentSessionId) {
            const activeSessionKey = `user:active:session:teacher:${userId}`;
            const activeSessionId = await redisClient.get(activeSessionKey);
            if (!activeSessionId || activeSessionId !== currentSessionId) {
                throw new AppError("Session expired. You have logged in from another device.", 401);
            }
        }

        const teacher = await prisma.teacher.findUnique({
            where:{
                id:userId
            },
            include: {
                department: {
                    include: {
                        college: {
                            select: {
                                id: true,
                                organizationId: true
                            }
                        }
                    }
                }
            }
        })

        if(!teacher){
            throw new AppError("Teacher not found", 404);
        }
        

        // SECURITY: Verify teacher belongs to the college in the token
        if(teacher.departmentId !== departmentId){
            throw new AppError("Unauthorized - Teacher does not belong to this department", 403);
        }

        // SECURITY: Verify the college belongs to the organization in the token
        if(organizationId && teacher.department.college.organizationId !== organizationId){
            throw new AppError("Unauthorized - Teacher's college does not belong to this organization", 403);
        }

        const teacherContext:TeacherContext = {
            id:teacher.id, 
            email:teacher.email,
            role:userRole,
            organizationId: organizationId,
            collegeId: collegeId,
            departmentId: departmentId,
            employeeNo: employeeNo,
        }
        req.teacher = teacherContext;
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

    // ==================== STUDENT AUTHENTICATION ====================
    
    public static async checkStudent(req:Request, res:Response, next:NextFunction) {
        // SECURITY: Verify request came through Kong
        AuthenticatedUser.verifyKongHeaders(req);
        
        const userId = req.headers['x-user-id'] as string;
        const userEmail = req.headers['x-user-email'] as string;
        const userRole = req.headers['x-user-role'] as string;
        const organizationId = req.headers['x-user-organization-id'] as string;
        const collegeId = req.headers['x-user-college-id'] as string;
        const departmentId = req.headers['x-user-department-id'] as string;
        const batchId = req.headers['x-user-batch-id'] as string;
        const sectionId = req.headers['x-user-section-id'] as string;
        const regNo = req.headers['x-user-reg-no'] as string;
        const name = req.headers['x-user-name'] as string;
        const currentSessionId = req.headers['x-user-session-id'] as string;
        
        if (!userId || !userEmail || !userRole) {
            throw new AppError("Missing required authentication headers", 401);
        }

        // SECURITY: Validate session ID for single device login
        if (currentSessionId) {
            const activeSessionKey = `user:active:session:student:${userId}`;
            const activeSessionId = await redisClient.get(activeSessionKey);
            if (!activeSessionId || activeSessionId !== currentSessionId) {
                throw new AppError("Session expired. You have logged in from another device.", 401);
            }
        }
        
        const student = await prisma.student.findUnique({
            where:{
                id: userId
            },
            include: {
                department: {
                    include: {
                        college: {
                            select: {
                                id: true,
                                organizationId: true
                            }
                        }
                    }
                },
                batch: true,
                section: true
            }
        })
        
        if(!student){
            throw new AppError("Student not found", 404);
        }
        
        // SECURITY: Verify student belongs to the department/college in the token
        if(collegeId && student.department.collegeId !== collegeId){
            throw new AppError("Unauthorized - Student does not belong to this college", 403);
        }
        
        // SECURITY: Verify the college belongs to the organization in the token
        if(organizationId && student.department.college.organizationId !== organizationId){
            throw new AppError("Unauthorized - Student's college does not belong to this organization", 403);
        }

        // SECURITY: Verify regNo matches if provided in headers
        if(regNo && student.regNo !== regNo){
            throw new AppError("Unauthorized - Registration number mismatch", 403);
        }
        
        const studentContext: StudentContext = {
            id: student.id, 
            email: student.email,
            regNo: student.regNo,
            name: student.name,
            role: userRole,
            organizationId: student.department.college.organizationId,
            collegeId: student.department.collegeId,
            departmentId: student.departmentId,
            batchId: student.batchId,
            sectionId: student.sectionId
        }
        req.student = studentContext;
        return next();  
    }

    public static async refreshTokenStudent(req:Request, res:Response, next:NextFunction) {
        const refreshToken = req.cookies.refreshToken;
        if(!refreshToken) {
            throw new AppError("Refresh token not found", 401);
        }

        const securityManager = PasetoV4SecurityManager.getInstance();
        const payload:PasetoRefreshPayload = await securityManager.verifyRefreshToken(refreshToken);
        if(!payload){
            throw new AppError("Invalid refresh token", 401);
        }

        const student = await prisma.student.findUnique({
            where:{
                id: payload.userId
            },
            include:{
                department: {
                    include: {
                        college: {
                            select: {
                                id: true,
                                organizationId: true
                            }
                        }
                    }
                },
                batch: true,
                section: true
            }
        })

        if(!student){
            throw new AppError("Student not found", 404);
        }
        
        const studentContext: StudentContext = {
            id: student.id,
            email: student.email,
            regNo: student.regNo,
            name: student.name,
            role: "student",
            organizationId: student.department.college.organizationId,
            collegeId: student.department.collegeId,
            departmentId: student.departmentId,
            batchId: student.batchId,
            sectionId: student.sectionId
        }
        req.student = studentContext;
        return next();
    }

    public static async checkDean(req:Request, res:Response, next:NextFunction) {
        // SECURITY: Verify request came through Kong
        AuthenticatedUser.verifyKongHeaders(req);

        const userId = req.headers['x-user-id'] as string;
        const userEmail = req.headers['x-user-email'] as string;
        const userRole = req.headers['x-user-role'] as string;
        const organizationId = req.headers['x-user-organization-id'] as string;
        const collegeId = req.headers['x-user-college-id'] as string;
        const currentSessionId = req.headers['x-user-session-id'] as string;

        if(!userId || !userEmail || !userRole || !organizationId || !collegeId){
            throw new AppError("Missing required authentication headers", 401);
        }

        // SECURITY: Validate session ID for single device login
        if (currentSessionId) {
            const activeSessionKey = `user:active:session:dean:${userId}`;
            const activeSessionId = await redisClient.get(activeSessionKey);
            if (!activeSessionId || activeSessionId !== currentSessionId) {
                throw new AppError("Session expired. You have logged in from another device.", 401);
            }
        }

        const dean = await prisma.dean.findUnique({
            where:{
                id:userId
            },
            include: {
                college: {
                    select: {
                        id: true,
                        organizationId: true
                    }
                }
            }
        })

        if(!dean){
            throw new AppError("Dean not found", 404);
        }

        // SECURITY: Verify dean belongs to the college in the token
        if(dean.collegeId !== collegeId){
            throw new AppError("Unauthorized - Dean does not belong to this college", 403);
        }

        // SECURITY: Verify the college belongs to the organization in the token
        if(organizationId && dean.college.organizationId !== organizationId){
            throw new AppError("Unauthorized - Dean's college does not belong to this organization", 403);
        }

        const deanContext:DeanContext = {
            id:dean.id, 
            mailId:dean.mailId,
            role:userRole,
            organizationId: organizationId,
            collegeId: collegeId,
        }
        req.dean = deanContext;
        return next();
    }

    public static async refreshTokenTeacher(req:Request, res:Response, next:NextFunction) {
        const refreshToken = req.cookies.refreshToken;
        if(!refreshToken) {
            throw new AppError("Refresh token not found", 401);
        }

        const securityManager = PasetoV4SecurityManager.getInstance();
        const payload:PasetoRefreshPayload = await securityManager.verifyRefreshToken(refreshToken);
        if(!payload){
            throw new AppError("Invalid refresh token", 401);
        }

        const teacher = await prisma.teacher.findUnique({
            where:{
                id: payload.userId
            },
            include:{
                department: {
                    include: {
                        college: {
                            select: {
                                id: true,
                                organizationId: true
                            }
                        }
                    }
                }
            }
        })

        if(!teacher){
            throw new AppError("Teacher not found", 404);
        }
        
        const teacherContext: TeacherContext = {
            id: teacher.id,
            email: teacher.email,
            role: "teacher",
            organizationId: teacher.department.college.organizationId,
            collegeId: teacher.department.collegeId,
            departmentId: teacher.departmentId,
            employeeNo: teacher.employeeNo
        }
        req.teacher = teacherContext;
        return next();
    }

    public static async refreshTokenDean(req:Request, res:Response, next:NextFunction) {
        const refreshToken = req.cookies.refreshToken;
        if(!refreshToken) {
            throw new AppError("Refresh token not found", 401);
        }

        const securityManager = PasetoV4SecurityManager.getInstance();
        const payload:PasetoRefreshPayload = await securityManager.verifyRefreshToken(refreshToken);
        if(!payload){
            throw new AppError("Invalid refresh token", 401);
        }

        const dean = await prisma.dean.findUnique({
            where:{
                id: payload.userId
            },
            include:{
                college: {
                    select: {
                        id: true,
                        organizationId: true
                    }
                }
            }
        })

        if(!dean){
            throw new AppError("Dean not found", 404);
        }
        
        const deanContext: DeanContext = {
            id: dean.id,
            mailId: dean.mailId,
            role: "dean",
            organizationId: dean.college.organizationId,
            collegeId: dean.collegeId
        }
        req.dean = deanContext;
        return next();
    }
    
}