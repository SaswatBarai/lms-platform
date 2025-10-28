import {transporter, getTransporterStatus} from "@config/mail.config.js";
import env from "@config/env.js"


export class OrganizationAction {

    static async sendOrgCreateAccountOTP(email: string, otp: string, retries = 2) {
        // Check if we should use console mode
        if (process.env.EMAIL_MODE === 'console') {
            console.log(`
╔══════════════════════════════════════════════════════════════╗
║                    🚀 DEVELOPMENT OTP ALERT                  ║
╠══════════════════════════════════════════════════════════════╣
║  📧 Email: ${email.padEnd(48)} ║
║  🔐 OTP Code: ${otp.padEnd(44)} ║
║  ⏰ Time: ${new Date().toLocaleString().padEnd(45)} ║
║  💡 Mode: Console (Email disabled for development)          ║
╚══════════════════════════════════════════════════════════════╝
            `);
            return true;
        }

        // Fallback to console if transporter is not verified
        const isVerified = getTransporterStatus();
        if (!isVerified && env.NODE_ENV === 'development') {
            console.log(`
╔══════════════════════════════════════════════════════════════╗
║               🚀 DEVELOPMENT OTP (FALLBACK MODE)             ║
╠══════════════════════════════════════════════════════════════╣
║  📧 Email: ${email.padEnd(48)} ║
║  🔐 OTP Code: ${otp.padEnd(44)} ║
║  ⏰ Time: ${new Date().toLocaleString().padEnd(45)} ║
║  ⚠️  Gmail not connected, using console fallback            ║
╚══════════════════════════════════════════════════════════════╝
            `);
            return true;
        }

        for (let attempt = 0; attempt <= retries; attempt++) {
            try {
                if (attempt > 0) {
                    console.log(`[Notification] Retry attempt ${attempt}/${retries} for ${email}`);
                    // Wait before retrying (exponential backoff)
                    await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
                }

                console.log(`[Notification] 📤 Attempting to send OTP email to ${email}`);
                
                const result = await transporter.sendMail({
                    from: `LMS Platform <${env.MAIL_USER}>`, 
                    to: email,
                    subject: "Your OTP for Creating Organization Account",
                    html: htmlForOrg(otp)
                });
                
                if (result.rejected.length > 0) {
                    console.error(`[Notification] ❌ Email rejected by server for ${email}:`, result.rejected);
                    if (attempt === retries) {
                        // Last attempt failed, use console fallback
                        this.logOTPToConsole(email, otp, 'Email rejected by server');
                        return false;
                    }
                    continue; // Try again
                } else {
                    console.log(`[Notification] ✅ OTP email sent successfully to ${email}`);
                    console.log(`[Notification] 📨 Message ID: ${result.messageId}`);
                    return true;
                }
            } catch (error: any) {
                console.error(`[Notification] ❌ Error sending OTP email to ${email}:`, error.message);
                console.error(`[Notification] Error code:`, error.code);
                
                // Handle specific errors
                if (error.code === 'ECONNECTION' || error.code === 'ETIMEDOUT' || error.code === 'ECONNRESET') {
                    console.error(`[Notification] 🌐 Network/Connection error detected`);
                } else if (error.message.includes('BadCredentials') || error.message.includes('Username and Password not accepted')) {
                    console.error(`[Notification] 🔒 Gmail authentication failed. Please check:`);
                    console.error(`[Notification]    - Gmail 2FA is enabled`);
                    console.error(`[Notification]    - App Password is correctly set`);
                    console.error(`[Notification]    - Credentials match Gmail account`);
                }
                
                // If this is the last attempt, fallback to console
                if (attempt === retries) {
                    this.logOTPToConsole(email, otp, error.message);
                    return false;
                }
            }
        }
        
        return false;
    }

    private static logOTPToConsole(email: string, otp: string, reason: string) {
        console.log(`
╔══════════════════════════════════════════════════════════════╗
║                    🚀 FALLBACK OTP ALERT                     ║
╠══════════════════════════════════════════════════════════════╣
║  📧 Email: ${email.padEnd(48)} ║
║  🔐 OTP Code: ${otp.padEnd(44)} ║
║  ⏰ Time: ${new Date().toLocaleString().padEnd(45)} ║
║  ❌ Reason: ${reason.substring(0, 47).padEnd(47)} ║
╚══════════════════════════════════════════════════════════════╝
        `);
    }

    static async sendCollegeAccountCreatedEmail(collegeName: string, email: string, loginUrl: string, retries = 2) {
        // Check if we should use console mode
        if (process.env.EMAIL_MODE === 'console') {
            console.log(`
╔══════════════════════════════════════════════════════════════╗
║              📧 COLLEGE ACCOUNT CREATED (CONSOLE)            ║
╠══════════════════════════════════════════════════════════════╣
║  College: ${collegeName.substring(0, 47).padEnd(47)} ║
║  📧 Email: ${email.padEnd(48)} ║
║  🔗 Login URL: ${loginUrl.substring(0, 43).padEnd(43)} ║
║  💡 Mode: Console (Email disabled for development)          ║
╚══════════════════════════════════════════════════════════════╝
            `);
            return true;
        }

        // Fallback to console if transporter is not verified
        const isVerified = getTransporterStatus();
        if (!isVerified && env.NODE_ENV === 'development') {
            console.log(`[Notification] ⚠️  Gmail not connected, skipping welcome email for ${email}`);
            return true; // Don't fail the flow
        }

        for (let attempt = 0; attempt <= retries; attempt++) {
            try {
                if (attempt > 0) {
                    console.log(`[Notification] Retry attempt ${attempt}/${retries} for welcome email to ${email}`);
                    await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
                }

                console.log(`[Notification] 📤 Attempting to send welcome email to ${email}`);
                
                const result = await transporter.sendMail({
                    from: `LMS Platform <${env.MAIL_USER}>`, 
                    to: email,
                    subject: `Welcome to ${collegeName}! Your Account is Ready`,
                    html: htmlForCollegeAccountCreated(collegeName, loginUrl)
                });
                
                if (result.rejected.length > 0) {
                    console.error(`[Notification] ❌ Welcome email rejected for ${email}:`, result.rejected);
                    if (attempt === retries) {
                        return false;
                    }
                    continue;
                } else {
                    console.log(`[Notification] ✅ Welcome email sent successfully to ${email}`);
                    console.log(`[Notification] 📨 Message ID: ${result.messageId}`);
                    return true;
                }
            } catch (error: any) {
                console.error(`[Notification] ❌ Error sending welcome email to ${email}:`, error.message);
                
                if (attempt === retries) {
                    console.error(`[Notification] ⚠️  Failed to send welcome email after ${retries + 1} attempts`);
                    return false;
                }
            }
        }
        
        return false;
    }
}























