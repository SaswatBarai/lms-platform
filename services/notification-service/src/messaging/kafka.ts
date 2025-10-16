import { Kafka } from "kafkajs";

const brokers = (process.env.KAFKA_BROKERS || "kafka:29092").split(",");

const kafka = new Kafka({
	clientId: process.env.KAFKA_CLIENT_ID || "notification-service",
	brokers,
});

export async function startNotificationConsumer(): Promise<void> {
	const consumer = kafka.consumer({ groupId: process.env.KAFKA_GROUP_ID || "notification-group" });
	await consumer.connect();
	await consumer.subscribe({ topic: "rider-updates", fromBeginning: false });
	console.log("[notification] Kafka consumer connected and subscribed to rider-updates");

	await consumer.run({
		eachMessage: async ({ message }) => {
			const raw = message.value?.toString() ?? "{}";
			const data = JSON.parse(raw);
			console.log("[notification] Received rider update:", data);
			// TODO: trigger email or other notification using existing services
		},
	});
}


