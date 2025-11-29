import { z } from "zod"
import {
  createHodSchema,
  loginHodSchema,
} from "@schemas/organization.js"

export type CreateHodInput = z.infer<typeof createHodSchema>
export type LoginHodInput = z.infer<typeof loginHodSchema>

