import { NotificationConsumer } from "./messaging/consumer.js";
import env from "./config/env.js";
import app from "./app.js";

async function startNotificationService() {
  try {
    console.log(`
╔══════════════════════════════════════════════════════════════╗
║         🔔 NOTIFICATION SERVICE STARTING                     ║
║         Environment: ${env.NODE_ENV?.padEnd(43)} ║
╚══════════════════════════════════════════════════════════════╝
    `);

    // Start the HTTP server for health checks
    const PORT = env.PORT || 4002;
    const server = app.listen(PORT, () => {
      console.log(`[NotificationService] HTTP server running on port ${PORT}`);
    });

    // Start the Kafka consumer
    await NotificationConsumer.start();

    console.log("[NotificationService] ✅ Service started successfully");

    return server;

  } catch (error) {
    console.error("[NotificationService] ❌ Failed to start service:", error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log("[NotificationService] SIGTERM received, shutting down gracefully...");
  await NotificationConsumer.shutdown();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log("[NotificationService] SIGINT received, shutting down gracefully...");
  await NotificationConsumer.shutdown();
  process.exit(0);
});

// Start the service
startNotificationService();
