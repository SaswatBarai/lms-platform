import { Router } from "express";
import multer from "multer";
import {
    uploadBulkImportController,
    validateBulkImportController
} from "../controller/bulk/bulk-import.controller.js";
import {
    getJobStatusController,
    listJobsController,
    rollbackJobController,
    getErrorReportController
} from "../controller/bulk/bulk-job.controller.js";
import { AuthenticatedUser } from "../middleware/authValidator.js";

const router: Router = Router();

// Configure multer for file uploads (memory storage)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 50 * 1024 * 1024 // 50MB limit
    }
});

// Health check endpoint (public, no auth required)
router.get("/health", (req, res) => {
    res.status(200).json({ 
        status: "ok", 
        service: "bulk-import-api",
        timestamp: new Date().toISOString()
    });
});

// Bulk Import Routes
router.post(
    "/upload",
    AuthenticatedUser.checkCollege, // Or checkNonTeachingStaff based on requirements
    upload.single('file'),
    uploadBulkImportController
);

router.post(
    "/validate",
    AuthenticatedUser.checkCollege,
    upload.single('file'),
    validateBulkImportController
);

// Job Management Routes
router.get(
    "/jobs",
    AuthenticatedUser.checkCollege,
    listJobsController
);

router.get(
    "/jobs/:jobId",
    AuthenticatedUser.checkCollege,
    getJobStatusController
);

router.post(
    "/jobs/:jobId/rollback",
    AuthenticatedUser.checkCollege,
    rollbackJobController
);

router.get(
    "/jobs/:jobId/errors",
    AuthenticatedUser.checkCollege,
    getErrorReportController
);

export default router;

