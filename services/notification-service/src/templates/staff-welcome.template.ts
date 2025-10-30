export const staffWelcomeEmailTemplate = (name: string, tempPassword: string, loginUrl: string): string => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to LMS Platform</title>
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
      background: var(--gradient-primary);
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

    .welcome-section {
      text-align: center;
      margin-bottom: 32px;
    }

    .welcome-title {
      font-size: 28px;
      font-weight: 700;
      color: var(--text-primary);
      margin-bottom: 12px;
      line-height: 1.2;
    }

    .welcome-subtitle {
      font-size: 16px;
      color: var(--text-secondary);
      margin-bottom: 8px;
    }

    .welcome-message {
      font-size: 16px;
      color: var(--text-secondary);
      line-height: 1.6;
      margin-bottom: 24px;
    }

    /* Credentials Card */
    .credentials-card {
      background: var(--surface-secondary);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 24px;
      margin: 32px 0;
      position: relative;
    }

    .credentials-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 20px;
    }

    .credentials-icon {
      width: 40px;
      height: 40px;
      background: var(--gradient-secondary);
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 18px;
    }

    .credentials-title {
      font-size: 18px;
      font-weight: 600;
      color: var(--text-primary);
    }

    .credential-item {
      margin-bottom: 16px;
    }

    .credential-item:last-child {
      margin-bottom: 0;
    }

    .credential-label {
      font-size: 12px;
      font-weight: 600;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 6px;
      display: block;
    }

    .credential-value {
      font-size: 18px;
      font-weight: 600;
      color: var(--text-primary);
      font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
      background: var(--surface);
      padding: 12px 16px;
      border-radius: 8px;
      border: 1px solid var(--border);
      word-break: break-all;
      letter-spacing: 1px;
    }

    /* Alert Box */
    .alert-box {
      background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
      border: 1px solid #f59e0b;
      border-radius: 12px;
      padding: 20px;
      margin: 32px 0;
      position: relative;
    }

    .alert-content {
      display: flex;
      gap: 16px;
      align-items: flex-start;
    }

    .alert-icon {
      width: 24px;
      height: 24px;
      background: var(--warning);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 14px;
      flex-shrink: 0;
      margin-top: 2px;
    }

    .alert-text {
      font-size: 14px;
      color: #92400e;
      line-height: 1.5;
    }

    .alert-text strong {
      font-weight: 600;
    }

    /* CTA Section */
    .cta-section {
      text-align: center;
      margin: 40px 0;
    }

    .cta-button {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: var(--gradient-primary);
      color: white;
      text-decoration: none;
      padding: 16px 32px;
      border-radius: 12px;
      font-size: 16px;
      font-weight: 600;
      transition: all 0.2s ease;
      box-shadow: var(--shadow-md);
      border: none;
      cursor: pointer;
    }

    .cta-button:hover {
      transform: translateY(-2px);
      box-shadow: var(--shadow-lg);
    }

    .cta-button-icon {
      font-size: 18px;
    }

    /* Support Section */
    .support-section {
      background: var(--surface-secondary);
      border-radius: 12px;
      padding: 24px;
      margin: 32px 0;
      text-align: center;
    }

    .support-title {
      font-size: 16px;
      font-weight: 600;
      color: var(--text-primary);
      margin-bottom: 8px;
    }

    .support-text {
      font-size: 14px;
      color: var(--text-secondary);
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

      .welcome-title {
        font-size: 24px;
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
  </style>
</head>
<body>
  <div class="email-wrapper">
    <div class="email-container">
      <!-- Header -->
      <div class="email-header">
        <div class="header-logo">
          <div class="logo-icon">🎓</div>
          <div class="logo-text">LMS Platform</div>
        </div>
        <div class="header-title">Staff Account Created</div>
      </div>

      <!-- Main Body -->
      <div class="email-body">
        <div class="welcome-section">
          <h1 class="welcome-title">Welcome aboard, ${name}!</h1>
          <p class="welcome-subtitle">Your staff account has been successfully created</p>
          <p class="welcome-message">
            You now have access to the LMS Platform. Use the temporary password below to log in and start managing your academic responsibilities.
          </p>
        </div>

        <!-- Credentials Card -->
        <div class="credentials-card">
          <div class="credentials-header">
            <div class="credentials-icon">🔐</div>
            <div class="credentials-title">Your Login Credentials</div>
          </div>
          <div class="credential-item">
            <span class="credential-label">Temporary Password</span>
            <div class="credential-value">${tempPassword}</div>
          </div>
        </div>

        <!-- Security Alert -->
        <div class="alert-box">
          <div class="alert-content">
            <div class="alert-icon">⚠️</div>
            <div class="alert-text">
              <strong>Security Reminder:</strong> This is a temporary password. Please change it immediately after your first login to ensure account security.
            </div>
          </div>
        </div>

        <!-- CTA Button -->
        <div class="cta-section">
          <a href="${loginUrl}" class="cta-button">
            <span class="cta-button-icon">🚀</span>
            Access Your Dashboard
          </a>
        </div>

        <!-- Support Section -->
        <div class="support-section">
          <div class="support-title">Need Help Getting Started?</div>
          <p class="support-text">
            Contact your administrator if you have any questions about accessing the platform or need assistance with your account setup.
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

