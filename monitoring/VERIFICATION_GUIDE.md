# Monitoring Stack Verification Guide

This guide provides step-by-step instructions to verify all monitoring components are working correctly.

## Prerequisites

1. Ensure all services are running:
   ```bash
   docker-compose up -d
   ```

2. Wait for all services to be healthy (check with `docker-compose ps`)

## Verification Steps

### V4.1 - Prometheus Metrics Collection

**Tool:** Browser  
**URL:** http://localhost:9090

**Steps:**
1. Open Prometheus UI at http://localhost:9090
2. Go to "Graph" tab
3. Enter query: `http_requests_total`
4. Click "Execute"
5. **Acceptance Criteria:** You should see metrics from auth-service with labels (method, route, status_code)

**Alternative:** Query `rate(http_requests_total[5m])` to see request rate

---

### V4.2 - Grafana Dashboards

**Tool:** Browser  
**URL:** http://localhost:3001

**Steps:**
1. Open Grafana at http://localhost:3001
2. Login with credentials:
   - Username: `admin`
   - Password: `admin`
3. Navigate to "Dashboards" → "Browse"
4. Open "API Performance" dashboard
5. **Acceptance Criteria:** 
   - Dashboard loads without errors
   - "Request Rate (Real-time)" graph shows data
   - Graphs update in real-time (refresh every 10s)

**Available Dashboards:**
- System Overview
- API Performance
- Authentication
- Bulk Imports

---

### V4.3 - Elasticsearch Log Ingestion

**Tool:** Kibana  
**URL:** http://localhost:5601

**Steps:**
1. Open Kibana at http://localhost:5601
2. Go to "Discover" tab
3. Create index pattern: `lms-logs-*`
4. Select time field: `@timestamp`
5. Search for recent logs
6. **Acceptance Criteria:**
   - Logs appear in Kibana
   - Can filter by service, level, traceId
   - Logs are in JSON format with structured fields

**Test Query Examples:**
- Filter by service: `service: "auth-service"`
- Filter by level: `level: "error"`
- Filter by traceId: `traceId: "YOUR_TRACE_ID"`

---

### V4.4 - Distributed Tracing

**Tool:** Jaeger UI  
**URL:** http://localhost:16686

**Steps:**
1. Open Jaeger UI at http://localhost:16686
2. Make an API request to auth-service (e.g., GET /auth/api/health)
3. In Jaeger UI, select service: `auth-service`
4. Click "Find Traces"
5. **Acceptance Criteria:**
   - Traces appear in Jaeger
   - Can see end-to-end request flow
   - Spans show timing information
   - Trace ID is visible in response headers (X-Trace-ID)

**To test end-to-end:**
1. Make request through Kong gateway
2. Request flows: Kong → Auth Service → Database
3. All spans should be visible in Jaeger

---

### V4.5 - Alert Firing

**Tool:** Manual Testing

**Steps:**
1. Create a test endpoint that returns 500:
   ```typescript
   // Add to health.route.ts temporarily
   router.get('/test-error', (req, res) => {
     res.status(500).json({ error: 'Test error' });
   });
   ```

2. Generate high error rate:
   ```bash
   for i in {1..100}; do
     curl http://localhost:8000/auth/api/test-error
   done
   ```

3. Wait 1-5 minutes for alert to fire

