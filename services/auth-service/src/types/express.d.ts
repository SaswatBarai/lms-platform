import {Request,Response,NextFunction} from "express"

declare global {
    namespace Express {
        interface Request {
            organization: OrganizationContext;
            college: CollegeContext;
            nonTeachingStaff: NonTeachingStaffContext;
            hod: HodContext;

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
export type AsyncHandler = (req:Request,res:Response,next:NextFunction) => Promise<any>;