// gateway/kong/plugins/paseto-vault-auth/main.go
package main

import (
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"github.com/Kong/go-pdk"
	"github.com/Kong/go-pdk/server"
	"github.com/aidanwoods/go-paseto"

	"kong-plugin-paseto-vault-auth/vault"
)

type Config struct {
	VaultAddress      string   `json:"vault_address"`       // Vault server address
	VaultToken        string   `json:"vault_token"`         // Vault authentication token
	RequiredRoles     []string `json:"required_roles"`      // Required roles for access
	CacheTimeout      int      `json:"cache_timeout"`       // Public key cache timeout (seconds)
	SkipPathPrefixes  []string `json:"skip_path_prefixes"`  // Paths to skip authentication
	HeaderPrefix      string   `json:"header_prefix"`       // Header prefix for injected claims
}

type PasetoPayload struct {
	UserID         string   `json:"userId"`
	Email          string   `json:"email"`
	Role           string   `json:"role"`
	OrganizationID string   `json:"organizationId"`
	Permissions    []string `json:"permissions"`
	SessionID      string   `json:"sessionId"`
	Iat            int64    `json:"iat"`
	Exp            int64    `json:"exp"`
	Iss            string   `json:"iss"`
	Aud            string   `json:"aud"`
}

type PluginInstance struct {
	config     *Config
	keyManager *vault.KeyManager
}

func New() interface{} {
	return &Config{
		VaultAddress:     "http://vault:8200",
		CacheTimeout:     3600, // 1 hour default
		HeaderPrefix:     "X-User-",
		SkipPathPrefixes: []string{"/health", "/metrics", "/auth/login", "/auth/refresh"},
	}
}

func (conf *Config) Access(kong *pdk.PDK) {
	// Initialize plugin instance
	instance := &PluginInstance{
		config: conf,
	}

	// Initialize Vault client and key manager
	if err := instance.initializeVault(kong); err != nil {
		kong.Log.Err("Failed to initialize Vault integration: ", err.Error())
		kong.Response.Exit(503, "Authentication service unavailable", nil)
		return
	}

	// Check if path should skip authentication
	if instance.shouldSkipAuth(kong) {
		return
	}

	// Extract and validate token
	token, err := instance.extractToken(kong)
	if err != nil {
		kong.Log.Warn("Token extraction failed: ", err.Error())
		kong.Response.Exit(401, map[string]interface{}{
			"message": "Authentication required",
			"error":   "missing_or_invalid_token",
		}, nil)
		return
	}

	// Verify token and extract payload
	payload, err := instance.verifyToken(token, kong)
	if err != nil {
		kong.Log.Warn("Token verification failed: ", err.Error())
		kong.Response.Exit(401, map[string]interface{}{
			"message": "Invalid or expired authentication token",
			"error":   "token_verification_failed",
		}, nil)
		return
	}

	// Check role-based access
	if err := instance.checkRoleAccess(payload, kong); err != nil {
		kong.Log.Warn("Role access check failed: ", err.Error())
		kong.Response.Exit(403, map[string]interface{}{
			"message": "Insufficient permissions for this resource",
			"error":   "insufficient_permissions",
		}, nil)
		return
	}

	// Inject headers for downstream services
	instance.injectHeaders(payload, kong)

	kong.Log.Info(fmt.Sprintf("Authentication successful - User: %s, Role: %s, Org: %s", 
		payload.UserID, payload.Role, payload.OrganizationID))
}

func (p *PluginInstance) initializeVault(kong *pdk.PDK) error {
	// Validate Vault configuration
	if p.config.VaultAddress == "" {
		return fmt.Errorf("vault address not configured")
	}
	if p.config.VaultToken == "" {
		return fmt.Errorf("vault token not configured")
	}

	// Create Vault client
	vaultClient := vault.NewClient(p.config.VaultAddress, p.config.VaultToken)
	
	// Create key manager with cache duration
	cacheDuration := time.Duration(p.config.CacheTimeout) * time.Second
	p.keyManager = vault.NewKeyManager(vaultClient, cacheDuration)

	kong.Log.Info("Vault integration initialized successfully")
	return nil
}

