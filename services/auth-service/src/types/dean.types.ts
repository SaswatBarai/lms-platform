import { z } from "zod"
import {
  createDeanSchema,
  loginDeanSchema,
  forgotPasswordDeanSchema,
  resetForgotPasswordDeanSchema,
  resetPasswordScehma,
} from "@schemas/organization.js"

export type CreateDeanInput = z.infer<typeof createDeanSchema>
export type LoginDeanInput = z.infer<typeof loginDeanSchema>
export type ForgotPasswordDeanInput = z.infer<typeof forgotPasswordDeanSchema>
export type ResetForgotPasswordDeanInput = z.infer<typeof resetForgotPasswordDeanSchema>
export type ResetPasswordDeanInput = z.infer<typeof resetPasswordScehma>

