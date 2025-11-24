export const studentWelcomeEmailTemplate = (
  email: string,
  name: string,
  regNo: string,
  tempPassword: string,
  collegeName: string,
  departmentName: string,
  loginUrl: string
): string => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to ${collegeName} - Student Portal</title>
  <style>
    :root {
      --background: #ffffff;
      --foreground: #0a0a0a;
      --card: #ffffff;
      --card-foreground: #0a0a0a;
      --primary: #1e40af;
      --primary-foreground: #ffffff;
      --secondary: #f0f9ff;
      --secondary-foreground: #1e3a8a;
      --muted: #f5f5f5;
      --muted-foreground: #737373;
      --accent: #dbeafe;
      --accent-foreground: #1e3a8a;
      --destructive: #ef4444;
      --destructive-foreground: #fafafa;
      --border: #e5e5e5;
      --input: #e5e5e5;
      --ring: #1e40af;
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
      background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
      color: var(--foreground);
      line-height: 1.6;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
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

    /* Header */
    .email-header {
      background: linear-gradient(135deg, var(--primary) 0%, #3b82f6 100%);
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
      width: 56px;
      height: 56px;
      background: var(--primary-foreground);
      color: var(--primary);
      border-radius: var(--radius);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 28px;
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

    .department-badge {
      font-size: 14px;
      font-weight: 500;
      color: var(--primary-foreground);
      background: rgba(255, 255, 255, 0.2);
      padding: 8px 16px;
      border-radius: calc(var(--radius) * 2);
      display: inline-block;
      margin-top: 8px;
      border: 1px solid rgba(255, 255, 255, 0.3);
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
      font-weight: 600;
      color: var(--foreground);
      margin-bottom: 12px;
      line-height: 1.25;
    }

    .welcome-subtitle {
      font-size: 16px;
      color: var(--muted-foreground);
      margin-bottom: 8px;
    }

    .welcome-message {
      font-size: 16px;
      color: var(--muted-foreground);
      line-height: 1.6;
      margin-bottom: 24px;
    }

    /* Student Info Card */
    .student-info {
      background: var(--secondary);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 24px;
      margin: 24px 0;
      text-align: center;
    }

    .student-icon {
      width: 64px;
      height: 64px;
      background: var(--primary);
      color: var(--primary-foreground);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 32px;
      margin: 0 auto 16px;
    }

    .student-name {
      font-size: 20px;
      font-weight: 600;
      color: var(--foreground);
      margin-bottom: 4px;
    }

    .student-email {
      font-size: 14px;
      color: var(--muted-foreground);
      font-family: ui-monospace, 'SFMono-Regular', 'Consolas', monospace;
      background: var(--background);
      padding: 4px 8px;
      border-radius: calc(var(--radius) / 2);
      border: 1px solid var(--border);
      display: inline-block;
    }

    /* Registration Number Highlight */
    .reg-no-card {
      background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
      border: 2px solid #f59e0b;
      border-radius: var(--radius);
      padding: 24px;
      margin: 24px 0;
      text-align: center;
    }

    .reg-no-label {
      font-size: 12px;
      font-weight: 600;
      color: #92400e;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 8px;
    }

    .reg-no-value {
      font-size: 32px;
      font-weight: 700;
      color: #78350f;
      font-family: ui-monospace, 'SFMono-Regular', 'Consolas', monospace;
      letter-spacing: 3px;
    }

    .reg-no-note {
      font-size: 12px;
      color: #92400e;
      margin-top: 8px;
    }

    /* Credentials Card */
    .credentials-card {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 32px;
      margin: 32px 0;
      position: relative;
      overflow: hidden;
    }

    .credentials-card::before {
      content: '';
      position: absolute;
      top: -50%;
      left: -50%;
      width: 200%;
      height: 200%;
      background: radial-gradient(circle, rgba(30, 64, 175, 0.02) 0%, transparent 70%);
      pointer-events: none;
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
      background: var(--primary);
      color: var(--primary-foreground);
      border-radius: var(--radius);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
    }

    .credentials-title {
      font-size: 18px;
      font-weight: 600;
      color: var(--foreground);
      position: relative;
      z-index: 2;
    }

    .credential-item {
      margin-bottom: 16px;
      position: relative;
      z-index: 2;
    }

    .credential-item:last-child {
      margin-bottom: 0;
    }

    .credential-label {
      font-size: 12px;
      font-weight: 600;
      color: var(--muted-foreground);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 6px;
      display: block;
    }

    .credential-value {
      font-size: 16px;
      font-weight: 600;
      color: var(--foreground);
      font-family: ui-monospace, 'SFMono-Regular', 'Consolas', monospace;
      background: var(--muted);
      padding: 12px 16px;
      border-radius: var(--radius);
      border: 1px solid var(--border);
      word-break: break-all;
      letter-spacing: 1px;
    }

    /* Alert Box */
    .alert-box {
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: var(--radius);
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
      background: #ef4444;
      color: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
      flex-shrink: 0;
      margin-top: 2px;
    }

    .alert-text {
      font-size: 14px;
      color: #991b1b;
      line-height: 1.5;
    }

    .alert-text strong {
      font-weight: 600;
    }

    /* Info Box */
    .info-box {
      background: var(--secondary);
      border: 1px solid #bfdbfe;
      border-radius: var(--radius);
      padding: 20px;
      margin: 24px 0;
    }

    .info-content {
      display: flex;
      gap: 16px;
      align-items: flex-start;
    }

    .info-icon {
      width: 24px;
      height: 24px;
      background: var(--primary);
      color: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
      flex-shrink: 0;
    }

    .info-text {
      font-size: 14px;
      color: var(--secondary-foreground);
      line-height: 1.5;
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
      background: linear-gradient(135deg, var(--primary) 0%, #3b82f6 100%);
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
      transform: translateY(-2px);
      box-shadow: var(--shadow-lg);
    }

    .cta-button-icon {
      font-size: 20px;
    }

    /* Quick Start Guide */
    .quick-start {
      background: var(--muted);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 24px;
      margin: 32px 0;
    }

    .quick-start-title {
      font-size: 16px;
      font-weight: 600;
      color: var(--foreground);
      margin-bottom: 16px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .quick-start-steps {
      list-style: none;
    }

    .quick-start-step {
      display: flex;
      gap: 12px;
      margin-bottom: 12px;
      align-items: flex-start;
    }

    .quick-start-step:last-child {
      margin-bottom: 0;
    }

    .step-number {
      width: 24px;
      height: 24px;
      background: var(--primary);
      color: var(--primary-foreground);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: 600;
      flex-shrink: 0;
    }

    .step-text {
      font-size: 14px;
      color: var(--foreground);
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

    .footer-department {
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

      .reg-no-value {
        font-size: 24px;
        letter-spacing: 2px;
      }

      .credentials-card {
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

    /* Animations */
    @keyframes subtle-pulse {
      0%, 100% {
        transform: scale(1);
        box-shadow: var(--shadow);
      }
      50% {
        transform: scale(1.02);
        box-shadow: var(--shadow-md);
      }
    }

    .cta-button {
      animation: subtle-pulse 3s ease-in-out infinite;
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
          <div class="logo-text">${collegeName}</div>
        </div>
        <div class="header-title">Student Account Created</div>
        <div class="department-badge">📚 ${departmentName}</div>
      </div>

      <!-- Main Body -->
      <div class="email-body">
        <div class="welcome-section">
          <h1 class="welcome-title">Welcome to ${collegeName}, ${name}!</h1>
          <p class="welcome-subtitle">Your student account has been successfully created</p>
          <p class="welcome-message">
            Congratulations! You are now officially enrolled in ${departmentName} at ${collegeName}. 
            Your student portal is ready for you to explore courses, submit assignments, and connect with your peers.
          </p>
        </div>

        <!-- Student Info -->
        <div class="student-info">
          <div class="student-icon">👨‍🎓</div>
          <div class="student-name">${name}</div>
          <div class="student-email">${email}</div>
        </div>

        <!-- Registration Number Highlight -->
        <div class="reg-no-card">
          <div class="reg-no-label">📋 Your Registration Number</div>
          <div class="reg-no-value">${regNo}</div>
          <div class="reg-no-note">Keep this safe! You'll need it for exams and official documents.</div>
        </div>

        <!-- Credentials Card -->
        <div class="credentials-card">
          <div class="credentials-header">
            <div class="credentials-icon">🔐</div>
            <div class="credentials-title">Your Login Credentials</div>
          </div>
          <div class="credential-item">
            <span class="credential-label">Email / Username</span>
            <div class="credential-value">${email}</div>
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
              <strong>Important Security Notice:</strong> This is a temporary password. 
              You must change it immediately after your first login to protect your account.
            </div>
          </div>
        </div>

        <!-- Info Box -->
        <div class="info-box">
          <div class="info-content">
            <div class="info-icon">ℹ️</div>
            <div class="info-text">
              Your registration number <strong>${regNo}</strong> is your unique identifier. 
              Use it for exam registrations, library access, and all official college communications.
            </div>
          </div>
        </div>

        <!-- CTA Button -->
        <div class="cta-section">
          <a href="${loginUrl}" class="cta-button">
            <span class="cta-button-icon">🚀</span>
            Access Student Portal
          </a>
        </div>

        <!-- Quick Start Guide -->
        <div class="quick-start">
          <div class="quick-start-title">
            <span>📖</span> Quick Start Guide
          </div>
          <ul class="quick-start-steps">
            <li class="quick-start-step">
              <span class="step-number">1</span>
              <span class="step-text">Click the button above to access the student portal</span>
            </li>
            <li class="quick-start-step">
              <span class="step-number">2</span>
              <span class="step-text">Log in with your email and temporary password</span>
            </li>
            <li class="quick-start-step">
              <span class="step-number">3</span>
              <span class="step-text">Change your password immediately for security</span>
            </li>
            <li class="quick-start-step">
              <span class="step-number">4</span>
              <span class="step-text">Complete your profile and explore your courses</span>
            </li>
          </ul>
        </div>
      </div>

      <!-- Footer -->
      <div class="email-footer">
        <div class="footer-content">
          <div class="footer-info">
            <div class="footer-logo">
              <div class="footer-logo-icon">🎓</div>
              ${collegeName} LMS
            </div>
            <div class="footer-copyright">© 2025 ${collegeName}. All rights reserved.</div>
            <div class="footer-department">${departmentName} • Student Portal</div>
          </div>
          <div class="footer-links">
            <a href="#" class="footer-link">Student Handbook</a>
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

