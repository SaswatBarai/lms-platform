import { defineConfig } from "drizzle-kit";
import dotenv from "dotenv";

dotenv.config();

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.POST_DB!,
  },
  verbose: true,
  strict: true,
});

/*
 * Drizzle ORM Commands (Prisma Equivalent)
 *
 * Development (Quick iterations):
 *   pnpm db:push     → Push schema directly to DB (no migration files)
 *                     Like: npx prisma db push
 *
 * Production (With migration history):
 *   pnpm db:generate → Generate migration SQL files from schema changes
 *                     Like: npx prisma migrate dev
 *
 *   pnpm db:migrate  → Apply migration files to database
 *                     Like: npx prisma migrate deploy
 *
 * Database Browser:
 *   pnpm db:studio   → Open visual database browser
 *                     Like: npx prisma studio
 */
