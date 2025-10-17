import { authOTP } from "@services/auth.service.js";
import { IProducerPayload } from "../types/index.js";
import {kafka} from "./kafka.js";


export async function startNotificationConsumer(): Promise<void> {
	try {
		const consumer = kafka.consumer({ 
			groupId: process.env.KAFKA_GROUP_ID || "notification-group",
			sessionTimeout: 30000,
			heartbeatInterval: 3000,
		});
		
		await consumer.connect();
		console.log("[notification] Kafka consumer connected successfully");
		
		await consumer.subscribe({ topic: "otp-auth", fromBeginning: false });
		console.log("[notification] Subscribed to otp-auth topic");
		
		await consumer.run({
			eachMessage: async ({ topic, partition, message }) => {
				try {
					if (!message.value) {
						console.log("[notification] Received empty message");
						return;
					}

					const payload: IProducerPayload = JSON.parse(message.value.toString());
					const {action,data,type,subType} = payload;
					console.log(`[notification] Processing message: ${action}-${type}-${subType}`);
					
					switch(action) {
						case "auth-otp":
							await authOTP({data,type,subType});
							break;
						default:
							console.log(`[notification] Unknown action: ${action}`);
					}

				} catch (error) {
					console.error("[notification] Error processing message:", error);
				}
			},
		});
	} catch (error) {
		console.error("[notification] Error starting consumer:", error);
		// Retry after 5 seconds
		setTimeout(() => {
			console.log("[notification] Retrying to start consumer...");
			startNotificationConsumer();
		}, 5000);
	}
}