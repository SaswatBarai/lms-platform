import zxcvbn from 'zxcvbn';
import { AppError } from './AppError.js';

export const validatePasswordStrength = (password: string) => {
    // Phase 1: Password Policy
    if (password.length < 12) {
        throw new AppError('Password must be at least 12 characters long', 400);
    }
    
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (!(hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar)) {
        throw new AppError('Password must contain uppercase, lowercase, number and special character', 400);
    }

    const result = zxcvbn(password);
    if (result.score < 3) {
        throw new AppError('Password is too weak (common pattern detected)', 400);
    }
};