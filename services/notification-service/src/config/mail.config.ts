import nodemailer from 'nodemailer';
import env from "./env.js";

// Create transporter with fallback for testing
export const transporter = nodemailer.createTransport({
    service: 'gmail',
    host: env.MAIL_HOST,
    port: env.MAIL_PORT,
    secure: env.MAIL_PORT === 465, // true for 465, false for other ports
    auth: {
        user: env.MAIL_USER,
        pass: env.MAIL_PASS
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
});

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
    for (let i = 0; i < retries; i++) {
        try {
            await transporter.verify();
            console.log('[mail] ✅ Gmail transporter configured and verified successfully');
            isTransporterVerified = true;
            return;
        } catch (error: any) {
            console.error(`[mail] ❌ Verification attempt ${i + 1}/${retries} failed:`, error.message);
            
            if (i < retries - 1) {
                console.log(`[mail] ⏳ Retrying in ${delay/1000} seconds...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            } else {
                console.error('[mail] ⚠️  Gmail transporter verification failed after all retries');
                console.log('[mail] 📝 Will use console logging for emails in development');
                console.log('[mail] 💡 Please verify:');
                console.log('[mail]    - Gmail 2FA is enabled');
                console.log('[mail]    - App Password is correctly set in MAIL_PASS');
                console.log('[mail]    - MAIL_USER matches the Gmail account');
                console.log('[mail]    - Network allows outbound SMTP connections');
            }
        }
    }
};

// Start verification asynchronously (don't block startup)
verifyTransporter().catch(err => {
    console.error('[mail] Verification error:', err);
});

export const getTransporterStatus = () => isTransporterVerified;