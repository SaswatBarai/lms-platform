import "./config/tracing.js";
import { NotificationConsumer } from "./messaging/consumer.js";
import env from "./config/env.js";
import app from "./app.js";
import { logger } from "./config/logger.js";

async function startNotificationService() {
  try {
    logger.info(`
╔══════════════════════════════════════════════════════════════╗
║         🔔 NOTIFICATION SERVICE STARTING                     ║
║         Environment: ${env.NODE_ENV?.padEnd(43)} ║
║         Email Mode:  ${env.EMAIL_MODE?.toUpperCase().padEnd(43)} ║
╚══════════════════════════════════════════════════════════════╝
    `);

    // Start the HTTP server for health checks
    const PORT = env.PORT || 4002;
    const server = app.listen(PORT, () => {
      logger.info(`[NotificationService] HTTP server running on port ${PORT}`);
    });

    // Start the Kafka consumer
    await NotificationConsumer.start();

    logger.info("[NotificationService] ✅ Service started successfully");

    return server;

  } catch (error) {
    logger.error("[NotificationService] ❌ Failed to start service:", error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  logger.info("[NotificationService] SIGTERM received, shutting down gracefully...");
  await NotificationConsumer.shutdown();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info("[NotificationService] SIGINT received, shutting down gracefully...");
  await NotificationConsumer.shutdown();
  process.exit(0);
});

// Start the service
startNotificationService();
