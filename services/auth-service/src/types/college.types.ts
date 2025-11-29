import { z } from "zod"
import {
  createCollegeSchema,
  loginCollegeSchema,
} from "@schemas/organization.js"

export type CreateCollegeInput = z.infer<typeof createCollegeSchema>
export type LoginCollegeInput = z.infer<typeof loginCollegeSchema>

