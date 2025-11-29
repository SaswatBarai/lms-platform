import { Router } from "express";
import {
    createOrganizationController,
    verifyOrganizationOtpController,
    resendOrganizationOtpController,
    loginOrganizationController,
    logoutOrganization,
    regenerateAccessTokenOrganization,
    forgotPasswordOrganization,
    resetPasswordOrganizationController,
    resetForgotPasswordOrganization
} from "@controller/organization/auth.controller.js"
import {
    createCollegeController,
    forgotPasswordCollege,
    loginCollegeController,
    logoutCollege,
    regenerateAccessTokenCollege,
    resetPasswordCollegeController,
    resetForgotPasswordCollegeController
} from "../controller/college/auth.controller.js"
import {
    addBatchNonTeachingStaffController,
    addCourseNonTeachingStaffController,
    addDepartmentNonTeachingStaffController,
    addSectionNonTeachingStaffController,
    createNonTeachingStaffBulkController,
    login as loginNonTeachingStaff,
    logoutNonTeachingStaffController,
    resetPasswordNonTeachingStaffController
} from "../controller/nonTeachingStaff/staff.controller.js"
import {
    createStudentBulkController,
    loginStudentController,
    logoutStudentController,
    regenerateAccessTokenStudentController,
    resetPasswordStudentController,
    forgotPasswordStudentController,
    resetForgotPasswordStudentController
} from "../controller/students/auth.controller.js"
import {
    createBulkTeacherController,
    loginTeacherController,
    logoutTeacherController,
    regenerateAccessTokenTeacherController,
    raiseUpdatePasswordTeacherController,
    forgotPasswordTeacherController,
    resetForgotPasswordTeacherController
} from "../controller/teacher/auth.controller.js"
import { validate } from "@middleware/validate.js"
import {
    createOrganizationSchema,
    verifyOrganizationOtpSchema,
    resendOrganizationOtpSchema,
    loginOrganizationSchema,
    loginCollegeSchema,
    createNonTeachingStaffBulkSchema,
    loginNonTeachingStaffSchema,
    resetPasswordScehma,
    addDepartmentBulkSchema,
    addCourseBulkSchema,
    addBatchSchema,
    addSectionSchema,
    createStudentBulkSchema,
    forgotResetPasswordSchema,
    loginHodSchema,
    loginStudentSchema,
    resetPasswordStudentSchema,
    forgotPasswordStudentSchema,
    resetForgotPasswordStudentSchema,
    createTeacherBulkSchema,
    loginTeacherSchema,
    forgotPasswordTeacherSchema,
    resetForgotPasswordTeacherSchema,
    updatePasswordTeacherSchema
} from "@schemas/organization.js"
import {AuthenticatedUser} from "../middleware/authValidator.js"
import { regenerateAccessTokenHod } from "@controller/hod/auth.controller.js";

const router: Router = Router();


// Organization Routes
router.post("/create-organization", validate({ body: createOrganizationSchema }), createOrganizationController)
router.post("/verify-organization-otp", validate({ body: verifyOrganizationOtpSchema }), verifyOrganizationOtpController)
router.post("/resend-organization-otp", validate({ body: resendOrganizationOtpSchema }), resendOrganizationOtpController)
router.post("/login-organization", validate({ body: loginOrganizationSchema }), loginOrganizationController)
router.post("/logout-organization", AuthenticatedUser.checkOrganization, logoutOrganization);
router.post("/regenerate-access-token-organization", AuthenticatedUser.refreshTokenOrganization, regenerateAccessTokenOrganization);
router.post("/forgot-password-organization", forgotPasswordOrganization);
router.post("/forgot-reset-password-organization",validate({body:forgotResetPasswordSchema}),resetForgotPasswordOrganization)
router.post("/reset-password-organization",AuthenticatedUser.checkOrganization,validate({body:resetPasswordScehma}), resetPasswordOrganizationController);


// College Routes 
router.post("/create-college", AuthenticatedUser.checkOrganization, createCollegeController);
router.post("/login-college", validate({ body: loginCollegeSchema }), loginCollegeController);
router.post("/logout-college", AuthenticatedUser.checkCollege, logoutCollege);
router.post("/regenerate-access-token-college", AuthenticatedUser.refreshTokenCollege, regenerateAccessTokenCollege);
router.post("/forgot-password-college", forgotPasswordCollege);
router.post("/forgot-reset-password-college",validate({body:forgotResetPasswordSchema}),resetForgotPasswordCollegeController)
router.post("/reset-password-college",AuthenticatedUser.checkCollege,validate({body:resetPasswordScehma}), resetPasswordCollegeController);




