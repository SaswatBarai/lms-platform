import { PutObjectCommand } from "@aws-sdk/client-s3";
import { s3Client, S3_BUCKET_NAME } from "../config/s3.js";
import { prisma } from "../lib/prisma.js";
import { KafkaProducer } from "../messaging/producer.js";
import { v4 as uuidv4 } from "uuid";

export interface BulkUploadOptions {
    skipDuplicates?: boolean;
    sendWelcomeEmails?: boolean;
}

export class BulkUploadService {
    /**
     * Upload file to S3 and create bulk import job
     */
    static async uploadFileAndCreateJob(
        file: Express.Multer.File,
        importType: "student_import" | "teacher_import",
        uploadedBy: string,
        uploadedByType: string,
        collegeId?: string,
        options?: BulkUploadOptions
    ): Promise<{ jobId: string; status: string }> {
        // Generate unique job ID
        const jobId = uuidv4();
        const fileName = file.originalname;
        const fileExtension = fileName.split('.').pop()?.toLowerCase() || 'csv';
        const s3Key = `imports/${jobId}/${fileName}`;

        // Upload file to S3 using PutObjectCommand (more reliable than streaming)
        console.log(`[BulkUploadService] Uploading file to S3: ${s3Key}, size: ${file.buffer?.length || 0} bytes`);
        
        if (!file.buffer || file.buffer.length === 0) {
            throw new Error("File buffer is empty - upload failed");
        }
        
        const putCommand = new PutObjectCommand({
                Bucket: S3_BUCKET_NAME,
                Key: s3Key,
            Body: file.buffer,
                ContentType: file.mimetype || `text/${fileExtension === 'json' ? 'json' : 'csv'}`
        });
        
        try {
            const result = await s3Client.send(putCommand);
            console.log(`[BulkUploadService] S3 upload result:`, JSON.stringify(result.$metadata));
        } catch (s3Error: any) {
            console.error(`[BulkUploadService] S3 upload failed:`, s3Error.message || s3Error);
            throw new Error(`Failed to upload file to S3: ${s3Error.message}`);
        }
        
        const fileUrl = `http://minio:9000/${S3_BUCKET_NAME}/${s3Key}`;
        console.log(`[BulkUploadService] File uploaded successfully: ${fileUrl}`);

        // Create job record in database
        const job = await prisma.bulkImportJob.create({
            data: {
                id: jobId,
                type: importType,
                fileUrl,
                fileName,
                uploadedBy,
                uploadedByType,
                collegeId: collegeId || null,
                status: "pending",
                options: JSON.parse(JSON.stringify(options || {}))
            }
        });

        // Publish job to Kafka
        const kafkaProducer = KafkaProducer.getInstance();
        await kafkaProducer.sendBulkImportJob({
            jobId,
            importType,
            bucket: S3_BUCKET_NAME,
            s3Key,
            userId: uploadedBy,
            ...(collegeId && { collegeId })
        });

        return {
            jobId: job.id,
            status: job.status
        };
    }

    /**
     * Validate file format (CSV or JSON)
     */
    static validateFileFormat(file: Express.Multer.File): { valid: boolean; error?: string } {
        const allowedMimeTypes = [
            'text/csv',
            'application/csv',
            'text/plain',
            'application/json'
        ];

        const fileExtension = file.originalname.split('.').pop()?.toLowerCase();
        const allowedExtensions = ['csv', 'json'];

        if (!allowedExtensions.includes(fileExtension || '')) {
            return {
                valid: false,
                error: `Invalid file format. Allowed formats: ${allowedExtensions.join(', ')}`
            };
        }

        if (!allowedMimeTypes.includes(file.mimetype) && fileExtension !== 'json') {
            // Allow JSON files even if mimetype is not set correctly
            if (fileExtension !== 'json') {
                return {
                    valid: false,
                    error: `Invalid MIME type: ${file.mimetype}`
                };
            }
        }

        return { valid: true };
    }

    /**
     * Get job status
     */
    static async getJobStatus(jobId: string) {
        // @ts-ignore - BulkImportJob model exists in shared database
        const job = await prisma.bulkImportJob.findUnique({
            where: { id: jobId }
        });

        if (!job) {
            throw new Error("Job not found");
        }

        return job;
    }

    /**
     * List jobs for a user
     */
    static async listJobs(
        uploadedBy: string,
        uploadedByType: string,
        limit: number = 50,
        offset: number = 0
    ) {
        // @ts-ignore - BulkImportJob model exists in shared database
        return await prisma.bulkImportJob.findMany({
            where: {
                uploadedBy,
                uploadedByType
            },
            orderBy: {
                createdAt: 'desc'
            },
            take: limit,
            skip: offset
        });
    }
}

