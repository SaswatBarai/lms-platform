import { Kafka } from "kafkajs";

const brokers = (process.env.KAFKA_BROKERS || "kafka:29092").split(",");

export const kafka = new Kafka({
	clientId: process.env.KAFKA_CLIENT_ID || "notification-service",
	brokers,
	retry: {
		initialRetryTime: 100,
		retries: 8
	},
	connectionTimeout: 3000,
	requestTimeout: 30000,
});




