# LMS Platform - Auth Service API Documentation

## 🚀 Overview

The Auth Service is the central authentication and authorization service for the LMS Platform. It handles organization and college registration, login, and session management with **single-device login enforcement**.

**Base URL (via Kong Gateway):** `http://localhost:8000`

All API endpoints are accessible through Kong Gateway at the above base URL.

---

## 📋 Table of Contents

- [Authentication](#authentication)
- [Organization Endpoints](#organization-endpoints)
- [College Endpoints](#college-endpoints)
- [Testing Endpoints](#testing-endpoints)
- [Error Codes](#error-codes)
- [Response Format](#response-format)
- [Security Features](#security-features)

---

## 🔐 Authentication

The service uses **PASETO v4 public tokens** for authentication. Tokens are automatically set as HTTP-only cookies and must be included in the `Authorization` header for protected endpoints.

### Authentication Header Format
```
Authorization: Bearer <paseto_token>
```

### Token Claims
```json
{
  "id": "user_id",
  "email": "user@example.com", 
  "name": "User Name",
  "role": "org-admin" | "college-admin",
  "type": "organization" | "college",
  "sessionId": "unique_session_id",
  "organizationId": "org_id", // For colleges only
  "iat": 1635724800,
  "exp": 1635811200
}
```

---

## 🏢 Organization Endpoints

### 1. Create Organization Account

Initiates organization registration by sending an OTP to the provided email.

**Endpoint:** `POST /auth/api/create-organization`

**Request Body:**
```json
{
  "name": "Example University",
  "email": "admin@example.edu",
  "password": "SecurePassword123!",
  "recoveryEmail": "recovery@example.edu",
  "address": "123 University Street, Education City",
  "phone": "+1234567890"
}
```

**Validation Rules:**
- `name`: 3-255 characters, required
- `email`: Valid email format, max 255 characters, unique
- `password`: Minimum 8 characters, must contain uppercase, lowercase, number, and special character
- `recoveryEmail`: Valid email format, required
- `address`: 5-500 characters, optional
- `phone`: 10-20 characters, valid phone format

**Success Response (200):**
```json
{
  "success": true,
  "message": "OTP sent successfully",
  "data": {
    "email": "admin@example.edu",
    "sessionToken": "abc123...xyz789"
  }
}
```

**Error Responses:**

| Status Code | Error | Description |
|-------------|-------|-------------|
| 400 | Invalid validation | Field validation failed |
| 409 | Conflict | Email or phone already exists |
| 400 | Already details present | Registration already in progress |
| 500 | Server error | Failed to send OTP |

**Example Error (400):**
```json
{
  "success": false,
  "message": "Password must be at least 8 characters",
  "errors": [
    "Must include at least one uppercase letter",
    "Must include at least one special character"
  ]
}
```

---

### 2. Verify Organization OTP

Completes organization registration after OTP verification.

**Endpoint:** `POST /auth/api/verify-organization-otp`

**Request Body:**
```json
{
  "email": "admin@example.edu",
  "otp": "123456",
  "sessionToken": "abc123...xyz789"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Organization created successfully",
  "data": {
    "organization": {
      "id": "clxyz123456789",
      "name": "Example University",
      "email": "admin@example.edu",
      "phone": "+1234567890",
      "address": "123 University Street, Education City",
      "recoveryEmail": "recovery@example.edu",
      "totalStudents": 0,
      "totalTeachers": 0,
      "totalDeans": 0,
      "totalNonTeachingStaff": 0,
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

**Error Responses:**

| Status Code | Error | Description |
|-------------|-------|-------------|
| 400 | Invalid OTP | OTP expired or incorrect |
| 400 | Session not found | Registration data not found |
| 500 | Creation failed | Organization creation failed |

---

### 3. Resend Organization OTP

Resends OTP for organization registration (rate limited).

**Endpoint:** `POST /auth/api/resend-organization-otp`

**Request Body:**
```json
{
  "email": "admin@example.edu"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "OTP resent successfully"
}
```

**Error Responses:**

| Status Code | Error | Description |
|-------------|-------|-------------|
| 429 | Rate limited | Must wait before requesting new OTP |
| 400 | Session not found | Registration session expired |
| 500 | Send failed | Failed to send OTP |

---

### 4. Organization Login

Authenticates organization and returns access tokens.

**Endpoint:** `POST /auth/api/login-organization`

**Request Body:**
```json
{
  "email": "admin@example.edu",
  "password": "SecurePassword123!"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "organization": {
      "id": "clxyz123456789",
      "name": "Example University",
      "email": "admin@example.edu",
      "phone": "+1234567890",
      "address": "123 University Street, Education City",
      "recoveryEmail": "recovery@example.edu",
      "totalStudents": 150,
      "totalTeachers": 25,
      "totalDeans": 3,
      "totalNonTeachingStaff": 10,
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-20T14:22:00.000Z"
    },
    "tokens": {
      "accessToken": "v4.public.eyJ..."
    }
  }
}
```

**Cookies Set:**
- `accessToken`: HTTP-only, 1 day expiry
- `refreshToken`: HTTP-only, 7 days expiry

**Error Responses:**

| Status Code | Error | Description |
|-------------|-------|-------------|
| 401 | Invalid credentials | Email or password incorrect |
| 400 | Validation error | Invalid email format |

---

### 5. Organization Logout (🔒 Protected)

Logs out organization and invalidates session.

**Endpoint:** `POST /auth/api/logout-organization`

**Headers Required:**
```
Authorization: Bearer <access_token>
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Logout successful"
}
```

**Cookies Cleared:**
- `accessToken`
- `refreshToken`

**Error Responses:**

| Status Code | Error | Description |
|-------------|-------|-------------|
| 401 | Unauthorized | Invalid or expired token |
| 404 | Organization not found | Organization doesn't exist |

---

### 6. Regenerate Access Token (🔒 Protected)

Generates new access token for organization.

**Endpoint:** `POST /auth/api/regenerate-access-token-organization`

**Headers Required:**
```
Authorization: Bearer <refresh_token>
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Access token regenerated successfully"
}
```

**Cookies Updated:**
- `accessToken`: New token set

**Error Responses:**

| Status Code | Error | Description |
|-------------|-------|-------------|
| 401 | Unauthorized | Invalid refresh token |
| 404 | Session not found | Session expired |

---

## 🏫 College Endpoints

### 1. Create College (🔒 Protected - Organization Only)

Creates a new college under an organization. Only organization admins can create colleges.

**Endpoint:** `POST /auth/api/create-college`

**Headers Required:**
```
Authorization: Bearer <org_admin_token>
```

**Request Body:**
```json
{
  "name": "Engineering College",
  "email": "admin@engineering.example.edu",
  "password": "CollegePassword123!",
  "organizationId": "clxyz123456789",
  "recoveryEmail": "recovery@engineering.example.edu",
  "phone": "+1234567891"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "College created successfully",
  "data": {
    "college": {
      "id": "clcollege789456",
      "name": "Engineering College",
      "email": "admin@engineering.example.edu",
      "phone": "+1234567891",
      "organizationId": "clxyz123456789",
      "recoveryEmail": "recovery@engineering.example.edu",
      "deanId": null,
      "createdAt": "2024-01-15T11:00:00.000Z",
      "updatedAt": "2024-01-15T11:00:00.000Z"
    }
  }
}
```

**Error Responses:**

| Status Code | Error | Description |
|-------------|-------|-------------|
| 401 | Unauthorized | Only organization admins can create colleges |
| 400 | Missing fields | Required fields not provided |
| 409 | Conflict | College email already exists |

---

### 2. College Login

Authenticates college and returns access tokens.

**Endpoint:** `POST /auth/api/login-college`

**Request Body:**
```json
{
  "email": "admin@engineering.example.edu",
  "password": "CollegePassword123!"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "college": {
      "id": "clcollege789456",
      "name": "Engineering College",
      "email": "admin@engineering.example.edu",
      "phone": "+1234567891",
      "organizationId": "clxyz123456789",
      "organizationName": "Example University",
      "recoveryEmail": "recovery@engineering.example.edu",
      "deanId": null,
      "createdAt": "2024-01-15T11:00:00.000Z",
      "updatedAt": "2024-01-15T11:00:00.000Z"
    },
    "tokens": {
      "accessToken": "v4.public.eyJ..."
    }
  }
}
```

**Cookies Set:**
- `accessToken`: HTTP-only, 1 day expiry
- `refreshToken`: HTTP-only, 7 days expiry

**Error Responses:**

| Status Code | Error | Description |
|-------------|-------|-------------|
| 401 | Invalid credentials | Email or password incorrect |
| 400 | Validation error | Invalid email format |

---

### 3. College Logout (🔒 Protected)

Logs out college and invalidates session.

**Endpoint:** `POST /auth/api/logout-college`

**Headers Required:**
```
Authorization: Bearer <college_access_token>
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Logout successful"
}
```

**Error Responses:**

| Status Code | Error | Description |
|-------------|-------|-------------|
| 401 | Unauthorized | Invalid or expired token |
| 404 | College not found | College doesn't exist |

---

### 4. Regenerate College Access Token (🔒 Protected)

Generates new access token for college.

**Endpoint:** `POST /auth/api/regenerate-access-token-college`

**Headers Required:**
```
Authorization: Bearer <college_refresh_token>
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Access token regenerated successfully"
}
```

**Error Responses:**

| Status Code | Error | Description |
|-------------|-------|-------------|
| 401 | Unauthorized | Invalid refresh token |
| 404 | Session not found | Session expired |

---

## 🧪 Testing Endpoints

### Test Protected Route

Tests authentication and returns user information extracted from token.

**Endpoint:** `GET /auth/api/test-protected`

**Headers Required:**
```
Authorization: Bearer <access_token>
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Authentication successful - You have access to this protected resource",
  "data": {
    "message": "This is a protected endpoint that requires valid PASETO authentication",
    "user": {
      "id": "clxyz123456789",
      "email": "admin@example.edu",
      "role": "org-admin",
      "type": "organization"
    },
    "timestamp": "2024-01-15T12:00:00.000Z",
    "endpoint": "/api/test-protected"
  }
}
```

**Error Responses:**

| Status Code | Error | Description |
|-------------|-------|-------------|
| 401 | Unauthorized | Invalid or expired token |
| 403 | Forbidden | Insufficient permissions |

---

## ❌ Error Codes

### HTTP Status Codes

| Status Code | Type | Description |
|-------------|------|-------------|
| 200 | Success | Request successful |
| 201 | Created | Resource created successfully |
| 400 | Bad Request | Invalid request data or validation failed |
| 401 | Unauthorized | Authentication failed or token invalid |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Resource already exists |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error occurred |

### Common Error Messages

| Error Message | Cause | Solution |
|---------------|-------|----------|
| "Invalid email address" | Email format is invalid | Provide valid email format |
| "Password must be at least 8 characters" | Password too short | Use minimum 8 characters |
| "Must include at least one uppercase letter" | Password missing uppercase | Add uppercase letter |
| "Must include at least one special character" | Password missing special char | Add !@#$%^&* character |
| "Organization with this email already exists" | Duplicate email | Use different email |
| "Invalid OTP" | Wrong OTP entered | Check OTP and try again |
| "Please wait before requesting a new OTP" | Rate limited | Wait 60 seconds before retry |
| "Session has been invalidated by another login" | Single device login | Login from new device only |
| "Your session has been invalidated" | Session expired | Login again |

### Validation Errors

All validation errors follow this format:
```json
{
  "success": false,
  "message": "Primary error message",
  "errors": [
    "Detailed error 1",
    "Detailed error 2"
  ]
}
```

---

## 📄 Response Format

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": {
    // Response data object
  }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description",
  "errors": ["Detailed error messages"] // Optional
}
```

