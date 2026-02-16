# API Endpoints Documentation Summary

## 📊 Complete Endpoint List

### Health (1 endpoint)
- `GET /health` - Health check

### Organization (9 endpoints)
- `POST /create-organization` - Create organization account (sends OTP)
- `POST /verify-organization-otp` - Verify OTP and create account
- `POST /resend-organization-otp` - Resend OTP (rate limited)
- `POST /login-organization` - Organization login
- `POST /logout-organization` - Organization logout (protected)
- `POST /regenerate-access-token-organization` - Regenerate access token (protected)
- `POST /forgot-password-organization` - Request password reset
- `POST /forgot-reset-password-organization` - Reset password with token
- `POST /reset-password-organization` - Reset password (authenticated, protected)

### College (7 endpoints)
- `POST /create-college` - Create college account (protected - org auth required)
- `POST /login-college` - College login
- `POST /logout-college` - College logout (protected)
- `POST /regenerate-access-token-college` - Regenerate access token (protected)
- `POST /forgot-password-college` - Request password reset
- `POST /forgot-reset-password-college` - Reset password with token
- `POST /reset-password-college` - Reset password (authenticated, protected)

### Non-Teaching Staff (11 endpoints)
- `POST /create-non-teaching-staff-bulk` - Create staff members in bulk (protected - college auth required)
- `POST /login-non-teaching-staff` - Staff login
- `POST /logout-non-teaching-staff` - Staff logout (protected)
- `POST /regenerate-access-token-non-teaching-staff` - Regenerate access token (protected)
- `POST /reset-password-non-teaching-staff` - Reset password (authenticated, protected)
- `POST /forgot-password-non-teaching-staff` - Request password reset
- `POST /forgot-reset-password-non-teaching-staff` - Reset password with token
- `POST /add-department` - Add departments in bulk (protected)
- `POST /add-course` - Add courses in bulk (protected)
- `POST /add-batch` - Add batch (protected)
- `POST /add-section` - Add sections (protected)

### HOD (7 endpoints)
- `POST /create-hod` - Create HOD account (protected - staff auth required)
- `POST /login-hod` - HOD login
- `POST /logout-hod` - HOD logout (protected)
- `POST /regenerate-access-token-hod` - Regenerate access token (protected)
- `POST /forgot-password-hod` - Request password reset
- `POST /forgot-reset-password-hod` - Reset password with token
- `POST /reset-password-hod` - Reset password (authenticated, protected)

### Student (7 endpoints)
- `POST /create-student-bulk` - Create students in bulk with auto-allocation (protected - staff auth required)
- `POST /login-student` - Student login (email or regNo)
- `POST /logout-student` - Student logout (protected)
- `POST /regenerate-access-token-student` - Regenerate access token (protected)
- `POST /reset-password-student` - Reset password (authenticated, protected)
- `POST /forgot-password-student` - Request password reset (email or regNo)
- `POST /forgot-reset-password-student` - Reset password with token

### Testing (1 endpoint)
- `GET /test-protected` - Test protected route (protected - all user types)

## 🔐 Authentication

All protected endpoints require:
- **Header**: `Authorization: Bearer <paseto_token>`
- **OR**: HTTP-only cookie (automatically set on login)

## 📝 Notes

- **Single Device Login**: All login endpoints enforce single-device login (previous sessions are invalidated)
- **Rate Limiting**: OTP resend endpoints are rate limited
- **Bulk Operations**: Staff and student creation support bulk operations
- **Dry Run**: Student bulk creation supports `dryRun` mode for preview
- **Gender Balance**: Student creation automatically balances gender distribution across sections
- **Auto-Allocation**: Student creation automatically allocates students to sections based on capacity and gender balance

## 📚 Access Documentation

- **API docs (Scalar)**: http://localhost:8000/auth/api/api-docs
- **Direct Service**: http://localhost:4001/api-docs

