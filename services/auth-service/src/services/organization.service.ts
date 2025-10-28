import pkg from "@prisma/client";
import { z, ZodError } from "zod";
import { prisma } from "../lib/prisma.js";
import { AppError } from "../utils/AppError.js";
import { CreateCollegeInput, CreateOrganizationInput, ServiceResult } from "../types/organization.js";
import {hashPassword} from "../utils/security.js"
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";

const { Prisma } = pkg;


export interface OrganizationResponse {
  id: string;
  name: string;
  email: string;
  recoveryEmail: string | null;
  address: string;
  phone: string;
  createdAt: Date;
  updatedAt: Date;
}
export interface CollegeResponse{
    id: string;
    name: string;
    email: string;
    recoveryEmail: string | null;
    organizationId: string;
    createdAt: Date;
    updatedAt: Date;
}


const handlePrismaError = (error: unknown): never => {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case "P2002":
        const field = (error.meta?.target as string[])?.[0] || "field";
        throw new AppError(`Organization with this ${field} already exists`, 409);
      case "P2025":
        throw new AppError("Organization not found", 404);
      default:
        throw new AppError("Database operation failed", 500);
    }
  }
  throw new AppError("An unexpected error occurred", 500);
};

const handleValidationError = (error: z.ZodError): never => {
  const errorMessages = error.issues.map(
    (issue) => `${issue.path.join(".")}: ${issue.message}`
  );
  throw new AppError(`Validation failed: ${errorMessages.join(", ")}`, 400);
};

// ===============================
// CORE SERVICE FUNCTIONS
// ===============================


export const createOrganizationService = async (
    InputData: CreateOrganizationInput
):Promise<ServiceResult<OrganizationResponse>> => {
    try {
        const {email,name,password,address,phone,recoveryEmail} = InputData;
        if(!email || !name || !password || !recoveryEmail){
            throw new AppError("Missing required fields",400);
        }
        //check the email or phone already exists
        const existingMail = await prisma.organization.findUnique({
            where: {email}
        })
        const existingPhone = await prisma.organization.findUnique({
            where: {phone}
        })
        if(existingMail || existingPhone){
            throw new AppError("Organization with this email or phone already exists",409);
        }

        //hash the password
        const hashedPassword = await hashPassword(password);

        //create the organization 
        const newOrganization = await prisma.organization.create({
            data:{
                name,
                email,
                password: hashedPassword,
                address: address || "",
                phone,
                recoveryEmail,
            },
            select:{
                id: true,
                name: true,
                email: true,
                recoveryEmail: true,
                address: true,
                phone: true,
                createdAt: true,
                updatedAt: true,
            }
        })
        if(!newOrganization){
            throw new AppError("Failed to create organization",500);
        }
        return {
            success: true,
            data: newOrganization,
            message: "Organization created successfully"
        }



    } catch (error) {
        if(error instanceof ZodError){
            handleValidationError(error);
        }
        if(error instanceof PrismaClientKnownRequestError){
            handlePrismaError(error);
        }
        if(error instanceof AppError){
            throw error;
        }

        throw new AppError("Failed to create organization", 500);

    }
}



export const createCollegeService = async(
    InputData:CreateCollegeInput
):Promise<ServiceResult<CollegeResponse>> => {
    try {
        const {name,email,password,organizationId,recoveryEmail,phone} = InputData;
        if(!name || !email || !password || !organizationId || !recoveryEmail){
            throw new AppError("Missing required fields",400);
        }

        // Validate that the organization exists
        const organization = await prisma.organization.findUnique({
            where: { id: organizationId }
        });

        if (!organization) {
            throw new AppError("Organization not found. Please provide a valid organizationId.", 404);
        }

        //check the email or phone already exists
        const existingMail = await prisma.college.findUnique({
            where:{email}
        })

        const existingPhone = await prisma.college.findUnique({
            where:{phone}
        });

        if(existingMail || existingPhone){
            throw new AppError("College with this email or phone already exists",409);
        }
        //hash the password 
        const hashedPassword = await hashPassword(password);

        //create the college
        const newCollege = await prisma.college.create({
            data:{
                name,
                email,
                password: hashedPassword,
                organizationId,
                recoveryEmail,
                phone,
            },
            select:{
                id: true,
                name: true,
                email: true,
                recoveryEmail: true,
                organizationId: true,
                createdAt: true,
                updatedAt: true,
            }
        })
        if(!newCollege){
            throw new AppError("Failed to create college",500);
        }
        return {
            success: true,
            data: newCollege,
            message: "College created successfully"
        }
    } catch (error) {
        if(error instanceof ZodError){
            handleValidationError(error);
        }
        if(error instanceof PrismaClientKnownRequestError){
            // Handle foreign key constraint error specifically
            if(error.code === 'P2003'){
                throw new AppError("Invalid organizationId. The specified organization does not exist.", 400);
            }
            handlePrismaError(error);
        }
        if(error instanceof AppError){
            throw error;
        }
        console.log(error);

        throw new AppError("Failed to create college", 500);
        
    }
}