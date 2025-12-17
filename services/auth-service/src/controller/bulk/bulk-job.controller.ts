import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { BulkUploadService } from "../../services/bulk-upload.service.js";
import { BulkJobService } from "../../services/bulk-job.service.js";
import { AppError } from "../../utils/AppError.js";
import { prisma } from "../../lib/prisma.js";

/**
 * Get job status
 * GET /api/bulk/jobs/:jobId
 */
export const getJobStatusController = asyncHandler(
    async (req: Request, res: Response) => {
        const { jobId } = req.params;
        if (!jobId) {
            throw new AppError("Job ID is required", 400);
        }
        const userId = req.headers['x-user-id'] as string;
        const userType = req.headers['x-user-role'] as string;

        const job = await BulkUploadService.getJobStatus(jobId);

        // Verify user has access to this job
        if (job.uploadedBy !== userId || job.uploadedByType !== userType) {
            throw new AppError("Unauthorized access to job", 403);
        }

        res.status(200).json({
            success: true,
            data: job
        });
    }
);

/**
 * List jobs for current user
 * GET /api/bulk/jobs
 */
export const listJobsController = asyncHandler(
    async (req: Request, res: Response) => {
        const userId = req.headers['x-user-id'] as string;
        const userType = req.headers['x-user-role'] as string;
        const limit = parseInt(req.query.limit as string) || 50;
        const offset = parseInt(req.query.offset as string) || 0;

        const jobs = await BulkUploadService.listJobs(userId, userType, limit, offset);

        res.status(200).json({
            success: true,
            data: {
                jobs,
                pagination: {
                    limit,
                    offset,
                    total: jobs.length
                }
            }
        });
    }
);

/**
 * Rollback a bulk import job
 * POST /api/bulk/jobs/:jobId/rollback
 */
export const rollbackJobController = asyncHandler(
    async (req: Request, res: Response) => {
        const { jobId } = req.params;
        if (!jobId) {
            throw new AppError("Job ID is required", 400);
        }
        const userId = req.headers['x-user-id'] as string;
        const userType = req.headers['x-user-role'] as string;

        // Verify job exists and user has access
        // @ts-ignore - BulkImportJob model exists in shared database
        const job = await prisma.bulkImportJob.findUnique({
            where: { id: jobId }
        });

        if (!job) {
            throw new AppError("Job not found", 404);
        }

        if (job.uploadedBy !== userId || job.uploadedByType !== userType) {
            throw new AppError("Unauthorized access to job", 403);
        }

        // Check if job is completed
        if (job.status !== "completed") {
            throw new AppError("Only completed jobs can be rolled back", 400);
        }

        // Check if rollback is allowed (within 24 hours)
        const completedAt = job.completedAt;
        if (!completedAt) {
            throw new AppError("Job completion time not found", 400);
        }

        const hoursSinceCompletion = (Date.now() - completedAt.getTime()) / (1000 * 60 * 60);
        if (hoursSinceCompletion > 24) {
            throw new AppError("Rollback is only allowed within 24 hours of completion", 400);
        }

        // Perform rollback
        const result = await BulkJobService.rollbackJob(jobId);

        res.status(200).json({
            success: true,
            message: "Job rolled back successfully",
            data: {
                jobId,
                recordsDeleted: result.recordsDeleted
            }
        });
    }
);

/**
 * Get error report URL
 * GET /api/bulk/jobs/:jobId/errors
 */
export const getErrorReportController = asyncHandler(
    async (req: Request, res: Response) => {
        const { jobId } = req.params;
        if (!jobId) {
            throw new AppError("Job ID is required", 400);
        }
        const userId = req.headers['x-user-id'] as string;
        const userType = req.headers['x-user-role'] as string;

        // @ts-ignore - BulkImportJob model exists in shared database
        const job = await prisma.bulkImportJob.findUnique({
            where: { id: jobId }
        });

        if (!job) {
            throw new AppError("Job not found", 404);
        }

        if (job.uploadedBy !== userId || job.uploadedByType !== userType) {
            throw new AppError("Unauthorized access to job", 403);
        }

        if (!job.errorReportUrl) {
            throw new AppError("No error report available for this job", 404);
        }

        res.status(200).json({
            success: true,
            data: {
                errorReportUrl: job.errorReportUrl,
                failedRows: job.failedRows
            }
        });
    }
);

