import "./config/tracing.js"
import app from "./app.js"
import { initKafkaProducer } from "./messaging/kafka.js";
import dotenv from "dotenv";
import env from "./config/env.js";
import { logger } from "./config/logger.js";
import { Server } from "http";
import {V4} from "paseto"
import fs from "fs/promises";


dotenv.config();


const PORT = env.PORT || 4000;

let server: Server | null = null;

// Initialize everything asynchronously
(async () => {
  try {
    // Generate PASETO keys
    const privateKey = await V4.generateKey('public');
    
    const privateKeyPem = privateKey.export({ type: 'pkcs8', format: 'pem' });
    const publicKeyBytes = await V4.keyObjectToBytes(privateKey);
    const publicKeyOnly = publicKeyBytes.slice(-32);
    const publicKeyB64 = Buffer.from(publicKeyOnly).toString('base64');
    
    await fs.writeFile('private.key', privateKeyPem);
    await fs.writeFile('public.key', publicKeyB64);
    
    logger.info('🔐 PASETO keys generated successfully');
    logger.info(`Public Key: ${publicKeyB64}`);
    
    // Initialize PasetoV4SecurityManager
    const { PasetoV4SecurityManager } = await import("./utils/security.js");
    const securityManager = PasetoV4SecurityManager.getInstance();
    await securityManager.initialize();
    
    // Start the server after keys are ready
    server = app.listen(PORT, () => {
      logger.info(`🚀 Auth Service is running on port ${PORT} in ${env.NODE_ENV} mode`);
    });
    
  } catch (error) {
    logger.error('❌ Failed to initialize auth service:', error);
    process.exit(1);
  }
})();

// Initialize Kafka producer on startup
initKafkaProducer().catch((err: Error) => {
    logger.error("[auth] Kafka producer failed to start (continuing without Kafka)", err);
    // Do not exit the process; allow HTTP API to remain available
});

// Handle unhandled promise rejections
process.on("unhandledRejection",(err:any)=>{
    logger.error("UNHANDLED REJECTION! 💥 Shutting down...");
    logger.error(err.name,err.message);
    process.exit(1);
})

// Handle uncaught exceptions
process.on("uncaughtException",(err:any)=>{
    logger.error("UNCAUGHT EXCEPTION! 💥 Shutting down...");
    logger.error(err.name,err.message);
    process.exit(1);
})
// Handle SIGTERM signal (e.g., from process manager)
process.on("SIGTERM",()=>{
    logger.info("SIGTERM RECEIVED. Shutting down gracefully...");
    if (server) {
        server.close(() => {
            logger.info("💥 Process terminated!");
            process.exit(0);
        });
    } else {
        // no server to close
        process.exit(0);
    }
});
