import { Router } from "express";
import {
    createOrganizationController,
    verifyOrganizationOtpController,
    resendOrganizationOtpController,
    loginOrganizationController,
    logoutOrganization,
    regenerateAccessTokenOrganization,
    forgotPasswordOrganization,
    resetPasswordOrganization
} from "@controller/organization/auth.controller.js"
import {
    createCollegeController,
    forgotPasswordCollege,
    loginCollegeController,
    logoutCollege,
    regenerateAccessTokenCollege,
    resetPasswordCollege
} from "../controller/college/auth.controller.js"
import {
    createNonTeachingStaffBulkController,
    login as loginNonTeachingStaff
} from "../controller/nonTeachingStaff/staff.controller.js"
import { validate } from "@middleware/validate.js"
import {
    createOrganizationSchema,
    verifyOrganizationOtpSchema,
    resendOrganizationOtpSchema,
    loginOrganizationSchema,
    loginCollegeSchema,
    createNonTeachingStaffBulkSchema,
    loginNonTeachingStaffSchema,

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
router.post("/forgot-password-organization", forgotPasswordOrganization);
router.post("/reset-password-organization", resetPasswordOrganization);


// College Routes 
router.post("/create-college", AuthenticatedUser.checkOrganization, createCollegeController);
router.post("/login-college", validate({ body: loginCollegeSchema }), loginCollegeController);
router.post("/logout-college", AuthenticatedUser.checkCollege, logoutCollege);
router.post("/regenerate-access-token-college", AuthenticatedUser.refreshTokenCollege, regenerateAccessTokenCollege);
router.post("/forgot-password-college", forgotPasswordCollege);
router.post("/reset-password-college", resetPasswordCollege);

// Non-Teaching Staff Routes
router.post(
    "/create-non-teaching-staff-bulk",
    AuthenticatedUser.checkCollege, // Protects the route
    validate({ body: createNonTeachingStaffBulkSchema }), // Validates the input array
    createNonTeachingStaffBulkController
);
router.post("/login-non-teaching-staff", validate({ body: loginNonTeachingStaffSchema }), loginNonTeachingStaff);

// Protected test route to verify authentication plugin


router.get("/test-protected", async (req, res) => {
    try {
        // This route should be protected by Kong's PASETO-Vault plugin
        // If the request reaches here, it means authentication was successful

        // Extract user info from headers set by Kong plugin (with X-User- prefix)
        const userId = req.headers['x-user-id'] as string;
        const userEmail = req.headers['x-user-email'] as string;
        const userRole = req.headers['x-user-role'] as string;
        const organizationId = req.headers['x-user-organization-id'] as string;
        const collegeId = req.headers['x-user-college-id'] as string;

        console.log("Authenticated user:", { userId, userEmail, userRole, organizationId, collegeId });

        res.status(200).json({
            success: true,
            message: "Authentication successful - You have access to this protected resource",
            data: {
                message: "This is a protected endpoint that requires valid PASETO authentication",
                user: {
                    id: userId || "Not provided",
                    email: userEmail || "Not provided",
                    role: userRole || "Not provided",
                    organizationId: organizationId || "Not provided",
                    collegeId: collegeId || "Not provided"
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
