import { z } from "zod"
import {
  resetPasswordScehma,
  forgotResetPasswordSchema,
  addDepartmentSchema,
  addDepartmentBulkSchema,
  addCourseSchema,
  addCourseBulkSchema,
  addBatchSchema,
  addSectionSchema,
} from "@schemas/organization.js"

export type ResetPasswordInput = z.infer<typeof resetPasswordScehma>
export type ForgotResetPasswordInput = z.infer<typeof forgotResetPasswordSchema>
export type AddDepartmentInput = z.infer<typeof addDepartmentSchema>
export type AddDepartmentBulkInput = z.infer<typeof addDepartmentBulkSchema>
export type AddCourseInput = z.infer<typeof addCourseSchema>
export type AddCourseBulkInput = z.infer<typeof addCourseBulkSchema>
export type AddBatchInput = z.infer<typeof addBatchSchema>
export type AddSectionInput = z.infer<typeof addSectionSchema>

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

