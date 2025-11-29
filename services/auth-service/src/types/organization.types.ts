import { z } from "zod"
import {
  createOrganizationSchema,
  verifyOrganizationOtpSchema,
  resendOrganizationOtpSchema,
  loginOrganizationSchema,
} from "@schemas/organization.js"

export type CreateOrganizationInput = z.infer<typeof createOrganizationSchema>
export type verifyOrganizationOtpInput = z.infer<typeof verifyOrganizationOtpSchema>
export type ResendOrganizationOtpInput = z.infer<typeof resendOrganizationOtpSchema>
export type LoginOrganizationInput = z.infer<typeof loginOrganizationSchema>

export enum OrganizationRole {
  ORG_ADMIN = "org-admin",
}

