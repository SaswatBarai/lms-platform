import { Kafka, Producer } from "kafkajs";

const brokers = (process.env.KAFKA_BROKERS || "kafka:29092").split(",");

const kafka = new Kafka({
	clientId: process.env.KAFKA_CLIENT_ID || "auth-service",
	brokers,
});

let producer: Producer | null = null;

export async function initKafkaProducer(): Promise<void> {
	if (producer) return;
	producer = kafka.producer();
	await producer.connect();
	console.log("[auth] Kafka producer connected");
}

export async function publishRiderUpdate(message: unknown): Promise<void> {
	if (!producer) {
		await initKafkaProducer();
	}
	await producer!.send({
		topic: "rider-updates",
		messages: [{ value: JSON.stringify(message) }],
	});
}


