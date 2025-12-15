import { prisma } from "@lib/prisma.js";
import { AppError } from "@utils/AppError.js";
import { hashPassword, verifyPassword } from "@utils/security.js"; // Import from your security.ts
import zxcvbn from "zxcvbn";

export class PasswordService {
    static validatePolicy(password: string) {
        if (password.length < 12) throw new AppError("Password must be at least 12 characters.", 400);
        if (!/[A-Z]/.test(password)) throw new AppError("Password must contain an uppercase letter.", 400);
        if (!/[a-z]/.test(password)) throw new AppError("Password must contain a lowercase letter.", 400);
        if (!/[0-9]/.test(password)) throw new AppError("Password must contain a number.", 400);
        if (!/[!@#$%^&*]/.test(password)) throw new AppError("Password must contain a special character.", 400);

        const strength = zxcvbn(password);
        if (strength.score < 3) throw new AppError("Password is too weak. Avoid common phrases.", 400);
    }

    static async checkHistory(userId: string, userType: string, newPassword: string) {
        const history = await prisma.passwordHistory.findMany({
            where: { userId, userType },
            orderBy: { createdAt: 'desc' },
            take: 5
        });

        for (const record of history) {
            if (await verifyPassword(record.passwordHash, newPassword)) {
                throw new AppError("Cannot reuse any of your last 5 passwords.", 400);
            }
        }
    }

    static async addToHistory(userId: string, userType: string, passwordHash: string) {
        await prisma.passwordHistory.create({
            data: { userId, userType, passwordHash }
        });
    }
}