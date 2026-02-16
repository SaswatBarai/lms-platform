import { kafka } from "./client.js";
import {topics} from "./topics.js";
import { logger } from "../config/logger.js";

export async function ensureKafkaTopics(): Promise<void> {
	const admin = kafka.admin();
	logger.info("[infra] Connecting Kafka admin...");
	await admin.connect();
	logger.info("[infra] Kafka admin connected");

	logger.info("[infra] Ensuring topics:", topics.map(t => t.topic).join(", "));
	await admin.createTopics({ topics, waitForLeaders: true });
	logger.info("[infra] Topics ensured");

	await admin.disconnect();
	logger.info("[infra] Kafka admin disconnected");
}

// Allow running directly (node dist/kafka/admin.js)
if (import.meta.url === `file://${process.argv[1]}`) {
	ensureKafkaTopics().catch((err) => {
		logger.error("[infra] Kafka admin init failed", err);
		process.exit(1);
	});
}


