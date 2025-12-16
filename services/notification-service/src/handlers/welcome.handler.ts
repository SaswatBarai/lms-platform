import { EmailService } from "@services/email.service.js";
import { welcomeEmailTemplate, staffWelcomeEmailTemplate, teacherWelcomeEmailTemplate, studentWelcomeEmailTemplate, deanWelcomeEmailTemplate } from "../templates/index.js";
import { WelcomeEmailData, StaffWelcomeEmailData, TeacherWelcomeEmailData, HodWelcomeEmailData, StudentWelcomeEmailData, DeanWelcomeEmailData } from "../types/notification.types.js";
import { hodWelcomeEmailTemplate } from "templates/hod-welcome.template.js";

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
    const { email, name, tempPassword, loginUrl,collegeName } = data;

    if (!email || !name || !tempPassword) {
      console.error("[WelcomeEmailHandler] Missing required data for staff welcome");
      return false;
    }

    console.log(`[WelcomeEmailHandler] Processing staff welcome email for ${email}`);

    const html = staffWelcomeEmailTemplate(
      email,
      name,
      tempPassword,
      collegeName || "College",
      loginUrl || "http://localhost:8000/auth/api/login-staff"
    );

    const result = await EmailService.sendEmail({
      to: email,
      subject: `Welcome ${name}! Your Staff Account is Ready`,
      html,
      tempPassword // Pass password directly for console mode display
    });

    if (result.success) {
      console.log(`[WelcomeEmailHandler] ✅ Staff welcome email sent to ${email}`);
      return true;
    }

    console.error(`[WelcomeEmailHandler] ❌ Failed to send staff welcome email to ${email}`);
    return false;
  }

  public static async handleHodWelcome(data: HodWelcomeEmailData):Promise<boolean> {
    const { email, name, tempPassword, collegeName, loginUrl } = data;

    if (!email || !name || !tempPassword || !collegeName || !loginUrl) {
      console.error("[WelcomeEmailHandler] Missing required data for hod welcome");
      return false;
    }

    console.log(`[WelcomeEmailHandler] Processing hod welcome email for ${email}`);
    
    const html = hodWelcomeEmailTemplate(
      email,
      name,
      tempPassword,
      collegeName,
      loginUrl || "http://localhost:8000/auth/api/login-hod"
    );

    const result = await EmailService.sendEmail({
      to: email,
      subject: `Welcome ${name}! Your HOD Account is Ready`,
      html,
      tempPassword // Pass password directly for console mode display
    });

    if (result.success) {
      console.log(`[WelcomeEmailHandler] ✅ HOD welcome email sent to ${email}`);
      return true;
    }

    console.error(`[WelcomeEmailHandler] ❌ Failed to send hod welcome email to ${email}`);
    return false;
  }

  /**
   * Handle welcome email for teacher account
   */
  public static async handleTeacherWelcome(data: TeacherWelcomeEmailData): Promise<boolean> {
    const { email, name, tempPassword, employeeNo, collegeName, loginUrl } = data;

    if (!email || !name || !tempPassword || !employeeNo || !collegeName) {
      console.error("[WelcomeEmailHandler] Missing required data for teacher welcome");
      return false;
    }

    console.log(`[WelcomeEmailHandler] Processing teacher welcome email for ${email} (EmployeeNo: ${employeeNo})`);

    const html = teacherWelcomeEmailTemplate(
      email,
      name,
      tempPassword,
      employeeNo,
      collegeName,
      loginUrl || "http://localhost:8000/auth/api/login-teacher"
    );

    const result = await EmailService.sendEmail({
      to: email,
      subject: `Welcome ${name}! Your Teacher Account at ${collegeName} is Ready`,
      html,
      tempPassword // Pass password directly for console mode display
    });

    if (result.success) {
      console.log(`[WelcomeEmailHandler] ✅ Teacher welcome email sent to ${email} (EmployeeNo: ${employeeNo})`);
      return true;
    }

    console.error(`[WelcomeEmailHandler] ❌ Failed to send teacher welcome email to ${email}`);
    return false;
  }

  /**
   * Handle welcome email for student account
   */
  public static async handleStudentWelcome(data: StudentWelcomeEmailData): Promise<boolean> {
    const { email, name, regNo, tempPassword, collegeName, departmentName, loginUrl } = data;

    if (!email || !name || !regNo || !tempPassword || !collegeName || !departmentName) {
      console.error("[WelcomeEmailHandler] Missing required data for student welcome");
      return false;
    }

    console.log(`[WelcomeEmailHandler] Processing student welcome email for ${email} (RegNo: ${regNo})`);

    const html = studentWelcomeEmailTemplate(
      email,
      name,
      regNo,
      tempPassword,
      collegeName,
      departmentName,
      loginUrl || "http://localhost:8000/auth/api/login-student"
    );

    const result = await EmailService.sendEmail({
      to: email,
      subject: `Welcome ${name}! Your Student Account at ${collegeName} is Ready`,
      html,
      tempPassword // Pass password directly for console mode display
    });

    if (result.success) {
      console.log(`[WelcomeEmailHandler] ✅ Student welcome email sent to ${email} (RegNo: ${regNo})`);
      return true;
    }

    console.error(`[WelcomeEmailHandler] ❌ Failed to send student welcome email to ${email}`);
    return false;
  }

  /**
   * Handle welcome email for dean account
   */
  public static async handleDeanWelcome(data: DeanWelcomeEmailData): Promise<boolean> {
    const { email, name, tempPassword, collegeName, loginUrl } = data;

    if (!email || !name || !tempPassword || !collegeName) {
      console.error("[WelcomeEmailHandler] Missing required data for dean welcome");
      return false;
    }

    console.log(`[WelcomeEmailHandler] Processing dean welcome email for ${email}`);

    const html = deanWelcomeEmailTemplate(
      email,
      name,
      tempPassword,
      collegeName,
      loginUrl || "http://localhost:8000/auth/api/login-dean"
    );

    const result = await EmailService.sendEmail({
      to: email,
      subject: `Welcome ${name}! Your Dean Account at ${collegeName} is Ready`,
      html,
      tempPassword // Pass password directly for console mode display
    });

    if (result.success) {
      console.log(`[WelcomeEmailHandler] ✅ Dean welcome email sent to ${email}`);
      return true;
    }

    console.error(`[WelcomeEmailHandler] ❌ Failed to send dean welcome email to ${email}`);
    return false;
  }
}

