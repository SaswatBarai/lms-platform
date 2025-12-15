# Auth Service - Complete Route Testing Guide

This document provides comprehensive testing instructions for all routes in the Auth Service.

## Base URLs

```bash
# Via Kong Gateway (Recommended)
BASE_URL="http://localhost:8000"

# Direct Service (Internal/Development)
# BASE_URL="http://localhost:4001"
```

## Prerequisites

1. Ensure all services are running:
   ```bash
   docker-compose ps
   ```

2. Access Swagger UI for interactive testing:
   - http://localhost:8000/auth/api/api-docs

3. Save cookies for authenticated requests:
   ```bash
   # Use -c cookies.txt to save cookies
   # Use -b cookies.txt to send cookies
   ```

---

## Test Flow Overview

```
1. Create Organization → Verify OTP → Login Organization
2. Create College (with org token) → Login College
3. Create Non-Teaching Staff (with college token) → Login Staff
4. Add Departments → Add Courses → Add Batches → Add Sections
5. Create HOD (with staff token) → Login HOD
6. Create Students (with staff token) → Login Student
7. Create Teachers (with staff token) → Login Teacher
8. Create Dean (with college token) → Login Dean
```

---

## 1. Health Check

### GET /health
```bash
curl -X GET "${BASE_URL}/auth/api/health"
```

**Expected Response:**
```json
{
  "status": "ok"
}
```

---

## 2. Organization Routes

### 2.1 Create Organization
**POST** `/auth/api/create-organization`

```bash
curl -X POST "${BASE_URL}/auth/api/create-organization" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test University",
    "email": "admin@university.edu",
    "password": "SecurePassword123!",
    "recoveryEmail": "recovery@university.edu",
    "phone": "+1234567890",
    "address": "123 University Street, City, Country"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "OTP sent successfully",
  "data": {
    "email": "admin@university.edu",
    "sessionToken": "abc123..."
  }
}
```

**Save the `sessionToken` for next step!**

---

### 2.2 Verify Organization OTP
**POST** `/auth/api/verify-organization-otp`

```bash
# Replace OTP and sessionToken with actual values
curl -X POST "${BASE_URL}/auth/api/verify-organization-otp" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@university.edu",
    "otp": "123456",
    "sessionToken": "your-session-token-here"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Organization created successfully"
}
```

---

### 2.3 Resend Organization OTP
**POST** `/auth/api/resend-organization-otp`

```bash
curl -X POST "${BASE_URL}/auth/api/resend-organization-otp" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@university.edu"
  }'
```

**Note:** Rate limited - 5 attempts per minute

---

### 2.4 Login Organization
**POST** `/auth/api/login-organization`

```bash
curl -X POST "${BASE_URL}/auth/api/login-organization" \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{
    "email": "admin@university.edu",
    "password": "SecurePassword123!"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "accessToken": "v4.public.eyJ...",
    "organization": {
      "id": "org-id",
      "name": "Test University",
      "email": "admin@university.edu"
    }
  }
}
```

**Save the `accessToken` for protected routes!**

**Security Features Tested:**
- ✅ Account lockout check (after 5 failed attempts)
- ✅ Rate limiting (5 attempts per minute)
- ✅ Single device login enforcement

---

### 2.5 Logout Organization
**POST** `/auth/api/logout-organization` (Protected)

```bash
curl -X POST "${BASE_URL}/auth/api/logout-organization" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ORG_ACCESS_TOKEN" \
  -b cookies.txt
```

---

### 2.6 Regenerate Access Token Organization
**POST** `/auth/api/regenerate-access-token-organization` (Protected)

```bash
curl -X POST "${BASE_URL}/auth/api/regenerate-access-token-organization" \
  -H "Content-Type: application/json" \
  -b cookies.txt
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Tokens rotated successfully",
  "data": {
    "accessToken": "v4.public.eyJ..."
  }
}
```

**Security Features Tested:**
- ✅ Token rotation (old token invalidated)
- ✅ Token reuse detection
- ✅ New session ID and token family

