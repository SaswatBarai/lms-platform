import { EmailService } from "@services/email.service.js";
import { nonTeachingStaffPasswordResetEmailTemplate, passwordResetEmailTemplate, hodPasswordResetEmailTemplate, studentPasswordResetEmailTemplate, teacherPasswordResetEmailTemplate, deanPasswordResetEmailTemplate } from "../templates/index.js";
import { ForgotPasswordData, StudentForgotPasswordData, TeacherForgotPasswordData, DeanForgotPasswordData } from "../types/notification.types.js";

interface ExtendedForgotPasswordData extends ForgotPasswordData {
  collegeName?: string;
  name?: string;
}

interface HodForgotPasswordData extends ExtendedForgotPasswordData{
  departmentName: string;
  departShortName:string;
}


export class PasswordResetHandler {
  /**
   * Handle password reset email for organization
   */
  public static async handleOrganizationPasswordReset(data: ForgotPasswordData): Promise<boolean> {
    const { email, sessionToken } = data;

    if (!email || !sessionToken) {
      console.error("[PasswordResetHandler] Missing email or session token for organization");
      return false;
    }

    console.log(`[PasswordResetHandler] Processing organization password reset for ${email}`);

    const resetLink = `http://localhost:8000/auth/api/reset-password-organization?token=${sessionToken}`;
    const html = passwordResetEmailTemplate(resetLink);

    const result = await EmailService.sendEmail({
      to: email,
      subject: "Reset Your Password - LMS Platform",
      html
    });

    if (result.success) {
      console.log(`[PasswordResetHandler] ✅ Organization password reset email sent to ${email}`);
      return true;
    }

    console.error(`[PasswordResetHandler] ❌ Failed to send organization password reset email to ${email}`);
    return false;
  }

  /**
   * Handle password reset email for college
   */
  public static async handleCollegePasswordReset(data: ForgotPasswordData): Promise<boolean> {
    const { email, sessionToken } = data;

    if (!email || !sessionToken) {
      console.error("[PasswordResetHandler] Missing email or session token for college");
      return false;
    }

    console.log(`[PasswordResetHandler] Processing college password reset for ${email}`);

    const resetLink = `http://localhost:8000/auth/api/reset-password-college?token=${sessionToken}`;
    const html = passwordResetEmailTemplate(resetLink);

    const result = await EmailService.sendEmail({
      to: email,
      subject: "Reset Your Password - LMS Platform",
      html
    });

    if (result.success) {
      console.log(`[PasswordResetHandler] ✅ College password reset email sent to ${email}`);
      return true;
    }

    console.error(`[PasswordResetHandler] ❌ Failed to send college password reset email to ${email}`);
    return false;
  }

  

  public static async handleNonTeachingStaffPasswordReset(data: ExtendedForgotPasswordData): Promise<boolean> {
    const { email, sessionToken, collegeName,name } = data;
    
    if (!email || !sessionToken || !collegeName) {
      console.error("[PasswordResetHandler] Missing email, session token, or college name for non-teaching staff");
      return false;
    }
    console.log(`[PasswordResetHandler] Processing non-teaching staff password reset for ${email}`);

    const resetLink = `http://localhost:8000/auth/api/reset-password-non-teaching-staff?token=${sessionToken}`;
    const html = nonTeachingStaffPasswordResetEmailTemplate(email, collegeName, resetLink, name!);
    
    const result = await EmailService.sendEmail({
      to: email,
      subject: "Reset Your Password - LMS Platform",
      html
    })
    if (result.success) {
      console.log(`[PasswordResetHandler] ✅ Non-teaching staff password reset email sent to ${email}`);
      return true;
    }
    console.error(`[PasswordResetHandler] ❌ Failed to send non-teaching staff password reset email to ${email}`);
    return false;
  }


