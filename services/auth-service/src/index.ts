import app from "./app.js"
import { initKafkaProducer } from "./messaging/kafka.js";
import dotenv from "dotenv";
import env from "./config/env.js";
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
    
    console.log('🔐 PASETO keys generated successfully');
    console.log(`Public Key: ${publicKeyB64}`);
    
    // Initialize PasetoV4SecurityManager
    const { PasetoV4SecurityManager } = await import("./utils/security.js");
    const securityManager = PasetoV4SecurityManager.getInstance();
    await securityManager.initialize();
    
    // Start the server after keys are ready
    server = app.listen(PORT, () => {
      console.log(`🚀 Auth Service is running on port ${PORT} in ${env.NODE_ENV} mode`);
    });
    
  } catch (error) {
    console.error('❌ Failed to initialize auth service:', error);
    process.exit(1);
  }
})();

// Initialize Kafka producer on startup
initKafkaProducer().catch((err: Error) => {
    console.error("[auth] Kafka producer failed to start (continuing without Kafka)", err);
    // Do not exit the process; allow HTTP API to remain available
});

// Handle unhandled promise rejections
process.on("unhandledRejection",(err:any)=>{
    console.error("UNHANDLED REJECTION! 💥 Shutting down...");
    console.error(err.name,err.message);
    process.exit(1);
})

// Handle uncaught exceptions
process.on("uncaughtException",(err:any)=>{
    console.error("UNCAUGHT EXCEPTION! 💥 Shutting down...");
    console.error(err.name,err.message);
    process.exit(1);
})
// Handle SIGTERM signal (e.g., from process manager)
process.on("SIGTERM",()=>{
    console.log("SIGTERM RECEIVED. Shutting down gracefully...");
    if (server) {
        server.close(() => {
            console.log("💥 Process terminated!");
            process.exit(0);
        });
    } else {
        // no server to close
        process.exit(0);
    }
});
