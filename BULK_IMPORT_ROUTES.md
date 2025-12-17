# Bulk Import API Routes - Kong Configuration

All bulk import routes are configured in Kong Gateway and require authentication (except health check).

## Public Routes (No Auth Required)

### Health Check
- **GET** `/auth/api/bulk/health`
  - Returns service status
  - No authentication required
  - Response: `{"status":"ok","service":"bulk-import-api","timestamp":"..."}`

## Protected Routes (Authentication Required)

All routes below require a valid PASETO token in the `Authorization` header.

### File Upload & Validation

1. **POST** `/auth/api/bulk/upload`
   - Upload CSV/JSON file and create import job
   - **Headers**: `Authorization: Bearer <token>`
   - **Body**: `multipart/form-data`
     - `file`: CSV or JSON file (max 50MB)
     - `importType`: `"student_import"` or `"teacher_import"`
     - `options`: (optional) JSON string with `{skipDuplicates, sendWelcomeEmails}`
   - **Response**: `{success: true, data: {jobId, status}}`
   - **Status**: 202 Accepted

2. **POST** `/auth/api/bulk/validate`
   - Validate file without importing
   - **Headers**: `Authorization: Bearer <token>`
   - **Body**: `multipart/form-data`
     - `file`: CSV or JSON file
     - `importType`: `"student_import"` or `"teacher_import"`
   - **Response**: `{success: true, data: {totalRows, validRows, invalidRows, errors}}`
   - **Status**: 200 OK

### Job Management

3. **GET** `/auth/api/bulk/jobs`
   - List all jobs for the authenticated user
   - **Headers**: `Authorization: Bearer <token>`
   - **Query Parameters**:
     - `limit`: (optional) Number of jobs to return (default: 50)
     - `offset`: (optional) Pagination offset (default: 0)
   - **Response**: `{success: true, data: {jobs: [...], pagination: {...}}}`
   - **Status**: 200 OK

4. **GET** `/auth/api/bulk/jobs/:jobId`
   - Get status of a specific job
   - **Headers**: `Authorization: Bearer <token>`
   - **Path Parameters**: `jobId` - UUID of the job
   - **Response**: `{success: true, data: {id, status, totalRows, successRows, failedRows, errorReportUrl, ...}}`
   - **Status**: 200 OK

5. **POST** `/auth/api/bulk/jobs/:jobId/rollback`
   - Rollback a completed import job (within 24 hours)
   - **Headers**: `Authorization: Bearer <token>`
   - **Path Parameters**: `jobId` - UUID of the job
   - **Response**: `{success: true, message: "Job rolled back successfully", data: {jobId, recordsDeleted}}`
   - **Status**: 200 OK
   - **Errors**: 
     - 400: Job not completed or >24 hours old
     - 403: Unauthorized access
     - 404: Job not found

6. **GET** `/auth/api/bulk/jobs/:jobId/errors`
   - Get error report URL for a job
   - **Headers**: `Authorization: Bearer <token>`
   - **Path Parameters**: `jobId` - UUID of the job
   - **Response**: `{success: true, data: {errorReportUrl, failedRows}}`
   - **Status**: 200 OK
   - **Errors**: 
     - 404: No error report available

## Kong Route Configuration

Routes are configured in `gateway/kong/kong.yaml`:

1. **Health Check Route** (Public)
   - Priority: 20
   - No authentication plugin

2. **Bulk Import Routes** (Protected)
   - `/auth/api/bulk/upload`
   - `/auth/api/bulk/validate`
   - `/auth/api/bulk/jobs`
   - Protected with `paseto-vault-auth-lua` plugin

3. **Job-Specific Routes** (Protected)
   - Regex patterns for job IDs:
     - `~/auth/api/bulk/jobs/[^/]+$` - Get job status
     - `~/auth/api/bulk/jobs/[^/]+/rollback$` - Rollback job
     - `~/auth/api/bulk/jobs/[^/]+/errors$` - Get error report
   - Priority: 10
   - Protected with `paseto-vault-auth-lua` plugin

## Testing Routes

### Health Check (No Auth)
```bash
curl http://localhost:8000/auth/api/bulk/health
```

### Upload File (Requires Auth)
```bash
curl -X POST http://localhost:8000/auth/api/bulk/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@students.csv" \
  -F "importType=student_import"
```

### Get Job Status (Requires Auth)
```bash
curl http://localhost:8000/auth/api/bulk/jobs/JOB_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### List Jobs (Requires Auth)
```bash
curl http://localhost:8000/auth/api/bulk/jobs \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Rollback Job (Requires Auth)
```bash
curl -X POST http://localhost:8000/auth/api/bulk/jobs/JOB_ID/rollback \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Get Error Report (Requires Auth)
```bash
curl http://localhost:8000/auth/api/bulk/jobs/JOB_ID/errors \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Route Priority

Routes are matched in this order:
1. Health check (priority 20) - matches first
2. Job-specific routes (priority 10) - regex patterns
3. General bulk routes (default priority) - exact paths

This ensures:
- Health check is always accessible
- Job-specific routes match before general `/jobs` route
- Proper route matching for all endpoints

