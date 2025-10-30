# Bulk Non-Teaching Staff Creation API

## Overview

This document describes the bulk staff creation feature that allows College Admins to create multiple non-teaching staff accounts in a single request. The feature implements an asynchronous architecture where staff accounts are created immediately in the database, and welcome emails with temporary passwords are sent asynchronously via Kafka.

## Architecture

```
Frontend → Kong Gateway → Auth Service → PostgreSQL (Immediate)
                              ↓
                           Kafka (otp-auth topic)
                              ↓
                      Notification Service → Email (Async)
```

### Flow

1. **Frontend**: College Admin submits an array of staff members
2. **Kong Gateway**: Routes request to auth-service (with authentication)
3. **Auth Service**:
   - Validates the College Admin authentication
   - Generates secure temporary passwords for each staff
   - Inserts all staff records into PostgreSQL
   - Publishes email notifications to Kafka
   - Returns immediate success response
4. **Notification Service**:
   - Consumes messages from Kafka
   - Sends welcome emails with temporary passwords

## API Endpoint

### Create Non-Teaching Staff in Bulk

**Endpoint**: `POST /auth/api/create-non-teaching-staff-bulk`

**Authentication**: Required (College Admin only)

**Headers**:
```
Authorization: Bearer <college_admin_access_token>
Content-Type: application/json
```

**Request Body**:
```json
[
  {
    "name": "John Doe",
    "email": "john.doe@example.com",
    "phone": "+1234567890",
    "role": "studentsection"
  },
  {
    "name": "Jane Smith",
    "email": "jane.smith@example.com",
    "phone": "+0987654321",
    "role": "regestral"
  },
  {
    "name": "Bob Johnson",
    "email": "bob.johnson@example.com",
    "phone": "+1122334455",
    "role": "adminstractor"
  }
]
```

**Field Descriptions**:
- `name` (string, required): Staff member's full name (min 3 characters)
- `email` (string, required): Valid email address (must be unique)
- `phone` (string, required): Phone number in international format (must be unique)
- `role` (enum, optional): One of `"studentsection"`, `"regestral"`, `"adminstractor"` (default: `"studentsection"`)

**Success Response** (201 Created):
```json
{
  "success": true,
  "message": "3 staff accounts are being created. Welcome emails will be sent shortly."
}
```

**Error Responses**:

**400 Bad Request** - Validation Error:
```json
{
  "status": "fail",
  "message": "Invalid input data",
  "errors": [
    {
      "path": "0.email",
      "message": "Invalid email address"
    },
    {
      "path": "1.phone",
      "message": "Invalid phone number format"
    }
  ]
}
```

**401 Unauthorized** - Not authenticated:
```json
{
  "success": false,
  "message": "Authentication required"
}
```

**403 Forbidden** - Not a College Admin:
```json
{
  "success": false,
  "message": "Access denied. College admin only."
}
```

## Email Notification

Each staff member receives a welcome email with:
- Personalized greeting with their name
- Temporary password (16 character hex string)
- Login URL
- Security warning to change password after first login

**Email Template Preview**:
```
Subject: Welcome [Name]! Your Staff Account is Ready

Welcome [Name]! 🎓

Your staff account has been successfully created. You can now log in to the LMS Platform using the credentials below.

┌─────────────────────────┐
│ TEMPORARY PASSWORD      │
│ [16-char-hex-password]  │
└─────────────────────────┘

⚠️ Important: Please change your password after your first login for security.

[Login to Dashboard Button]
```

## Implementation Details

### Files Modified

#### Auth Service

1. **`services/auth-service/src/schemas/organization.ts`**
   - Added `createNonTeachingStaffBulkSchema` - Zod array schema for bulk validation

2. **`services/auth-service/src/controller/college/staff.controller.ts`** (NEW)
   - `createNonTeachingStaffBulkController` - Main controller handling bulk creation

3. **`services/auth-service/src/routes/organization.route.ts`**
   - Added POST route: `/create-non-teaching-staff-bulk`
   - Protected with `AuthenticatedUser.checkCollege` middleware
   - Validated with `createNonTeachingStaffBulkSchema`

4. **`services/auth-service/src/types/organization.ts`**
   - Updated `ProducerPayload` type to include `"staff-welcome-email"`

5. **`services/auth-service/src/middleware/validate.ts`**
   - Updated to support `ZodSchema<any>` (includes both ZodObject and ZodArray)

#### Notification Service

6. **`services/notification-service/src/services/auth.service.ts`**
   - Added `staff-welcome-email` case in `emailNotification` function
   - Updated `data` interface to include `name` and `tempPassword`

7. **`services/notification-service/src/actions/org.action.ts`**
   - Added `sendStaffWelcomeEmail` static method
   - Includes retry logic and console fallback
   - Added HTML template for staff welcome email

8. **`services/notification-service/src/html/index.ts`**
   - Exported `htmlForStaffAccountCreated` function

#### Gateway