---

### 2.7 Forgot Password Organization
**POST** `/auth/api/forgot-password-organization`

```bash
curl -X POST "${BASE_URL}/auth/api/forgot-password-organization" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@university.edu"
  }'
```

---

### 2.8 Reset Forgot Password Organization
**POST** `/auth/api/forgot-reset-password-organization`

```bash
curl -X POST "${BASE_URL}/auth/api/forgot-reset-password-organization" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@university.edu",
    "token": "reset-token-from-email",
    "password": "NewSecurePassword123!"
  }'
```

---

### 2.9 Reset Password Organization (Authenticated)
**POST** `/auth/api/reset-password-organization` (Protected)

```bash
curl -X POST "${BASE_URL}/auth/api/reset-password-organization" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ORG_ACCESS_TOKEN" \
  -d '{
    "email": "admin@university.edu",
    "oldPassword": "SecurePassword123!",
    "newPassword": "NewSecurePassword123!"
  }'
```

**Security Features Tested:**
- ✅ Password policy validation (12+ chars, complexity)
- ✅ Password history check (cannot reuse last 5)
- ✅ Session revocation on password change

---

## 3. College Routes

### 3.1 Create College
**POST** `/auth/api/create-college` (Protected - Requires Organization Auth)

```bash
curl -X POST "${BASE_URL}/auth/api/create-college" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ORG_ACCESS_TOKEN" \
  -d '{
    "name": "Engineering College",
    "email": "admin@college.edu",
    "password": "CollegePassword123!",
    "organizationId": "org-id-here",
    "recoveryEmail": "recovery@college.edu",
    "phone": "+1234567891"
  }'
```

---

### 3.2 Login College
**POST** `/auth/api/login-college`

```bash
curl -X POST "${BASE_URL}/auth/api/login-college" \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{
    "email": "admin@college.edu",
    "password": "CollegePassword123!"
  }'
```

**Security Features Tested:**
- ✅ Account lockout check
- ✅ Rate limiting
- ✅ Single device login

---

### 3.3 Logout College
**POST** `/auth/api/logout-college` (Protected)

```bash
curl -X POST "${BASE_URL}/auth/api/logout-college" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_COLLEGE_ACCESS_TOKEN" \
  -b cookies.txt
```

---

### 3.4 Regenerate Access Token College
**POST** `/auth/api/regenerate-access-token-college` (Protected)

```bash
curl -X POST "${BASE_URL}/auth/api/regenerate-access-token-college" \
  -H "Content-Type: application/json" \
  -b cookies.txt
```

---

### 3.5 Forgot Password College
**POST** `/auth/api/forgot-password-college`

```bash
curl -X POST "${BASE_URL}/auth/api/forgot-password-college" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@college.edu"
  }'
```

---

### 3.6 Reset Forgot Password College
**POST** `/auth/api/forgot-reset-password-college`

```bash
curl -X POST "${BASE_URL}/auth/api/forgot-reset-password-college" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@college.edu",
    "token": "reset-token-from-email",
    "password": "NewCollegePassword123!"
  }'
```

---

### 3.7 Reset Password College (Authenticated)
**POST** `/auth/api/reset-password-college` (Protected)

```bash
curl -X POST "${BASE_URL}/auth/api/reset-password-college" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_COLLEGE_ACCESS_TOKEN" \
  -d '{
    "email": "admin@college.edu",
    "oldPassword": "CollegePassword123!",
    "newPassword": "NewCollegePassword123!"
  }'
```

---

## 4. Non-Teaching Staff Routes

### 4.1 Create Non-Teaching Staff Bulk
**POST** `/auth/api/create-non-teaching-staff-bulk` (Protected - Requires College Auth)

