export const studentPasswordResetEmailTemplate = (
  email: string,
  name: string,
  regNo: string,
  sessionToken: string,
  collegeName: string,
  departmentName: string,
  resetUrl: string
): string => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Password Reset - ${collegeName}</title>
  <style>
    :root {
      --background: #ffffff;
      --foreground: #0a0a0a;
      --card: #ffffff;
      --primary: #dc2626;
      --primary-foreground: #ffffff;
      --secondary: #fef2f2;
      --muted: #f5f5f5;
      --muted-foreground: #737373;
      --border: #e5e5e5;
      --radius: 0.5rem;
      --shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
      --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
    }

    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
      background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
      color: var(--foreground);
      line-height: 1.6;
    }

    .email-wrapper {
      width: 100%;
      min-height: 100vh;
      padding: 20px;
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

    .email-header {
      background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%);
      padding: 40px 30px;
      text-align: center;
    }

    .header-icon {
      width: 64px;
      height: 64px;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 32px;
      margin: 0 auto 16px;
    }

    .header-title {
      font-size: 24px;
      font-weight: 600;
      color: white;
      margin-bottom: 8px;
    }

    .header-subtitle {
      font-size: 14px;
      color: rgba(255, 255, 255, 0.9);
    }

    .email-body {
      padding: 40px 30px;
    }

    .greeting {
      font-size: 20px;
      font-weight: 600;
      color: var(--foreground);
      margin-bottom: 16px;
    }

    .message {
      font-size: 16px;
      color: var(--muted-foreground);
      margin-bottom: 24px;
      line-height: 1.6;
    }

    .student-info {
      background: var(--secondary);
      border: 1px solid #fecaca;
      border-radius: var(--radius);
      padding: 20px;
      margin: 24px 0;
    }

    .info-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
    }

    .info-row:last-child {
      margin-bottom: 0;
    }

    .info-label {
      font-size: 14px;
      color: var(--muted-foreground);
    }

    .info-value {
      font-size: 14px;
      font-weight: 600;
      color: var(--foreground);
    }

    .token-card {
      background: var(--muted);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 24px;
      margin: 24px 0;
      text-align: center;
    }

    .token-label {
      font-size: 12px;
      font-weight: 600;
      color: var(--muted-foreground);
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 12px;
    }

    .token-value {
      font-size: 14px;
      font-weight: 600;
      color: var(--foreground);
      font-family: ui-monospace, monospace;
      background: white;
      padding: 12px;
      border-radius: calc(var(--radius) / 2);
      border: 1px solid var(--border);
      word-break: break-all;
      line-height: 1.8;
    }

    .warning-box {
      background: #fef3c7;
      border: 1px solid #f59e0b;
      border-radius: var(--radius);
      padding: 16px;
      margin: 24px 0;
      display: flex;
      gap: 12px;
      align-items: flex-start;
    }

    .warning-icon {
      font-size: 20px;
      flex-shrink: 0;
    }

    .warning-text {
      font-size: 14px;
      color: #92400e;
      line-height: 1.5;
    }

    .cta-section {
      text-align: center;
      margin: 32px 0;
    }

    .cta-button {
      display: inline-block;
      background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%);
      color: white;
      text-decoration: none;
      padding: 16px 32px;
      border-radius: var(--radius);
      font-size: 16px;
      font-weight: 500;
      box-shadow: var(--shadow);
    }

    .expiry-note {
      font-size: 14px;
      color: var(--muted-foreground);
      text-align: center;
      margin-top: 16px;
    }

    .security-note {
      background: var(--muted);
      border-radius: var(--radius);
      padding: 20px;
      margin: 24px 0;
    }

    .security-title {
      font-size: 14px;
      font-weight: 600;
      color: var(--foreground);
      margin-bottom: 8px;
    }

    .security-text {
      font-size: 13px;
      color: var(--muted-foreground);
      line-height: 1.5;
    }

    .email-footer {
      background: var(--muted);
      border-top: 1px solid var(--border);
      padding: 24px 30px;
      text-align: center;
    }

    .footer-logo {
      font-size: 16px;
      font-weight: 600;
      color: var(--foreground);
      margin-bottom: 8px;
    }

    .footer-text {
      font-size: 12px;
      color: var(--muted-foreground);
    }

    @media (max-width: 640px) {
      .email-wrapper { padding: 10px; }
      .email-header, .email-body, .email-footer { padding-left: 20px; padding-right: 20px; }
      .info-row { flex-direction: column; gap: 4px; }
    }
  </style>
</head>
<body>
  <div class="email-wrapper">
    <div class="email-container">
      <div class="email-header">
        <div class="header-icon">🔐</div>
        <div class="header-title">Password Reset Request</div>
        <div class="header-subtitle">${collegeName} - Student Portal</div>
      </div>

      <div class="email-body">
        <div class="greeting">Hello, ${name}!</div>
        
        <p class="message">
          We received a request to reset the password for your student account. 
          Use the reset token below to create a new password.
        </p>

        <div class="student-info">
          <div class="info-row">
            <span class="info-label">Registration Number:</span>
            <span class="info-value">${regNo}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Email:</span>
            <span class="info-value">${email}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Department:</span>
            <span class="info-value">${departmentName}</span>
          </div>
        </div>

        <div class="token-card">
          <div class="token-label">🔑 Your Reset Token</div>
          <div class="token-value">${sessionToken}</div>
        </div>

        <div class="warning-box">
          <span class="warning-icon">⚠️</span>
          <span class="warning-text">
            <strong>This token expires in 10 minutes.</strong> 
            If you didn't request this password reset, please ignore this email or contact your administrator immediately.
          </span>
        </div>

        <div class="cta-section">
          <a href="${resetUrl}?token=${sessionToken}&email=${encodeURIComponent(email)}" class="cta-button">
            Reset Password
          </a>
          <p class="expiry-note">Link expires in 10 minutes</p>
        </div>

        <div class="security-note">
          <div class="security-title">🛡️ Security Tips</div>
          <p class="security-text">
            • Never share your password or reset token with anyone<br>
            • Make sure you're on the official college portal before entering your new password<br>
            • Use a strong password with uppercase, lowercase, numbers, and special characters
          </p>
        </div>
      </div>

      <div class="email-footer">
        <div class="footer-logo">🎓 ${collegeName}</div>
        <div class="footer-text">${departmentName} • Student Portal</div>
        <div class="footer-text">© 2025 ${collegeName}. All rights reserved.</div>
      </div>
    </div>
  </div>
</body>
</html>
`;