9. **`gateway/kong/kong.yaml`**
   - Added `/auth/api/create-non-teaching-staff-bulk` to protected routes

## Database Schema

The feature uses the existing `NonTeachingStaff` table:

```prisma
model NonTeachingStaff {
  id         String   @id @default(cuid())
  collegeId  String
  name       String   @db.VarChar(255)
  email      String   @unique @db.VarChar(255)
  phone      String   @unique @db.VarChar(20)
  password   String   @db.VarChar(255)
  role       UserRole @default(studentsection)
  
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
  
  college    College @relation(fields: [collegeId], references: [id], onDelete: Cascade)
}
```

## Security Features

1. **Authentication**: Only authenticated College Admins can access the endpoint
2. **Authorization**: Verified via `AuthenticatedUser.checkCollege` middleware
3. **Password Generation**: Secure random 16-character hex passwords (128-bit entropy)
4. **Password Hashing**: Passwords are hashed using bcrypt before storage
5. **Duplicate Prevention**: `skipDuplicates: true` prevents duplicate email/phone entries
6. **Session Validation**: Kong gateway validates PASETO tokens via Vault

## Kafka Integration

**Topic**: `otp-auth`

**Message Format**:
```json
{
  "action": "email-notification",
  "type": "staff-welcome-email",
  "subType": "create-account",
  "data": {
    "email": "staff@example.com",
    "name": "Staff Name",
    "tempPassword": "1a2b3c4d5e6f7890",
    "loginUrl": "http://localhost:8000/auth/api/login-staff"
  }
}
```

## Testing

### Using cURL

```bash
# 1. Login as College Admin
curl -X POST http://localhost:8000/auth/api/login-college \
  -H "Content-Type: application/json" \
  -d '{
    "email": "college@example.com",
    "password": "YourPassword123!"
  }'

# Save the accessToken from response

# 2. Create Staff in Bulk
curl -X POST http://localhost:8000/auth/api/create-non-teaching-staff-bulk \
  -H "Content-Type: application/json" \
  -H "Cookie: accessToken=YOUR_ACCESS_TOKEN_HERE" \
  -d '[
    {
      "name": "Test Staff 1",
      "email": "staff1@example.com",
      "phone": "+11234567890",
      "role": "studentsection"
    },
    {
      "name": "Test Staff 2",
      "email": "staff2@example.com",
      "phone": "+10987654321",
      "role": "regestral"
    }
  ]'
```

### Using Postman

1. **Login as College Admin**:
   - Method: POST
   - URL: `http://localhost:8000/auth/api/login-college`
   - Body (JSON):
     ```json
     {
       "email": "college@example.com",
       "password": "YourPassword123!"
     }
     ```
   - Save cookies from response

2. **Create Staff in Bulk**:
   - Method: POST
   - URL: `http://localhost:8000/auth/api/create-non-teaching-staff-bulk`
   - Headers: Cookies will be sent automatically
   - Body (JSON): Array of staff objects

## Error Handling

### Validation Errors
- Missing required fields
- Invalid email format
- Invalid phone format
- Invalid role enum
- Name too short (< 3 characters)
- Empty array

### Database Errors
- Duplicate email (skipped silently with `skipDuplicates: true`)
- Duplicate phone (skipped silently with `skipDuplicates: true`)
- College not found
- Database connection issues

### Email Errors
- Email sending failures are logged but don't fail the request
- Temporary passwords are logged to console as fallback
- Retry mechanism (2 retries with exponential backoff)

## Performance Considerations

1. **Batch Insert**: Uses Prisma's `createMany` for efficient bulk insertion
2. **Async Email**: Emails are sent asynchronously via Kafka (non-blocking)
3. **Immediate Response**: Frontend receives response before emails are sent
4. **Duplicate Handling**: `skipDuplicates: true` prevents unique constraint errors

## Future Enhancements

1. Add batch size limit (e.g., max 100 staff per request)
2. Implement progress tracking via WebSocket
3. Add CSV import support
4. Implement password complexity configuration
5. Add email template customization per college
6. Implement bulk staff deletion/update endpoints
7. Add staff account activation/deactivation
8. Implement role-based permissions for staff

## Troubleshooting

### Staff created but no emails received
- Check Kafka consumer logs in notification-service
- Verify email configuration (SMTP settings)
- Check console logs for fallback password display
- Verify Kafka topic `otp-auth` is accessible

### Authentication errors
- Verify College Admin is logged in
- Check PASETO token validity
- Verify Redis session exists
- Check Kong gateway logs

### Duplicate staff not inserted
- This is expected behavior with `skipDuplicates: true`
- Check for existing email/phone in database
- Response will still show total count (including skipped)

## Support

For issues or questions:
1. Check service logs: auth-service, notification-service, Kong
2. Verify Kafka connectivity
3. Check Redis session data
4. Review PostgreSQL logs for constraint errors

---

**Last Updated**: October 30, 2025
**Version**: 1.0.0