---

## 🔒 Security Features

### Single Device Login
- Only one active session per organization/college
- New login invalidates previous sessions
- Session validation on every request
- Redis-based session storage

### Password Security
- Argon2 hashing algorithm
- Salt-based password storage
- Strong password requirements

### Token Security
- PASETO v4 public tokens
- HTTP-only cookies
- Short-lived access tokens (1 day)
- Refresh tokens for token renewal (7 days)

### Rate Limiting
- OTP requests limited to 1 per minute
- Failed login attempt protection
- IP-based rate limiting via Kong Gateway

### Data Validation
- Zod schema validation
- Input sanitization
- SQL injection prevention
- XSS protection

---

## 🌐 Testing Examples

### Example: Complete Organization Registration Flow

1. **Create Organization**
```bash
curl -X POST http://localhost:8000/auth/api/create-organization \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Tech University",
    "email": "admin@tech.edu",
    "password": "SecurePass123!",
    "recoveryEmail": "recovery@tech.edu",
    "address": "123 Tech Street",
    "phone": "+1234567890"
  }'
```

2. **Verify OTP** (Use sessionToken from step 1)
```bash
curl -X POST http://localhost:8000/auth/api/verify-organization-otp \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@tech.edu",
    "otp": "123456",
    "sessionToken": "your_session_token_here"
  }'
```

