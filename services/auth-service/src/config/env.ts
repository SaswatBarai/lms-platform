// services/auth-service/src/config/env.ts
import { z } from "zod";
import dotenv from "dotenv";

dotenv.config();

const envSchema = z.object({
    // Existing configuration
    PORT: z.coerce.number().default(4001), // Auth service port
    DATABASE_URL: z.string().url().startsWith("postgresql://"),
    ACCESS_TOKEN_SECRET: z.string().min(32),
    ACCESS_TOKEN_EXPIRES_IN: z.string().default("30d"),
    REFRESH_TOKEN_SECRET: z.string().min(32),
    REFRESH_TOKEN_EXPIRES_IN: z.string().default("7d"),
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
    OTP_SECRET: z.string().min(32),
    REDIS_URL: z.string().url().startsWith("redis://"),
    
    // New Vault configuration
    VAULT_ADDR: z.string().url().default("http://localhost:8200"),
    VAULT_TOKEN: z.string().min(1, "Vault token is required"),
    VAULT_NAMESPACE: z.string().optional(),
    VAULT_KEY_PATH: z.string().default("lms/paseto/keys"),
    VAULT_TIMEOUT: z.coerce.number().default(10000),
    VAULT_RETRY_ATTEMPTS: z.coerce.number().default(3),
    
    // Additional useful configs
    KAFKA_BROKERS: z.string().default("localhost:9093"),
    REDIS_PASSWORD: z.string().optional(),
    
    // PASETO specific
    PASETO_ACCESS_TOKEN_EXPIRES_IN: z.string().default("15m"),
    PASETO_REFRESH_TOKEN_EXPIRES_IN: z.string().default("7d"),
    PASETO_ISSUER: z.string().default("lms-auth-service"),
    PASETO_AUDIENCE: z.string().default("lms-platform"),
});

const env = envSchema.safeParse(process.env);

if (!env.success) {
    console.error("❌ Invalid environment variables", env.error.format());
    process.exit(1);
}

// Create organized config object
const config = {
    ...env.data,
    
    // Computed properties
    isDevelopment: env.data.NODE_ENV === 'development',
    isProduction: env.data.NODE_ENV === 'production',
    isTesting: env.data.NODE_ENV === 'test',
    
    // Vault configuration object
    vault: {
        address: env.data.VAULT_ADDR,
        token: env.data.VAULT_TOKEN,
        namespace: env.data.VAULT_NAMESPACE,
        keyPath: env.data.VAULT_KEY_PATH,
        timeout: env.data.VAULT_TIMEOUT,
        retryAttempts: env.data.VAULT_RETRY_ATTEMPTS,
    },
    
    // PASETO configuration
    paseto: {
        accessTokenExpiresIn: env.data.PASETO_ACCESS_TOKEN_EXPIRES_IN,
        refreshTokenExpiresIn: env.data.PASETO_REFRESH_TOKEN_EXPIRES_IN,
        issuer: env.data.PASETO_ISSUER,
        audience: env.data.PASETO_AUDIENCE,
    },
    
    // Legacy tokens (for backward compatibility)
    legacy: {
        accessTokenSecret: env.data.ACCESS_TOKEN_SECRET,
        accessTokenExpiresIn: env.data.ACCESS_TOKEN_EXPIRES_IN,
        refreshTokenSecret: env.data.REFRESH_TOKEN_SECRET,
        refreshTokenExpiresIn: env.data.REFRESH_TOKEN_EXPIRES_IN,
    },
    
    // Database
    database: {
        url: env.data.DATABASE_URL,
    },
    
    // Redis
    redis: {
        url: env.data.REDIS_URL,
        password: env.data.REDIS_PASSWORD,
    },
    
    // Security
    security: {
        otpSecret: env.data.OTP_SECRET,
    },
};

// Export both the config object and individual values
export { config };
export default env.data;
