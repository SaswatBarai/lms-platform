import { EmailService } from "@services/email.service.js";
import { nonTeachingStaffPasswordResetEmailTemplate, passwordResetEmailTemplate, hodPasswordResetEmailTemplate } from "../templates/index.js";
import { ForgotPasswordData } from "../types/notification.types.js";

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

  
}

