# Phase 3: Bulk Import Verification Guide

This guide will help you verify all Phase 3 bulk import functionality.

## Prerequisites

1. **Start all services:**
```bash
docker-compose up -d
```

2. **Get valid IDs from database:**
```bash
# Get Department ID
docker exec -it postgres_cont psql -U lms_user -d lms_db -c "SELECT id, name FROM \"Department\" LIMIT 5;"

# Get Batch ID
docker exec -it postgres_cont psql -U lms_user -d lms_db -c "SELECT id, \"batchYear\" FROM \"Batch\" LIMIT 5;"

# Get Section ID
docker exec -it postgres_cont psql -U lms_user -d lms_db -c "SELECT id, \"sectionNo\" FROM \"Section\" LIMIT 5;"
```

3. **Get Access Token:**
```bash
# Login as college admin or non-teaching staff
curl -X POST http://localhost:8000/auth/api/login-college \
  -H "Content-Type: application/json" \
  -d '{"email":"your_email@college.edu","password":"your_password"}'

# Save the accessToken from response
export ACCESS_TOKEN="<your_access_token>"
```

## Part 1: Generate Test Data

### Generate 5000-row CSV (for V3.1-V3.3, V3.7)
```bash
DEPT_ID=<dept_id> BATCH_ID=<batch_id> SECTION_ID=<section_id> node generate-csv.js
```

### Generate Invalid CSV (for V3.4-V3.5)
```bash
DEPT_ID=<dept_id> BATCH_ID=<batch_id> SECTION_ID=<section_id> node generate-invalid-csv.js
```

## Part 2: Automated Tests (V3.1-V3.3)

Run the automated verification script:

```bash
ACCESS_TOKEN=$ACCESS_TOKEN ./verify-phase-3.sh
```

This will test:
- **V3.1**: CSV upload returns job ID immediately
- **V3.2**: Import happens asynchronously
- **V3.3**: Progress visible via API

Expected output:
```
✅ Upload Success (Job ID: xxx)
✅ V3.1 Passed: Upload took 2s (<10s requirement)
✅ V3.2 Passed: Job created asynchronously
✅ V3.3 Passed: Job completed successfully
   Total Rows: 5000
   Success: 5000
   Failed: 0
```

## Part 3: Manual Tests (V3.4-V3.8)

### V3.4: Error Reporting

**Test:** Upload invalid CSV and verify error report

```bash
# 1. Upload invalid.csv
curl -X POST http://localhost:8000/auth/api/bulk/upload \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -F "file=@invalid.csv" \
  -F "importType=student_import"

# Save JOB_ID from response

# 2. Wait a few seconds, then get job status
curl http://localhost:8000/auth/api/bulk/jobs/$JOB_ID \
  -H "Authorization: Bearer $ACCESS_TOKEN"

# 3. Get error report
curl http://localhost:8000/auth/api/bulk/jobs/$JOB_ID/errors \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

**Expected:**
- Job status shows: `"failedRows": 4`
- Error report URL is present
- Download error report from MinIO console (http://localhost:9001)
- Error report contains row numbers and error messages

### V3.5: Partial Success

**Test:** Verify valid rows were imported despite errors

```bash
# Check if the valid student was created
docker exec -it postgres_cont psql -U lms_user -d lms_db -c \
  "SELECT name, email FROM \"Student\" WHERE name='Valid User';"
```

**Expected:**
- 1 row returned (the valid student)
- Job status is `"completed"` (not failed)

### V3.6: Rollback Mechanism

**Test:** Rollback a completed import

```bash
# 1. Rollback the job from V3.5
curl -X POST http://localhost:8000/auth/api/bulk/jobs/$JOB_ID/rollback \
  -H "Authorization: Bearer $ACCESS_TOKEN"

# 2. Verify student was deleted
docker exec -it postgres_cont psql -U lms_user -d lms_db -c \
  "SELECT COUNT(*) FROM \"Student\" WHERE name='Valid User';"

# 3. Check job status
curl http://localhost:8000/auth/api/bulk/jobs/$JOB_ID \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

**Expected:**
- Response: `"message": "Job rolled back successfully"`
- Student count: 0
- Job status: `"rolled_back"`

