import { kafka } from "./client.js";
import {topics} from "./topics.js"

export async function ensureKafkaTopics(): Promise<void> {
	const admin = kafka.admin();
	console.log("[infra] Connecting Kafka admin...");
	await admin.connect();
	console.log("[infra] Kafka admin connected");

	console.log("[infra] Ensuring topics:", topics.map(t => t.topic).join(", "));
	await admin.createTopics({ topics, waitForLeaders: true });
	console.log("[infra] Topics ensured");

	await admin.disconnect();
	console.log("[infra] Kafka admin disconnected");
}

// Allow running directly (node dist/kafka/admin.js)
if (import.meta.url === `file://${process.argv[1]}`) {
	ensureKafkaTopics().catch((err) => {
		console.error("[infra] Kafka admin init failed", err);
		process.exit(1);
	});
}


