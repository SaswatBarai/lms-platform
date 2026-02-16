import "./config/tracing.js";
import { ensureKafkaTopics } from "./kafka/admin.js";
import http from "http";
import client from 'prom-client';
import { logger } from "./config/logger.js";

// Initialize Metrics
const register = new client.Registry();
client.collectDefaultMetrics({ register });

async function initInfrastructure(): Promise<void> {
  logger.info("[infra] Initializing infrastructure...");
  await ensureKafkaTopics();
  logger.info("[infra] Infrastructure initialization completed.");
}

// Create a simple HTTP server for health checks and metrics
const server = http.createServer(async (req, res) => {
	// Add metrics endpoint
	if (req.url === "/metrics") {
		res.writeHead(200, { "Content-Type": register.contentType });
		res.end(await register.metrics());
		return;
	}

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
			logger.info(`[infra] Health server running on port ${PORT}`);
		});
	})
	.catch((err) => {
		logger.error("[infra] Initialization failed", err);
		process.exit(1);
	});


