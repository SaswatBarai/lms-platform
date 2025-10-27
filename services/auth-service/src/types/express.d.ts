import {Request,Response,NextFunction} from "express"

declare global {
    namespace Express {
        interface Request {
            organization: OrganizationContext;
        }
    }
}

export interface OrganizationContext {
    id: string;
    name: string;
    email: string;
    role: string;
    type: string;
}

export type AsyncHandler = (req:Request,res:Response,next:NextFunction) => Promise<any>;