import { Kafka } from 'kafkajs';

const kafka = new Kafka({
  clientId: 'auth-service',
  brokers: [process.env.KAFKA_BROKER || 'localhost:9092']
});

const producer = kafka.producer();
await producer.connect();

export const logAuthEvent = async (event: {
    userId: string,
    userType: string,
    action: string,
    ipAddress: string,
    userAgent: string,
    success: boolean,
    metadata?: any
}) => {
    try {
        await producer.send({
            topic: 'auth.audit.events',
            messages: [
                { value: JSON.stringify({ ...event, timestamp: new Date().toISOString() }) }
            ]
        });
    } catch (error) {
        console.error('Failed to send audit log:', error);
    }
};