import { authOTP } from "@services/auth.service.js";
import { IProducerPayload } from "../types/index.js";
import {kafka} from "./kafka.js";


export async function startNotificationConsumer(): Promise<void> {
	const consumer = kafka.consumer({ groupId: process.env.KAFKA_GROUP_ID || "notification-group" });
	await consumer.connect();
	await consumer.subscribe({ topic: "rider-updates", fromBeginning: false });
	console.log("[notification] Kafka consumer connected and subscribed to rider-updates");

	await consumer.run({
		eachMessage: async ({ topic, partition, message }) => {
            try {
                if (!message.value) {
                    console.log("[notification] Received empty message");
                    return;
                }

                const payload: IProducerPayload = JSON.parse(message.value.toString());
                const {action,data,type,subType} = payload;
                switch(action) {
                    case "auth-otp":
                        authOTP({data,type,subType});
                }

            } catch (error) {
                console.error("[notification] Error processing message:", error);
            }
		},
	});
}