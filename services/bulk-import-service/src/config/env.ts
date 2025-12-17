import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
    DATABASE_URL: z.string(),
    REDIS_URL: z.string(),
    KAFKA_BROKERS: z.string().default("kafka:29092"),
    AWS_REGION: z.string().default("us-east-1"),
    S3_ENDPOINT: z.string().default("http://minio:9000"),
    S3_BUCKET_NAME: z.string().default("lms-bulk-imports"),
    AWS_ACCESS_KEY_ID: z.string(),
    AWS_SECRET_ACCESS_KEY: z.string(),
});

export const env = envSchema.parse(process.env);