import nodemailer from 'nodemailer';
import env from "./env.js";

export const transporter = nodemailer.createTransport({
    host:env.MAIL_HOST,
    port:env.MAIL_PORT,
    secure:env.MAIL_PORT===465, // true for 465, false for other ports
    auth:{
        user:env.MAIL_USER,
        pass:env.MAIL_PASS
    }
})