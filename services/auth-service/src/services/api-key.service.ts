import crypto from 'crypto';
import {prisma} from "../lib/prisma.js";
import { AppError } from "../utils/AppError.js";

export class ApiKeyService {

  static async createApiKey(data: {
    name: string;
    scopes: string[];
    createdBy: string;
    createdByType: string;
    description?: string;
  }) {
    // 1. Generate a secure random 32-byte hex string
    const rawKey = crypto.randomBytes(32).toString('hex');
    const prefix = 'lms_live_';
    const fullKey = `${prefix}${rawKey}`;

    // 2. Hash the key for storage (SHA-256)
    const keyHash = crypto
      .createHash('sha256')
      .update(fullKey)
      .digest('hex');

    // 3. Store in Database
    const apiKey = await prisma.apiKey.create({
      data: {
        keyHash,
        prefix, // Store prefix to easily identify key type in UI
        name: data.name,
        description: data.description,
        scopes: data.scopes,
        createdBy: data.createdBy,
        createdByType: data.createdByType,
      },
    });

    return {
      id: apiKey.id,
      name: apiKey.name,
      prefix: apiKey.prefix,
      key: fullKey, // RETURN RAW KEY ONE TIME ONLY
      createdAt: apiKey.createdAt,
    };
  }

  static async listApiKeys(userId: string) {
    return prisma.apiKey.findMany({
      where: { createdBy: userId, isActive: true },
      select: {
        id: true,
        name: true,
        prefix: true,
        scopes: true,prisma,
        lastUsedAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });prisma
  }

  static async revokeApiKey(keyId: string, userId: string) {
    const key = await prisma.apiKey.findUnique({
      where: { id: keyId },
    });

    if (!key || key.createdBy !== userId) {
      throw new AppError('API Key not found or access denied', 404);
    }
prisma
    return prisma.apiKey.update({
      where: { id: keyId },
      data: { isActive: false },
    });
  }
}