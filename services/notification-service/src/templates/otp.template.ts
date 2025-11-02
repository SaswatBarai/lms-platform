export const otpEmailTemplate = (otp: string): string => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>OTP Verification - LMS Platform</title>
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

    /* Main Content */
    .email-body {
      padding: 40px 30px;
    }

    .verification-section {
      text-align: center;
      margin-bottom: 32px;
    }

    .verification-title {
      font-size: 28px;
      font-weight: 600;
      color: var(--foreground);
      margin-bottom: 12px;
      line-height: 1.25;
    }

    .verification-subtitle {
      font-size: 16px;
      color: var(--muted-foreground);
      margin-bottom: 8px;
    }

    .verification-message {
      font-size: 16px;
      color: var(--muted-foreground);
      line-height: 1.6;
      margin-bottom: 24px;
    }

    /* OTP Display - Hero Section */
    .otp-hero {
      background: var(--muted);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 40px 30px;
      margin: 40px 0;
      text-align: center;
      position: relative;
      overflow: hidden;
    }

    .otp-hero::before {
      content: '';
      position: absolute;
      top: -50%;
      left: -50%;
      width: 200%;
      height: 200%;
      background: radial-gradient(circle, rgba(0, 0, 0, 0.02) 0%, transparent 70%);
      pointer-events: none;
    }

    .otp-label {
      font-size: 14px;
      font-weight: 600;
      color: var(--muted-foreground);
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 16px;
      display: block;
    }

    .otp-display {
      font-size: 48px;
      font-weight: 600;
      letter-spacing: 8px;
      color: var(--foreground);
      font-family: ui-monospace, 'SFMono-Regular', 'Consolas', monospace;
      background: var(--background);
      padding: 24px 32px;
      border-radius: var(--radius);
      border: 3px solid var(--border);
      margin: 20px 0;
      display: inline-block;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      position: relative;
      z-index: 2;
      min-width: 280px;
      word-break: break-all;
    }

    .otp-meta {
      display: flex;
      justify-content: center;
      gap: 20px;
      margin-top: 20px;
      flex-wrap: wrap;
    }

    .otp-meta-item {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      color: var(--muted-foreground);
    }

    .otp-meta-icon {
      width: 20px;
      height: 20px;
      background: var(--primary);
      color: var(--primary-foreground);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      flex-shrink: 0;
    }

    /* Security Info */
    .security-info {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 24px;
      margin: 32px 0;
      position: relative;
    }

    .security-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 12px;
    }

    .security-icon {
      width: 32px;
      height: 32px;
      background: var(--primary);
      color: var(--primary-foreground);
      border-radius: var(--radius);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
      flex-shrink: 0;
    }

    .security-title {
      font-size: 16px;
      font-weight: 600;
      color: var(--foreground);
    }

    .security-text {
      font-size: 14px;
      color: var(--muted-foreground);
      line-height: 1.5;
      margin: 0;
    }

    /* Instructions */
    .instructions {
      background: var(--muted);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 24px;
      margin: 32px 0;
      text-align: center;
    }

    .instructions-title {
      font-size: 16px;
      font-weight: 600;
      color: var(--foreground);
      margin-bottom: 8px;
    }

    .instructions-text {
      font-size: 14px;
      color: var(--muted-foreground);
      line-height: 1.5;
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

      .verification-title {
        font-size: 24px;
      }

      .otp-display {
        font-size: 36px;
        letter-spacing: 4px;
        padding: 20px 24px;
        min-width: 240px;
      }

      .otp-meta {
        gap: 12px;
      }

      .otp-meta-item {
        font-size: 12px;
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

    /* Pulse animation for OTP */
    @keyframes pulse {
      0%, 100% {
        transform: scale(1);
        box-shadow: 0 0 0 0 rgba(30, 64, 175, 0.4);
      }
      50% {
        transform: scale(1.02);
        box-shadow: 0 0 0 8px rgba(30, 64, 175, 0.1);
      }
    }

    .otp-display {
      animation: pulse 2s infinite;
    }
  </style>
</head>
<body>
  <div class="email-wrapper">
    <div class="email-container">
      <!-- Header -->
      <div class="email-header">
        <div class="header-logo">
          <div class="logo-icon">🔐</div>
          <div class="logo-text">LMS Platform</div>
        </div>
        <div class="header-title">Secure Verification</div>
      </div>

      <!-- Main Body -->
      <div class="email-body">
        <div class="verification-section">
          <h1 class="verification-title">Verify Your Identity</h1>
          <p class="verification-subtitle">One-Time Password Required</p>
          <p class="verification-message">
            To complete your verification and secure access to your account, please use the code below. This ensures the safety of your personal information.
          </p>
        </div>

        <!-- OTP Hero Section -->
        <div class="otp-hero">
          <span class="otp-label">Your Verification Code</span>
          <div class="otp-display">${otp}</div>
          <div class="otp-meta">
            <div class="otp-meta-item">
              <div class="otp-meta-icon">⏱️</div>
              <span>Expires in 10 minutes</span>
            </div>
            <div class="otp-meta-item">
              <div class="otp-meta-icon">🔒</div>
              <span>One-time use only</span>
            </div>
          </div>
        </div>

        <!-- Instructions -->
        <div class="instructions">
          <div class="instructions-title">How to Verify</div>
          <p class="instructions-text">
            Enter this code in the verification screen to complete your authentication. The code will expire automatically after 10 minutes for security.
          </p>
        </div>

        <!-- Security Info -->
        <div class="security-info">
          <div class="security-header">
            <div class="security-icon">🛡️</div>
            <div class="security-title">Security Notice</div>
          </div>
          <p class="security-text">
            This verification code was requested for your LMS Platform account. If you didn't initiate this verification, please contact our support team immediately and change your account password.
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

