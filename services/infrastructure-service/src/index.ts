import { ensureKafkaTopics } from "./kafka/admin.js";
import http from "http";

async function initInfrastructure(): Promise<void> {
	console.log("[infra] Initializing infrastructure...");
	await ensureKafkaTopics();
	console.log("[infra] Infrastructure initialization completed.");
}

// Create a simple HTTP server for health checks
const server = http.createServer((req, res) => {
	if (req.url === "/health") {
		res.writeHead(200, { "Content-Type": "application/json" });
		res.end(JSON.stringify({ status: "healthy", service: "infrastructure-service" }));
	} else {
		res.writeHead(404);
		res.end();
	}
});

const PORT = process.env.PORT || 4003;

initInfrastructure()
	.then(() => {
		server.listen(PORT, () => {
			console.log(`[infra] Health server running on port ${PORT}`);
		});
	})
	.catch((err) => {
		console.error("[infra] Initialization failed", err);
		process.exit(1);
	});


