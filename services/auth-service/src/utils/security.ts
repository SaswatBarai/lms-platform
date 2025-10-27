import argon from "argon2";
import { AppError } from "./AppError.js";
import env from "../config/env.js"
import { V4 as paseto } from "paseto"
import { promises as fs } from 'fs';
import { OrganizationRole, TokenPlayload } from "../types/organization.js";
import path from 'path';
import crypto from 'crypto';


/**
 * Hashes a plain-text password using Argon2.
 * @param {string} password The password to hash.
 * @returns {Promise<string>} A promise that resolves with the hashed password.
 */
export const hashPassword = async (password: string): Promise<string> => {
    try {

        if (!password) {
            throw new AppError("Password must be provided for hashing.", 400);
        }

        const hash = await argon.hash(password, {
            type: argon.argon2id, //means it will provide both security and performance
        })
        return hash;

    } catch (error) {
        throw new AppError("Could not hash the password.", 500);
        if (env.NODE_ENV === "development") {
            console.error("Error hashing password:", error);
        }
    }
}


/**
 * Verifies a plain-text password against a hash.
 * @param {string} hash The stored hash from the database.
 * @param {string} password The plain-text password from user input.
 * @returns {Promise<boolean>} A promise that resolves to true if the password is correct, false otherwise.
 */

export const verifyPassword = async (hash: string, password: string): Promise<boolean> => {
    try {
        if (!hash || !password) {
            throw new AppError("Invalid hash or password provided for verification.", 400);
        }
        const isValid = await argon.verify(hash, password);
        return isValid;
    } catch (error) {
        throw new AppError("Could not verify the password.", 500);
        if (env.NODE_ENV === "development") {
            console.error("Error verifying password:", error);
        }

    }
}


export const validateEmail = (email:string) => {
  return String(email)
    .toLowerCase()
    .match(
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    );
};

//================= PASETO TOKEN UTILITIES ==================//

import { V4 } from 'paseto';

export interface PasetoTokenPayload {
  userId: string;
  email: string;
  role: 'ADMIN' | 'DEAN' | 'TEACHER' | 'STUDENT';
  organizationId: string;
  permissions: string[];
  sessionId: string;
  iat: number;
  exp: number;
  iss: string;
  aud: string;
  [key: string]: unknown;
}

export interface PasetoRefreshPayload {
  userId: string;
  sessionId: string;
  tokenFamily: string;
  iat: number;
  exp: number;
  iss: string;
  [key: string]: unknown;
}

export class PasetoV4SecurityManager {
  private static instance: PasetoV4SecurityManager;
  private privateKey: string | null = null;
  private publicKey: string | null = null;
  private readonly keysDir = process.cwd(); // Keys are in the root directory
  private readonly privateKeyPath = path.join(this.keysDir, 'private.key');
  private readonly publicKeyPath = path.join(this.keysDir, 'public.key');

  private constructor() {}

  public static getInstance(): PasetoV4SecurityManager {
    if (!PasetoV4SecurityManager.instance) {
      PasetoV4SecurityManager.instance = new PasetoV4SecurityManager();
    }
    return PasetoV4SecurityManager.instance;
  }

  /**
   * Initialize keys - Generate new ones if they don't exist
   */
  public async initialize(): Promise<void> {
    try {
      // Ensure keys directory exists
      await fs.mkdir(this.keysDir, { recursive: true });

      // Try to load existing keys
      const keysExist = await this.loadExistingKeys();
      
      if (!keysExist) {
        console.log('🔑 Generating new PASETO V4 Ed25519 key pair...');
        await this.generateAndSaveKeys();
        console.log('✅ PASETO V4 keys generated and saved successfully');
      } else {
        console.log('✅ Existing PASETO V4 keys loaded successfully');
      }
    } catch (error) {
      console.error('❌ Failed to initialize PASETO V4 keys:', error);
      throw new Error('PASETO V4 key initialization failed');
    }
  }

