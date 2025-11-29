import { z } from "zod"
import {
  createStudentBulkSchema,
  loginStudentSchema,
  resetPasswordStudentSchema,
  forgotPasswordStudentSchema,
  resetForgotPasswordStudentSchema,
} from "@schemas/organization.js"

export type CreateStudentBulkInput = z.infer<typeof createStudentBulkSchema>
export type LoginStudentInput = z.infer<typeof loginStudentSchema>
export type ResetPasswordStudentInput = z.infer<typeof resetPasswordStudentSchema>
export type ForgotPasswordStudentInput = z.infer<typeof forgotPasswordStudentSchema>
export type ResetForgotPasswordStudentInput = z.infer<typeof resetForgotPasswordStudentSchema>

