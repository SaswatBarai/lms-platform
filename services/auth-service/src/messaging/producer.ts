import { Producer } from "kafkajs";
import { kafka } from "./kafka.js";
import { ProducerPayload } from "../types/organization.js";

export class KafkaProducer {
	private producer: Producer | null = null;
	private connected: boolean = false;

	constructor() {
		// Don't connect in constructor, do it lazily in methods
	}

	private async ensureConnected(): Promise<void> {
		if (!this.producer) {
			this.producer = kafka.producer();
		}
		if (!this.connected) {
			await this.producer.connect();
			this.connected = true;
		}
	}

	public async publishOTP(message: ProducerPayload): Promise<boolean> {
		await this.ensureConnected();
		const result = await this.producer!.send({
			topic: "otp-auth",
			messages:[{
				value: JSON.stringify(message)
			}],
		});
		if(result && result.length > 0) {
			return true;
		}
		return false;
	}


	public async publishEmailNotification(message:ProducerPayload):Promise<boolean>{
		// Use the same topic as OTP messages since notification service subscribes to "otp-auth"
		// The service differentiates based on the "action" field
		await this.ensureConnected();

		const result = await this.producer!.send({
			topic:"otp-auth", // Use same topic as notification service subscribes to
			messages:[{
				value: JSON.stringify(message)
			}],
		})

		if(result && result.length > 0){
			return true;
		}
		return false;

	}

	public async publishForgotPassword(message:ProducerPayload):Promise<boolean> {
		await this.ensureConnected();
		const result = await this.producer!.send({
			topic: "forgot-password-messages",
			messages:[{
				value: JSON.stringify(message)
			}],
		})
		if(result && result.length > 0){
			return true;
		}
		return false;
	}

	
}