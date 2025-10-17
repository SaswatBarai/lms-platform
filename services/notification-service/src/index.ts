import cluster from "cluster";
import os from "os";
import app from "./app.js";
import { startNotificationConsumer } from "./messaging/consumer.js";
import env from "@config/env.js";
import dotenv from "dotenv";
import { Server } from "http";

dotenv.config();

const PORT = env.PORT || 4003;

//no of CPU cores available
const numCPUs = os.cpus().length;

if(cluster.isPrimary && env.NODE_ENV === "production") {
    console.log(`Primary ${process.pid} is running`);
    // Fork workers.
    for (let i = 0; i < numCPUs; i++) {
        cluster.fork();
    }

    cluster.on("exit", (worker, code, signal) => {
        console.log(`worker ${worker.process.pid} died`);
        console.log("Forking another worker!");
        cluster.fork();
    });
}
 else {
    const server:Server = app.listen(PORT, () => {
        console.log(`Notification Service running on port ${PORT} - Worker ${process.pid}`);
    })
    server.on("error", (error:Error) => {
        console.error("Error occurred:", error);
    });

    // Start Kafka consumer alongside the HTTP server
    startNotificationConsumer().catch((err: Error) => {
        console.error("[notification] Kafka consumer failed to start", err);
        process.exit(1);
    });

    process.on("SIGTERM", () => {
        console.log(`SIGTERM RECEIVED by worker ${process.pid}. Shutting down gracefully...`);
        server.close(() => {
            console.log(`Worker ${process.pid} has closed all connections.`);
            process.exit(0);
        });
    });
 }

 // Global handlers for unexpected errors
process.on("unhandledRejection", (err: Error) => {
    console.error("UNHANDLED REJECTION! 💥 Shutting down...");
    console.error(err.name, err.message);
    process.exit(1);
});

process.on("uncaughtException", (err: Error) => {
    console.error("UNCAUGHT EXCEPTION! 💥 Shutting down...");
    console.error(err.name, err.message);
    process.exit(1);
});

