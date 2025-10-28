import { Router } from "express";
import {
    createOrganizationController,
    verifyOrganizationOtpController,
    resendOrganizationOtpController,
    loginOrganizationController,
    logoutOrganization,
    regenerateAccessTokenOrganization
} from "@controller/organization/auth.controller.js"
import {
    createCollegeController,
    loginCollegeController,
    logoutCollege,
    regenerateAccessTokenCollege
} from "../controller/college/auth.controller.js"
import { validate } from "@middleware/validate.js"
import {
    createOrganizationSchema,
    verifyOrganizationOtpSchema,
    resendOrganizationOtpSchema,
    loginOrganizationSchema,
    loginCollegeSchema,

} from "@schemas/organization.js"
import {AuthenticatedUser} from "../middleware/authValidator.js"

const router: Router = Router();


// Organization Routes
router.post("/create-organization", validate({ body: createOrganizationSchema }), createOrganizationController)
router.post("/verify-organization-otp", validate({ body: verifyOrganizationOtpSchema }), verifyOrganizationOtpController)
router.post("/resend-organization-otp", validate({ body: resendOrganizationOtpSchema }), resendOrganizationOtpController)
router.post("/login-organization", validate({ body: loginOrganizationSchema }), loginOrganizationController)
router.post("/logout-organization", AuthenticatedUser.checkOrganization, logoutOrganization);
router.post("/regenerate-access-token-organization", AuthenticatedUser.refreshTokenOrganization, regenerateAccessTokenOrganization);


// College Routes 
router.post("/create-college", AuthenticatedUser.checkOrganization, createCollegeController);
router.post("/login-college", validate({ body: loginCollegeSchema }), loginCollegeController);
router.post("/logout-college", AuthenticatedUser.checkCollege, logoutCollege);
router.post("/regenerate-access-token-college", AuthenticatedUser.refreshTokenCollege, regenerateAccessTokenCollege);

// Protected test route to verify authentication plugin
router.get("/test-protected", async (req, res) => {
    try {
        // This route should be protected by Kong's PASETO-Vault plugin
        // If the request reaches here, it means authentication was successful

        // Extract user info from headers set by Kong plugin
        const userId = req.headers['x-user-id'] as string;
        const userEmail = req.headers['x-user-email'] as string;
        const userRole = req.headers['x-user-role'] as string;
        const userType = req.headers['x-user-type'] as string;

        console.log("Authenticated user:", { userId, userEmail, userRole, userType });

        res.status(200).json({
            success: true,
            message: "Authentication successful - You have access to this protected resource",
            data: {
                message: "This is a protected endpoint that requires valid PASETO authentication",
                user: {
                    id: userId || "Not provided",
                    email: userEmail || "Not provided",
                    role: userRole || "Not provided",
                    type: userType || "Not provided"
                },
                timestamp: new Date().toISOString(),
                endpoint: "/api/test-protected"
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error instanceof Error ? error.message : "Unknown error"
        });
    }
})


export default router;
