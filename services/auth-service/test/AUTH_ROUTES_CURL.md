# Auth Service - Complete CURL Commands for Testing

**Base URL**: `http://localhost:8000/auth/api` (via Kong Gateway)

**Note**: Replace placeholder values (like `YOUR_TOKEN`, `YOUR_EMAIL`, etc.) with actual values from your test data.

---

## 🔐 Authentication Headers

For protected routes, include the PASETO token:

```bash
Authorization: Bearer YOUR_PASETO_TOKEN
```

Or use cookies (set automatically on login):
```bash
Cookie: accessToken=YOUR_PASETO_TOKEN
```

---

## 📋 Table of Contents

1. [Health Check](#health-check)
2. [Organization Routes](#organization-routes)
3. [College Routes](#college-routes)
4. [Non-Teaching Staff Routes](#non-teaching-staff-routes)
5. [HOD Routes](#hod-routes)
6. [Student Routes](#student-routes)
7. [Teacher Routes](#teacher-routes)
8. [Dean Routes](#dean-routes)
9. [Session Management Routes](#session-management-routes)
10. [Test Protected Route](#test-protected-route)

---

## Health Check

### GET /health
```bash
curl -X GET "http://localhost:8000/auth/api/health"
```

---

## Organization Routes

### POST /create-organization
**Description**: Create organization account (sends OTP)
```bash
curl -X POST "http://localhost:8000/auth/api/create-organization" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test University",
    "email": "admin@university.edu",
    "password": "SecurePass123!",
    "recoveryEmail": "recovery@university.edu",
    "phone": "+1234567890",
    "address": "123 University Street, City, Country"
  }'
```

### POST /verify-organization-otp
**Description**: Verify OTP and create account
```bash
curl -X POST "http://localhost:8000/auth/api/verify-organization-otp" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@university.edu",
    "otp": "123456",
    "sessionToken": "YOUR_SESSION_TOKEN"
  }'
```

### POST /resend-organization-otp
**Description**: Resend OTP (rate limited)
```bash
curl -X POST "http://localhost:8000/auth/api/resend-organization-otp" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@university.edu"
  }'
```

### POST /login-organization
**Description**: Organization login
```bash
curl -X POST "http://localhost:8000/auth/api/login-organization" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@university.edu",
    "password": "SecurePass123!"
  }'
```

### POST /logout-organization
**Description**: Organization logout (protected)
```bash
curl -X POST "http://localhost:8000/auth/api/logout-organization" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_PASETO_TOKEN"
```

### POST /regenerate-access-token-organization
**Description**: Regenerate access token (protected)
```bash
curl -X POST "http://localhost:8000/auth/api/regenerate-access-token-organization" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_REFRESH_TOKEN"
```

### POST /forgot-password-organization
**Description**: Request password reset
```bash
curl -X POST "http://localhost:8000/auth/api/forgot-password-organization" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@university.edu"
  }'
```

### POST /forgot-reset-password-organization
**Description**: Reset password with token
```bash
curl -X POST "http://localhost:8000/auth/api/forgot-reset-password-organization" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@university.edu",
    "token": "YOUR_RESET_TOKEN",
    "password": "NewSecurePass123!"
  }'
```

### POST /reset-password-organization
**Description**: Reset password (authenticated, protected)
```bash
curl -X POST "http://localhost:8000/auth/api/reset-password-organization" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_PASETO_TOKEN" \
  -d '{
    "email": "admin@university.edu",
    "oldPassword": "OldSecurePass123!",
    "newPassword": "NewSecurePass123!"
  }'
```

---

## College Routes

### POST /create-college
**Description**: Create college account (protected - org auth required)
```bash
curl -X POST "http://localhost:8000/auth/api/create-college" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ORG_TOKEN" \
  -d '{
    "name": "Engineering College",
    "email": "college@university.edu",
    "password": "CollegePass123!",
    "organizationId": "YOUR_ORG_ID",
    "recoveryEmail": "recovery@college.edu",
    "phone": "+1234567891",
    "address": "456 College Avenue"
  }'
```

### POST /login-college
**Description**: College login
```bash
curl -X POST "http://localhost:8000/auth/api/login-college" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "college@university.edu",
    "password": "CollegePass123!"
  }'
```

### POST /logout-college
**Description**: College logout (protected)
```bash
curl -X POST "http://localhost:8000/auth/api/logout-college" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_PASETO_TOKEN"
```

### POST /regenerate-access-token-college
**Description**: Regenerate access token (protected)
```bash
curl -X POST "http://localhost:8000/auth/api/regenerate-access-token-college" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_REFRESH_TOKEN"
```

### POST /forgot-password-college
**Description**: Request password reset
```bash
curl -X POST "http://localhost:8000/auth/api/forgot-password-college" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "college@university.edu"
  }'
```

### POST /forgot-reset-password-college
**Description**: Reset password with token
```bash
curl -X POST "http://localhost:8000/auth/api/forgot-reset-password-college" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "college@university.edu",
    "token": "YOUR_RESET_TOKEN",
    "password": "NewCollegePass123!"
  }'
```

### POST /reset-password-college
**Description**: Reset password (authenticated, protected)
```bash
curl -X POST "http://localhost:8000/auth/api/reset-password-college" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_PASETO_TOKEN" \
  -d '{
    "email": "college@university.edu",
    "oldPassword": "OldCollegePass123!",
    "newPassword": "NewCollegePass123!"
  }'
```

---

## Non-Teaching Staff Routes

### POST /create-non-teaching-staff-bulk
**Description**: Create staff members in bulk (protected - college auth required)
```bash
curl -X POST "http://localhost:8000/auth/api/create-non-teaching-staff-bulk" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_COLLEGE_TOKEN" \
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

### POST /login-non-teaching-staff
**Description**: Staff login
```bash
curl -X POST "http://localhost:8000/auth/api/login-non-teaching-staff" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@college.edu",
    "password": "StaffPass123!"
  }'
```

### POST /logout-non-teaching-staff
**Description**: Staff logout (protected)
```bash
curl -X POST "http://localhost:8000/auth/api/logout-non-teaching-staff" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_PASETO_TOKEN"
```

### POST /regenerate-access-token-non-teaching-staff
**Description**: Regenerate access token (protected)
```bash
curl -X POST "http://localhost:8000/auth/api/regenerate-access-token-non-teaching-staff" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_REFRESH_TOKEN"
```

### POST /reset-password-non-teaching-staff
**Description**: Reset password (authenticated, protected)
```bash
curl -X POST "http://localhost:8000/auth/api/reset-password-non-teaching-staff" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_PASETO_TOKEN" \
  -d '{
    "email": "john.doe@college.edu",
    "oldPassword": "OldStaffPass123!",
    "newPassword": "NewStaffPass123!"
  }'
```

### POST /forgot-password-non-teaching-staff
**Description**: Request password reset
```bash
curl -X POST "http://localhost:8000/auth/api/forgot-password-non-teaching-staff" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@college.edu"
  }'
```

### POST /forgot-reset-password-non-teaching-staff
**Description**: Reset password with token
```bash
curl -X POST "http://localhost:8000/auth/api/forgot-reset-password-non-teaching-staff" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@college.edu",
    "token": "YOUR_RESET_TOKEN",
    "password": "NewStaffPass123!"
  }'
```

### POST /add-department
**Description**: Add departments in bulk (protected)
```bash
curl -X POST "http://localhost:8000/auth/api/add-department" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_STAFF_TOKEN" \
  -d '[
    {
      "name": "Computer Science",
      "shortName": "CSE",
      "hodId": "YOUR_HOD_ID"
    },
    {
      "name": "Electrical Engineering",
      "shortName": "EE"
    }
  ]'
```

### POST /add-course
**Description**: Add courses in bulk (protected)
```bash
curl -X POST "http://localhost:8000/auth/api/add-course" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_STAFF_TOKEN" \
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

### POST /add-batch
**Description**: Add batch (protected)
```bash
curl -X POST "http://localhost:8000/auth/api/add-batch" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_STAFF_TOKEN" \
  -d '{
    "courseId": "YOUR_COURSE_ID",
    "batchYear": "2024-2028",
    "batchType": "BTECH"
  }'
```

### POST /add-section
**Description**: Add sections (protected)
```bash
curl -X POST "http://localhost:8000/auth/api/add-section" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_STAFF_TOKEN" \
  -d '{
    "no_of_section": 3,
    "department_id": "YOUR_DEPARTMENT_ID",
    "batch_id": "YOUR_BATCH_ID"
  }'
```

---

## HOD Routes

### POST /create-hod
**Description**: Create HOD account (protected - staff auth required)
```bash
curl -X POST "http://localhost:8000/auth/api/create-hod" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_STAFF_TOKEN" \
  -d '{
    "name": "Dr. HOD Name",
    "email": "hod@college.edu",
    "departmentId": "YOUR_DEPARTMENT_ID"
  }'
```

### POST /login-hod
**Description**: HOD login
```bash
curl -X POST "http://localhost:8000/auth/api/login-hod" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "hod@college.edu",
    "password": "HodPass123!"
  }'
```

### POST /logout-hod
**Description**: HOD logout (protected)
```bash
curl -X POST "http://localhost:8000/auth/api/logout-hod" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_PASETO_TOKEN"
```

### POST /regenerate-access-token-hod
**Description**: Regenerate access token (protected)
```bash
curl -X POST "http://localhost:8000/auth/api/regenerate-access-token-hod" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_REFRESH_TOKEN"
```

### POST /forgot-password-hod
**Description**: Request password reset
```bash
curl -X POST "http://localhost:8000/auth/api/forgot-password-hod" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "hod@college.edu"
  }'
```

### POST /forgot-reset-password-hod
**Description**: Reset password with token
```bash
curl -X POST "http://localhost:8000/auth/api/forgot-reset-password-hod" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "hod@college.edu",
    "token": "YOUR_RESET_TOKEN",
    "password": "NewHodPass123!"
  }'
```

### POST /reset-password-hod
**Description**: Reset password (authenticated, protected)
```bash
curl -X POST "http://localhost:8000/auth/api/reset-password-hod" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_PASETO_TOKEN" \
  -d '{
    "email": "hod@college.edu",
    "oldPassword": "OldHodPass123!",
    "newPassword": "NewHodPass123!"
  }'
```

---

## Student Routes

### POST /create-student-bulk
**Description**: Create students in bulk with auto-allocation (protected - staff auth required)
```bash
curl -X POST "http://localhost:8000/auth/api/create-student-bulk" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_STAFF_TOKEN" \
  -d '{
    "students": [
      {
        "name": "Student One",
        "email": "student1@college.edu",
        "phone": "+1234567894",
        "gender": "MALE"
      },
      {
        "name": "Student Two",
        "email": "student2@college.edu",
        "phone": "+1234567895",
        "gender": "FEMALE"
      }
    ],
    "batchId": "YOUR_BATCH_ID",
    "departmentId": "YOUR_DEPARTMENT_ID",
    "dryRun": false
  }'
```

### POST /login-student
**Description**: Student login (email or regNo)
```bash
# Login with email
curl -X POST "http://localhost:8000/auth/api/login-student" \
  -H "Content-Type: application/json" \
  -d '{
    "identifier": "student1@college.edu",
    "password": "StudentPass123!"
  }'

# Login with registration number
curl -X POST "http://localhost:8000/auth/api/login-student" \
  -H "Content-Type: application/json" \
  -d '{
    "identifier": "REG123456",
    "password": "StudentPass123!"
  }'
```

### POST /logout-student
**Description**: Student logout (protected)
```bash
curl -X POST "http://localhost:8000/auth/api/logout-student" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_PASETO_TOKEN"
```

### POST /regenerate-access-token-student
**Description**: Regenerate access token (protected)
```bash
curl -X POST "http://localhost:8000/auth/api/regenerate-access-token-student" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_REFRESH_TOKEN"
```

### POST /reset-password-student
**Description**: Reset password (authenticated, protected)
```bash
curl -X POST "http://localhost:8000/auth/api/reset-password-student" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_PASETO_TOKEN" \
  -d '{
    "oldPassword": "OldStudentPass123!",
    "newPassword": "NewStudentPass123!"
  }'
```

### POST /forgot-password-student
**Description**: Request password reset (email or regNo)
```bash
# With email
curl -X POST "http://localhost:8000/auth/api/forgot-password-student" \
  -H "Content-Type: application/json" \
  -d '{
    "identifier": "student1@college.edu"
  }'

# With registration number
curl -X POST "http://localhost:8000/auth/api/forgot-password-student" \
  -H "Content-Type: application/json" \
  -d '{
    "identifier": "REG123456"
  }'
```

### POST /forgot-reset-password-student
**Description**: Reset password with token
```bash
curl -X POST "http://localhost:8000/auth/api/forgot-reset-password-student" \
  -H "Content-Type: application/json" \
  -d '{
    "identifier": "student1@college.edu",
    "token": "YOUR_RESET_TOKEN",
    "password": "NewStudentPass123!"
  }'
```

---

## Teacher Routes

### POST /create-teacher-bulk
**Description**: Create teachers in bulk (protected - staff auth required)
```bash
curl -X POST "http://localhost:8000/auth/api/create-teacher-bulk" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_STAFF_TOKEN" \
  -d '[
    {
      "name": "Dr. Teacher One",
      "email": "teacher1@college.edu",
      "phone": "+1234567896",
      "departmentId": "YOUR_DEPARTMENT_ID"
    },
    {
      "name": "Dr. Teacher Two",
      "email": "teacher2@college.edu",
      "phone": "+1234567897",
      "departmentId": "YOUR_DEPARTMENT_ID"
    }
  ]'
```

### POST /login-teacher
**Description**: Teacher login
```bash
curl -X POST "http://localhost:8000/auth/api/login-teacher" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teacher1@college.edu",
    "password": "TeacherPass123!"
  }'
```

### POST /logout-teacher
**Description**: Teacher logout (protected)
```bash
curl -X POST "http://localhost:8000/auth/api/logout-teacher" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_PASETO_TOKEN"
```

### POST /regenerate-access-token-teacher
**Description**: Regenerate access token (protected)
```bash
curl -X POST "http://localhost:8000/auth/api/regenerate-access-token-teacher" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_REFRESH_TOKEN"
```

### POST /reset-password-teacher
**Description**: Reset password (authenticated, protected)
```bash
curl -X POST "http://localhost:8000/auth/api/reset-password-teacher" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_PASETO_TOKEN" \
  -d '{
    "oldPassword": "OldTeacherPass123!",
    "newPassword": "NewTeacherPass123!"
  }'
```

### POST /forgot-password-teacher
**Description**: Request password reset
```bash
curl -X POST "http://localhost:8000/auth/api/forgot-password-teacher" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teacher1@college.edu"
  }'
```

### POST /forgot-reset-password-teacher
**Description**: Reset password with token
```bash
curl -X POST "http://localhost:8000/auth/api/forgot-reset-password-teacher" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teacher1@college.edu",
    "token": "YOUR_RESET_TOKEN",
    "password": "NewTeacherPass123!"
  }'
```

---

## Dean Routes

### POST /create-dean
**Description**: Create dean account (protected - college auth required)
```bash
curl -X POST "http://localhost:8000/auth/api/create-dean" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_COLLEGE_TOKEN" \
  -d '{
    "name": "Dr. Dean Name",
    "email": "dean@college.edu",
    "password": "DeanPass123!",
    "recoveryEmail": "recovery@dean.edu",
    "phone": "+1234567898",
    "address": "789 Dean Street"
  }'
```

### POST /login-dean
**Description**: Dean login
```bash
curl -X POST "http://localhost:8000/auth/api/login-dean" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "dean@college.edu",
    "password": "DeanPass123!"
  }'
```

### POST /logout-dean
**Description**: Dean logout (protected)
```bash
curl -X POST "http://localhost:8000/auth/api/logout-dean" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_PASETO_TOKEN"
```

### POST /regenerate-access-token-dean
**Description**: Regenerate access token (protected)
```bash
curl -X POST "http://localhost:8000/auth/api/regenerate-access-token-dean" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_REFRESH_TOKEN"
```

### POST /reset-password-dean
**Description**: Reset password (authenticated, protected)
```bash
curl -X POST "http://localhost:8000/auth/api/reset-password-dean" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_PASETO_TOKEN" \
  -d '{
    "email": "dean@college.edu",
    "oldPassword": "OldDeanPass123!",
    "newPassword": "NewDeanPass123!"
  }'
```

### POST /forgot-password-dean
**Description**: Request password reset
```bash
curl -X POST "http://localhost:8000/auth/api/forgot-password-dean" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "dean@college.edu"
  }'
```

### POST /forgot-reset-password-dean
**Description**: Reset password with token
```bash
curl -X POST "http://localhost:8000/auth/api/forgot-reset-password-dean" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "dean@college.edu",
    "token": "YOUR_RESET_TOKEN",
    "password": "NewDeanPass123!"
  }'
```

---

## Session Management Routes

### GET /student/me/session
**Description**: Get current session details (protected - student auth required)
```bash
curl -X GET "http://localhost:8000/auth/api/student/me/session" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_PASETO_TOKEN" \
  -H "x-user-session-id: YOUR_SESSION_ID"
```

### POST /student/me/logout-all
**Description**: Logout from all devices (protected - student auth required)
```bash
curl -X POST "http://localhost:8000/auth/api/student/me/logout-all" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_PASETO_TOKEN"
```

### POST /admin/force-logout
**Description**: Admin force logout user (protected - college auth required)
```bash
curl -X POST "http://localhost:8000/auth/api/admin/force-logout" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_COLLEGE_TOKEN" \
  -d '{
    "userId": "USER_ID_TO_LOGOUT",
    "userType": "student"
  }'
```

---

## Test Protected Route

### GET /test-protected
**Description**: Test protected route (protected - all user types)
```bash
curl -X GET "http://localhost:8000/auth/api/test-protected" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_PASETO_TOKEN"
```

---

## 📝 Notes

1. **Password Requirements**: All passwords must be at least 8 characters (12+ for new accounts) and include:
   - At least one uppercase letter
   - At least one lowercase letter
   - At least one number
   - At least one special character (!@#$%^&*)

2. **Rate Limiting**: 
   - Global: 100 requests per 15 minutes per IP
   - Login endpoints: 5 attempts per minute per IP
   - OTP resend: Rate limited

3. **Account Lockout**: 
   - After 5 failed login attempts, account is locked for 15 minutes
   - Returns HTTP 423 when locked

4. **Single Device Login**: All login endpoints enforce single-device login (previous sessions are invalidated)

5. **Token Format**: PASETO v4 tokens are used for authentication

6. **Session Management**: Session ID is included in the `x-user-session-id` header for session validation

---

## 🔄 Testing Workflow Example

1. **Create Organization** → Get session token
2. **Verify OTP** → Organization created
3. **Login Organization** → Get access token and refresh token
4. **Create College** (using org token)
5. **Login College** → Get college tokens
6. **Create Staff** (using college token)
7. **Login Staff** → Get staff tokens
8. **Add Department** (using staff token)
9. **Add Course** (using staff token)
10. **Add Batch** (using staff token)
11. **Add Section** (using staff token)
12. **Create Students** (using staff token)
13. **Login Student** → Get student tokens
14. **Test Session Management** (using student token)

---

## 🐛 Troubleshooting

- **401 Unauthorized**: Check if token is valid and not expired
- **403 Forbidden**: Check if user has required permissions
- **423 Locked**: Account is locked due to failed login attempts (wait 15 minutes)
- **429 Too Many Requests**: Rate limit exceeded (wait before retrying)
- **400 Bad Request**: Check request body format and required fields
- **404 Not Found**: Check if endpoint path is correct

---

**Last Updated**: 2025-12-16

