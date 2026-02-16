import "./config/tracing.js";
import express from "express";
import { consumer, producer } from "./config/kafka";
import { StudentImportWorker } from "./workers/student-import.worker";
import { TeacherImportWorker } from "./workers/teacher-import.worker";
import { BulkImportJobPayload } from "./types/job.types";
import client from 'prom-client';
import { logger } from "./config/logger.js";

const app = express();
const PORT = process.env.PORT || 4004;

// Initialize Metrics
const register = new client.Registry();
client.collectDefaultMetrics({ register });

// Metrics endpoint
app.get("/metrics", async (req, res) => {
    res.setHeader('Content-Type', register.contentType);
    res.send(await register.metrics());
});

// Health check endpoint
app.get("/health", (req, res) => {
    res.status(200).json({ status: "ok", service: "bulk-import-service" });
});

const studentWorker = new StudentImportWorker();
const teacherWorker = new TeacherImportWorker();

const start = async () => {
    try {
        // Start HTTP server for health checks
        app.listen(PORT, () => {
            logger.info(`🏥 Health check server running on port ${PORT}`);
        });

        await producer.connect();
        await consumer.connect();
        await consumer.subscribe({ topic: 'bulk.import.jobs', fromBeginning: false });

        logger.info("🚀 Bulk Import Worker Service Started");

        await consumer.run({
            eachMessage: async ({ topic, message }) => {
                if (!message.value) return;
                
                const payload = JSON.parse(message.value.toString()) as BulkImportJobPayload;
                logger.info(`Processing Job: ${payload.jobId} [Type: ${payload.importType}]`);

                try {
                    if (payload.importType === 'student_import') {
                        await studentWorker.execute(payload);
                    } else if (payload.importType === 'teacher_import') {
                        await teacherWorker.execute(payload);
                    } else {
                        logger.warn(`Unknown import type: ${payload.importType}`);
                        // Publish failure event for unknown type
                        await producer.send({
                            topic: 'bulk.import.failed',
                            messages: [{ 
                                value: JSON.stringify({ 
                                    jobId: payload.jobId, 
                                    status: 'failed',
                                    error: `Unknown import type: ${payload.importType}`
                                }) 
                            }]
                        });
                        return;
                    }
                    
                    // Publish completion event
                    await producer.send({
                        topic: 'bulk.import.completed',
                        messages: [{ value: JSON.stringify({ jobId: payload.jobId, status: 'completed' }) }]
                    });
                } catch (error) {
                    logger.error(`[Worker] Job ${payload.jobId} failed:`, error);
                    // Publish failure event
                    await producer.send({
                        topic: 'bulk.import.failed',
                        messages: [{ 
                            value: JSON.stringify({ 
                                jobId: payload.jobId, 
                                status: 'failed',
                                error: error instanceof Error ? error.message : 'Unknown error'
                            }) 
                        }]
                    });
                }
            }
        });
    } catch (e) {
        logger.error("Failed to start worker", e);
    }
};

start();