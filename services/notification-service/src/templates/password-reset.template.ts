export const passwordResetEmailTemplate = (resetLink: string): string => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password - LMS Platform</title>
  <style>
    :root {
      --primary: #1e40af;
      --primary-dark: #1e3a8a;
      --primary-light: #3b82f6;
      --secondary: #06b6d4;
      --accent: #f59e0b;
      --background: #f8fafc;
      --surface: #ffffff;
      --surface-secondary: #f1f5f9;
      --text-primary: #1e293b;
      --text-secondary: #64748b;
      --text-muted: #94a3b8;
      --border: #e2e8f0;
      --border-focus: #3b82f6;
      --success: #10b981;
      --warning: #f59e0b;
      --error: #ef4444;
      --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
      --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
      --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
      --gradient-primary: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
      --gradient-secondary: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%);
      --gradient-reset: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
    }

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: var(--background);
      color: var(--text-primary);
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
      background: var(--surface);
      border-radius: 16px;
      overflow: hidden;
      box-shadow: var(--shadow-lg);
    }

    /* Header */
    .email-header {
      background: var(--gradient-reset);
      padding: 40px 30px;
      text-align: center;
      position: relative;
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
      background: rgba(255, 255, 255, 0.2);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      font-weight: bold;
      color: white;
    }

    .logo-text {
      font-size: 24px;
      font-weight: 700;
      color: white;
      letter-spacing: -0.5px;
    }

    .header-title {
      font-size: 18px;
      font-weight: 500;
      color: rgba(255, 255, 255, 0.9);
      margin-bottom: 8px;
    }

    /* Main Content */
    .email-body {
      padding: 40px 30px;
    }

    .reset-section {
      text-align: center;
      margin-bottom: 32px;
    }

    .reset-title {
      font-size: 28px;
      font-weight: 700;
      color: var(--text-primary);
      margin-bottom: 12px;
      line-height: 1.2;
    }

    .reset-subtitle {
      font-size: 16px;
      color: var(--text-secondary);
      margin-bottom: 8px;
    }

    .reset-message {
      font-size: 16px;
      color: var(--text-secondary);
      line-height: 1.6;
      margin-bottom: 24px;
    }

    /* Reset Card */
    .reset-card {
      background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
      border: 2px solid #fca5a5;
      border-radius: 16px;
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
      background: radial-gradient(circle, rgba(220, 38, 38, 0.05) 0%, transparent 70%);
      pointer-events: none;
    }

    .reset-icon {
      width: 64px;
      height: 64px;
      background: var(--error);
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 32px;
      margin: 0 auto 20px;
      color: white;
      box-shadow: var(--shadow-md);
    }

    .reset-card-title {
      font-size: 20px;
      font-weight: 700;
      color: #991b1b;
      margin-bottom: 12px;
      position: relative;
      z-index: 2;
    }

    .reset-card-text {
      font-size: 16px;
      color: #991b1b;
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
      background: var(--gradient-reset);
      color: white;
      text-decoration: none;
      padding: 18px 36px;
      border-radius: 12px;
      font-size: 16px;
      font-weight: 600;
      transition: all 0.2s ease;
      box-shadow: var(--shadow-md);
      border: none;
      cursor: pointer;
      position: relative;
      z-index: 2;
    }

    .cta-button:hover {
      transform: translateY(-2px);
      box-shadow: var(--shadow-lg);
    }

    .cta-button-icon {
      font-size: 20px;
    }

    /* Timer Section */
    .timer-section {
      background: var(--surface-secondary);
      border-radius: 12px;
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
      background: var(--gradient-secondary);
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 16px;
    }

    .timer-title {
      font-size: 16px;
      font-weight: 600;
      color: var(--text-primary);
    }

    .timer-text {
      font-size: 14px;
      color: var(--text-secondary);
      line-height: 1.5;
    }

    /* Security Notice */
    .security-notice {
      background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
      border: 1px solid #10b981;
      border-radius: 12px;
      padding: 20px;
      margin: 32px 0;
      text-align: center;
    }

    .security-title {
      font-size: 16px;
      font-weight: 600;
      color: #065f46;
      margin-bottom: 8px;
    }

    .security-text {
      font-size: 14px;
      color: #065f46;
      line-height: 1.5;
    }

    /* Footer */
    .email-footer {
      background: var(--surface-secondary);
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
      color: var(--text-primary);
    }

    .footer-logo-icon {
      width: 24px;
      height: 24px;
      background: var(--gradient-primary);
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 12px;
      font-weight: bold;
    }

    .footer-copyright {
      font-size: 12px;
      color: var(--text-muted);
    }

    .footer-links {
      display: flex;
      gap: 16px;
    }

    .footer-link {
      color: var(--text-secondary);
      text-decoration: none;
      font-size: 12px;
      font-weight: 500;
      transition: color 0.2s ease;
    }

    .footer-link:hover {
      color: var(--primary);
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

    /* Pulse animation for reset button */
    @keyframes pulse-red {
      0%, 100% {
        transform: scale(1);
        box-shadow: 0 0 0 0 rgba(220, 38, 38, 0.4);
      }
      50% {
        transform: scale(1.02);
        box-shadow: 0 0 0 8px rgba(220, 38, 38, 0.1);
      }
    }

    .cta-button {
      animation: pulse-red 3s infinite;
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
          <div class="logo-text">LMS Platform</div>
        </div>
        <div class="header-title">Password Reset Request</div>
      </div>

      <!-- Main Body -->
      <div class="email-body">
        <div class="reset-section">
          <h1 class="reset-title">Reset Your Password</h1>
          <p class="reset-subtitle">Secure Account Recovery</p>
          <p class="reset-message">
            We received a request to reset your password for your LMS Platform account. Click the button below to securely create a new password.
          </p>
        </div>

        <!-- Reset Card -->
        <div class="reset-card">
          <div class="reset-icon">🔒</div>
          <div class="reset-card-title">Password Reset Required</div>
          <p class="reset-card-text">
            Your account security is important to us. Use the secure link below to reset your password and regain access to your account.
          </p>
        </div>

        <!-- CTA Button -->
        <div class="cta-section">
          <a href="${resetLink}" class="cta-button">
            <span class="cta-button-icon">🔐</span>
            Reset My Password
          </a>
        </div>

        <!-- Timer Section -->
        <div class="timer-section">
          <div class="timer-header">
            <div class="timer-icon">⏱️</div>
            <div class="timer-title">Link Expires Soon</div>
          </div>
          <p class="timer-text">
            This password reset link will expire in 10 minutes for security reasons. Please use it promptly to reset your password.
          </p>
        </div>

        <!-- Security Notice -->
        <div class="security-notice">
          <div class="security-title">Didn't Request This Reset?</div>
          <p class="security-text">
            If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged and your account is secure.
          </p>
        </div>
      </div>

      <!-- Footer -->
      <div class="email-footer">
        <div class="footer-content">
          <div class="footer-info">
            <div class="footer-logo">
              <div class="footer-logo-icon">🎓</div>
              LMS Platform
            </div>
            <div class="footer-copyright">© 2025 LMS Platform. All rights reserved.</div>
          </div>
          <div class="footer-links">
            <a href="#" class="footer-link">Privacy Policy</a>
            <a href="#" class="footer-link">Terms of Service</a>
            <a href="#" class="footer-link">Support</a>
          </div>
        </div>
      </div>
    </div>
  </div>
</body>
</html>
`;

