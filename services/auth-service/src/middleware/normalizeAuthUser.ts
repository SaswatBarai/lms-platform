import { Request, Response, NextFunction } from 'express';
import { AppError } from '@utils/AppError.js';

/**
 * Middleware to normalize authentication context to req.user
 * Extracts user info from any authentication context (organization, college, teacher, etc)
 * and sets it on req.user for use in controllers
 */
export const normalizeAuthUser = (req: Request, res: Response, next: NextFunction) => {
  // Check if user is already set (from some other auth mechanism)
  if (req.user) {
    return next();
  }

  // Extract user from any of the available authentication contexts
  if (req.organization) {
    req.user = {
      id: req.organization.id,
      role: req.organization.role,
      email: req.organization.email,
    };
  } else if (req.college) {
    req.user = {
      id: req.college.id,
      role: req.college.role,
      email: req.college.email,
    };
  } else if (req.teacher) {
    req.user = {
      id: req.teacher.id,
      role: req.teacher.role,
      email: req.teacher.email,
    };
  } else if (req.hod) {
    req.user = {
      id: req.hod.id,
      role: req.hod.role,
      email: req.hod.email,
    };
  } else if (req.student) {
    req.user = {
      id: req.student.id,
      role: req.student.role,
      email: req.student.email,
    };
  } else if (req.dean) {
    req.user = {
      id: req.dean.id,
      role: req.dean.role,
      email: req.dean.mailId,
    };
  } else if (req.nonTeachingStaff) {
    req.user = {
      id: req.nonTeachingStaff.id,
      role: req.nonTeachingStaff.role,
      email: req.nonTeachingStaff.email,
    };
  } else {
    throw new AppError('User not authenticated', 401);
  }

  next();
};
