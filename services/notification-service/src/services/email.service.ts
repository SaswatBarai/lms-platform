import { transporter, getTransporterStatus } from "@config/mail.config.js";
import env from "@config/env.js";

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export class EmailService {
  private static readonly MAX_RETRIES = 2;
  private static readonly RETRY_DELAY_MS = 2000;

  /**
   * Send email with retry logic and console fallback for development
   */
  public static async sendEmail(
    options: EmailOptions,
    retries: number = this.MAX_RETRIES
  ): Promise<SendEmailResult> {
    const { to, subject, html } = options;

    // Console mode for development
    if (process.env.EMAIL_MODE === 'console') {
      this.logToConsole(to, subject, "Console mode enabled");
      return { success: true };
    }

    // Check if transporter is verified
    const isVerified = getTransporterStatus();
    if (!isVerified && env.NODE_ENV === 'development') {
      this.logToConsole(to, subject, "Gmail not connected, using console fallback");
      return { success: true };
    }

    // Attempt to send email with retries
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        if (attempt > 0) {
          console.log(`[EmailService] Retry attempt ${attempt}/${retries} for ${to}`);
          await this.delay(Math.pow(2, attempt) * this.RETRY_DELAY_MS);
        }

        console.log(`[EmailService] 📤 Sending email to ${to}: ${subject}`);
        
        const result = await transporter.sendMail({
          from: `LMS Platform <${env.MAIL_USER}>`,
          to,
          subject,
          html
        });

        if (result.rejected.length > 0) {
          console.error(`[EmailService] ❌ Email rejected for ${to}:`, result.rejected);
          
          if (attempt === retries) {
            this.logToConsole(to, subject, "Email rejected by server");
            return { success: false, error: "Email rejected by server" };
          }
          continue;
        }

        console.log(`[EmailService] ✅ Email sent successfully to ${to}`);
        console.log(`[EmailService] 📨 Message ID: ${result.messageId}`);
        return { success: true, messageId: result.messageId };

      } catch (error: any) {
        console.error(`[EmailService] ❌ Error sending email to ${to}:`, error.message);
        
        this.handleError(error);

        if (attempt === retries) {
          this.logToConsole(to, subject, error.message);
          return { success: false, error: error.message };
        }
      }
    }

    return { success: false, error: "Max retries exceeded" };
  }

  /**
   * Handle and log specific error types
   */
  private static handleError(error: any): void {
    if (error.code === 'ECONNECTION' || error.code === 'ETIMEDOUT' || error.code === 'ECONNRESET') {
      console.error(`[EmailService] 🌐 Network/Connection error detected`);
    } else if (error.message.includes('BadCredentials') || error.message.includes('Username and Password not accepted')) {
      console.error(`[EmailService] 🔒 Gmail authentication failed. Please check:`);
      console.error(`[EmailService]    - Gmail 2FA is enabled`);
      console.error(`[EmailService]    - App Password is correctly set`);
      console.error(`[EmailService]    - Credentials match Gmail account`);
    }
  }

  /**
   * Log email details to console for development/fallback
   */
  private static logToConsole(to: string, subject: string, reason: string): void {
    console.log(`
╔══════════════════════════════════════════════════════════════╗
║                    📧 EMAIL CONSOLE LOG                      ║
╠══════════════════════════════════════════════════════════════╣
║  To: ${to.padEnd(55)} ║
║  Subject: ${subject.substring(0, 50).padEnd(50)} ║
║  Time: ${new Date().toLocaleString().padEnd(53)} ║
║  Reason: ${reason.substring(0, 51).padEnd(51)} ║
╚══════════════════════════════════════════════════════════════╝
    `);
  }

  /**
   * Delay execution for retry logic
   */
  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

