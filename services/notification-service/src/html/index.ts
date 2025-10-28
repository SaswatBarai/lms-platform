export const htmlForForgotPassword = (organizationName: string, resetLink: string) => `
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

      <a href="${resetLink}" class="button">Reset Password</a>

      <p style="margin-top: 20px;">If you didn’t request this, you can safely ignore this email — your password will remain unchanged.</p>

      <div class="footer">
        © 2025 ${organizationName}. All rights reserved.
      </div>
    </div>
  </div>
</body>
</html>
`;
