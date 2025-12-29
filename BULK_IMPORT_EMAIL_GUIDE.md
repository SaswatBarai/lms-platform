# Bulk Import Email Configuration Guide

## How to Enable Welcome Emails for Bulk Student Import

### Option 1: Using cURL

When uploading a CSV file, include `options` in the request body with `sendWelcomeEmails: true`:

```bash
curl -X POST http://localhost:8000/auth/api/bulk/upload \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -F "file=@students.csv;type=text/csv" \
  -F "importType=student_import" \
  -F 'options={"sendWelcomeEmails":true}'
```

### Option 2: Using JavaScript/Node.js

```javascript
const formData = new FormData();
formData.append('file', fileBlob, 'students.csv');
formData.append('importType', 'student_import');
formData.append('options', JSON.stringify({ sendWelcomeEmails: true }));

const response = await fetch('http://localhost:8000/auth/api/bulk/upload', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${accessToken}`
  },
  body: formData
});
```

### Option 3: Using Postman/API Client

1. **Method**: POST
2. **URL**: `http://localhost:8000/auth/api/bulk/upload`
3. **Headers**:
   - `Authorization: Bearer YOUR_ACCESS_TOKEN`
4. **Body** (form-data):
   - `file`: [Select your CSV file]
   - `importType`: `student_import`
   - `options`: `{"sendWelcomeEmails":true}`

## Important Notes

⚠️ **Security Warning**: 
- Welcome emails are **disabled by default** for security reasons
- When enabled, emails are sent but **passwords are NOT included** in the email
- Students must use "Forgot Password" to set their initial password
- This is a security best practice

## Default Behavior

- **Without `sendWelcomeEmails`**: No emails are sent (default)
- **With `sendWelcomeEmails: false`**: No emails are sent
- **With `sendWelcomeEmails: true`**: Welcome emails are sent (without passwords)

## Email Content

When enabled, students receive:
- Welcome message
- Their registration number (regNo)
- College and department information
- Login URL
- **Note**: Password is NOT sent - students must use password reset

