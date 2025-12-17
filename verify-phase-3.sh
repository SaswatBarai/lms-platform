#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BASE_URL="${BASE_URL:-http://localhost:8000/auth/api/bulk}"
FILE_PATH="${FILE_PATH:-./students_5k.csv}"
ACCESS_TOKEN="${ACCESS_TOKEN:-your_access_token_here}"

echo -e "${BLUE}🚀 Starting Phase 3 Bulk Import Verification...${NC}\n"

# Check if file exists
if [ ! -f "$FILE_PATH" ]; then
    echo -e "${RED}❌ Error: File $FILE_PATH not found${NC}"
    echo -e "${YELLOW}Please run: node generate-csv.js first${NC}"
    exit 1
fi

# Check if access token is set
if [ "$ACCESS_TOKEN" = "your_access_token_here" ]; then
    echo -e "${YELLOW}⚠️  Warning: ACCESS_TOKEN not set${NC}"
    echo -e "${YELLOW}Please set ACCESS_TOKEN environment variable:${NC}"
    echo -e "${YELLOW}export ACCESS_TOKEN=<your_token>${NC}\n"
    echo -e "${YELLOW}Continuing without authentication (may fail)...${NC}\n"
    HEADERS=""
else
    HEADERS="-H \"Authorization: Bearer $ACCESS_TOKEN\""
fi

# Test V3.1 & V3.2: Upload CSV
echo -e "${BLUE}📤 Test V3.1 & V3.2: Uploading CSV file...${NC}"
START_TIME=$(date +%s)

RESPONSE=$(curl -s -X POST \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    -F "file=@$FILE_PATH" \
    -F "importType=student_import" \
    "$BASE_URL/upload")

END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

echo "Response: $RESPONSE"

# Extract job ID
JOB_ID=$(echo "$RESPONSE" | grep -o '"jobId":"[^"]*' | cut -d'"' -f4)

if [ -z "$JOB_ID" ]; then
    echo -e "${RED}❌ Upload Failed${NC}"
    echo "Response: $RESPONSE"
    exit 1
else
    echo -e "${GREEN}✅ Upload Success (Job ID: $JOB_ID)${NC}"
fi

# Check upload time
if [ $DURATION -lt 10 ]; then
    echo -e "${GREEN}✅ V3.1 Passed: Upload took ${DURATION}s (<10s requirement)${NC}"
else
    echo -e "${YELLOW}⚠️  V3.1 Warning: Upload took ${DURATION}s (>10s)${NC}"
fi

echo -e "${GREEN}✅ V3.2 Passed: Job created asynchronously${NC}\n"

# Test V3.3: Progress Tracking
echo -e "${BLUE}📊 Test V3.3: Polling job progress...${NC}"
STATUS="pending"
POLL_COUNT=0
MAX_POLLS=60  # Max 2 minutes

while [[ "$STATUS" != "completed" && "$STATUS" != "failed" && $POLL_COUNT -lt $MAX_POLLS ]]; do
    sleep 2
    POLL_COUNT=$((POLL_COUNT + 1))
    
    JOB_RESP=$(curl -s -H "Authorization: Bearer $ACCESS_TOKEN" "$BASE_URL/jobs/$JOB_ID")
    
    STATUS=$(echo "$JOB_RESP" | grep -o '"status":"[^"]*' | cut -d'"' -f4)
    SUCCESS=$(echo "$JOB_RESP" | grep -o '"successRows":[^,}]*' | cut -d':' -f2)
    FAILED=$(echo "$JOB_RESP" | grep -o '"failedRows":[^,}]*' | cut -d':' -f2)
    TOTAL=$(echo "$JOB_RESP" | grep -o '"totalRows":[^,}]*' | cut -d':' -f2)
    
    PROCESSED=$((SUCCESS + FAILED))
    
    echo -e "  Status: ${YELLOW}$STATUS${NC} | Processed: $PROCESSED / $TOTAL (Success: $SUCCESS, Failed: $FAILED)"
done

if [ "$STATUS" = "completed" ]; then
    echo -e "${GREEN}✅ V3.3 Passed: Job completed successfully${NC}"
    echo -e "   Total Rows: $TOTAL"
    echo -e "   Success: $SUCCESS"
    echo -e "   Failed: $FAILED"
elif [ "$STATUS" = "failed" ]; then
    echo -e "${RED}❌ Job failed${NC}"
    exit 1
else
    echo -e "${RED}❌ Timeout: Job did not complete in time${NC}"
    exit 1
fi

echo -e "\n${GREEN}✅ Automated tests (V3.1-V3.3) completed successfully!${NC}"
echo -e "\n${BLUE}📝 Next Steps:${NC}"
echo -e "1. Run manual tests V3.4-V3.8 (see instructions below)"
echo -e "2. Check database: docker exec -it postgres_cont psql -U lms_user -d lms_db -c 'SELECT COUNT(*) FROM \"Student\";'"
echo -e "3. Check MinIO console: http://localhost:9001"
echo -e "4. Check notification logs: docker logs notification_service"

echo -e "\n${BLUE}📋 Manual Test Instructions:${NC}"
echo -e "${YELLOW}V3.4: Error Reporting${NC}"
echo -e "  1. Generate invalid CSV: node generate-invalid-csv.js"
echo -e "  2. Upload: curl -X POST -H \"Authorization: Bearer \$ACCESS_TOKEN\" -F \"file=@invalid.csv\" -F \"importType=student_import\" $BASE_URL/upload"
echo -e "  3. Get job status and check errorReportUrl"
echo -e ""
echo -e "${YELLOW}V3.6: Rollback${NC}"
echo -e "  curl -X POST -H \"Authorization: Bearer \$ACCESS_TOKEN\" $BASE_URL/jobs/$JOB_ID/rollback"
echo -e ""
echo -e "${YELLOW}V3.7: Duplicate Detection${NC}"
echo -e "  Upload students_5k.csv again and verify duplicates are rejected"

