import { Router } from "express";
import {createOrganizationController, verifyOrganizationOtpController, resendOrganizationOtpController, loginOrganizationController} from "@controller/organization/auth.controller.js"
import {validate} from "@middleware/validate.js"
import {createOrganizationSchema,verifyOrganizationOtpSchema, resendOrganizationOtpSchema, loginOrganizationSchema} from "@schemas/organization.js"

const router: Router = Router();


// Organization Routes
router.post("/create-organization",validate({body: createOrganizationSchema}),createOrganizationController)
router.post("/verify-organization-otp",validate({body: verifyOrganizationOtpSchema}),verifyOrganizationOtpController)
router.post("/resend-organization-otp",validate({body: resendOrganizationOtpSchema}),resendOrganizationOtpController)
router.post("/login-organization",validate({body: loginOrganizationSchema}),loginOrganizationController)

// TEST ONLY - Direct organization creation without OTP
router.post("/test-create-organization", async (req, res) => {
    const { hashPassword } = await import("@utils/security.js");
    const { prisma } = await import("@lib/prisma.js");
    
    try {
        const { name, email, password, phone, recoveryEmail, address } = req.body;
        const hashedPassword = await hashPassword(password);
        
        const organization = await prisma.organization.create({
            data: {
                name,
                email,
                password: hashedPassword,
                phone,
                recoveryEmail,
                address: address || "Test Address"
            }
        });
        
        res.status(201).json({
            success: true,
            message: "Test organization created successfully",
            data: {
                id: organization.id,
                name: organization.name,
                email: organization.email
            }
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error instanceof Error ? error.message : "Unknown error"
        });
    }
})


export default router;
