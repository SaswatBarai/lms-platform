import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { BulkUploadService } from "../../services/bulk-upload.service.js";
import { AppError } from "../../utils/AppError.js";
import { ParserService } from "../../services/bulk-parser.service.js";
import { ValidatorService } from "../../services/bulk-validator.service.js";

/**
 * Upload file and create bulk import job
 * POST /api/bulk/upload
 */
export const uploadBulkImportController = asyncHandler(
    async (req: Request, res: Response) => {
        const file = req.file;
        if (!file) {
            throw new AppError("No file uploaded", 400);
        }

        // Validate file format
        const validation = BulkUploadService.validateFileFormat(file);
        if (!validation.valid) {
            throw new AppError(validation.error || "Invalid file format", 400);
        }

        // Get user info from request (set by auth middleware)
        const userId = req.headers['x-user-id'] as string;
        const userType = req.headers['x-user-role'] as string;
        const collegeId = req.headers['x-user-college-id'] as string | undefined;

        // Get import type and options from body
        const { importType, options } = req.body;

        if (!importType || !["student_import", "teacher_import"].includes(importType)) {
            throw new AppError("Invalid import type. Must be 'student_import' or 'teacher_import'", 400);
        }

        // Upload file and create job
        const result = await BulkUploadService.uploadFileAndCreateJob(
            file,
            importType,
            userId,
            userType,
            collegeId,
            options ? JSON.parse(options) : undefined
        );

        res.status(202).json({
            success: true,
            message: "File uploaded successfully. Import job created.",
            data: {
                jobId: result.jobId,
                status: result.status
            }
        });
    }
);

/**
 * Validate file without importing
 * POST /api/bulk/validate
 */
export const validateBulkImportController = asyncHandler(
    async (req: Request, res: Response) => {
        const file = req.file;
        if (!file) {
            throw new AppError("No file uploaded", 400);
        }

        // Validate file format
        const validation = BulkUploadService.validateFileFormat(file);
        if (!validation.valid) {
            throw new AppError(validation.error || "Invalid file format", 400);
        }

        const { importType } = req.body;
        if (!importType || !["student_import", "teacher_import"].includes(importType)) {
            throw new AppError("Invalid import type", 400);
        }

        // Parse file
        const rows = await ParserService.parseFileBuffer(file.buffer, file.originalname);

        // Validate rows (this would need schema based on importType)
        // For now, return basic validation
        const errors: Array<{ row: number; error: string }> = [];
        
        // Basic validation - check if rows exist
        if (rows.length === 0) {
            errors.push({ row: 0, error: "File is empty" });
        }

        res.status(200).json({
            success: true,
            message: "Validation complete",
            data: {
                totalRows: rows.length,
                validRows: rows.length - errors.length,
                invalidRows: errors.length,
                errors: errors.slice(0, 100) // Limit to first 100 errors
            }
        });
    }
);

