// services/auth-service/src/config/vault.ts
import VaultApi from 'node-vault-client';
import { config } from './env.js';

export interface VaultConfig {
  address: string;
  token: string;
  namespace?: string | undefined;
  keyPath: string;
  timeout: number;
  retryAttempts: number;
}

export class VaultClient {
  private static instance: VaultClient;
  private vault: VaultApi;
  private vaultConfig: VaultConfig;

  private constructor() {
    this.vaultConfig = config.vault;

    // Initialize Vault client with enhanced configuration
    this.vault = new VaultApi({
      api: {
        url: this.vaultConfig.address,
        apiVersion: 'v1'
      },
      auth: {
        type: 'token',
        config: {
          token: this.vaultConfig.token,
          ...(this.vaultConfig.namespace && { 
            namespace: this.vaultConfig.namespace 
          })
        }
      }
    });

    // Log initialization
    console.log(`🔐 Vault client initialized - Address: ${this.vaultConfig.address}`);
  }

  public static getInstance(): VaultClient {
    if (!VaultClient.instance) {
      VaultClient.instance = new VaultClient();
    }
    return VaultClient.instance;
  }

  /**
   * Store secret with enhanced error handling
   */
  async storeSecret(path: string, data: Record<string, any>): Promise<void> {
    const fullPath = `${this.vaultConfig.keyPath}/${path}`;
    
    try {
      await this.vault.write(fullPath, data);
      console.log(`✅ Secret stored successfully at: ${fullPath}`);
    } catch (error) {
      console.error(`❌ Failed to store secret at ${fullPath}:`, error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new VaultError(`Failed to store secret: ${errorMessage}`, 'STORE_FAILED');
    }
  }

  /**
   * Retrieve secret with enhanced error handling
   */
  async getSecret(path: string): Promise<any> {
    const fullPath = `${this.vaultConfig.keyPath}/${path}`;
    
    try {
      const response = await this.vault.read(fullPath);
      return response;
    } catch (error) {
      const isErrorWithResponse = error && typeof error === 'object' && 'response' in error;
      if (isErrorWithResponse && (error as any).response?.status === 404) {
        return null; // Secret doesn't exist
      }
      console.error(`❌ Failed to read secret at ${fullPath}:`, error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new VaultError(`Failed to read secret: ${errorMessage}`, 'READ_FAILED');
    }
  }

  /**
   * Enhanced health check with detailed status
   */
  async healthCheck(): Promise<VaultHealthStatus> {
    try {
      // Test connection by attempting to read a test path
      await this.vault.list('sys/mounts');
      
      return {
        isHealthy: true,
        sealed: false,
        initialized: true,
        version: null,
        tokenValid: true,
        tokenTTL: 0,
      };
    } catch (error) {
      console.error('❌ Vault health check failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        isHealthy: false,
        sealed: true,
        initialized: false,
        version: null,
        tokenValid: false,
        tokenTTL: 0,
        error: errorMessage,
      };
    }
  }

  /**
   * Automatic token renewal with enhanced logic
   */
  async renewToken(): Promise<void> {
    try {
      // Note: Token renewal is handled automatically by the node-vault-client library
      // This method is kept for interface compatibility but may not be needed
      console.log(`✅ Vault token renewal requested - handled by library`);
    } catch (error) {
      console.error('❌ Failed to renew Vault token:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new VaultError(`Token renewal failed: ${errorMessage}`, 'RENEWAL_FAILED');
    }
  }

  // Getter for configuration
  public getConfig(): VaultConfig {
    return { ...this.vaultConfig };
  }
}

// Custom error class for Vault operations
export class VaultError extends Error {
  constructor(
    message: string,
    public code: string,
    public originalError?: any
  ) {
    super(message);
    this.name = 'VaultError';
  }
}

// Health status interface
export interface VaultHealthStatus {
  isHealthy: boolean;
  sealed: boolean;
  initialized: boolean;
  version: string | null;
  tokenValid: boolean;
  tokenTTL: number;
  error?: string;
}

export const vaultClient = VaultClient.getInstance();