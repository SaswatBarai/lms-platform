import {z} from 'zod';
import dotenv from 'dotenv';

dotenv.config();


const envSchema = z.object({
    PORT:z.coerce.number().default(4003),
    NODE_ENV:z.enum(["development","production","test"]).default("development"),
    MAIL_USER:z.string().email(),
    MAIL_PASS:z.string().min(8),
    MAIL_PORT:z.coerce.number().default(587),
    MAIL_HOST:z.string().default("smtp.gmail.com")
})

const env = envSchema.safeParse(process.env);

if(!env.success){
    console.error("❌ Invalid environment variables",env.error.format());
    process.exit(1);
}

export default env.data;