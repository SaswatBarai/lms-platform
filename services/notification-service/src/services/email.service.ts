import { transporter, getTransporterStatus } from "@config/mail.config.js";
import env from "@config/env.js";

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  tempPassword?: string; // For console mode display (welcome emails)
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
    const { to, subject, html, tempPassword } = options;
    const emailMode = this.getEmailMode();

    // Console mode - log to console instead of sending emails
    if (emailMode === 'console') {
      this.logToConsole(to, subject, html, "Console mode enabled", tempPassword);
      return { success: true };
    }

    // Email mode - send actual emails
    // Check if transporter is available and verified
    if (!transporter) {
      console.warn(`[EmailService] ⚠️  Transporter not initialized. Falling back to console mode.`);
      this.logToConsole(to, subject, html, "Transporter not initialized, using console fallback", tempPassword);
      return { success: true };
    }

    const isVerified = getTransporterStatus();
    if (!isVerified) {
      console.warn(`[EmailService] ⚠️  Transporter not verified. Falling back to console mode.`);
      this.logToConsole(to, subject, html, "Transporter not verified, using console fallback", tempPassword);
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
            this.logToConsole(to, subject, html, "Email rejected by server", tempPassword);
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
          this.logToConsole(to, subject, html, error.message, tempPassword);
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
   * Extract OTP from HTML content (for console mode testing only)
   */
  private static extractOTP(html: string): string | null {
    // Look for OTP in common patterns used in email templates
    const patterns = [
      /<div[^>]*class[^>]*otp[^>]*>(\d{4,8})<\/div>/i,
      /<div[^>]*class[^>]*otp-display[^>]*>(\d{4,8})<\/div>/i,
      /otp[^>]*>(\d{4,8})</i,
      /(?:OTP|Code|Verification Code)[\s:]*(\d{4,8})/i,
      /<strong[^>]*>(\d{4,8})<\/strong>/i,
      /<span[^>]*>(\d{4,8})<\/span>/i
    ];
    
    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }
    
    return null;
  }

  /**
   * Extract reset token from HTML content (for console mode testing only)
   */
  private static extractResetToken(html: string): string | null {
    // Look for token in URL query parameters
    const patterns = [
      /[?&]token=([a-f0-9]+)/i,                    // ?token=xxx or &token=xxx
      /token=([a-f0-9]{16,})/i,                    // token=xxx (16+ hex chars)
      /class="token-value"[^>]*>([a-f0-9]+)</i,    // <div class="token-value">xxx</div>
      /<code[^>]*>([a-f0-9]{32,})<\/code>/i,       // <code>xxx</code>
      /<strong[^>]*>([a-f0-9]{32,})<\/strong>/i    // <strong>xxx</strong>
    ];
    
    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }
    
    return null;
  }

  /**
   * Extract reset link from HTML content (for console mode testing only)
   */
  private static extractResetLink(html: string): string | null {
    // Look for href containing reset/password URLs with token parameter
    const patterns = [
      /href="(https?:\/\/[^"]*\?token=[^"]*)"/i,           // href="http...?token=..."
      /href="(https?:\/\/[^"]*reset-password[^"]*)"/i,     // href="http...reset-password..."
      /href="(https?:\/\/[^"]*forgot[^"]*)"/i,             // href="http...forgot..."
      /href='(https?:\/\/[^']*\?token=[^']*)'/i,           // href='http...?token=...'
      /(https?:\/\/localhost[^\s<>"']*token=[^\s<>"']*)/i  // Plain URL with token
    ];
    
    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }
    
    return null;
  }


  /**
   * Mask sensitive information in text (tokens, passwords - but NOT OTPs in console mode)
   */
  private static maskSensitive(text: string): string {
    // Only mask tokens and passwords, not OTPs (OTPs will be shown separately in console mode)
    return text
      .replace(/token[=:]\s*[\w-]+/gi, 'token=****')  // Mask tokens
      .replace(/password[=:]\s*[\w!@#$%^&*]+/gi, 'password=****');  // Mask passwords
  }

  /**
   * Log email details to console for development/fallback
   * OTPs, reset tokens, and temporary passwords are shown ONLY in console mode for testing purposes
   */
  private static logToConsole(to: string, subject: string, html: string, reason: string, tempPassword?: string): void {
    const timestamp = new Date().toLocaleString();
    const sanitizedSubject = this.maskSensitive(subject);
    const otp = this.extractOTP(html);
    const resetToken = this.extractResetToken(html);
    const resetLink = this.extractResetLink(html);
    const isOTPEmail = subject.toLowerCase().includes('otp') || subject.toLowerCase().includes('verification');
    const isPasswordResetEmail = subject.toLowerCase().includes('password') && subject.toLowerCase().includes('reset');
    const isWelcomeEmail = subject.toLowerCase().includes('welcome') || subject.toLowerCase().includes('account is ready');
    
    let output = `
╔══════════════════════════════════════════════════════════════════════════════╗
║                        📧 EMAIL CONSOLE MODE                                 ║
╠══════════════════════════════════════════════════════════════════════════════╣
║  To:       ${to.padEnd(68)} ║
║  Subject:  ${sanitizedSubject.substring(0, 65).padEnd(65)} ║
║  Time:     ${timestamp.padEnd(68)} ║
║  Mode:     ${this.getEmailMode().toUpperCase().padEnd(68)} ║`;
    
    // Show OTP only in console mode for testing (development only)
    if (otp && isOTPEmail && this.getEmailMode() === 'console') {
      output += `
╠══════════════════════════════════════════════════════════════════════════════╣
║  🔐 OTP (Development Only): ${otp.padEnd(52)} ║
║  ⚠️  This OTP is only visible in console mode for testing                    ║`;
    }
    
    // Show temporary password only in console mode for testing (development only)
    // Use the password passed directly from handler, not extracted from HTML
    if (tempPassword && isWelcomeEmail && this.getEmailMode() === 'console') {
      output += `
╠══════════════════════════════════════════════════════════════════════════════╣
║  🔑 Temporary Password (Development Only): ${tempPassword.padEnd(40)} ║
║  ⚠️  This password is only visible in console mode for testing                ║`;
    }
    
    // Show reset token only in console mode for testing (development only)
    if (resetToken && isPasswordResetEmail && this.getEmailMode() === 'console') {
      output += `
╠══════════════════════════════════════════════════════════════════════════════╣
║  🔑 Reset Token (Development Only):                                          ║
║  ${resetToken.substring(0, 76).padEnd(76)} ║
║  ⚠️  This token is only visible in console mode for testing                  ║`;
    }
    
    // Show reset link only in console mode for testing (development only)
    if (resetLink && isPasswordResetEmail && this.getEmailMode() === 'console') {
      output += `
╠══════════════════════════════════════════════════════════════════════════════╣
║  🔗 Reset Link (Development Only):                                           ║
║  ${resetLink.substring(0, 76).padEnd(76)} ║`;
    }
    
    output += `
╚══════════════════════════════════════════════════════════════════════════════╝
    `;
    
    console.log(output);
  }

  /**
   * Delay execution for retry logic
   */
  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

