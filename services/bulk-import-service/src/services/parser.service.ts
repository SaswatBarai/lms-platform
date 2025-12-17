import { GetObjectCommand } from "@aws-sdk/client-s3";
import { s3Client } from "../config/s3";
import { parseCsvStream } from "../utils/csvParser";
import { parseJsonStream } from "../utils/jsonParser";
import { Readable } from "stream";

export class ParserService {
    static async parseFile(bucket: string, key: string): Promise<any[]> {
        const command = new GetObjectCommand({ Bucket: bucket, Key: key });
        const response = await s3Client.send(command);
        
        if (!response.Body) throw new Error("File body is empty");
        
        // Determine file type from extension
        const fileExtension = key.toLowerCase().split('.').pop();
        
        if (fileExtension === 'json') {
            return parseJsonStream(response.Body as Readable);
        } else {
            // Default to CSV
            return parseCsvStream(response.Body as Readable);
        }
    }
}