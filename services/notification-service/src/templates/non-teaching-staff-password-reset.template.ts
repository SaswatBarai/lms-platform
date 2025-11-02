export const nonTeachingStaffPasswordResetEmailTemplate = (
  email: string,
  collegeName: string,
  resetLink: string,
  name: string
): string => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Password Reset - ${collegeName} LMS</title>
  <style>
    :root {
      --background: #ffffff;
      --foreground: #0a0a0a;
      --card: #ffffff;
      --card-foreground: #0a0a0a;
      --popover: #ffffff;
      --popover-foreground: #0a0a0a;
      --primary: #171717;
      --primary-foreground: #fafafa;
      --secondary: #f5f5f5;
      --secondary-foreground: #171717;
      --muted: #f5f5f5;
      --muted-foreground: #737373;
      --accent: #f5f5f5;
      --accent-foreground: #171717;
      --destructive: #ef4444;
      --destructive-foreground: #fafafa;
      --border: #e5e5e5;
      --input: #e5e5e5;
      --ring: #171717;
      --radius: 0.5rem;
      --shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
      --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
      --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
    }

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
      background: var(--background);
      color: var(--foreground);
      line-height: 1.6;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }

    .email-wrapper {
      width: 100%;
      min-height: 100vh;
      padding: 20px;
      background: var(--background);
    }

    .email-container {
      max-width: 600px;
      margin: 0 auto;
      background: var(--card);
      border-radius: var(--radius);
      overflow: hidden;
      box-shadow: var(--shadow-lg);
      border: 1px solid var(--border);
    }

    /* Header */
    .email-header {
      background: var(--primary);
      padding: 40px 30px;
      text-align: center;
      position: relative;
      border-bottom: 1px solid var(--border);
    }

    .header-logo {
      display: inline-flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 16px;
    }

    .logo-icon {
      width: 48px;
      height: 48px;
      background: var(--primary-foreground);
      color: var(--primary);
      border-radius: var(--radius);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      font-weight: 600;
    }

    .logo-text {
      font-size: 24px;
      font-weight: 600;
      color: var(--primary-foreground);
      letter-spacing: -0.025em;
    }

    .header-title {
      font-size: 18px;
      font-weight: 500;
      color: var(--primary-foreground);
      margin-bottom: 8px;
    }

    .college-name {
      font-size: 16px;
      font-weight: 500;
      color: var(--primary-foreground);
      background: rgba(255, 255, 255, 0.1);
      padding: 8px 16px;
      border-radius: calc(var(--radius) * 2);
      display: inline-block;
      margin-top: 8px;
      border: 1px solid rgba(255, 255, 255, 0.2);
    }

    /* Main Content */
    .email-body {
      padding: 40px 30px;
    }

    .greeting-section {
      margin-bottom: 32px;
    }

    .greeting-title {
      font-size: 24px;
      font-weight: 600;
      color: var(--foreground);
      margin-bottom: 8px;
    }

    .staff-info {
      background: var(--muted);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 20px;
      margin: 24px 0;
      text-align: center;
    }

    .staff-icon {
      width: 48px;
      height: 48px;
      background: var(--primary);
      color: var(--primary-foreground);
      border-radius: var(--radius);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      margin: 0 auto 16px;
    }

    .staff-role {
      font-size: 16px;
      font-weight: 600;
      color: var(--foreground);
      margin-bottom: 4px;
    }

    .staff-email {
      font-size: 14px;
      color: var(--muted-foreground);
      font-family: ui-monospace, 'SFMono-Regular', 'Consolas', monospace;
      background: var(--background);
      padding: 4px 8px;
      border-radius: calc(var(--radius) / 2);
      border: 1px solid var(--border);
      display: inline-block;
    }

    .reset-section {
      text-align: center;
      margin: 32px 0;
    }

    .reset-title {
      font-size: 28px;
      font-weight: 600;
      color: var(--foreground);
      margin-bottom: 12px;
      line-height: 1.25;
    }

    .reset-message {
      font-size: 16px;
      color: var(--muted-foreground);
      line-height: 1.6;
      margin-bottom: 24px;
    }

    /* Reset Card */
    .reset-card {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 32px;
      margin: 32px 0;
      text-align: center;
      position: relative;
      overflow: hidden;
    }

    .reset-card::before {
      content: '';
      position: absolute;
      top: -50%;
      left: -50%;
      width: 200%;
      height: 200%;
      background: radial-gradient(circle, rgba(0, 0, 0, 0.02) 0%, transparent 70%);
      pointer-events: none;
    }

    .reset-icon {
      width: 64px;
      height: 64px;
      background: var(--primary);
      color: var(--primary-foreground);
      border-radius: var(--radius);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 32px;
      margin: 0 auto 20px;
      box-shadow: var(--shadow);
    }

    .reset-card-title {
      font-size: 20px;
      font-weight: 600;
      color: var(--foreground);
      margin-bottom: 12px;
      position: relative;
      z-index: 2;
    }

    .reset-card-text {
      font-size: 16px;
      color: var(--muted-foreground);
      line-height: 1.6;
      margin-bottom: 24px;
      position: relative;
      z-index: 2;
    }

    /* CTA Section */
    .cta-section {
      text-align: center;
      margin: 40px 0;
    }

    .cta-button {
      display: inline-flex;
      align-items: center;
      gap: 12px;
      background: var(--primary);
      color: var(--primary-foreground);
      text-decoration: none;
      padding: 16px 32px;
      border-radius: var(--radius);
      font-size: 16px;
      font-weight: 500;
      transition: all 0.2s ease;
      box-shadow: var(--shadow);
      border: none;
      cursor: pointer;
      position: relative;
      z-index: 2;
    }

    .cta-button:hover {
      background: var(--accent);
      color: var(--accent-foreground);
      box-shadow: var(--shadow-md);
    }

    .cta-button-icon {
      font-size: 20px;
    }

    /* Timer Section */
    .timer-section {
      background: var(--muted);
      border-radius: var(--radius);
      padding: 20px;
      margin: 32px 0;
      text-align: center;
      border: 1px solid var(--border);
    }

    .timer-header {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      margin-bottom: 12px;
    }

    .timer-icon {
      width: 32px;
      height: 32px;
      background: var(--primary);
      color: var(--primary-foreground);
      border-radius: var(--radius);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
    }

    .timer-title {
      font-size: 16px;
      font-weight: 600;
      color: var(--foreground);
    }

    .timer-text {
      font-size: 14px;
      color: var(--muted-foreground);
      line-height: 1.5;
    }

    /* Security Notice */
    .security-notice {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 20px;
      margin: 32px 0;
      text-align: center;
    }

    .security-title {
      font-size: 16px;
      font-weight: 600;
      color: var(--foreground);
      margin-bottom: 8px;
    }

    .security-text {
      font-size: 14px;
      color: var(--muted-foreground);
      line-height: 1.5;
    }

    /* Support Section */
    .support-section {
      background: var(--muted);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 24px;
      margin: 32px 0;
      text-align: center;
    }

    .support-icon {
      width: 40px;
      height: 40px;
      background: var(--primary);
      color: var(--primary-foreground);
      border-radius: var(--radius);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      margin: 0 auto 16px;
    }

    .support-title {
      font-size: 16px;
      font-weight: 600;
      color: var(--foreground);
      margin-bottom: 8px;
    }

    .support-text {
      font-size: 14px;
      color: var(--muted-foreground);
      line-height: 1.5;
      margin-bottom: 12px;
    }

    .support-contact {
      font-size: 14px;
      font-weight: 500;
      color: var(--foreground);
      text-decoration: none;
      background: var(--background);
      padding: 8px 16px;
      border-radius: var(--radius);
      border: 1px solid var(--border);
      display: inline-block;
      transition: all 0.2s ease;
    }

    .support-contact:hover {
      background: var(--accent);
      color: var(--accent-foreground);
    }

    /* Footer */
    .email-footer {
      background: var(--muted);
      border-top: 1px solid var(--border);
      padding: 32px 30px;
    }

    .footer-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 20px;
    }

    .footer-info {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .footer-logo {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 16px;
      font-weight: 600;
      color: var(--foreground);
    }

    .footer-logo-icon {
      width: 24px;
      height: 24px;
      background: var(--primary);
      color: var(--primary-foreground);
      border-radius: calc(var(--radius) / 2);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: 600;
    }

    .footer-copyright {
      font-size: 12px;
      color: var(--muted-foreground);
    }

    .footer-college {
      font-size: 12px;
      color: var(--muted-foreground);
      font-weight: 500;
    }

    .footer-links {
      display: flex;
      gap: 16px;
    }

    .footer-link {
      color: var(--muted-foreground);
      text-decoration: none;
      font-size: 12px;
      font-weight: 500;
      transition: color 0.2s ease;
    }

    .footer-link:hover {
      color: var(--foreground);
    }

    /* Responsive Design */
    @media (max-width: 640px) {
      .email-wrapper {
        padding: 10px;
      }

      .email-header,
      .email-body,
      .email-footer {
        padding-left: 20px;
        padding-right: 20px;
      }

      .reset-title {
        font-size: 24px;
      }

      .reset-card {
        padding: 24px;
      }

      .cta-button {
        padding: 16px 24px;
        font-size: 15px;
      }

      .footer-content {
        flex-direction: column;
        text-align: center;
        gap: 16px;
      }

      .footer-links {
        justify-content: center;
      }
    }

    /* Focus states and animations */
    @keyframes subtle-pulse {
      0%, 100% {
        transform: scale(1);
        box-shadow: var(--shadow);
      }
      50% {
        transform: scale(1.01);
        box-shadow: var(--shadow-md);
      }
    }

    .cta-button {
      animation: subtle-pulse 4s ease-in-out infinite;
    }
  </style>
</head>
<body>
  <div class="email-wrapper">
    <div class="email-container">
      <!-- Header -->
      <div class="email-header">
        <div class="header-logo">
          <div class="logo-icon">🔑</div>
          <div class="logo-text">${collegeName}</div>
        </div>
        <div class="header-title">Staff Password Reset Request</div>
        <div class="college-name">Learning Management System</div>
      </div>

      <!-- Main Body -->
      <div class="email-body">
        <div class="greeting-section">
          <h1 class="greeting-title">Hello, ${name}!</h1>
        </div>

        <!-- Staff Info -->
        <div class="staff-info">
          <div class="staff-icon">👩‍💼</div>
          <div class="staff-role">Non-Teaching Staff</div>
          <div class="staff-email">${email}</div>
        </div>

        <div class="reset-section">
          <h2 class="reset-title">Password Reset Required</h2>
          <p class="reset-message">
            We received a password reset request for your ${collegeName} LMS staff account. As a valued member of our non-teaching staff, we want to ensure you can access all the administrative tools and resources you need.
          </p>
        </div>

        <!-- Reset Card -->
        <div class="reset-card">
          <div class="reset-icon">🔒</div>
          <div class="reset-card-title">Secure Access Recovery</div>
          <p class="reset-card-text">
            Your account security is our priority. Click the button below to securely reset your password and regain access to staff resources, scheduling tools, and administrative features.
          </p>
        </div>

        <!-- CTA Button -->
        <div class="cta-section">
          <a href="${resetLink}" class="cta-button">
            <span class="cta-button-icon">🔐</span>
            Reset Staff Password
          </a>
        </div>

        <!-- Timer Section -->
        <div class="timer-section">
          <div class="timer-header">
            <div class="timer-icon">⏱️</div>
            <div class="timer-title">Link Expires in 10 Minutes</div>
          </div>
          <p class="timer-text">
            This password reset link will expire in 10 minutes for security reasons. Please use it promptly to reset your password and maintain access to your staff account.
          </p>
        </div>

        <!-- Support Section -->
        <div class="support-section">
          <div class="support-icon">🛟</div>
          <div class="support-title">Need Technical Assistance?</div>
          <p class="support-text">
            If you're having trouble with the password reset process or need help with your staff account, our IT support team is here to help.
          </p>
          <a href="mailto:it-support@${collegeName.toLowerCase().replace(/\s+/g, '')}.edu" class="support-contact">
            Contact IT Support
          </a>
        </div>

        <!-- Security Notice -->
        <div class="security-notice">
          <div class="security-title">Didn't Request This Reset?</div>
          <p class="security-text">
            If you didn't request a password reset, please contact your system administrator immediately. Your current password will remain unchanged and your account is secure.
          </p>
        </div>
      </div>

      <!-- Footer -->
      <div class="email-footer">
        <div class="footer-content">
          <div class="footer-info">
            <div class="footer-logo">
              <div class="footer-logo-icon">👥</div>
              ${collegeName} LMS
            </div>
            <div class="footer-copyright">© 2025 ${collegeName}. All rights reserved.</div>
            <div class="footer-college">Non-Teaching Staff Portal</div>
          </div>
          <div class="footer-links">
            <a href="#" class="footer-link">Staff Handbook</a>
            <a href="#" class="footer-link">IT Support</a>
            <a href="#" class="footer-link">Privacy Policy</a>
          </div>
        </div>
      </div>
    </div>
  </div>
</body>
</html>
`;