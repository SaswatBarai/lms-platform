import { z } from "zod"
import {
  createTeacherBulkSchema,
  loginTeacherSchema,
  updatePasswordTeacherSchema,
  forgotPasswordTeacherSchema,
  resetForgotPasswordTeacherSchema,
} from "@schemas/organization.js"

export type CreateTeacherBulkInput = z.infer<typeof createTeacherBulkSchema>
export type LoginTeacherInput = z.infer<typeof loginTeacherSchema>
export type UpdatePasswordTeacherInput = z.infer<typeof updatePasswordTeacherSchema>
export type ForgotPasswordTeacherInput = z.infer<typeof forgotPasswordTeacherSchema>
export type ResetForgotPasswordTeacherInput = z.infer<typeof resetForgotPasswordTeacherSchema>

