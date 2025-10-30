export const htmlForForgotPassword = (organizationName: string, resetLink: string, sessionToken: string) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password</title>
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
      <h1 class="heading">Reset Your Password 🔒</h1>
      <p>Hello from ${organizationName},</p>
      <p>We received a request to reset your password. Click the button below to securely reset it. This link will expire in 30 minutes.</p>

      <a href="${resetLink}?token=${sessionToken}" class="button">Reset Password</a>

      <p style="margin-top: 20px;">If you didn't request this, you can safely ignore this email — your password will remain unchanged.</p>

      <div class="footer">
        © 2025 ${organizationName}. All rights reserved.
      </div>
    </div>
  </div>
</body>
</html>
`;

export const htmlForStaffAccountCreated = (staffName: string, tempPassword: string, loginUrl: string) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to LMS Platform</title>
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
      --accent: #3b82f6;
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
      color: var(--card-foreground);
    }

    p {
      font-size: 14px;
      color: var(--muted-foreground);
      line-height: 1.5;
      margin-bottom: 20px;
    }

    .credentials-box {
      background-color: var(--muted);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 20px;
      margin: 24px 0;
      text-align: left;
    }

    .credential-row {
      margin-bottom: 12px;
      display: flex;
      flex-direction: column;
    }

    .credential-row:last-child {
      margin-bottom: 0;
    }

    .credential-label {
      font-size: 12px;
      font-weight: 600;
      color: var(--muted-foreground);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 4px;
    }

    .credential-value {
      font-size: 16px;
      font-weight: 600;
      color: var(--foreground);
      font-family: monospace;
      word-break: break-all;
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

    .warning-box {
      background-color: #fef3c7;
      border: 1px solid #fbbf24;
      border-radius: var(--radius);
      padding: 12px;
      margin: 20px 0;
      font-size: 13px;
      color: #92400e;
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
      .credential-value {
        font-size: 14px;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <h1 class="heading">Welcome ${staffName}! 🎓</h1>
      <p>Your staff account has been successfully created. You can now log in to the LMS Platform using the credentials below.</p>

      <div class="credentials-box">
        <div class="credential-row">
          <span class="credential-label">Temporary Password</span>
          <span class="credential-value">${tempPassword}</span>
        </div>
      </div>

      <div class="warning-box">
        ⚠️ <strong>Important:</strong> Please change your password after your first login for security.
      </div>

      <a href="${loginUrl}" class="button">Login to Dashboard</a>

      <p style="margin-top: 20px;">If you have any questions or need assistance, please contact your administrator.</p>

      <div class="footer">
        © 2025 LMS Platform. All rights reserved.
      </div>
    </div>
  </div>
</body>
</html>
`;