```bash
curl -X POST "${BASE_URL}/auth/api/create-non-teaching-staff-bulk" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_COLLEGE_ACCESS_TOKEN" \
  -d '[
    {
      "name": "John Doe",
      "email": "john.doe@college.edu",
      "phone": "+1234567892",
      "role": "studentsection"
    },
    {
      "name": "Jane Smith",
      "email": "jane.smith@college.edu",
      "phone": "+1234567893",
      "role": "regestral"
    }
  ]'
```

---

### 4.2 Login Non-Teaching Staff
**POST** `/auth/api/login-non-teaching-staff`

```bash
curl -X POST "${BASE_URL}/auth/api/login-non-teaching-staff" \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{
    "email": "john.doe@college.edu",
    "password": "TempPassword123!"
  }'
```

---

### 4.3 Logout Non-Teaching Staff
**POST** `/auth/api/logout-non-teaching-staff` (Protected)

```bash
curl -X POST "${BASE_URL}/auth/api/logout-non-teaching-staff" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_STAFF_ACCESS_TOKEN" \
  -b cookies.txt
```

---

### 4.4 Regenerate Access Token Non-Teaching Staff
**POST** `/auth/api/regenerate-access-token-non-teaching-staff` (Protected)

```bash
curl -X POST "${BASE_URL}/auth/api/regenerate-access-token-non-teaching-staff" \
  -H "Content-Type: application/json" \
  -b cookies.txt
```

---

### 4.5 Reset Password Non-Teaching Staff
**POST** `/auth/api/reset-password-non-teaching-staff` (Protected)

```bash
curl -X POST "${BASE_URL}/auth/api/reset-password-non-teaching-staff" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_STAFF_ACCESS_TOKEN" \
  -d '{
    "email": "john.doe@college.edu",
    "oldPassword": "OldPassword123!",
    "newPassword": "NewPassword123!"
  }'
```

---

### 4.6 Forgot Password Non-Teaching Staff
**POST** `/auth/api/forgot-password-non-teaching-staff`

```bash
curl -X POST "${BASE_URL}/auth/api/forgot-password-non-teaching-staff" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@college.edu"
  }'
```

---

### 4.7 Reset Forgot Password Non-Teaching Staff
**POST** `/auth/api/forgot-reset-password-non-teaching-staff`

```bash
curl -X POST "${BASE_URL}/auth/api/forgot-reset-password-non-teaching-staff" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@college.edu",
    "token": "reset-token-from-email",
    "password": "NewPassword123!"
  }'
```

---

### 4.8 Add Department (Bulk)
**POST** `/auth/api/add-department` (Protected - Requires Non-Teaching Staff Auth)

```bash
curl -X POST "${BASE_URL}/auth/api/add-department" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_STAFF_ACCESS_TOKEN" \
  -d '[
    {
      "name": "Computer Science",
      "shortName": "CS"
    },
    {
      "name": "Electrical Engineering",
      "shortName": "EE"
    }
  ]'
```

**Save department IDs for later steps!**

---

### 4.9 Add Course (Bulk)
**POST** `/auth/api/add-course` (Protected)

```bash
curl -X POST "${BASE_URL}/auth/api/add-course" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_STAFF_ACCESS_TOKEN" \
  -d '[
    {
      "name": "BACHELOR_OF_TECHNOLOGY",
      "shortName": "BTECH"
    },
    {
      "name": "MASTER_OF_TECHNOLOGY",
      "shortName": "MTECH"
    }
  ]'
```

**Save course IDs for next step!**

---

### 4.10 Add Batch
**POST** `/auth/api/add-batch` (Protected)

```bash
curl -X POST "${BASE_URL}/auth/api/add-batch" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_STAFF_ACCESS_TOKEN" \
  -d '[
    {
      "courseId": "course-id-here",
      "batchYear": "2024-2028",
      "batchType": "BTECH"
    }
  ]'
```

**Save batch ID for student creation!**

---

### 4.11 Add Section
**POST** `/auth/api/add-section` (Protected)

```bash
curl -X POST "${BASE_URL}/auth/api/add-section" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_STAFF_ACCESS_TOKEN" \
  -d '{
    "no_of_section": 3,
    "department_id": "dept-id-here",
    "batch_id": "batch-id-here"
  }'
```

