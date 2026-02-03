# 📋 Complete Logging Test Guide

## ✅ Current Status

Your logging system is **WORKING**! Here's what we verified:

- ✅ **TraceIds are being generated** (32-character hex strings)
- ✅ **Logs are structured JSON** with traceId, service, timestamp, etc.
- ✅ **Filebeat is shipping logs** to Elasticsearch
- ✅ **Elasticsearch has 14,602+ documents** indexed
- ✅ **Kibana is accessible** at http://localhost:5601

---

## 🧪 Quick Test

Run the test script:

```bash
cd /home/saswat-barai/lms-platform
./monitoring/test-logging.sh
```

This will:
1. Generate 10 test requests with traceIds
2. Wait for logs to be indexed
3. Verify logs are in Elasticsearch
4. Show you a sample traceId to search

---

## 📊 How to View Logs in Kibana

### Step 1: Open Kibana
```
http://localhost:5601
```

### Step 2: Create Data View (if not done)
1. Click **"Create data view"** button
2. **Index pattern**: `lms-logs-*`
3. **Timestamp field**: `@timestamp`
4. Click **"Save data view to Kibana"**

### Step 3: View Logs in Discover
You'll see logs in the Discover view. Each row is a log entry.

---

## 🔍 Search Examples

### 1. Find Logs by Service
```
service: "auth-service"
```

### 2. Find Logs by TraceId
```
traceId: "fba467fb5b6656cd451c5168c7c945f1"
```

### 3. Find Incoming Requests
```
message: "Incoming request"
```

### 4. Find Error Logs
```
level: "error"
```

### 5. Find Logs by Path
```
path: "/auth/api/health"
```

### 6. Combine Filters
```
service: "auth-service" AND level: "info" AND message: "Incoming request"
```

### 7. Find Logs in Time Range
- Use the time picker (top right)
- Select "Last 15 minutes" or "Last 1 hour"

---

## 🎯 Test Log Correlation (V4.7)

### Step 1: Get a TraceId
```bash
# Make a request and get traceId
TRACE_ID=$(curl -s -D - http://localhost:8000/auth/api/health | grep -i "x-trace-id" | cut -d' ' -f2 | tr -d '\r')
echo "Trace ID: $TRACE_ID"
```

### Step 2: Search in Kibana
1. Open Kibana Discover
2. In search bar, enter:
   ```
   traceId: "YOUR_TRACE_ID_HERE"
   ```
3. You should see all logs related to that request!

### Step 3: Verify
- ✅ You should see the "Incoming request" log
- ✅ You should see any related logs (if any)
- ✅ All logs have the same traceId

---

## 📝 Log Structure

Each log entry contains:

```json
{
  "level": "info",
  "message": "Incoming request",
  "service": "auth-service",
  "timestamp": "2025-12-31T11:12:15.129Z",
  "traceId": "fba467fb5b6656cd451c5168c7c945f1",
  "method": "GET",
  "path": "/auth/api/health",
  "ip": "::ffff:172.18.0.16"
}
```

**Key Fields:**
- `traceId`: Unique identifier for request correlation
- `service`: Service name (auth-service)
- `level`: Log level (info, warn, error)
- `message`: Log message
- `timestamp`: When the log was created
- `method`: HTTP method
- `path`: Request path
- `ip`: Client IP address

---

## 🚀 Generate More Test Logs

### Option 1: Use the Test Script
```bash
./monitoring/test-logging.sh
```

### Option 2: Manual Requests
```bash
# Generate 10 requests
for i in {1..10}; do
  curl http://localhost:8000/auth/api/health
  sleep 1
done
```

### Option 3: Test Different Endpoints
```bash
# Health check
curl http://localhost:8000/auth/api/health

# Readiness check
curl http://localhost:8000/auth/api/health/ready

# Metrics
curl http://localhost:8000/auth/api/metrics
```

---

## 🔧 Troubleshooting

### Problem: No logs in Kibana

**Check 1: Is Filebeat running?**
```bash
docker-compose ps filebeat
docker-compose logs filebeat | tail -20
```

**Check 2: Is Elasticsearch healthy?**
```bash
curl http://localhost:9200/_cluster/health
# Should return: {"status":"green" or "yellow"}
```

**Check 3: Are logs being created?**
```bash
docker-compose logs auth-service | tail -10
# Should see JSON logs with traceId
```

**Check 4: Check Elasticsearch indices**
```bash
curl "http://localhost:9200/_cat/indices/lms-logs-*?v"
# Should see: lms-logs-YYYY.MM.DD with documents
```

### Problem: Logs not parsed as JSON

**Check Winston output:**
```bash
docker-compose logs auth-service | tail -5
# Should see JSON format, not plain text
```

### Problem: No traceId in logs

**Check tracingMiddleware:**
```bash
# Verify middleware is applied
grep "tracingMiddleware" services/auth-service/src/app.ts

# Check if service was rebuilt
docker-compose ps auth-service
```

---

## 📈 Advanced: Create Log Dashboard

1. Go to **Dashboard** → **Create dashboard**
2. Add visualizations:
   - **Bar chart**: Log levels over time
   - **Pie chart**: Distribution by service
   - **Data table**: Recent error logs
   - **Line chart**: Request rate over time

---

## ✅ Verification Checklist

- [ ] Kibana is accessible at http://localhost:5601
- [ ] Data view created with pattern `lms-logs-*`
- [ ] Logs appear in Discover view
- [ ] Can search by `service: "auth-service"`
- [ ] Can search by `traceId: "..."` 
- [ ] Logs have structured JSON format
- [ ] traceId appears in response headers (`X-Trace-ID`)
- [ ] Log correlation works (same traceId shows related logs)

---

## 🎓 Understanding the Flow

```
1. Request → Auth Service
2. tracingMiddleware → Generates/Extracts traceId
3. Winston Logger → Creates JSON log with traceId
4. Docker → Captures stdout (JSON logs)
5. Filebeat → Reads Docker logs
6. Filebeat → Sends to Elasticsearch
7. Elasticsearch → Indexes logs (lms-logs-YYYY.MM.DD)
8. Kibana → Visualizes logs from Elasticsearch
```

---

## 📞 Quick Commands Reference

```bash
# Get traceId from response
curl -s -D - http://localhost:8000/auth/api/health | grep -i "x-trace-id"

# View recent logs
docker-compose logs --tail=20 auth-service

# Check Elasticsearch indices
curl "http://localhost:9200/_cat/indices/lms-logs-*?v"

# Search logs in Elasticsearch
curl "http://localhost:9200/lms-logs-*/_search?q=traceId:YOUR_TRACE_ID&pretty"

# Check Filebeat status
docker-compose logs filebeat | tail -20
```

---

**You're all set!** 🎉 Start exploring your logs in Kibana!






