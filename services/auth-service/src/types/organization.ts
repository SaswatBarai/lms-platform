import { z } from "zod"
import {
  createOrganizationSchema,
  verifyOrganizationOtpSchema,
  loginOrganizationSchema,
  createCollegeSchema,
  loginCollegeSchema
} from "@schemas/organization.js"





export type CreateOrganizationInput = z.infer<typeof createOrganizationSchema>
export type verifyOrganizationOtpInput = z.infer<typeof verifyOrganizationOtpSchema>
export type LoginOrganizationInput = z.infer<typeof loginOrganizationSchema>
export type CreateCollegeInput = z.infer<typeof createCollegeSchema>
export type LoginCollegeInput = z.infer<typeof loginCollegeSchema>



export interface ServiceResult<T> {
  success: boolean;
  data?: T;
  message: string;
  errors?: string[];
}

export interface ProducerPayload {
  action: "auth-otp" | "email-notification" | "forgot-password";
  type: "org-otp" |"welcome-email" | "college-forgot-password" | "org-forgot-password";
  subType?: "create-account";
  data: any;
}


//role enum
export enum OrganizationRole {
  ORG_ADMIN = "org-admin",
}


export interface TokenPlayload {
  accessToken: string;
  refreshToken?: string;
}