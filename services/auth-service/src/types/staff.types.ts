import { z } from "zod"
import {
  createNonTeachingStaffSchema,
  createNonTeachingStaffBulkSchema,
  loginNonTeachingStaffSchema,
} from "@schemas/organization.js"

export type CreateNonTeachingStaffInput = z.infer<typeof createNonTeachingStaffSchema>
export type CreateNonTeachingStaffBulkInput = z.infer<typeof createNonTeachingStaffBulkSchema>
export type LoginNonTeachingStaffInput = z.infer<typeof loginNonTeachingStaffSchema>

export enum NonTeachingStaffRole {
  STUDENT_SECTION = "studentsection",
  REGISTRAR = "regestral",
  ADMINISTRATOR = "adminstractor",
}

