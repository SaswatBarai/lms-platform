export interface BulkImportJobPayload {
    jobId: string;
    s3Key: string;
    bucket: string;
    importType: 'student_import' | 'teacher_import';
    userId: string;
    collegeId?: string;
}

export interface ImportResult {
    total: number;
    success: number;
    failed: number;
    errorUrl?: string;
}