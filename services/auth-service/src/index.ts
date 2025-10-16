import app from "./app.js"
import { initKafkaProducer } from "./messaging/kafka.js";
import dotenv from "dotenv";
import env from "./config/env.js";
import { Server } from "http";


dotenv.config();

const PORT = env.PORT || 4000;

let server: Server | null = null;

server = app.listen(PORT, ()=>{
    console.log(`🚀 Auth Service is running on port ${PORT} in ${env.NODE_ENV} mode`);
});

// Initialize Kafka producer on startup
initKafkaProducer().catch((err) => {
    console.error("[auth] Kafka producer failed to start", err);
    process.exit(1);
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
