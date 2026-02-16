import {z} from 'zod';
import dotenv from 'dotenv';
import { logger } from './logger.js';

dotenv.config();


const envSchema = z.object({
    PORT:z.coerce.number().default(4002),
    NODE_ENV:z.enum(["development","production","test"]).default("development"),
    EMAIL_MODE:z.enum(["email","console"]).default("email"),
    MAIL_USER:z.string().email().optional(),
    MAIL_PASS:z.string().min(8).optional(),
    MAIL_PORT:z.coerce.number().default(587),
    MAIL_HOST:z.string().default("smtp.gmail.com")
}).refine((data) => {
    // If EMAIL_MODE is 'email', MAIL_USER and MAIL_PASS are required
    if (data.EMAIL_MODE === 'email') {
        return data.MAIL_USER !== undefined && data.MAIL_PASS !== undefined;
    }
    return true;
}, {
    message: "MAIL_USER and MAIL_PASS are required when EMAIL_MODE=email",
    path: ["MAIL_USER", "MAIL_PASS"]
})

const env = envSchema.safeParse(process.env);

if(!env.success){
    logger.error("❌ Invalid environment variables", env.error.format());
    process.exit(1);
}

export default env.data;