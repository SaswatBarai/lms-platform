import { Request,Response,NextFunction } from "express";
import { AsyncHandler } from "../types/express.js";

export const asyncHandler = (fn:AsyncHandler) => (req:Request,res:Response,next:NextFunction) => {
    Promise.resolve(fn(req,res,next)).catch(next);
}