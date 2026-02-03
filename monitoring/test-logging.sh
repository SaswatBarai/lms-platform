#!/bin/bash

echo "=========================================="
echo "  Logging System Test Script"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Generate logs with traceIds
echo -e "${BLUE}Step 1: Generating test logs...${NC}"
echo ""

TRACE_IDS=()

for i in {1..10}; do
    echo -n "Request $i: "
    RESPONSE=$(curl -s -D - http://localhost:8000/auth/api/health 2>&1)
    TRACE_ID=$(echo "$RESPONSE" | grep -i "x-trace-id" | cut -d' ' -f2 | tr -d '\r')
    
    if [ ! -z "$TRACE_ID" ]; then
        echo -e "${GREEN}✓${NC} Trace ID: $TRACE_ID"
        TRACE_IDS+=("$TRACE_ID")
    else
        echo -e "${YELLOW}⚠${NC}  No traceId in response"
    fi
    sleep 0.5
done

echo ""
echo -e "${BLUE}Step 2: Waiting for logs to be indexed (10 seconds)...${NC}"
sleep 10

# Step 2: Check Elasticsearch
echo ""
echo -e "${BLUE}Step 3: Checking Elasticsearch indices...${NC}"
INDEX_COUNT=$(curl -s "http://localhost:9200/_cat/indices/lms-logs-*?v&h=index,docs.count" | tail -n +2 | awk '{sum+=$2} END {print sum}')
echo "Total documents in lms-logs indices: $INDEX_COUNT"

# Step 3: Get a sample traceId
if [ ${#TRACE_IDS[@]} -gt 0 ]; then
    SAMPLE_TRACE_ID=${TRACE_IDS[0]}
    echo ""
    echo -e "${BLUE}Step 4: Searching for logs with traceId...${NC}"
    echo "Trace ID: $SAMPLE_TRACE_ID"
    
    # Search in Elasticsearch
    RESULT=$(curl -s "http://localhost:9200/lms-logs-*/_search?q=traceId:$SAMPLE_TRACE_ID&size=1" | grep -o '"total":[0-9]*' | cut -d':' -f2)
    
    if [ ! -z "$RESULT" ] && [ "$RESULT" -gt 0 ]; then
        echo -e "${GREEN}✓${NC} Found $RESULT log(s) with this traceId in Elasticsearch"
    else
        echo -e "${YELLOW}⚠${NC}  No logs found yet (may need more time to index)"
    fi
fi

# Step 4: Show recent logs
echo ""
echo -e "${BLUE}Step 5: Recent auth-service logs (last 3):${NC}"
docker-compose logs --tail=20 auth-service | grep -E "traceId|Incoming request" | tail -3

echo ""
echo "=========================================="
echo -e "${GREEN}✓ Test Complete!${NC}"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Open Kibana: http://localhost:5601"
echo "2. Go to Discover"
echo "3. Search for: traceId: \"${SAMPLE_TRACE_ID}\""
echo ""
echo "Or search for:"
echo "  - service: \"auth-service\""
echo "  - message: \"Incoming request\""
echo "  - level: \"info\""
echo ""






