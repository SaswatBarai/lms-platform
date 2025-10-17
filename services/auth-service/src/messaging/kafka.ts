import { Kafka} from "kafkajs";

const brokers = (process.env.KAFKA_BROKERS || "kafka:29092").split(",");

export const kafka = new Kafka({
	clientId: process.env.KAFKA_CLIENT_ID || "auth-service",
	brokers,
});

export async function initKafkaProducer(): Promise<void> {
	const producer = kafka.producer();
	await producer.connect();
	console.log("[auth] Kafka producer connected successfully");
	// Keep the producer connected for the lifecycle of the application
	// It will be used by the KafkaProducer class
}