  public static async handleHodPasswordReset(data: HodForgotPasswordData):Promise<boolean> {
    const {name,email,sessionToken,departShortName,departmentName,collegeName} = data;
    if (!email || !sessionToken || !collegeName || !departmentName || !departShortName || !name) {
      console.error("[PasswordResetHandler] Missing required fields for HOD password reset");
      return false;
    }
    console.log(`[PasswordResetHandler] Processing HOD password reset for ${email}`);

    const resetLink = `http://localhost:8000/auth/api/reset-password-hod?token=${sessionToken}`;
    const html = hodPasswordResetEmailTemplate(email, name, collegeName, departmentName, departShortName, resetLink);

    const result = await EmailService.sendEmail({
      to: email,
      subject: `Password Reset - ${departmentName} HOD | ${collegeName} LMS`,
      html
    });

    if (result.success) {
      console.log(`[PasswordResetHandler] ✅ HOD password reset email sent to ${email}`);
      return true;
    }

    console.error(`[PasswordResetHandler] ❌ Failed to send HOD password reset email to ${email}`);
    return false;
  }

  /**
   * Handle password reset email for student
   */
  public static async handleStudentPasswordReset(data: StudentForgotPasswordData): Promise<boolean> {
    const { email, sessionToken, name, regNo, collegeName, departmentName } = data;

    if (!email || !sessionToken || !name || !regNo || !collegeName || !departmentName) {
      console.error("[PasswordResetHandler] Missing required fields for student password reset");
      return false;
    }

    console.log(`[PasswordResetHandler] Processing student password reset for ${email} (${regNo})`);

    const resetUrl = "http://localhost:8000/auth/api/forgot-reset-password-student";
    const html = studentPasswordResetEmailTemplate(
      email,
      name,
      regNo,
      sessionToken,
      collegeName,
      departmentName,
      resetUrl
    );

    const result = await EmailService.sendEmail({
      to: email,
      subject: `Password Reset Request - ${collegeName} Student Portal`,
      html
    });

    if (result.success) {
      console.log(`[PasswordResetHandler] ✅ Student password reset email sent to ${email}`);
      return true;
    }

    console.error(`[PasswordResetHandler] ❌ Failed to send student password reset email to ${email}`);
    return false;
  }

  /**
   * Handle password reset email for teacher
   */
  public static async handleTeacherPasswordReset(data: TeacherForgotPasswordData): Promise<boolean> {
    const { email, sessionToken, name, employeeNo, collegeName, departmentName } = data;

    if (!email || !sessionToken || !name || !employeeNo || !collegeName || !departmentName) {
      console.error("[PasswordResetHandler] Missing required fields for teacher password reset");
      return false;
    }

    console.log(`[PasswordResetHandler] Processing teacher password reset for ${email} (${employeeNo})`);

    const resetUrl = "http://localhost:8000/auth/api/forgot-reset-password-teacher";
    const html = teacherPasswordResetEmailTemplate(
      email,
      name,
      employeeNo,
      sessionToken,
      collegeName,
      departmentName,
      resetUrl
    );

    const result = await EmailService.sendEmail({
      to: email,
      subject: `Password Reset Request - ${collegeName} Faculty Portal`,
      html
    });

    if (result.success) {
      console.log(`[PasswordResetHandler] ✅ Teacher password reset email sent to ${email}`);
      return true;
    }

    console.error(`[PasswordResetHandler] ❌ Failed to send teacher password reset email to ${email}`);
    return false;
  }

  /**
   * Handle password reset email for dean
   */
  public static async handleDeanPasswordReset(data: DeanForgotPasswordData): Promise<boolean> {
    const { email, sessionToken, collegeName } = data;

    if (!email || !sessionToken || !collegeName) {
      console.error("[PasswordResetHandler] Missing required fields for dean password reset");
      return false;
    }

    console.log(`[PasswordResetHandler] Processing dean password reset for ${email}`);

    const resetUrl = "http://localhost:8000/auth/api/forgot-reset-password-dean";
    const html = deanPasswordResetEmailTemplate(
      email,
      sessionToken,
      collegeName,
      resetUrl
    );

    const result = await EmailService.sendEmail({
      to: email,
      subject: `Password Reset Request - ${collegeName} Dean Portal`,
      html
    });

    if (result.success) {
      console.log(`[PasswordResetHandler] ✅ Dean password reset email sent to ${email}`);
      return true;
    }

    console.error(`[PasswordResetHandler] ❌ Failed to send dean password reset email to ${email}`);
    return false;
  }
}

