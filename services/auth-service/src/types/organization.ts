import { z } from "zod"
import {
  createOrganizationSchema,
  verifyOrganizationOtpSchema,
  loginOrganizationSchema,
  createCollegeSchema,
  loginCollegeSchema,
  createNonTeachingStaffSchema,
  loginNonTeachingStaffSchema,
  resetPasswordScehma,
  addDepartmentSchema,
  addCourseSchema,
  createHodSchema,
  loginHodSchema,
  forgotResetPasswordSchema
} from "@schemas/organization.js"




export type CreateOrganizationInput = z.infer<typeof createOrganizationSchema>
export type verifyOrganizationOtpInput = z.infer<typeof verifyOrganizationOtpSchema>
export type LoginOrganizationInput = z.infer<typeof loginOrganizationSchema>
export type CreateCollegeInput = z.infer<typeof createCollegeSchema>
export type LoginCollegeInput = z.infer<typeof loginCollegeSchema>
export type CreateNonTeachingStaffInput = z.infer<typeof createNonTeachingStaffSchema>
export type LoginNonTeachingStaffInput = z.infer<typeof loginNonTeachingStaffSchema>
export type ResetPasswordInput = z.infer<typeof resetPasswordScehma>
export type ForgotResetPasswordInput = z.infer<typeof forgotResetPasswordSchema>
export type AddDepartmentInput = z.infer<typeof addDepartmentSchema>
export type AddCourseInput = z.infer<typeof addCourseSchema>
export type CreateHodInput = z.infer<typeof createHodSchema>
export type LoginHodInput = z.infer<typeof loginHodSchema>
export interface ServiceResult<T> {
  success: boolean;
  data?: T;
  message: string;
  errors?: string[];
}




export interface TokenPlayload {
  accessToken: string;
  refreshToken?: string;
}

//role enum
export enum OrganizationRole {
  ORG_ADMIN = "org-admin",
}

export enum NonTeachingStaffRole {
  "STUDENT_SECTION" = "studentsection",
  "REGISTRAR" = "regestral",
  "ADMINISTRATOR" = "adminstractor",
}


