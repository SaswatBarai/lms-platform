import { EmailService } from "@services/email.service.js";
import { welcomeEmailTemplate, staffWelcomeEmailTemplate } from "../templates/index.js";
import { WelcomeEmailData, StaffWelcomeEmailData } from "../types/notification.types.js";

export class WelcomeEmailHandler {
  /**
   * Handle welcome email for college account
   */
  public static async handleCollegeWelcome(data: WelcomeEmailData): Promise<boolean> {
    const { email, collegeName, loginUrl } = data;

    if (!email) {
      console.error("[WelcomeEmailHandler] Missing email for college welcome");
      return false;
    }

    console.log(`[WelcomeEmailHandler] Processing college welcome email for ${email}`);

    const html = welcomeEmailTemplate(
      collegeName || "College",
      loginUrl || "http://localhost:8000/auth/api/login-college"
    );

    const result = await EmailService.sendEmail({
      to: email,
      subject: `Welcome to ${collegeName || "LMS Platform"}! Your Account is Ready`,
      html
    });

    if (result.success) {
      console.log(`[WelcomeEmailHandler] ✅ College welcome email sent to ${email}`);
      return true;
    }

    console.error(`[WelcomeEmailHandler] ❌ Failed to send college welcome email to ${email}`);
    return false;
  }

  /**
   * Handle welcome email for staff account
   */
  public static async handleStaffWelcome(data: StaffWelcomeEmailData): Promise<boolean> {
    const { email, name, tempPassword, loginUrl } = data;

    if (!email || !name || !tempPassword) {
      console.error("[WelcomeEmailHandler] Missing required data for staff welcome");
      return false;
    }

    console.log(`[WelcomeEmailHandler] Processing staff welcome email for ${email}`);

    const html = staffWelcomeEmailTemplate(
      name,
      tempPassword,
      loginUrl || "http://localhost:8000/auth/api/login-staff"
    );

    const result = await EmailService.sendEmail({
      to: email,
      subject: `Welcome ${name}! Your Staff Account is Ready`,
      html
    });

    if (result.success) {
      console.log(`[WelcomeEmailHandler] ✅ Staff welcome email sent to ${email}`);
      return true;
    }

    console.error(`[WelcomeEmailHandler] ❌ Failed to send staff welcome email to ${email}`);
    return false;
  }
}

