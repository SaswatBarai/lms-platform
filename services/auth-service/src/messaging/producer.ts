import { Producer } from "kafkajs";
import { kafka } from "./kafka.js";
import { ProducerPayload } from "../types/organization.js";

export class KafkaProducer {
	private producer: Producer | null = null;

	constructor() {
		if(this.producer) return;
		this.producer = kafka.producer();
		this.producer.connect();
	}

	public async publishOTP(message: ProducerPayload): Promise<boolean> {
		if(!this.producer) {
			await this.producer!.connect();
		}
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
}