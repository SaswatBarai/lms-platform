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
    }
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

// Verify the transporter configuration
transporter.verify((error: any, success: any) => {
    if (error) {
        console.error('[mail] Gmail transporter configuration error:', error.message);
        console.log('[mail] Will use console logging for OTP instead');
    } else {
        console.log('[mail] Gmail transporter configured successfully');
    }
});