  /**
   * Load existing keys from filesystem
   */
  private async loadExistingKeys(): Promise<boolean> {
    try {
      const [privateKeyData, publicKeyData] = await Promise.all([
        fs.readFile(this.privateKeyPath, 'utf8'),
        fs.readFile(this.publicKeyPath, 'utf8')
      ]);

      this.privateKey = privateKeyData;
      this.publicKey = publicKeyData;
      
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Generate new Ed25519 key pair and save to filesystem
   */
  private async generateAndSaveKeys(): Promise<void> {
    // Generate Ed25519 key pair using PASETO V4
    const keyPair = await V4.generateKey('public');
    
    // Export keys in PEM format
    const privateKeyPem = keyPair.export({
      type: 'pkcs8',
      format: 'pem'
    }) as string;

    const publicKeyPem = keyPair.export({
      type: 'spki',
      format: 'pem'
    }) as string;

    // Save keys to filesystem
    await Promise.all([
      fs.writeFile(this.privateKeyPath, privateKeyPem, 'utf8'),
      fs.writeFile(this.publicKeyPath, publicKeyPem, 'utf8')
    ]);

    this.privateKey = privateKeyPem;
    this.publicKey = publicKeyPem;
  }

  /**
   * Generate access token with comprehensive payload
   */
  public async generateAccessToken(payload: Omit<PasetoTokenPayload, 'iat' | 'exp' | 'iss' | 'aud'>): Promise<string> {
    if (!this.privateKey) {
      throw new Error('Private key not initialized');
    }

    const now = Math.floor(Date.now() / 1000);
    const tokenPayload = {
      ...payload,
      iat: now,
      exp: now + (1* 24 * 60 * 60), // 1day
      iss: 'lms-auth-service',
      aud: 'lms-platform'
    } as PasetoTokenPayload;

    try {
      return await V4.sign(tokenPayload as Record<string, unknown>, this.privateKey);
    } catch (error) {
      console.error('❌ Failed to generate access token:', error);
      throw new Error('Access token generation failed');
    }
  }

  /**
   * Generate refresh token with rotation support
   */
  public async generateRefreshToken(userId: string, sessionId: string): Promise<string> {
    if (!this.privateKey) {
      throw new Error('Private key not initialized');
    }

    const now = Math.floor(Date.now() / 1000);
    const tokenFamily = crypto.randomUUID();
    
    const refreshPayload: PasetoRefreshPayload = {
      userId,
      sessionId,
      tokenFamily,
      iat: now,
      exp: now + (7 * 24 * 60 * 60), // 7 days
      iss: 'lms-auth-service'
    };

    try {
      return await V4.sign(refreshPayload as Record<string, unknown>, this.privateKey);
    } catch (error) {
      console.error('❌ Failed to generate refresh token:', error);
      throw new Error('Refresh token generation failed');
    }
  }

  /**
   * Verify and decode access token
   */
  public async verifyAccessToken(token: string): Promise<PasetoTokenPayload> {
    if (!this.publicKey) {
      throw new Error('Public key not initialized');
    }

    try {
      const payload = await V4.verify(token, this.publicKey) as PasetoTokenPayload;
      
      // Verify token hasn't expired
      const now = Math.floor(Date.now() / 1000);
      if (payload.exp < now) {
        throw new Error('Token has expired');
      }

      // Verify issuer and audience
      if (payload.iss !== 'lms-auth-service' || payload.aud !== 'lms-platform') {
        throw new Error('Invalid token issuer or audience');
      }

      return payload;
    } catch (error) {
      console.error('❌ Token verification failed:', error);
      throw new Error('Invalid or expired token');
    }
  }

  /**
   * Verify refresh token
   */
  public async verifyRefreshToken(token: string): Promise<PasetoRefreshPayload> {
    if (!this.publicKey) {
      throw new Error('Public key not initialized');
    }

    try {
      const payload = await V4.verify(token, this.publicKey) as PasetoRefreshPayload;
      
      const now = Math.floor(Date.now() / 1000);
      if (payload.exp < now) {
        throw new Error('Refresh token has expired');
      }

      return payload;
    } catch (error) {
      console.error('❌ Refresh token verification failed:', error);
      throw new Error('Invalid or expired refresh token');
    }
  }

  /**
   * Get public key for Kong plugin (PEM format)
   */
  public async getPublicKey(): Promise<string> {
    if (!this.publicKey) {
      throw new Error('Public key not initialized');
    }
    return this.publicKey;
  }

  /**
   * Generate secure session ID
   */
  public generateSessionId(): string {
    return crypto.randomBytes(32).toString('hex');
  }
}

// Export singleton instance
export const pasetoManager = PasetoV4SecurityManager.getInstance();


