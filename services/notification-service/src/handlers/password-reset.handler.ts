import { EmailService } from "@services/email.service.js";
import { passwordResetEmailTemplate } from "../templates/index.js";
import { ForgotPasswordData } from "../types/notification.types.js";

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
}