func (p *PluginInstance) shouldSkipAuth(kong *pdk.PDK) bool {
	path, err := kong.Request.GetPath()
	if err != nil {
		kong.Log.Warn("Failed to get request path: ", err.Error())
		return false
	}

	for _, prefix := range p.config.SkipPathPrefixes {
		if strings.HasPrefix(path, prefix) {
			kong.Log.Info("Skipping authentication for path: ", path)
			return true
		}
	}
	return false
}

func (p *PluginInstance) extractToken(kong *pdk.PDK) (string, error) {
	authHeader, err := kong.Request.GetHeader("Authorization")
	if err != nil || authHeader == "" {
		return "", fmt.Errorf("no authorization header found")
	}

	if !strings.HasPrefix(authHeader, "Bearer ") {
		return "", fmt.Errorf("invalid authorization header format")
	}

	token := strings.TrimPrefix(authHeader, "Bearer ")
	if token == "" {
		return "", fmt.Errorf("empty token")
	}

	return token, nil
}

func (p *PluginInstance) verifyToken(token string, kong *pdk.PDK) (*PasetoPayload, error) {
	// Get public key from Vault via key manager
	publicKey, err := p.keyManager.GetPublicKey(kong)
	if err != nil {
		return nil, fmt.Errorf("failed to get public key: %v", err)
	}

	// Parse and verify the PASETO token
	parser := paseto.NewParser()
	
	// Convert ed25519.PublicKey to the format expected by go-paseto
	pasetoPublicKey := paseto.NewV4AsymmetricPublicKeyFromBytes(publicKey)
	
	parsedToken, err := parser.ParseV4Public(pasetoPublicKey, token, nil)
	if err != nil {
		return nil, fmt.Errorf("token parsing failed: %v", err)
	}

	// Extract claims
	var payload PasetoPayload
	if err := json.Unmarshal(parsedToken.ClaimsJSON(), &payload); err != nil {
		return nil, fmt.Errorf("failed to unmarshal claims: %v", err)
	}

	// Verify expiration
	if time.Now().Unix() > payload.Exp {
		return nil, fmt.Errorf("token has expired")
	}

	// Verify issuer and audience
	if payload.Iss != "lms-auth-service" || payload.Aud != "lms-platform" {
		return nil, fmt.Errorf("invalid token issuer or audience")
	}

	return &payload, nil
}

func (p *PluginInstance) checkRoleAccess(payload *PasetoPayload, kong *pdk.PDK) error {
	if len(p.config.RequiredRoles) == 0 {
		return nil // No role restrictions
	}

	userRole := strings.ToUpper(payload.Role)
	for _, requiredRole := range p.config.RequiredRoles {
		if userRole == strings.ToUpper(requiredRole) {
			return nil
		}
	}

	return fmt.Errorf("user role '%s' not in required roles %v", payload.Role, p.config.RequiredRoles)
}

func (p *PluginInstance) injectHeaders(payload *PasetoPayload, kong *pdk.PDK) {
	prefix := p.config.HeaderPrefix
	
	// Inject standard headers
	kong.ServiceRequest.SetHeader(prefix+"Id", payload.UserID)
	kong.ServiceRequest.SetHeader(prefix+"Email", payload.Email)
	kong.ServiceRequest.SetHeader(prefix+"Role", payload.Role)
	kong.ServiceRequest.SetHeader(prefix+"Organization-Id", payload.OrganizationID)
	kong.ServiceRequest.SetHeader(prefix+"Session-Id", payload.SessionID)
	
	// Inject permissions as comma-separated string
	if len(payload.Permissions) > 0 {
		kong.ServiceRequest.SetHeader(prefix+"Permissions", strings.Join(payload.Permissions, ","))
	}
	
	// Add authentication metadata
	kong.ServiceRequest.SetHeader(prefix+"Auth-Time", fmt.Sprintf("%d", time.Now().Unix()))
	kong.ServiceRequest.SetHeader(prefix+"Key-Id", p.keyManager.GetKeyID())
}

func main() {
	server.StartServer(New, "2.0.0", 1000)
}