---

## 5. HOD Routes

### 5.1 Create HOD
**POST** `/auth/api/create-hod` (Protected - Requires Non-Teaching Staff Auth)

```bash
curl -X POST "${BASE_URL}/auth/api/create-hod" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_STAFF_ACCESS_TOKEN" \
  -d '{
    "name": "Dr. John Smith",
    "email": "hod.cs@college.edu",
    "departmentId": "dept-id-here"
  }'
```

---

### 5.2 Login HOD
**POST** `/auth/api/login-hod`

```bash
curl -X POST "${BASE_URL}/auth/api/login-hod" \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{
    "email": "hod.cs@college.edu",
    "password": "TempPassword123!"
  }'
```

---

### 5.3 Logout HOD
**POST** `/auth/api/logout-hod` (Protected)

```bash
curl -X POST "${BASE_URL}/auth/api/logout-hod" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_HOD_ACCESS_TOKEN" \
  -b cookies.txt
```

---

### 5.4 Regenerate Access Token HOD
**POST** `/auth/api/regenerate-access-token-hod` (Protected)

```bash
curl -X POST "${BASE_URL}/auth/api/regenerate-access-token-hod" \
  -H "Content-Type: application/json" \
  -b cookies.txt
```

---

### 5.5 Forgot Password HOD
**POST** `/auth/api/forgot-password-hod`

```bash
curl -X POST "${BASE_URL}/auth/api/forgot-password-hod" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "hod.cs@college.edu"
  }'
```

---

### 5.6 Reset Forgot Password HOD
**POST** `/auth/api/forgot-reset-password-hod`

```bash
curl -X POST "${BASE_URL}/auth/api/forgot-reset-password-hod" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "hod.cs@college.edu",
    "token": "reset-token-from-email",
    "password": "NewPassword123!"
  }'
```

---

### 5.7 Reset Password HOD
**POST** `/auth/api/reset-password-hod` (Protected)

```bash
curl -X POST "${BASE_URL}/auth/api/reset-password-hod" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_HOD_ACCESS_TOKEN" \
  -d '{
    "email": "hod.cs@college.edu",
    "oldPassword": "OldPassword123!",
    "newPassword": "NewPassword123!"
  }'
```

---

## 6. Student Routes

### 6.1 Create Student Bulk
**POST** `/auth/api/create-student-bulk` (Protected - Requires Non-Teaching Staff Auth)

```bash
curl -X POST "${BASE_URL}/auth/api/create-student-bulk" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_STAFF_ACCESS_TOKEN" \
  -d '{
    "students": [
      {
        "name": "Alice Johnson",
        "email": "alice@college.edu",
        "phone": "+1234567894",
        "gender": "FEMALE"
      },
      {
        "name": "Bob Smith",
        "email": "bob@college.edu",
        "phone": "+1234567895",
        "gender": "MALE"
      }
    ],
    "batchId": "batch-id-here",
    "departmentId": "dept-id-here",
    "dryRun": false
  }'
```

**Note:** Use `dryRun: true` to preview allocation without creating students.

---

### 6.2 Login Student
**POST** `/auth/api/login-student`

```bash
# Login with email
curl -X POST "${BASE_URL}/auth/api/login-student" \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{
    "identifier": "alice@college.edu",
    "password": "TempPassword123!"
  }'

# OR login with registration number
curl -X POST "${BASE_URL}/auth/api/login-student" \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{
    "identifier": "REG123456",
    "password": "TempPassword123!"
  }'
```

---

### 6.3 Logout Student
**POST** `/auth/api/logout-student` (Protected)

```bash
curl -X POST "${BASE_URL}/auth/api/logout-student" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_STUDENT_ACCESS_TOKEN" \
  -b cookies.txt
```

---

### 6.4 Regenerate Access Token Student
**POST** `/auth/api/regenerate-access-token-student` (Protected)

