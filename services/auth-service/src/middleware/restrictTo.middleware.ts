import { Request, Response, NextFunction } from 'express';
import { AppError } from '@utils/AppError.js';

/**
 * Middleware to restrict access to certain roles
 * Checks the role from req.user object and verifies it matches allowed roles
 * @param allowedRoles - List of roles allowed to access the route
 */
export const restrictTo = (...allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Check if user is authenticated
    if (!req.user) {
      throw new AppError('User not authenticated', 401);
    }

    // Check if user's role is in the allowed roles
    if (!allowedRoles.includes(req.user.role)) {
      throw new AppError(
        `You do not have permission to access this resource. Required role: ${allowedRoles.join(', ')}`,
        403
      );
    }

    next();
  };
};
