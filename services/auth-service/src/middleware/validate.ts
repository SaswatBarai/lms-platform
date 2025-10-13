import { RequestHandler } from "express";
import { ZodObject, ZodError } from "zod";

type SchemaParts = {
  body?: ZodObject<any>;
  params?: ZodObject<any>;
  query?: ZodObject<any>;
  headers?: ZodObject<any>;
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
      return next(err);
    }
  };