const htmlForOrg = (otp:string) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>OTP Verification</title>
  <style>
    /* Shadcn UI Inspired Theme */
    :root {
      --background: #f4f4f5; /* zinc-100 */
      --foreground: #09090b; /* zinc-950 */
      --card: #ffffff;
      --card-foreground: #09090b;
      --muted: #f4f4f5; /* zinc-100 */
      --muted-foreground: #71717a; /* zinc-500 */
      --border: #e4e4e7; /* zinc-200 */
      --radius: 0.5rem; /* 8px */
    }

    /* Reset */
    body, html {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      background-color: var(--background);
      color: var(--foreground);
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }

    .container {
      width: 100%;
      padding: 24px;
      box-sizing: border-box;
    }

    .card {
      background: var(--card);
      border-radius: var(--radius);
      max-width: 465px;
      margin: 0 auto;
      padding: 32px;
      border: 1px solid var(--border);
      box-shadow: 0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.05);
      text-align: center;
    }

    .heading {
        font-size: 24px;
        font-weight: 600;
        color: var(--card-foreground);
        margin: 0 0 12px;
    }

    p {
      font-size: 14px;
      color: var(--muted-foreground);
      line-height: 1.5;
      margin: 0 0 24px;
    }

    .otp-display {
      font-size: 36px;
      font-weight: 700;
      color: var(--foreground);
      letter-spacing: 4px;
      padding: 16px 0;
      border-radius: var(--radius);
      background-color: var(--muted);
      margin: 24px 0;
      font-family: monospace;
    }

    .footer {
      font-size: 12px;
      color: var(--muted-foreground);
      margin-top: 32px;
      border-top: 1px solid var(--border);
      padding-top: 24px;
    }

    @media (max-width: 500px) {
      .container {
        padding: 16px;
      }
      .card {
        padding: 24px;
      }
      .heading {
        font-size: 20px;
      }
      .otp-display {
        font-size: 30px;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <h1 class="heading">Confirm Your Identity</h1>
      <p>Enter the code below to complete your verification. This code will expire in 10 minutes.</p>
      
      <div class="otp-display">${otp}</div>
      
      <p style="margin: 0;">If you didn't request this code, you can safely ignore this email.</p>

      <div class="footer">
        © 2025 Your Company. All rights reserved.
      </div>
    </div>
  </div>
</body>
</html>
`
const htmlForCollegeAccountCreated = (collegeName: string, loginUrl: string) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Account Created Successfully</title>
  <style>
    :root {
      --background: #f4f4f5;
      --foreground: #09090b;
      --card: #ffffff;
      --card-foreground: #09090b;
      --muted: #f4f4f5;
      --muted-foreground: #71717a;
      --border: #e4e4e7;
      --radius: 0.5rem;
    }

    body, html {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      background-color: var(--background);
      color: var(--foreground);
    }

    .container {
      width: 100%;
      padding: 24px;
      box-sizing: border-box;
    }

    .card {
      background: var(--card);
      border-radius: var(--radius);
      max-width: 465px;
      margin: 0 auto;
      padding: 32px;
      border: 1px solid var(--border);
      box-shadow: 0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.05);
      text-align: center;
    }

    .heading {
      font-size: 24px;
      font-weight: 600;
      margin-bottom: 12px;
    }

    p {
      font-size: 14px;
      color: var(--muted-foreground);
      line-height: 1.5;
      margin-bottom: 20px;
    }

    .button {
      display: inline-block;
      padding: 12px 24px;
      background-color: #09090b;
      color: #ffffff;
      font-size: 14px;
      border-radius: var(--radius);
      text-decoration: none;
      font-weight: 600;
      margin-top: 16px;
    }

    .footer {
      font-size: 12px;
      color: var(--muted-foreground);
      margin-top: 32px;
      border-top: 1px solid var(--border);
      padding-top: 24px;
    }

    @media (max-width: 500px) {
      .container {
        padding: 16px;
      }
      .card {
        padding: 24px;
      }
      .heading {
        font-size: 20px;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <h1 class="heading">Welcome to ${collegeName}! 🎓</h1>
      <p>Your college account has been successfully created. You can now log in and access your dashboard.</p>

      <a href="${loginUrl}" class="button">Go to Dashboard</a>

      <p style="margin-top: 20px;">If you did not request this account, please contact the administration immediately.</p>

      <div class="footer">
        © 2025 ${collegeName}. All rights reserved.
      </div>
    </div>
  </div>
</body>
</html>
`



