import argon from "argon2";
import crypto from "crypto";
import env from "@config/env.js"

const OTP_SECRET = env.OTP_SECRET;


export const generateOtp = (): string => {
    const otp = crypto.randomInt(100000, 999999).toString();
    return otp;
}

/**
 * Hash the OTP using the SHA-256 algorithm + argon2 for added security
 * what is SHA-256: SHA-256 (Secure Hash Algorithm 256-bit) is a cryptographic hash function that generates 
 * a fixed-size (256-bit) hash value from input data of any size. It is widely used for data integrity'
 * verification and digital signatures.    
 */
export const hashOtp = async (otp: string, sessionToken: string): Promise<string> => {
    const data = crypto.createHmac("sha256", OTP_SECRET).update(`${sessionToken}:${otp}`).digest("hex"); 
    const hashedOtp = await argon.hash(data);
    return hashedOtp;
}

export const verifyOtp = async (otp: string, sessionToken: string, storedHash: string): Promise<boolean> => {
    const data = crypto.createHmac("sha256",OTP_SECRET).update(`${sessionToken}:${otp}`).digest("hex");
    return await argon.verify(storedHash, data);
}