3. **Login Organization**
```bash
curl -X POST http://localhost:8000/auth/api/login-organization \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{
    "email": "admin@tech.edu",
    "password": "SecurePass123!"
  }'
```

4. **Test Protected Route**
```bash
curl -X GET http://localhost:8000/auth/api/test-protected \
  -b cookies.txt
```

### Example: College Operations

1. **Create College** (Requires organization login)
```bash
curl -X POST http://localhost:8000/auth/api/create-college \
  -H "Content-Type: application/json" \
  -b org_cookies.txt \
  -d '{
    "name": "Engineering College",
    "email": "admin@eng.tech.edu",
    "password": "CollegePass123!",
    "organizationId": "your_org_id",
    "recoveryEmail": "recovery@eng.tech.edu",
    "phone": "+1234567891"
  }'
```

2. **College Login**
```bash
curl -X POST http://localhost:8000/auth/api/login-college \
  -H "Content-Type: application/json" \
  -c college_cookies.txt \
  -d '{
    "email": "admin@eng.tech.edu",
    "password": "CollegePass123!"
  }'
```

---

## 📞 Support

For technical support or questions about the Auth Service API:

- **Documentation Issues**: Check this documentation
- **API Errors**: Refer to error codes section
- **Authentication Problems**: Verify token format and expiry
- **Rate Limiting**: Check retry-after headers

---

**Last Updated:** October 28, 2024  
**API Version:** 1.0.0  
**Service:** LMS Auth Service
