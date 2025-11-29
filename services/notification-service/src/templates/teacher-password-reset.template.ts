export const teacherPasswordResetEmailTemplate = (
  email: string,
  name: string,
  employeeNo: string,
  sessionToken: string,
  collegeName: string,
  departmentName: string,
  resetUrl: string
): string => {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Password Reset Request</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background-color: #f0f4f8;
      padding: 20px;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 10px 40px rgba(102, 126, 234, 0.3);
    }
    .header {
      padding: 40px 30px;
      text-align: center;
      color: white;
    }
    .header h1 {
      font-size: 28px;
      margin-bottom: 10px;
      font-weight: 600;
    }
    .header p {
      font-size: 16px;
      opacity: 0.9;
    }
    .content {
      background: white;
      padding: 40px 30px;
      border-radius: 16px 16px 0 0;
      margin-top: -20px;
    }
    .greeting {
      font-size: 20px;
      color: #1a202c;
      margin-bottom: 20px;
      font-weight: 600;
    }
    .message {
      color: #4a5568;
      line-height: 1.8;
      margin-bottom: 25px;
      font-size: 15px;
    }
    .info-box {
      background: linear-gradient(135deg, #f6f8fc 0%, #eef2f7 100%);
      border-left: 4px solid #667eea;
      padding: 20px;
      border-radius: 8px;
      margin: 25px 0;
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px dashed #cbd5e0;
    }
    .info-row:last-child {
      border-bottom: none;
    }
    .info-label {
      color: #718096;
      font-size: 14px;
      font-weight: 500;
    }
    .info-value {
      color: #2d3748;
      font-size: 14px;
      font-weight: 600;
    }
    .token-box {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 20px;
      border-radius: 12px;
      text-align: center;
      margin: 25px 0;
    }
    .token-label {
      color: rgba(255,255,255,0.8);
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 10px;
    }
    .token-value {
      color: white;
      font-size: 18px;
      font-weight: 700;
      font-family: 'Courier New', monospace;
      word-break: break-all;
      background: rgba(255,255,255,0.1);
      padding: 12px;
      border-radius: 8px;
    }
    .btn-container {
      text-align: center;
      margin: 30px 0;
    }
    .reset-btn {
      display: inline-block;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      text-decoration: none;
      padding: 16px 40px;
      border-radius: 50px;
      font-weight: 600;
      font-size: 16px;
      box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .reset-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(102, 126, 234, 0.5);
    }
    .warning {
      background: #fff5f5;
      border: 1px solid #feb2b2;
      color: #c53030;
      padding: 15px;
      border-radius: 8px;
      margin: 20px 0;
      font-size: 14px;
    }
    .warning strong {
      display: block;
      margin-bottom: 5px;
    }
    .footer {
      background: #2d3748;
      padding: 25px 30px;
      text-align: center;
      color: #a0aec0;
      font-size: 13px;
    }
    .footer a {
      color: #667eea;
      text-decoration: none;
    }
    .divider {
      height: 1px;
      background: linear-gradient(90deg, transparent, #e2e8f0, transparent);
      margin: 25px 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔐 Password Reset Request</h1>
      <p>${collegeName} - Faculty Portal</p>
    </div>
    
    <div class="content">
      <p class="greeting">Hello ${name},</p>
      
      <p class="message">
        We received a request to reset your password for your faculty account. 
        If you didn't make this request, please ignore this email or contact your administrator.
      </p>

      <div class="info-box">
        <div class="info-row">
          <span class="info-label">👤 Faculty Name</span>
          <span class="info-value">${name}</span>
        </div>
        <div class="info-row">
          <span class="info-label">🆔 Employee No</span>
          <span class="info-value">${employeeNo}</span>
        </div>
        <div class="info-row">
          <span class="info-label">📧 Email</span>
          <span class="info-value">${email}</span>
        </div>
        <div class="info-row">
          <span class="info-label">🏛️ Department</span>
          <span class="info-value">${departmentName}</span>
        </div>
        <div class="info-row">
          <span class="info-label">🎓 College</span>
          <span class="info-value">${collegeName}</span>
        </div>
      </div>

      <div class="token-box">
        <div class="token-label">Your Reset Token</div>
        <div class="token-value">${sessionToken}</div>
      </div>

      <div class="btn-container">
        <a href="${resetUrl}?email=${encodeURIComponent(email)}&token=${sessionToken}" class="reset-btn">
          Reset My Password
        </a>
      </div>

      <div class="divider"></div>

      <div class="warning">
        <strong>⚠️ Security Notice</strong>
        This link will expire in 10 minutes. If you didn't request a password reset, 
        please contact your IT administrator immediately.
      </div>

      <p class="message" style="margin-bottom: 0;">
        If the button doesn't work, copy and paste the following URL into your browser:
        <br><br>
        <code style="background: #f7fafc; padding: 8px 12px; border-radius: 6px; font-size: 12px; word-break: break-all;">
          ${resetUrl}?email=${encodeURIComponent(email)}&token=${sessionToken}
        </code>
      </p>
    </div>

    <div class="footer">
      <p>This is an automated message from ${collegeName} LMS</p>
      <p style="margin-top: 10px;">© ${new Date().getFullYear()} All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `.trim();
};

