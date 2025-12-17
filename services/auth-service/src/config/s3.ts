import { S3Client } from "@aws-sdk/client-s3";
import env from "./env.js";

export const s3Client = new S3Client({
    region: process.env.AWS_REGION || "us-east-1",
    endpoint: process.env.S3_ENDPOINT || "http://minio:9000",
    forcePathStyle: true,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ""
    }
});

export const S3_BUCKET_NAME = process.env.S3_BUCKET_NAME || "lms-bulk-imports";

