/**
 * Email template for new device login notifications
 */

export function newDeviceLoginTemplate(data: {
  name: string;
  userType: string;
  deviceType?: string | undefined;
  browser?: string | undefined;
  os?: string | undefined;
  ipAddress?: string | undefined;
  location?: string | undefined;
  loginTime: string;
  loginUrl?: string | undefined;
  collegeName?: string | undefined;
  departmentName?: string | undefined;
  regNo?: string | undefined;
  employeeNo?: string | undefined;
}): string {
  const {
    name,
    userType,
    deviceType = "Unknown",
    browser = "Unknown",
    os = "Unknown",
    ipAddress = "Unknown",
    location = "Unknown",
    loginTime,
    loginUrl = "https://lms.example.com/login",
    collegeName,
    departmentName,
    regNo,
    employeeNo
  } = data;

  const userIdentifier = regNo ? `Registration Number: ${regNo}` : employeeNo ? `Employee Number: ${employeeNo}` : "";

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>New Device Login Alert</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f4f4f4;
        }
        .container {
            background-color: #ffffff;
            border-radius: 8px;
            padding: 30px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            border-bottom: 3px solid #e74c3c;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .header h1 {
            color: #e74c3c;
            margin: 0;
            font-size: 24px;
        }
        .alert-icon {
            font-size: 48px;
            margin-bottom: 10px;
        }
        .content {
            margin-bottom: 30px;
        }
        .info-box {
            background-color: #f8f9fa;
            border-left: 4px solid #007bff;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
        }
        .info-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid #e9ecef;
        }
        .info-row:last-child {
            border-bottom: none;
        }
        .info-label {
            font-weight: 600;
            color: #495057;
        }
        .info-value {
            color: #212529;
        }
        .warning-box {
            background-color: #fff3cd;
            border: 1px solid #ffc107;
            border-radius: 4px;
            padding: 15px;
            margin: 20px 0;
        }
        .warning-box p {
            margin: 0;
            color: #856404;
        }
        .button {
            display: inline-block;
            padding: 12px 24px;
            background-color: #007bff;
            color: #ffffff;
            text-decoration: none;
            border-radius: 4px;
            margin: 20px 0;
            text-align: center;
        }
        .button:hover {
            background-color: #0056b3;
        }
        .footer {
            text-align: center;
            color: #6c757d;
            font-size: 12px;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e9ecef;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="alert-icon">🔒</div>
            <h1>New Device Login Detected</h1>
        </div>
        
        <div class="content">
            <p>Hello <strong>${name}</strong>,</p>
            
            <p>We detected a login to your ${userType} account from a new device. If this was you, no action is needed. If you don't recognize this activity, please secure your account immediately.</p>
            
            <div class="info-box">
                <h3 style="margin-top: 0; color: #007bff;">Login Details</h3>
                <div class="info-row">
                    <span class="info-label">Time:</span>
                    <span class="info-value">${loginTime}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Device Type:</span>
                    <span class="info-value">${deviceType}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Browser:</span>
                    <span class="info-value">${browser}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Operating System:</span>
                    <span class="info-value">${os}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">IP Address:</span>
                    <span class="info-value">${ipAddress}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Location:</span>
                    <span class="info-value">${location}</span>
                </div>
                ${userIdentifier ? `
                <div class="info-row">
                    <span class="info-label">${regNo ? 'Registration Number' : 'Employee Number'}:</span>
                    <span class="info-value">${regNo || employeeNo}</span>
                </div>
                ` : ''}
                ${collegeName ? `
                <div class="info-row">
                    <span class="info-label">College:</span>
                    <span class="info-value">${collegeName}</span>
                </div>
                ` : ''}
                ${departmentName ? `
                <div class="info-row">
                    <span class="info-label">Department:</span>
                    <span class="info-value">${departmentName}</span>
                </div>
                ` : ''}
            </div>
            
            <div class="warning-box">
                <p><strong>⚠️ Security Notice:</strong> If you didn't make this login, please change your password immediately and contact support.</p>
            </div>
            
            <div style="text-align: center;">
                <a href="${loginUrl}" class="button">Secure Your Account</a>
            </div>
        </div>
        
        <div class="footer">
            <p>This is an automated security notification from LMS Platform.</p>
            <p>For security reasons, please do not reply to this email.</p>
            <p>If you have concerns, contact your system administrator.</p>
        </div>
    </div>
</body>
</html>
  `.trim();
}

