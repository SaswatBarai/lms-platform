import argon2 from "argon2";

/**
 * Generates a default password hash for bulk imports
 * Default password: "TempPassword123!"
 */
export async function hashPassword(password: string = "TempPassword123!"): Promise<string> {
    return await argon2.hash(password, {
        type: argon2.argon2id,
    });
}

