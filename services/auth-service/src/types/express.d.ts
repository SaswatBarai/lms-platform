import {Request,Response,NextFunction} from "express"

declare global {
    namespace Express {
        interface Request {
            organization: OrganizationContext;
            college: CollegeContext;
            nonTeachingStaff: NonTeachingStaffContext;
            hod: HodContext;
            student: StudentContext;
        }
    }
}

export interface OrganizationContext {
    id: string;
    email: string;
    role: string;
    organizationId?: string;
}

export interface CollegeContext {
    id: string;
    email: string;
    role: string;
    organizationId?: string;
    collegeId?: string;
}

export interface NonTeachingStaffContext {
    id: string;
    email: string;
    role: string;
    organizationId?: string;
    collegeId?: string;
}

export interface HodContext {
    id: string;
    email: string;
    role: string;
    organizationId?: string;
    collegeId?: string;
}

export interface StudentContext {
    id: string;
    email: string;
    regNo: string;
    name: string;
    role: string;
    organizationId?: string;
    collegeId?: string;
    departmentId?: string;
    batchId?: string;
    sectionId?: string;
}

export type AsyncHandler = (req:Request,res:Response,next:NextFunction) => Promise<any>;