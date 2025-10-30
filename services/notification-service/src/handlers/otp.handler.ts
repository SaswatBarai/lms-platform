import { EmailService } from "@services/email.service.js";
import { otpEmailTemplate } from "../templates/index.js";
import { OTPData } from "../types/notification.types.js";

export class OTPHandler {
  /**
   * Handle OTP email sending
   */
  public static async handleOTPEmail(data: OTPData): Promise<boolean> {
    const { email, otp } = data;

    if (!email || !otp) {
      console.error("[OTPHandler] Missing email or OTP");
      return false;
    }

    console.log(`[OTPHandler] Processing OTP request for ${email}`);

    const html = otpEmailTemplate(otp);
    const result = await EmailService.sendEmail({
      to: email,
      subject: "Your OTP for Creating Organization Account",
      html
    });

    if (result.success) {
      console.log(`[OTPHandler] ✅ OTP email sent successfully to ${email}`);
      return true;
    }

    console.error(`[OTPHandler] ❌ Failed to send OTP email to ${email}`);
    return false;
  }
}