// Non-Teaching Staff Routes
router.post(
    "/create-non-teaching-staff-bulk",
    AuthenticatedUser.checkCollege, // Protects the route
    validate({ body: createNonTeachingStaffBulkSchema }), // Validates the input array
    createNonTeachingStaffBulkController
);
router.post("/login-non-teaching-staff", validate({ body: loginNonTeachingStaffSchema }), loginNonTeachingStaff);
router.post("/reset-password-non-teaching-staff",AuthenticatedUser.checkNonTeachingStaff,validate({body:resetPasswordScehma}), resetPasswordNonTeachingStaffController);
router.post("/add-department",AuthenticatedUser.checkNonTeachingStaff,validate({body:addDepartmentBulkSchema}), addDepartmentNonTeachingStaffController);
router.post("/add-course",AuthenticatedUser.checkNonTeachingStaff,validate({body:addCourseBulkSchema}), addCourseNonTeachingStaffController);
router.post("/add-batch",AuthenticatedUser.checkNonTeachingStaff,validate({body:addBatchSchema}), addBatchNonTeachingStaffController);
router.post("/add-section",AuthenticatedUser.checkNonTeachingStaff,validate({body:addSectionSchema}), addSectionNonTeachingStaffController);
router.post("/forgot-password-non-teaching-staff", forgotPasswordCollege);
router.post("/forgot-reset-password-non-teaching-staff",validate({body:forgotResetPasswordSchema}),resetForgotPasswordCollegeController)
router.post("/regenerate-access-token-non-teaching-staff", AuthenticatedUser.refreshTokenNonTeachingStaff, regenerateAccessTokenCollege);
router.post("/logout-non-teaching-staff", AuthenticatedUser.checkNonTeachingStaff, logoutNonTeachingStaffController);






// Hod Routes
router.post("/create-hod",AuthenticatedUser.checkNonTeachingStaff,createCollegeController);
router.post("/login-hod", validate({ body: loginHodSchema }), loginCollegeController);
router.post("/logout-hod", AuthenticatedUser.checkCollege, logoutCollege);
router.post("/regenerate-access-token-hod", AuthenticatedUser.refreshTokenHod, regenerateAccessTokenHod);
router.post("/forgot-password-hod", forgotPasswordCollege);
router.post("/forgot-reset-password-hod",validate({body:forgotResetPasswordSchema}),resetForgotPasswordCollegeController)
router.post("/reset-password-hod",AuthenticatedUser.checkHod,validate({body:resetPasswordScehma}), resetPasswordCollegeController);


//Student Routes
router.post("/create-student-bulk", AuthenticatedUser.checkNonTeachingStaff, validate({body:createStudentBulkSchema}), createStudentBulkController);
router.post("/login-student", validate({ body: loginStudentSchema }), loginStudentController);
router.post("/logout-student", AuthenticatedUser.checkStudent, logoutStudentController);
router.post("/regenerate-access-token-student", AuthenticatedUser.refreshTokenStudent, regenerateAccessTokenStudentController);
router.post("/reset-password-student", AuthenticatedUser.checkStudent, validate({ body: resetPasswordStudentSchema }), resetPasswordStudentController);
router.post("/forgot-password-student", validate({ body: forgotPasswordStudentSchema }), forgotPasswordStudentController);
router.post("/forgot-reset-password-student", validate({ body: resetForgotPasswordStudentSchema }), resetForgotPasswordStudentController);

//Teacher Routes
router.post("/create-teacher-bulk", AuthenticatedUser.checkNonTeachingStaff, validate({ body: createTeacherBulkSchema }), createBulkTeacherController);
router.post("/login-teacher", validate({ body: loginTeacherSchema }), loginTeacherController);
router.post("/logout-teacher", AuthenticatedUser.checkTeacher, logoutTeacherController);
router.post("/regenerate-access-token-teacher", AuthenticatedUser.refreshTokenTeacher, regenerateAccessTokenTeacherController);
router.post("/reset-password-teacher", AuthenticatedUser.checkTeacher, validate({ body: updatePasswordTeacherSchema }), raiseUpdatePasswordTeacherController);
router.post("/forgot-password-teacher", validate({ body: forgotPasswordTeacherSchema }), forgotPasswordTeacherController);
router.post("/forgot-reset-password-teacher", validate({ body: resetForgotPasswordTeacherSchema }), resetForgotPasswordTeacherController);






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
