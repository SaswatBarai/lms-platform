// services/auth-service/src/utils/vault-security.ts
import { V4 } from 'paseto';
import { vaultClient } from '../config/vault.js';
import crypto from 'crypto';

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

export interface VaultKeyPair {
  privateKey: string;
  publicKey: string;
  createdAt: string;
  algorithm: string;
  keyId: string;
}

export class VaultPasetoManager {
  private static instance: VaultPasetoManager;
  private privateKey: string | null = null;
  private publicKey: string | null = null;
  private keyId: string | null = null;
  
  private readonly VAULT_KEY_PATH = 'lms/paseto/keys';
  private readonly PRIVATE_KEY_PATH = `${this.VAULT_KEY_PATH}/private`;
  private readonly PUBLIC_KEY_PATH = `${this.VAULT_KEY_PATH}/public`;

  private constructor() {}

  public static getInstance(): VaultPasetoManager {
    if (!VaultPasetoManager.instance) {
      VaultPasetoManager.instance = new VaultPasetoManager();
    }
    return VaultPasetoManager.instance;
  }

  /**
   * Initialize keys from Vault or generate new ones
   */
  public async initialize(): Promise<void> {
    try {
      console.log('🔑 Initializing PASETO keys with Vault...');

      // Check Vault health first
      const isHealthy = await vaultClient.healthCheck();
      if (!isHealthy) {
        throw new Error('Vault is not available or healthy');
      }

      // Try to load existing keys from Vault
      const existingKeys = await this.loadKeysFromVault();
      
      if (existingKeys) {
        console.log('✅ Loaded existing PASETO keys from Vault');
        this.privateKey = existingKeys.privateKey;
        this.publicKey = existingKeys.publicKey;
        this.keyId = existingKeys.keyId;
      } else {
        console.log('🔑 Generating new PASETO V4 key pair...');
        await this.generateAndStoreKeys();
        console.log('✅ New PASETO keys generated and stored in Vault');
      }

      // Setup token renewal
      this.setupTokenRenewal();

    } catch (error) {
      console.error('❌ Failed to initialize PASETO keys:', error);
      throw new Error('PASETO key initialization failed');
    }
  }

  /**
   * Load existing keys from Vault
   */
  private async loadKeysFromVault(): Promise<VaultKeyPair | null> {
    try {
      const [privateKeyData, publicKeyData] = await Promise.all([
        vaultClient.getSecret(this.PRIVATE_KEY_PATH),
        vaultClient.getSecret(this.PUBLIC_KEY_PATH)
      ]);

      if (!privateKeyData || !publicKeyData) {
        return null;
      }

      // Validate key data structure
      if (!privateKeyData.key || !publicKeyData.key || !publicKeyData.keyId) {
        console.warn('⚠️ Invalid key structure in Vault, regenerating...');
        return null;
      }

      return {
        privateKey: privateKeyData.key,
        publicKey: publicKeyData.key,
        keyId: publicKeyData.keyId,
        createdAt: publicKeyData.createdAt,
        algorithm: publicKeyData.algorithm || 'Ed25519'
      };
    } catch (error) {
      console.log('ℹ️ No existing keys found in Vault');
      return null;
    }
  }

  /**
   * Generate new Ed25519 key pair and store in Vault
   */
  private async generateAndStoreKeys(): Promise<void> {
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

    // Generate unique key ID
    const keyId = crypto.randomUUID();
    const timestamp = new Date().toISOString();

    // Prepare key data
    const privateKeyData = {
      key: privateKeyPem,
      keyId: keyId,
      createdAt: timestamp,
      algorithm: 'Ed25519',
      type: 'private'
    };

    const publicKeyData = {
      key: publicKeyPem,
      keyId: keyId,
      createdAt: timestamp,
      algorithm: 'Ed25519',
      type: 'public'
    };

    // Store keys in Vault
    await Promise.all([
      vaultClient.storeSecret(this.PRIVATE_KEY_PATH, privateKeyData),
      vaultClient.storeSecret(this.PUBLIC_KEY_PATH, publicKeyData)
    ]);

    // Cache keys locally
    this.privateKey = privateKeyPem;
    this.publicKey = publicKeyPem;
    this.keyId = keyId;

    console.log(`🔑 Generated key pair with ID: ${keyId}`);
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
      exp: now + (15 * 60), // 15 minutes
      iss: 'lms-auth-service',
      aud: 'lms-platform'
    } as PasetoTokenPayload;

    try {
      const token = await V4.sign(tokenPayload as Record<string, unknown>, this.privateKey, {
        ...(this.keyId && { kid: this.keyId }) // Include key ID in token header if available
      });
      
      console.log(`🎫 Generated access token for user ${payload.userId}`);
      return token;
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
      const token = await V4.sign(refreshPayload as Record<string, unknown>, this.privateKey, {
        ...(this.keyId && { kid: this.keyId })
      });
      
      console.log(`🔄 Generated refresh token for user ${userId}`);
      return token;
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
   * Get current key information
   */
  public getKeyInfo(): { keyId: string | null, hasKeys: boolean } {
    return {
      keyId: this.keyId,
      hasKeys: !!(this.privateKey && this.publicKey)
    };
  }

  /**
   * Rotate keys (generate new key pair)
   */
  public async rotateKeys(): Promise<void> {
    console.log('🔄 Starting key rotation...');
    
    // Store old key ID for reference
    const oldKeyId = this.keyId;
    
    // Generate and store new keys
    await this.generateAndStoreKeys();
    
    console.log(`✅ Key rotation complete. Old key ID: ${oldKeyId}, New key ID: ${this.keyId}`);
  }

  /**
   * Generate secure session ID
   */
  public generateSessionId(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Setup automatic token renewal
   */
  private setupTokenRenewal(): void {
    // Renew Vault token every 12 hours
    setInterval(async () => {
      try {
        await vaultClient.renewToken();
        console.log('🔄 Vault token renewed successfully');
      } catch (error) {
        console.error('❌ Failed to renew Vault token:', error);
      }
    }, 12 * 60 * 60 * 1000);
  }
}

// Export singleton instance
export const vaultPasetoManager = VaultPasetoManager.getInstance();
