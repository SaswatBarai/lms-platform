import {z} from "zod"
import { createOrganizationSchema, verifyOrganizationOtpSchema, loginOrganizationSchema } from "@schemas/organization.js"




export type CreateOrganizationInput = z.infer<typeof createOrganizationSchema>
export type verifyOrganizationOtpInput = z.infer<typeof verifyOrganizationOtpSchema>
export type LoginOrganizationInput = z.infer<typeof loginOrganizationSchema>



export interface ServiceResult<T> {
  success: boolean;
  data?: T;
  message: string;
  errors?: string[];
}

export interface ProducerPayload {
  action: "auth-otp";
  type: "org-otp" ;
  subType?:"create-account";
  data: any;
}


//role enum
export enum OrganizationRole {
  ADMIN = "admin",
}


export interface TokenPlayload{
    accessToken: string;
    refreshToken?:string;
}