4. **Acceptance Criteria:**
   - Alert appears in Alertmanager UI (http://localhost:9093)
   - Alert sent to Slack (if webhook configured)
   - Alert contains correct details (service name, error rate)

**Note:** Update `alertmanager.yml` with your Slack webhook URL before testing.

---

### V4.6 - Health Checks

**Tool:** Postman or curl

**Steps:**

1. **Liveness Probe:**
   ```bash
   curl http://localhost:8000/auth/api/health
   ```
   **Expected:** `{"status":"ok"}` with status 200

2. **Readiness Probe (all deps up):**
   ```bash
   curl http://localhost:8000/auth/api/health/ready
   ```
   **Expected:** 
   ```json
   {
     "timestamp": "...",
     "services": {
       "database": {"status": "up"},
       "redis": {"status": "up"}
     }
   }
   ```
   Status: 200

3. **Readiness Probe (DB down):**
   - Stop PostgreSQL: `docker-compose stop postgres`
   - Wait 10 seconds
   - Run readiness check again
   - **Expected:** Status 503 with database status "down"

---

### V4.7 - Log Correlation

**Tool:** Kibana

**Steps:**
1. Make an API request:
   ```bash
   curl -v http://localhost:8000/auth/api/health
   ```
   Note the `X-Trace-ID` from response headers

2. Open Kibana Discover
3. Search for the traceId: `traceId: "YOUR_TRACE_ID"`
4. **Acceptance Criteria:**
   - All logs related to the request appear
   - Logs from auth-service, kafka, notification (if applicable) are visible
   - Logs are correlated by traceId

**Alternative:** Use Jaeger to find traceId, then search in Kibana

---

### V4.8 - Dashboard Accuracy

**Tool:** Manual Testing

**Steps:**
1. Generate 100 login requests:
   ```bash
   for i in {1..100}; do
     curl -X POST http://localhost:8000/auth/api/students/login \
       -H "Content-Type: application/json" \
       -d '{"identifier":"test@example.com","password":"test123"}'
   done
   ```

2. Open Grafana → "Authentication" dashboard
3. Check "Total Login Attempts" stat panel
4. **Acceptance Criteria:**
   - Count matches (or close to) 100 login attempts
   - "Login Attempts" graph shows the spike
   - Success/failure breakdown is accurate

**Note:** Some requests may fail (invalid credentials), so count may be less than 100.

---

## Troubleshooting

### Prometheus not scraping metrics
- Check if auth-service is running: `docker-compose ps`
- Verify metrics endpoint: `curl http://localhost:4001/auth/api/metrics`
- Check Prometheus targets: http://localhost:9090/targets

### Grafana dashboards not loading
- Check if dashboards directory is mounted correctly
- Verify dashboard JSON files are valid JSON
- Check Grafana logs: `docker-compose logs grafana`

### No logs in Kibana
- Check Filebeat is running: `docker-compose ps filebeat`
- Check Filebeat logs: `docker-compose logs filebeat`
- Verify Elasticsearch is healthy: `curl http://localhost:9200/_cluster/health`

### No traces in Jaeger
- Verify tracing is initialized in app.ts
- Check Jaeger is running: `docker-compose ps jaeger`
- Verify OTLP endpoint: `curl http://localhost:4318/v1/traces`

### Alerts not firing
- Check Prometheus alert rules: http://localhost:9090/alerts
- Verify Alertmanager is configured: http://localhost:9093
- Check Alertmanager logs: `docker-compose logs alertmanager`

---

## Quick Verification Script

```bash
#!/bin/bash

echo "=== Verification Script ==="

echo "1. Checking Prometheus..."
curl -s http://localhost:9090/api/v1/query?query=up | grep -q "success" && echo "✓ Prometheus OK" || echo "✗ Prometheus FAILED"

echo "2. Checking Grafana..."
curl -s http://localhost:3001/api/health | grep -q "ok" && echo "✓ Grafana OK" || echo "✗ Grafana FAILED"

echo "3. Checking Elasticsearch..."
curl -s http://localhost:9200/_cluster/health | grep -q "green\|yellow" && echo "✓ Elasticsearch OK" || echo "✗ Elasticsearch FAILED"

echo "4. Checking Kibana..."
curl -s http://localhost:5601/api/status | grep -q "status" && echo "✓ Kibana OK" || echo "✗ Kibana FAILED"

echo "5. Checking Jaeger..."
curl -s http://localhost:16686/api/services | grep -q "services" && echo "✓ Jaeger OK" || echo "✗ Jaeger FAILED"

echo "6. Checking Alertmanager..."
curl -s http://localhost:9093/-/healthy | grep -q "OK" && echo "✓ Alertmanager OK" || echo "✗ Alertmanager FAILED"

echo "7. Checking Auth Service Metrics..."
curl -s http://localhost:4001/auth/api/metrics | grep -q "http_requests_total" && echo "✓ Metrics OK" || echo "✗ Metrics FAILED"

echo "8. Checking Health Endpoint..."
curl -s http://localhost:4001/auth/api/health | grep -q "ok" && echo "✓ Health OK" || echo "✗ Health FAILED"

echo "=== Verification Complete ==="
```

Save as `verify-monitoring.sh`, make executable (`chmod +x verify-monitoring.sh`), and run.

