import { RequestHandler } from "express";
import { ZodObject, ZodError, ZodArray, ZodTypeAny, ZodSchema } from "zod";

type SchemaParts = {
  body?: ZodSchema<any>;
  params?: ZodSchema<any>;
  query?: ZodSchema<any>;
  headers?: ZodSchema<any>;
};

// Helper function to extract errors recursively
const extractZodErrors = (
  errors: any,
  path = ""
): Array<{ path: string; message: string }> => {
  if (!errors) return [];
  if (errors._errors && errors._errors.length > 0) {
    return [
      {
        path: path || "root",
        message: errors._errors.join(", "),
      },
    ];
  }
  return Object.entries(errors)
    .filter(([key]) => key !== "_errors")
    .flatMap(([key, value]) => {
      const newPath = path ? `${path}.${key}` : key;
      return extractZodErrors(value, newPath);
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
        const formattedErrors = extractZodErrors(err.format());
        return res.status(400).json({
          status: "fail",
          message: "Invalid input data",
          errors:
            formattedErrors.length > 0
              ? formattedErrors
              : [{ message: "An unknown error occurred" }],
        });
      }
      return res.status(400).json({
        status: "fail",
        message: "Invalid input data",
        errors: [{ message: "An unknown error occurred" }],
      });
    }
  };