```bash
curl -X POST "${BASE_URL}/auth/api/regenerate-access-token-student" \
  -H "Content-Type: application/json" \
  -b cookies.txt
```

---

### 6.5 Reset Password Student
**POST** `/auth/api/reset-password-student` (Protected)

```bash
curl -X POST "${BASE_URL}/auth/api/reset-password-student" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_STUDENT_ACCESS_TOKEN" \
  -d '{
    "oldPassword": "OldPassword123!",
    "newPassword": "NewPassword123!"
  }'
```

---

### 6.6 Forgot Password Student
**POST** `/auth/api/forgot-password-student`

```bash
# Can use email or registration number
curl -X POST "${BASE_URL}/auth/api/forgot-password-student" \
  -H "Content-Type: application/json" \
  -d '{
    "identifier": "alice@college.edu"
  }'
```

---

### 6.7 Reset Forgot Password Student
**POST** `/auth/api/forgot-reset-password-student`

```bash
curl -X POST "${BASE_URL}/auth/api/forgot-reset-password-student" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "alice@college.edu",
    "token": "64-character-hex-token-from-email",
    "password": "NewPassword123!"
  }'
```

---

## 7. Teacher Routes

### 7.1 Create Teacher Bulk
**POST** `/auth/api/create-teacher-bulk` (Protected - Requires Non-Teaching Staff Auth)

```bash
curl -X POST "${BASE_URL}/auth/api/create-teacher-bulk" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_STAFF_ACCESS_TOKEN" \
  -d '{
    "collegeId": "college-id-here",
    "teachers": [
      {
        "name": "Dr. Alice Johnson",
        "email": "alice.johnson@college.edu",
        "phone": "+1234567896",
        "gender": "FEMALE",
        "departmentId": "dept-id-here"
      }
    ]
  }'
```

---

### 7.2 Login Teacher
**POST** `/auth/api/login-teacher`

```bash
# Login with email
curl -X POST "${BASE_URL}/auth/api/login-teacher" \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{
    "identifier": "alice.johnson@college.edu",
    "password": "TempPassword123!"
  }'

# OR login with employee number
curl -X POST "${BASE_URL}/auth/api/login-teacher" \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{
    "identifier": "EMP001",
    "password": "TempPassword123!"
  }'
```

---

### 7.3 Logout Teacher
**POST** `/auth/api/logout-teacher` (Protected)

```bash
curl -X POST "${BASE_URL}/auth/api/logout-teacher" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TEACHER_ACCESS_TOKEN" \
  -b cookies.txt
```

---

### 7.4 Regenerate Access Token Teacher
**POST** `/auth/api/regenerate-access-token-teacher` (Protected)

```bash
curl -X POST "${BASE_URL}/auth/api/regenerate-access-token-teacher" \
  -H "Content-Type: application/json" \
  -b cookies.txt
```

---

### 7.5 Reset Password Teacher
**POST** `/auth/api/reset-password-teacher` (Protected)

```bash
curl -X POST "${BASE_URL}/auth/api/reset-password-teacher" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TEACHER_ACCESS_TOKEN" \
  -d '{
    "oldPassword": "OldPassword123!",
    "newPassword": "NewPassword123!"
  }'
```

---

### 7.6 Forgot Password Teacher
**POST** `/auth/api/forgot-password-teacher`

```bash
curl -X POST "${BASE_URL}/auth/api/forgot-password-teacher" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "alice.johnson@college.edu"
  }'
```

---

### 7.7 Reset Forgot Password Teacher
**POST** `/auth/api/forgot-reset-password-teacher`

```bash
curl -X POST "${BASE_URL}/auth/api/forgot-reset-password-teacher" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "alice.johnson@college.edu",
    "sessionToken": "reset-token-from-email",
    "newPassword": "NewPassword123!"
  }'
```

---

## 8. Dean Routes

### 8.1 Create Dean
**POST** `/auth/api/create-dean` (Protected - Requires College Auth)

