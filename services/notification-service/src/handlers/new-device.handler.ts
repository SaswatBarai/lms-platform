import { EmailService } from "@services/email.service.js";
import { newDeviceLoginTemplate } from "../templates/new-device-login.template.js";
import { NewDeviceLoginData } from "../types/notification.types.js";

export class NewDeviceHandler {
  /**
   * Handle new device login email notification
   */
  public static async handleNewDeviceLogin(data: NewDeviceLoginData): Promise<boolean> {
    const {
      email,
      name,
      userType,
      deviceType,
      browser,
      os,
      ipAddress,
      location,
      loginTime,
      loginUrl,
      collegeName,
      departmentName,
      regNo,
      employeeNo
    } = data;

    if (!email || !name || !userType) {
      console.error("[NewDeviceHandler] Missing required fields (email, name, userType)");
      return false;
    }

    console.log(`[NewDeviceHandler] Processing new device login notification for ${userType}: ${email}`);

    const html = newDeviceLoginTemplate({
      name,
      userType,
      deviceType,
      browser,
      os,
      ipAddress,
      location,
      loginTime,
      loginUrl,
      collegeName,
      departmentName,
      regNo,
      employeeNo
    });

    const userTypeDisplay = userType.charAt(0).toUpperCase() + userType.slice(1);
    const result = await EmailService.sendEmail({
      to: email,
      subject: `🔒 New Device Login Alert - ${userTypeDisplay} Account`,
      html
    });

    if (result.success) {
      console.log(`[NewDeviceHandler] ✅ New device login email sent successfully to ${email}`);
      return true;
    }

    console.error(`[NewDeviceHandler] ❌ Failed to send new device login email to ${email}`);
    return false;
  }
}

