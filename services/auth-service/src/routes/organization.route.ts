import { Router } from "express";
import {createOrganizationController, verifyOrganizationOtpController, resendOrganizationOtpController} from "@controller/organization/auth.controller.js"
import {validate} from "@middleware/validate.js"
import {createOrganizationSchema,verifyOrganizationOtpSchema, resendOrganizationOtpSchema} from "@schemas/organization.js"

const router: Router = Router();


// Organization Routes
router.post("/create-organization",validate({body: createOrganizationSchema}),createOrganizationController)
router.post("/verify-organization-otp",validate({body: verifyOrganizationOtpSchema}),verifyOrganizationOtpController)
router.post("/resend-organization-otp",validate({body: resendOrganizationOtpSchema}),resendOrganizationOtpController);


export default router;
