import * as fastcsv from "fast-csv";
import { ImportError } from "../types/import.types";
import { Upload } from "@aws-sdk/lib-storage";
import { s3Client } from "../config/s3";
import { env } from "../config/env";
import { PassThrough } from "stream";

export class ErrorReporter {
    static async generateAndUpload(jobId: string, errors: ImportError[]): Promise<string> {
        const stream = new PassThrough();
        const csvStream = fastcsv.format({ headers: true });

        csvStream.pipe(stream);

        errors.forEach(err => {
            csvStream.write({
                Row: err.row,
                Error: err.error,
                ...err.data 
            });
        });
        csvStream.end();

        const s3Key = `imports/${jobId}/errors.csv`;

        const upload = new Upload({
            client: s3Client,
            params: {
                Bucket: env.S3_BUCKET_NAME,
                Key: s3Key,
                Body: stream,
                ContentType: 'text/csv'
            }
        });

        await upload.done();
        return s3Key;
    }
}