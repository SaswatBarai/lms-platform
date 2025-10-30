import { RequestHandler } from "express";
import { ZodObject, ZodError, ZodArray, ZodTypeAny, ZodSchema } from "zod";

type SchemaParts = {
  body?: ZodSchema<any>;
  params?: ZodSchema<any>;
  query?: ZodSchema<any>;
  headers?: ZodSchema<any>;
};

// Helper function to format detailed Zod errors with better context
const formatZodErrors = (error: ZodError, requestData: any) => {
  return error.issues.map((issue) => {
    const path = issue.path.join(".");
    const pathParts = issue.path;
    
    // For array validation, extract index and field
    let arrayIndex: number | null = null;
    let fieldName: string | null = null;
    let value: any = undefined;

    if (pathParts.length > 0) {
      // Check if first part is a number (array index)
      if (typeof pathParts[0] === "number") {
        arrayIndex = pathParts[0];
        fieldName = pathParts.length > 1 ? String(pathParts[1]) : null;
        
        // Try to get the actual value from request data
        try {
          if (Array.isArray(requestData) && arrayIndex !== null) {
            if (fieldName) {
              value = requestData[arrayIndex]?.[fieldName];
            } else {
              value = requestData[arrayIndex];
            }
          }
        } catch (e) {
          // Value extraction failed, leave it undefined
        }
      } else {
        // Not an array, just a regular field
        fieldName = String(pathParts[0]);
        try {
          value = requestData?.[fieldName];
        } catch (e) {
          // Value extraction failed
        }
      }
    }

    // Build a clear error object
    const errorObj: any = {
      path: path || "root",
      message: issue.message,
    };

    // Add array context if applicable
    if (arrayIndex !== null) {
      errorObj.arrayIndex = arrayIndex;
      errorObj.location = `Item ${arrayIndex}`;
    }

    // Add field name
    if (fieldName) {
      errorObj.field = fieldName;
    }

    // Add the problematic value if available
    if (value !== undefined) {
      errorObj.receivedValue = value;
    }

    // Add expected type if available
    if (issue.code === "invalid_type") {
      errorObj.expectedType = issue.expected;
      // Only add receivedType if it exists on the issue
      if ('received' in issue) {
        errorObj.receivedType = (issue as any).received;
      }
    }

    return errorObj;
  });
};

export const validate =
  (schema: SchemaParts): RequestHandler =>
  (req, res, next) => {
    try {
      // Re-assigning body is common and safe as it's often 'any'
      if (schema.body) {
        req.body = schema.body.parse(req.body);
      }
      // For these, we just validate. No need to reassign and cause type issues.
      if (schema.params) {
        schema.params.parse(req.params);
      }
      if (schema.query) {
        schema.query.parse(req.query);
      }
      if (schema.headers) {
        schema.headers.parse(req.headers);
      }

      return next();
    } catch (err) {
      if (err instanceof ZodError) {
        // Determine which part of the request had the error
        let requestData = req.body;
        if (schema.params && err.issues[0]?.path) {
          requestData = req.params;
        } else if (schema.query && err.issues[0]?.path) {
          requestData = req.query;
        } else if (schema.headers && err.issues[0]?.path) {
          requestData = req.headers;
        }

        const formattedErrors = formatZodErrors(err, requestData);
        
        return res.status(400).json({
          status: "fail",
          message: "Validation failed",
          totalErrors: formattedErrors.length,
          errors: formattedErrors,
        });
      }
      return res.status(400).json({
        status: "fail",
        message: "Invalid input data",
        errors: [{ message: "An unknown error occurred" }],
      });
    }
  };