```bash
curl -X POST "${BASE_URL}/auth/api/create-dean" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_COLLEGE_ACCESS_TOKEN" \
  -d '{
    "mailId": "dean@college.edu"
  }'
```

---

### 8.2 Login Dean
**POST** `/auth/api/login-dean`

```bash
curl -X POST "${BASE_URL}/auth/api/login-dean" \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{
    "mailId": "dean@college.edu",
    "password": "TempPassword123!"
  }'
```

---

### 8.3 Logout Dean
**POST** `/auth/api/logout-dean` (Protected)

```bash
curl -X POST "${BASE_URL}/auth/api/logout-dean" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_DEAN_ACCESS_TOKEN" \
  -b cookies.txt
```

---

### 8.4 Regenerate Access Token Dean
**POST** `/auth/api/regenerate-access-token-dean` (Protected)

```bash
curl -X POST "${BASE_URL}/auth/api/regenerate-access-token-dean" \
  -H "Content-Type: application/json" \
  -b cookies.txt
```

---

### 8.5 Reset Password Dean
**POST** `/auth/api/reset-password-dean` (Protected)

```bash
curl -X POST "${BASE_URL}/auth/api/reset-password-dean" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_DEAN_ACCESS_TOKEN" \
  -d '{
    "email": "dean@college.edu",
    "oldPassword": "OldPassword123!",
    "newPassword": "NewPassword123!"
  }'
```

---

### 8.6 Forgot Password Dean
**POST** `/auth/api/forgot-password-dean`

```bash
curl -X POST "${BASE_URL}/auth/api/forgot-password-dean" \
  -H "Content-Type: application/json" \
  -d '{
    "mailId": "dean@college.edu"
  }'
```

---

### 8.7 Reset Forgot Password Dean
**POST** `/auth/api/forgot-reset-password-dean`

```bash
curl -X POST "${BASE_URL}/auth/api/forgot-reset-password-dean" \
  -H "Content-Type: application/json" \
  -d '{
    "mailId": "dean@college.edu",
    "sessionToken": "reset-token-from-email",
    "newPassword": "NewPassword123!"
  }'
```

---

## 9. Test Protected Route

### GET /auth/api/test-protected
**GET** `/auth/api/test-protected` (Protected - Requires Any Valid Token)

```bash
curl -X GET "${BASE_URL}/auth/api/test-protected" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Authentication successful - You have access to this protected resource",
  "data": {
    "message": "This is a protected endpoint that requires valid PASETO authentication",
    "user": {
      "id": "user-id",
      "email": "user@example.com",
      "role": "student",
      "organizationId": "org-id",
      "collegeId": "college-id"
    },
    "timestamp": "2025-12-15T19:00:00.000Z",
    "endpoint": "/api/test-protected"
  }
}
```

---

## Security Testing Scenarios

### Test Account Lockout
```bash
# Attempt login 6 times with wrong password
for i in {1..6}; do
  curl -X POST "${BASE_URL}/auth/api/login-organization" \
    -H "Content-Type: application/json" \
    -d '{
      "email": "admin@university.edu",
      "password": "WrongPassword123!"
    }'
  echo "Attempt $i"
done

# 6th attempt should return 423 Locked
```

### Test Rate Limiting
```bash
# Make 101 requests rapidly
for i in {1..101}; do
  curl -X GET "${BASE_URL}/auth/api/health"
done

# 101st request should return 429 Too Many Requests
```

### Test Password Policy
```bash
# Try weak password (should fail)
curl -X POST "${BASE_URL}/auth/api/reset-password-organization" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "email": "admin@university.edu",
    "oldPassword": "SecurePassword123!",
    "newPassword": "weak"
  }'

# Try password without uppercase (should fail)
curl -X POST "${BASE_URL}/auth/api/reset-password-organization" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "email": "admin@university.edu",
    "oldPassword": "SecurePassword123!",
    "newPassword": "password123!"
  }'
```

