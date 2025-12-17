import { Kafka } from "kafkajs";
import { env } from "./env";

export const kafka = new Kafka({
    clientId: 'bulk-import-service',
    brokers: env.KAFKA_BROKERS.split(',')
});

export const consumer = kafka.consumer({ groupId: 'bulk-import-group' });
export const producer = kafka.producer();