### V3.7: Duplicate Detection

**Test:** Upload same CSV twice

```bash
# 1. Upload students_5k.csv again
curl -X POST http://localhost:8000/auth/api/bulk/upload \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -F "file=@students_5k.csv" \
  -F "importType=student_import"

# Save new JOB_ID

# 2. Wait for completion, then check status
curl http://localhost:8000/auth/api/bulk/jobs/$NEW_JOB_ID \
  -H "Authorization: Bearer $ACCESS_TOKEN"

# 3. Verify database count
docker exec -it postgres_cont psql -U lms_user -d lms_db -c \
  "SELECT COUNT(*) FROM \"Student\";"
```

**Expected:**
- High failed count (duplicates rejected)
- Database count remains ~5000 (not 10000)
- Error report shows "Duplicate email" errors

### V3.8: Completion Notification

**Test:** Check notification service logs

```bash
# Check notification service logs
docker logs notification_service | grep -i "bulk\|import"

# Or follow logs in real-time
docker logs -f notification_service
```

**Expected log entry:**
```
[Kafka Consumer] Received message from bulk.import.notifications
Job ID: xxx
Success: 5000, Failed: 0
Error Report: http://minio:9000/...
```

## Part 4: Additional Verifications

### Check MinIO Console
1. Open http://localhost:9001
2. Login: `minioadmin` / `minioadmin123`
3. Navigate to `lms-bulk-imports` bucket
4. Verify:
   - Uploaded CSV files in `imports/{jobId}/`
   - Error reports in `imports/{jobId}/errors.csv`

### Check Database
```bash
# Count total students
docker exec -it postgres_cont psql -U lms_user -d lms_db -c \
  "SELECT COUNT(*) FROM \"Student\";"

# View bulk import jobs
docker exec -it postgres_cont psql -U lms_user -d lms_db -c \
  "SELECT id, type, status, \"successRows\", \"failedRows\" FROM \"BulkImportJob\" ORDER BY \"createdAt\" DESC LIMIT 10;"

# View bulk import records (for rollback tracking)
docker exec -it postgres_cont psql -U lms_user -d lms_db -c \
  "SELECT \"jobId\", COUNT(*) as record_count FROM \"BulkImportRecord\" GROUP BY \"jobId\";"
```

### Check Redis Cache
```bash
# Check progress in Redis
docker exec -it redis_cont redis-cli -a redis_pass GET bulk:job:$JOB_ID:progress
```

### Check Kafka Topics
```bash
# View Kafka UI
open http://localhost:8081

# Check topics:
# - bulk.import.jobs (job requests)
# - bulk.import.completed (completion events)
# - bulk.import.failed (failure events)
# - bulk.import.notifications (notification events)
```

## Troubleshooting

### Issue: Upload fails with "No file uploaded"
**Solution:** Make sure you're using `-F` flag with curl and the field name is `file`

### Issue: "Unauthorized" error
**Solution:** Make sure ACCESS_TOKEN is set and valid. Re-login if expired.

### Issue: Job stuck in "processing"
**Solution:** 
1. Check bulk-import-service logs: `docker logs bulk_import_service`
2. Check Kafka connection: `docker logs kafka_cont`
3. Restart services: `docker-compose restart bulk-import-service`

### Issue: Error report not accessible
**Solution:**
1. Check MinIO is running: `docker ps | grep minio`
2. Access MinIO console: http://localhost:9001
3. Verify bucket exists and file is uploaded

## Success Criteria

✅ **V3.1**: CSV upload returns job ID in <10 seconds  
✅ **V3.2**: Import happens asynchronously (immediate response)  
✅ **V3.3**: Progress tracking works (status updates)  
✅ **V3.4**: Error reports generated and downloadable  
✅ **V3.5**: Partial success handled (valid rows imported)  
✅ **V3.6**: Rollback works (records deleted, status updated)  
✅ **V3.7**: Duplicates detected and rejected  
✅ **V3.8**: Completion notifications sent via Kafka  

## Next Steps

After successful verification:
1. Document any issues found
2. Test with larger datasets (10k, 50k rows)
3. Test concurrent uploads
4. Test with different user roles
5. Performance testing and optimization

