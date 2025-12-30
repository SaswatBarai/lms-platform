// services/notification-service/src/config/metrics.ts
import client from 'prom-client';

// Create a Registry
export const register = new client.Registry();

// Add default metrics (CPU, memory, etc.)
client.collectDefaultMetrics({ register });

// Custom Metrics for notification service
export const emailSentTotal = new client.Counter({
  name: 'notification_email_sent_total',
  help: 'Total number of emails sent',
  labelNames: ['type', 'status'],
  registers: [register]
});

export const kafkaMessagesProcessed = new client.Counter({
  name: 'notification_kafka_messages_processed_total',
  help: 'Total number of Kafka messages processed',
  labelNames: ['topic', 'status'],
  registers: [register]
});

export const notificationProcessingDuration = new client.Histogram({
  name: 'notification_processing_duration_seconds',
  help: 'Duration of notification processing in seconds',
  labelNames: ['type'],
  buckets: [0.1, 0.5, 1, 2, 5],
  registers: [register]
});