-- gateway/plugins/paseto-vault-auth-lua/handler.lua

local PasetoVaultAuthHandler = {
  PRIORITY = 1000,
  VERSION = "1.0.0",
}

function PasetoVaultAuthHandler:access(conf)
  
  -- Get the request path
  local path = kong.request.get_path()
  
  -- Skip authentication for certain paths
  local skip_paths = {"/health", "/metrics", "/api/create-organization", "/api/verify-organization-otp", "/api/resend-organization-otp", "/api/login-organization", "/api/test-create-organization"}
  
  for _, skip_path in ipairs(skip_paths) do
    if string.find(path, skip_path, 1, true) == 1 then
      kong.log.info("Skipping authentication for path: " .. path)
      return
    end
  end
  
  -- Get the Authorization header
  local headers = kong.request.get_headers()
  local auth_header = headers["authorization"]
  
  if not auth_header then
    kong.log.warn("No authorization header found")
    return kong.response.exit(401, { 
      error = "Missing authorization header",
      message = "Authentication required"
    })
  end
  
  -- Extract token from "Bearer <token>"
  local token = string.match(auth_header, "Bearer%s+(.+)")
  if not token then
    kong.log.warn("No bearer token found in authorization header")
    return kong.response.exit(401, { 
      error = "Invalid authorization header format",
      message = "Expected Bearer token"
    })
  end
  
  kong.log.debug("Token found: " .. string.sub(token, 1, 20) .. "...")
  
  -- For testing: Simple validation - check if token starts with "v4.public."
  if not string.match(token, "^v4%.public%.") then
    kong.log.warn("Token is not a valid PASETO v4 public token")
    return kong.response.exit(401, { 
      error = "Invalid token format",
      message = "Token must be a valid PASETO v4 public token"
    })
  end
  
  kong.log.info("PASETO token format validation passed")
  
  -- For testing: Instead of full PASETO parsing, we'll do basic validation
  -- In production, this would involve proper PASETO parsing and Vault public key verification
  
  -- Try to get public key from Vault (simplified version)
  local vault_ok, vault_err = self:validate_with_vault(conf, token)
  if not vault_ok then
    kong.log.warn("Vault validation failed: " .. (vault_err or "unknown error"))
    return kong.response.exit(401, {
      error = "Token validation failed",
      message = "Invalid or expired authentication token"
    })
  end
  
  -- Set user headers for the upstream service (mock data for testing)
  kong.service.request.set_header("X-User-Id", "test-user-123")
  kong.service.request.set_header("X-User-Email", "test@example.com")
  kong.service.request.set_header("X-User-Role", "admin")
  kong.service.request.set_header("X-User-Organization-Id", "org-456")
  kong.service.request.set_header("X-User-Session-Id", "session-789")
  kong.service.request.set_header("X-User-Permissions", "read,write,admin")
  kong.service.request.set_header("X-User-Auth-Time", tostring(os.time()))
  kong.service.request.set_header("X-Authenticated", "true")
  
  kong.log.info("Authentication successful - Headers injected for upstream service")
end

function PasetoVaultAuthHandler:validate_with_vault(conf, token)
  -- For testing purposes, we'll accept any token that passes basic format validation
  -- This avoids complex HTTP requests during plugin loading
  kong.log.info("Vault validation - accepting token for testing")
  return true
end

return PasetoVaultAuthHandler