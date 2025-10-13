import {z} from "zod"
import { createOrganizationSchema } from "@schemas/organization.js"

export type CreateOrganizationInput = z.infer<typeof createOrganizationSchema>

export interface ServiceResult<T> {
  success: boolean;
  data?: T;
  message: string;
  errors?: string[];
}