### Test Token Rotation
```bash
# Regenerate token first time
TOKEN1=$(curl -X POST "${BASE_URL}/auth/api/regenerate-access-token-organization" \
  -b cookies.txt | jq -r '.data.accessToken')

# Try to use old refresh token (should fail)
curl -X POST "${BASE_URL}/auth/api/regenerate-access-token-organization" \
  -b cookies.txt

# Should return 401 Unauthorized (token already used)
```

### Test Password History
```bash
# Reset password
curl -X POST "${BASE_URL}/auth/api/reset-password-organization" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"email": "...", "oldPassword": "...", "newPassword": "Password123!"}'

# Try to reset to same password again (should fail)
curl -X POST "${BASE_URL}/auth/api/reset-password-organization" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"email": "...", "oldPassword": "Password123!", "newPassword": "Password123!"}'

# Should return 400 Bad Request (cannot reuse last 5 passwords)
```

---

## Complete Test Script

Save this as `test-all-routes.sh`:

```bash
#!/bin/bash

BASE_URL="http://localhost:8000"

echo "=== Testing Auth Service Routes ==="

# Health Check
echo "1. Health Check..."
curl -X GET "${BASE_URL}/auth/api/health"
echo -e "\n"

# Create Organization
echo "2. Create Organization..."
ORG_RESPONSE=$(curl -s -X POST "${BASE_URL}/auth/api/create-organization" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test University",
    "email": "admin@university.edu",
    "password": "SecurePassword123!",
    "recoveryEmail": "recovery@university.edu",
    "phone": "+1234567890",
    "address": "123 University Street"
  }')
echo "$ORG_RESPONSE"
SESSION_TOKEN=$(echo "$ORG_RESPONSE" | jq -r '.data.sessionToken')
echo -e "\n"

# Verify OTP (replace with actual OTP from email/logs)
echo "3. Verify OTP..."
echo "⚠️  Replace OTP with actual value from notification service logs"
# curl -X POST "${BASE_URL}/auth/api/verify-organization-otp" \
#   -H "Content-Type: application/json" \
#   -d "{\"email\": \"admin@university.edu\", \"otp\": \"123456\", \"sessionToken\": \"$SESSION_TOKEN\"}"

echo -e "\n=== Test Complete ==="
```

---

## Notes

1. **Password Requirements:**
   - Minimum 12 characters
   - Must contain: uppercase, lowercase, number, special character (!@#$%^&*)
   - Password strength score ≥ 3 (zxcvbn)
   - Cannot reuse last 5 passwords

2. **Rate Limiting:**
   - Global: 100 requests per 15 minutes per IP
   - Login endpoints: 5 attempts per minute per IP

3. **Account Lockout:**
   - After 5 failed login attempts
   - Locked for 15 minutes
   - Returns HTTP 423

4. **Token Rotation:**
   - Old refresh token is invalidated
   - New tokens issued with new session ID
   - Token reuse detection prevents replay attacks

5. **Session Management:**
   - Single device login enforced
   - All sessions revoked on password change
   - Tokens stored in HTTP-only cookies

6. **Testing Tips:**
   - Use `-c cookies.txt` to save cookies
   - Use `-b cookies.txt` to send cookies
   - Check notification service logs for OTPs in console mode
   - Use Swagger UI for interactive testing: http://localhost:8000/auth/api/api-docs

---

## Quick Reference

| Endpoint | Method | Auth Required | Rate Limit |
|----------|--------|---------------|------------|
| `/health` | GET | No | Global |
| `/create-organization` | POST | No | Global |
| `/verify-organization-otp` | POST | No | Global |
| `/login-*` | POST | No | 5/min |
| `/logout-*` | POST | Yes | Global |
| `/regenerate-access-token-*` | POST | Yes | Global |
| `/reset-password-*` | POST | Yes | Global |
| `/forgot-password-*` | POST | No | Global |
| `/forgot-reset-password-*` | POST | No | Global |
| `/create-*` | POST | Yes | Global |

---

**Last Updated:** 2025-12-15
**Service Version:** 1.0.0

