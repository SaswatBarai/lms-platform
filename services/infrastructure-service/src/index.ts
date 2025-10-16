import { ensureKafkaTopics } from "./kafka/admin.js";

async function initInfrastructure(): Promise<void> {
	console.log("[infra] Initializing infrastructure...");
	await ensureKafkaTopics();
	console.log("[infra] Infrastructure initialization completed.");
}

initInfrastructure().catch((err) => {
	console.error("[infra] Initialization failed", err);
	process.exit(1);
});


