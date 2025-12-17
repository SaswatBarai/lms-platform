# Quick Start: Phase 3 Bulk Import Testing

## Step 1: Start Services
```bash
cd /home/saswat-barai/lms-platform
docker-compose up -d
```

## Step 2: Get Database IDs
```bash
# Copy these commands and save the IDs
docker exec -it postgres_cont psql -U lms_user -d lms_db -c "SELECT id, name FROM \"Department\" LIMIT 1;"
docker exec -it postgres_cont psql -U lms_user -d lms_db -c "SELECT id, \"batchYear\" FROM \"Batch\" LIMIT 1;"
docker exec -it postgres_cont psql -U lms_user -d lms_db -c "SELECT id, \"sectionNo\" FROM \"Section\" LIMIT 1;"
```

## Step 3: Generate Test Data
```bash
# Replace with your actual IDs
export DEPT_ID="your_dept_id_here"
export BATCH_ID="your_batch_id_here"
export SECTION_ID="your_section_id_here"

# Generate 5000-row CSV
DEPT_ID=$DEPT_ID BATCH_ID=$BATCH_ID SECTION_ID=$SECTION_ID node generate-csv.js

# Generate invalid CSV for error testing
DEPT_ID=$DEPT_ID BATCH_ID=$BATCH_ID SECTION_ID=$SECTION_ID node generate-invalid-csv.js
```

## Step 4: Get Access Token
```bash
# Login (replace with your credentials)
curl -X POST http://localhost:8000/auth/api/login-college \
  -H "Content-Type: application/json" \
  -d '{"email":"college@example.com","password":"your_password"}'

# Save the token
export ACCESS_TOKEN="paste_access_token_here"
```

## Step 5: Run Automated Tests
```bash
ACCESS_TOKEN=$ACCESS_TOKEN ./verify-phase-3.sh
```

## Step 6: Manual Tests

### Test Error Reporting (V3.4)
```bash
curl -X POST http://localhost:8000/auth/api/bulk/upload \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -F "file=@invalid.csv" \
  -F "importType=student_import"

# Get job ID from response, then:
export JOB_ID="paste_job_id_here"

# Check status
curl http://localhost:8000/auth/api/bulk/jobs/$JOB_ID \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq
```

### Test Rollback (V3.6)
```bash
curl -X POST http://localhost:8000/auth/api/bulk/jobs/$JOB_ID/rollback \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq
```

### Check Results
```bash
# View imported students
docker exec -it postgres_cont psql -U lms_user -d lms_db -c \
  "SELECT COUNT(*) FROM \"Student\";"

# View jobs
docker exec -it postgres_cont psql -U lms_user -d lms_db -c \
  "SELECT id, type, status, \"successRows\", \"failedRows\" FROM \"BulkImportJob\";"

# Check MinIO
open http://localhost:9001
# Login: minioadmin / minioadmin123

# Check notifications
docker logs notification_service | grep -i bulk
```

## Troubleshooting

**Services not starting?**
```bash
docker-compose logs auth-service
docker-compose logs bulk-import-service
```

**Can't generate CSV?**
- Make sure you have valid IDs from Step 2
- Check if Department, Batch, and Section exist in database

**Upload fails?**
- Check if ACCESS_TOKEN is valid
- Verify Kong is running: `docker ps | grep kong`
- Check auth-service logs

**Job stuck?**
- Check bulk-import-service logs: `docker logs bulk_import_service`
- Check Kafka: `docker logs kafka_cont`
- Restart: `docker-compose restart bulk-import-service`

## Quick Commands Reference

```bash
# Restart specific service
docker-compose restart bulk-import-service

# View logs
docker logs -f bulk_import_service

# Check database
docker exec -it postgres_cont psql -U lms_user -d lms_db

# Check Redis
docker exec -it redis_cont redis-cli -a redis_pass

# Check Kafka UI
open http://localhost:8081

# Check MinIO
open http://localhost:9001
```

## Expected Results

After successful run:
- ✅ 5000 students imported
- ✅ Error reports generated for invalid rows
- ✅ Rollback works
- ✅ Notifications sent
- ✅ Files visible in MinIO
- ✅ Jobs tracked in database

For detailed verification steps, see `PHASE3_VERIFICATION_GUIDE.md`

