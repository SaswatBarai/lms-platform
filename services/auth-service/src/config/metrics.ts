import client from 'prom-client';

// Create a Registry
export const register = new client.Registry();

// Add default metrics (CPU, memory, etc.)
client.collectDefaultMetrics({ register });

// ==========================================
// HTTP Metrics (Existing)
// ==========================================
export const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register]
});

export const httpRequestDurationMicroseconds = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.5, 1, 1.5, 2, 5],
  registers: [register]
});

// ==========================================
// Business & Auth Metrics (New & Existing)
// ==========================================
export const loginAttemptsTotal = new client.Counter({
  name: 'auth_login_attempts_total',
  help: 'Total number of login attempts',
  labelNames: ['status', 'user_type'], // e.g., success/failure, student/teacher
  registers: [register]
});

export const authRegistrationTotal = new client.Counter({
  name: 'auth_registration_total',
  help: 'Total number of user registrations',
  labelNames: ['user_type'], // e.g., student, teacher, hod
  registers: [register]
});

export const passwordResetRequestsTotal = new client.Counter({
  name: 'password_reset_requests_total',
  help: 'Total number of password reset requests initiated',
  labelNames: ['user_type'], 
  registers: [register]
});

export const activeSessionsTotal = new client.Gauge({
  name: 'active_sessions_total',
  help: 'Current number of active user sessions',
  labelNames: ['user_type'],
  registers: [register]
});

// ==========================================
// Bulk Import Metrics (New)
// ==========================================
export const bulkImportJobsTotal = new client.Counter({
  name: 'bulk_import_jobs_total',
  help: 'Total number of bulk import jobs initiated',
  labelNames: ['status', 'job_type'], // e.g., success/failed, teacher_import/student_import
  registers: [register]
});

export const bulkImportRowsProcessedTotal = new client.Counter({
  name: 'bulk_import_rows_processed_total',
  help: 'Total number of CSV rows processed during bulk imports',
  labelNames: ['status'], // e.g., success, error
  registers: [register]
});

// ==========================================
// Infrastructure Metrics (New)
// ==========================================
export const kafkaMessagesProducedTotal = new client.Counter({
  name: 'kafka_messages_produced_total',
  help: 'Total number of messages produced to Kafka topics',
  labelNames: ['topic'],
  registers: [register]
});