import { consumer, producer } from "./config/kafka";
import { StudentImportWorker } from "./workers/student-import.worker";
import { TeacherImportWorker } from "./workers/teacher-import.worker";
import { BulkImportJobPayload } from "./types/job.types";

const studentWorker = new StudentImportWorker();
const teacherWorker = new TeacherImportWorker();

const start = async () => {
    try {
        await producer.connect();
        await consumer.connect();
        await consumer.subscribe({ topic: 'bulk.import.jobs', fromBeginning: false });

        console.log("🚀 Bulk Import Worker Service Started");

        await consumer.run({
            eachMessage: async ({ topic, message }) => {
                if (!message.value) return;
                
                const payload = JSON.parse(message.value.toString()) as BulkImportJobPayload;
                console.log(`Processing Job: ${payload.jobId} [Type: ${payload.importType}]`);

                try {
                    if (payload.importType === 'student_import') {
                        await studentWorker.execute(payload);
                    } else if (payload.importType === 'teacher_import') {
                        await teacherWorker.execute(payload);
                    } else {
                        console.warn(`Unknown import type: ${payload.importType}`);
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
                    console.error(`[Worker] Job ${payload.jobId} failed:`, error);
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
        console.error("Failed to start worker", e);
    }
};

start();