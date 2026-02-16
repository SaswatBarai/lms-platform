import nodemailer from 'nodemailer';
import env from "./env.js";
import { logger } from "./logger.js";

// Create transporter only if EMAIL_MODE is 'email'
// In console mode, transporter won't be initialized
export const transporter = env.EMAIL_MODE === 'email' && env.MAIL_USER && env.MAIL_PASS
    ? nodemailer.createTransport({
        service: 'gmail',
        host: env.MAIL_HOST,
        port: env.MAIL_PORT,
        secure: env.MAIL_PORT === 465, // true for 465, false for other ports
        auth: {
            user: env.MAIL_USER!,
            pass: env.MAIL_PASS!
        },
        tls: {
            rejectUnauthorized: false
        },
        // Add connection pooling and timeout settings
        pool: true,
        maxConnections: 5,
        maxMessages: 100,
        connectionTimeout: 30000, // 30 seconds
        greetingTimeout: 30000,
        socketTimeout: 60000, // 60 seconds
        // Add debug if needed
        debug: env.NODE_ENV === 'development',
        logger: env.NODE_ENV === 'development'
    })
    : null as any; // Type assertion for console mode

// Create a test transporter for development/testing
export const testTransporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    auth: {
        user: 'ethereal.user@ethereal.email',
        pass: 'ethereal.pass'
    }
});

// Track if transporter is verified
let isTransporterVerified = false;

// Verify the transporter configuration with retry logic
const verifyTransporter = async (retries = 3, delay = 5000): Promise<void> => {
    // Skip verification if in console mode
    if (env.EMAIL_MODE === 'console') {
        logger.info('[mail] 📧 Console mode enabled - skipping transporter verification');
        return;
    }

    // Skip verification if transporter is not initialized
    if (!transporter) {
        logger.info('[mail] ⚠️  Transporter not initialized - check EMAIL_MODE and credentials');
        return;
    }

    for (let i = 0; i < retries; i++) {
        try {
            await transporter.verify();
            logger.info('[mail] ✅ Gmail transporter configured and verified successfully');
            isTransporterVerified = true;
            return;
        } catch (error: any) {
            logger.error(`[mail] ❌ Verification attempt ${i + 1}/${retries} failed:`, error.message);
            
            if (i < retries - 1) {
                logger.info(`[mail] ⏳ Retrying in ${delay/1000} seconds...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            } else {
                logger.error('[mail] ⚠️  Gmail transporter verification failed after all retries');
                logger.info('[mail] 📝 Will use console logging for emails');
                logger.info('[mail] 💡 Please verify:');
                logger.info('[mail]    - Gmail 2FA is enabled');
                logger.info('[mail]    - App Password is correctly set in MAIL_PASS');
                logger.info('[mail]    - MAIL_USER matches the Gmail account');
                logger.info('[mail]    - Network allows outbound SMTP connections');
            }
        }
    }
};

// Start verification asynchronously (don't block startup) - only if email mode
if (env.EMAIL_MODE === 'email') {
    verifyTransporter().catch(err => {
        logger.error('[mail] Verification error:', err);
    });
} else {
    logger.info('[mail] 📧 Console mode active - emails will be logged to console');
}

export const getTransporterStatus = (): boolean => {
    // In console mode, always return false (will trigger console logging)
    if (env.EMAIL_MODE === 'console') {
        return false;
    }
    return isTransporterVerified;
};