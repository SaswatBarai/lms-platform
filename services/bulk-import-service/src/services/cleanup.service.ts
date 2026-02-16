import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { s3Client } from "../config/s3";
import { logger } from "../config/logger";

export class CleanupService {
    /**
     * Delete a file from S3 bucket
     * @param bucket - S3 bucket name
     * @param key - S3 object key (file path)
     * @returns Promise<boolean> - true if deletion was successful
     */
    static async deleteFromS3(bucket: string, key: string): Promise<boolean> {
        try {
            const command = new DeleteObjectCommand({
                Bucket: bucket,
                Key: key
            });

            await s3Client.send(command);
            logger.info(`[CleanupService] Successfully deleted S3 file: ${bucket}/${key}`);
            return true;
        } catch (error) {
            logger.error(`[CleanupService] Failed to delete S3 file: ${bucket}/${key}`, error);
            return false;
        }
    }

    /**
     * Cleanup all files associated with a bulk import job
     * @param bucket - S3 bucket name
     * @param s3Key - The main CSV/JSON file key
     * @param errorReportKey - Optional error report file key
     */
    static async cleanupJobFiles(
        bucket: string,
        s3Key: string,
        errorReportKey?: string
    ): Promise<{ sourceDeleted: boolean; errorReportDeleted: boolean }> {
        // Delete the source CSV/JSON file
        const sourceDeleted = await this.deleteFromS3(bucket, s3Key);

        // Note: We keep the error report for user reference
        // If you also want to delete error reports after some time, 
        // you can implement a scheduled cleanup job
        let errorReportDeleted = true;
        
        // Uncomment below if you want to delete error reports immediately too
        // if (errorReportKey) {
        //     errorReportDeleted = await this.deleteFromS3(bucket, errorReportKey);
        // }

        return { sourceDeleted, errorReportDeleted };
    }
}

