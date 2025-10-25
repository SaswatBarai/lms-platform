// gateway/kong/plugins/paseto-vault-auth/vault/key_manager.go
package vault

import (
	"crypto/ed25519"
	"crypto/x509"
	"encoding/pem"
	"fmt"
	"sync"
	"time"

	"github.com/Kong/go-pdk"
)

type KeyManager struct {
	vaultClient   *Client
	publicKey     ed25519.PublicKey
	keyID         string
	cachedAt      time.Time
	cacheDuration time.Duration
	mu            sync.RWMutex
}

func NewKeyManager(vaultClient *Client, cacheDuration time.Duration) *KeyManager {
	return &KeyManager{
		vaultClient:   vaultClient,
		cacheDuration: cacheDuration,
	}
}

func (km *KeyManager) GetPublicKey(kong *pdk.PDK) (ed25519.PublicKey, error) {
	km.mu.RLock()
	// Check if we have a valid cached key
	if km.publicKey != nil && time.Since(km.cachedAt) < km.cacheDuration {
		defer km.mu.RUnlock()
		return km.publicKey, nil
	}
	km.mu.RUnlock()

	// Need to fetch/refresh the key
	kong.Log.Info("Fetching public key from Vault...")

	// First check Vault health
	if err := km.vaultClient.HealthCheck(); err != nil {
		return nil, fmt.Errorf("vault health check failed: %v", err)
	}

	// Fetch public key from Vault
	keyData, err := km.vaultClient.GetPublicKey()
	if err != nil {
		return nil, fmt.Errorf("failed to fetch public key from Vault: %v", err)
	}

	// Parse the PEM-encoded public key
	publicKey, err := km.parsePEMPublicKey(keyData.Key)
	if err != nil {
		return nil, fmt.Errorf("failed to parse public key: %v", err)
	}

	// Cache the key
	km.mu.Lock()
	km.publicKey = publicKey
	km.keyID = keyData.KeyID
	km.cachedAt = time.Now()
	km.mu.Unlock()

	kong.Log.Info(fmt.Sprintf("Public key cached successfully (Key ID: %s)", keyData.KeyID))
	return publicKey, nil
}

func (km *KeyManager) GetKeyID() string {
	km.mu.RLock()
	defer km.mu.RUnlock()
	return km.keyID
}

func (km *KeyManager) parsePEMPublicKey(pemData string) (ed25519.PublicKey, error) {
	block, _ := pem.Decode([]byte(pemData))
	if block == nil {
		return nil, fmt.Errorf("failed to parse PEM block")
	}

	if block.Type != "PUBLIC KEY" {
		return nil, fmt.Errorf("invalid PEM type: %s", block.Type)
	}

	// Parse the public key
	parsedKey, err := x509.ParsePKIXPublicKey(block.Bytes)
	if err != nil {
		return nil, fmt.Errorf("failed to parse public key: %v", err)
	}

	// Ensure it's an Ed25519 public key
	ed25519Key, ok := parsedKey.(ed25519.PublicKey)
	if !ok {
		return nil, fmt.Errorf("not an Ed25519 public key")
	}

	return ed25519Key, nil
}

func (km *KeyManager) InvalidateCache() {
	km.mu.Lock()
	defer km.mu.Unlock()
	
	km.publicKey = nil
	km.keyID = ""
	km.cachedAt = time.Time{}
}
