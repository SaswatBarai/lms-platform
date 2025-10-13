import {z} from "zod";
import dotenv from "dotenv";

dotenv.config();


const envSchema = z.object({
    PORT: z.coerce.number().default(4000),
    POST_DB: z.string().url().startsWith("postgresql://"),
    ACCESS_TOKEN_SECRET: z.string().min(32),
    ACCESS_TOKEN_EXPIRES_IN: z.string().default("30d"),
    REFRESH_TOKEN_SECRET: z.string().min(32),
    REFRESH_TOKEN_EXPIRES_IN: z.string().default("7d"),
    NODE_ENV: z.enum(["development","production","test"]).default("development"),
})


const env = envSchema.safeParse(process.env);

if(!env.success){
    console.error("❌ Invalid environment variables",env.error.format());
    process.exit(1);
}

export default env.data;
