// gateway/kong/plugins/paseto-vault-auth/vault/client.go
package vault

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"sync"
	"time"
)

type Client struct {
	baseURL    string
	token      string
	httpClient *http.Client
	mu         sync.RWMutex
}

type VaultSecretResponse struct {
	RequestId     string `json:"request_id"`
	LeaseId       string `json:"lease_id"`
	Renewable     bool   `json:"renewable"`
	LeaseDuration int    `json:"lease_duration"`
	Data          struct {
		Data     map[string]interface{} `json:"data"`
		Metadata map[string]interface{} `json:"metadata"`
	} `json:"data"`
	Warnings interface{} `json:"warnings"`
	Auth     interface{} `json:"auth"`
}

type PublicKeyData struct {
	Key       string `json:"key"`
	KeyID     string `json:"keyId"`
	CreatedAt string `json:"createdAt"`
	Algorithm string `json:"algorithm"`
	Type      string `json:"type"`
}

func NewClient(baseURL, token string) *Client {
	return &Client{
		baseURL: baseURL,
		token:   token,
		httpClient: &http.Client{
			Timeout: 10 * time.Second,
		},
	}
}

func (c *Client) GetPublicKey() (*PublicKeyData, error) {
	c.mu.RLock()
	defer c.mu.RUnlock()

	url := fmt.Sprintf("%s/v1/secret/data/lms/paseto/keys/public", c.baseURL)
	
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %v", err)
	}

	req.Header.Set("X-Vault-Token", c.token)
	req.Header.Set("Content-Type", "application/json")

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to make request to Vault: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("vault returned status %d: %s", resp.StatusCode, string(body))
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response body: %v", err)
	}

	var vaultResp VaultSecretResponse
	if err := json.Unmarshal(body, &vaultResp); err != nil {
		return nil, fmt.Errorf("failed to unmarshal vault response: %v", err)
	}

	// Extract public key data
	keyData := &PublicKeyData{}
	if key, ok := vaultResp.Data.Data["key"].(string); ok {
		keyData.Key = key
	} else {
		return nil, fmt.Errorf("public key not found in vault response")
	}

	if keyID, ok := vaultResp.Data.Data["keyId"].(string); ok {
		keyData.KeyID = keyID
	}

	if createdAt, ok := vaultResp.Data.Data["createdAt"].(string); ok {
		keyData.CreatedAt = createdAt
	}

	if algorithm, ok := vaultResp.Data.Data["algorithm"].(string); ok {
		keyData.Algorithm = algorithm
	}

	if keyType, ok := vaultResp.Data.Data["type"].(string); ok {
		keyData.Type = keyType
	}

	return keyData, nil
}

func (c *Client) HealthCheck() error {
	c.mu.RLock()
	defer c.mu.RUnlock()

	url := fmt.Sprintf("%s/v1/sys/health", c.baseURL)
	
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return fmt.Errorf("failed to create health check request: %v", err)
	}

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("failed to perform health check: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("vault health check failed with status: %d", resp.StatusCode)
	}

	return nil
}
