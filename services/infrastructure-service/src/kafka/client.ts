import { Kafka } from "kafkajs";

const brokers = (process.env.KAFKA_BROKERS || "kafka:29092").split(",");

export const kafka = new Kafka({
	clientId: process.env.KAFKA_CLIENT_ID || "infrastructure-service",
	brokers,
});


