import pkg from "@prisma/client";
import type { PrismaClient } from "@prisma/client";
const { PrismaClient: PrismaClientConstructor } = pkg;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClientConstructor();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;