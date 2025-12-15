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
   * Get current email mode
   */
  private static getEmailMode(): 'email' | 'console' {
    return env.EMAIL_MODE || 'email';
  }

  /**
   * Send email with retry logic and console fallback for development
   */
  public static async sendEmail(
    options: EmailOptions,
    retries: number = this.MAX_RETRIES
  ): Promise<SendEmailResult> {
    const { to, subject, html } = options;
    const emailMode = this.getEmailMode();

    // Console mode - log to console instead of sending emails
    if (emailMode === 'console') {
      this.logToConsole(to, subject, html, "Console mode enabled");
      return { success: true };
    }

    // Email mode - send actual emails
    // Check if transporter is available and verified
    if (!transporter) {
      console.warn(`[EmailService] ⚠️  Transporter not initialized. Falling back to console mode.`);
      this.logToConsole(to, subject, html, "Transporter not initialized, using console fallback");
      return { success: true };
    }

    const isVerified = getTransporterStatus();
    if (!isVerified) {
      console.warn(`[EmailService] ⚠️  Transporter not verified. Falling back to console mode.`);
      this.logToConsole(to, subject, html, "Transporter not verified, using console fallback");
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
          from: `LMS Platform <${env.MAIL_USER || 'noreply@lms-platform.com'}>`,
          to,
          subject,
          html
        });

        if (result.rejected.length > 0) {
          console.error(`[EmailService] ❌ Email rejected for ${to}:`, result.rejected);
          
          if (attempt === retries) {
            this.logToConsole(to, subject, html, "Email rejected by server");
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
          this.logToConsole(to, subject, html, error.message);
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
  private static logToConsole(to: string, subject: string, html: string, reason: string): void {
    const timestamp = new Date().toLocaleString();
    const maxWidth = 80;
    
    // Extract text preview from HTML (remove tags, limit length)
    const textPreview = html
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 200);
    
    console.log(`
╔══════════════════════════════════════════════════════════════════════════════╗
║                        📧 EMAIL CONSOLE MODE                                 ║
╠══════════════════════════════════════════════════════════════════════════════╣
║  To:       ${to.padEnd(68)} ║
║  Subject:  ${subject.substring(0, 65).padEnd(65)} ║
║  Time:     ${timestamp.padEnd(68)} ║
║  Mode:     ${this.getEmailMode().toUpperCase().padEnd(68)} ║
║  Reason:   ${reason.substring(0, 65).padEnd(65)} ║
╠══════════════════════════════════════════════════════════════════════════════╣
║  HTML Preview:                                                               ║
╠══════════════════════════════════════════════════════════════════════════════╣
${this.formatHTMLPreview(textPreview, maxWidth)}
╠══════════════════════════════════════════════════════════════════════════════╣
║  Full HTML Content:                                                          ║
╠══════════════════════════════════════════════════════════════════════════════╣
${html.split('\n').map(line => `║  ${line.substring(0, 72).padEnd(72)} ║`).join('\n')}
╚══════════════════════════════════════════════════════════════════════════════╝
    `);
  }

  /**
   * Format HTML preview text for console display
   */
  private static formatHTMLPreview(text: string, maxWidth: number): string {
    const lines: string[] = [];
    let currentLine = '';
    
    const words = text.split(' ');
    for (const word of words) {
      if ((currentLine + word).length <= maxWidth - 4) {
        currentLine += (currentLine ? ' ' : '') + word;
      } else {
        if (currentLine) {
          lines.push(`║  ${currentLine.padEnd(maxWidth - 4)} ║`);
        }
        currentLine = word;
      }
    }
    
    if (currentLine) {
      lines.push(`║  ${currentLine.padEnd(maxWidth - 4)} ║`);
    }
    
    return lines.length > 0 ? lines.join('\n') : `║  ${' '.padEnd(maxWidth - 4)} ║`;
  }

  /**
   * Delay execution for retry logic
   */
  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

