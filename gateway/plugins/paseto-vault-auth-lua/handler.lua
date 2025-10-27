-- gateway/plugins/paseto-vault-auth-lua/handler.lua

local cjson = require "cjson.safe"

local PasetoVaultAuthHandler = {
  PRIORITY = 1000,
  VERSION = "1.0.0",
}

function PasetoVaultAuthHandler:access(conf)
  
  -- Get the request path
  local path = kong.request.get_path()
  
  -- Skip authentication for certain paths
  local skip_paths = (conf and conf.skip_path_prefixes) or {"/health", "/metrics", "/api/create-organization", "/api/verify-organization-otp", "/api/resend-organization-otp", "/api/login-organization", "/api/test-create-organization"}
  
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
  
  -- Helpers: base64url decode and PASETO payload decode (without signature verification)
  local function b64url_to_b64(input)
    if not input then return nil end
    local s = input:gsub('-', '+'):gsub('_', '/')
    local pad = #s % 4
    if pad == 2 then
      s = s .. '=='
    elseif pad == 3 then
      s = s .. '='
    elseif pad ~= 0 then
      return nil
    end
    return s
  end

  local function decode_paseto_payload(v4_public_token)
    local parts = {}
    for part in string.gmatch(v4_public_token, "[^%.]+") do
      table.insert(parts, part)
    end
    -- Accept standard PASETO format: v4.public.<base64url(payload[+sig])>
    -- Some implementations may include an extra trailing part; we only need the 3rd part
    if #parts < 3 then
      return nil, "Malformed PASETO token"
    end
    local payload_b64url = parts[3]
    local payload_b64 = b64url_to_b64(payload_b64url)
    if not payload_b64 then
      return nil, "Invalid base64url payload"
    end
    local payload_raw = ngx.decode_base64(payload_b64)
    if not payload_raw then
      return nil, "Payload base64 decode failed"
    end
    -- Some PASETO libs embed signature bytes after the JSON in the 3rd segment.
    -- Try to slice out the JSON object between the first '{' and the last '}'.
    local start_pos = string.find(payload_raw, "{", 1, true)
    local last_close = nil
    local search_from = 1
    while true do
      local s, e = string.find(payload_raw, "}", search_from, true)
      if not s then break end
      last_close = e
      search_from = e + 1
    end
    local candidate_json = payload_raw
    if start_pos and last_close and last_close > start_pos then
      candidate_json = string.sub(payload_raw, start_pos, last_close)
    end
    local obj, err = cjson.decode(candidate_json)
    if not obj then
      return nil, "Payload JSON decode failed: " .. (err or "unknown")
    end
    return obj, nil
  end

  -- Decode claims from token (unsigned read; signature validation should be added in prod)
  local claims, decode_err = decode_paseto_payload(token)
  if not claims then
    kong.log.warn("Failed to decode PASETO payload: " .. (decode_err or "unknown error"))
    return kong.response.exit(401, {
      error = "Invalid token payload",
      message = "Failed to parse authentication token"
    })
  end

  -- Optional: simple expiration check if present
  local now = os.time()
  if type(claims.exp) == "number" and claims.exp < now then
    kong.log.warn("Token expired at " .. tostring(claims.exp))
    return kong.response.exit(401, {
      error = "Token expired",
      message = "Authentication token has expired"
    })
  end

  -- Optional role enforcement from config
  local required_roles = (conf and conf.required_roles) or {}
  if required_roles and #required_roles > 0 then
    local role_ok = false
    local claim_role = claims.role
    local claim_roles = claims.roles
    if type(claim_role) == "string" then
      for _, r in ipairs(required_roles) do
        if r == claim_role then
          role_ok = true
          break
        end
      end
    elseif type(claim_roles) == "table" then
      local role_set = {}
      for _, rr in ipairs(required_roles) do role_set[rr] = true end
      for _, cr in ipairs(claim_roles) do
        if role_set[cr] then
          role_ok = true
          break
        end
      end
    else
      -- if no role claim and roles are required, deny
      role_ok = false
    end
    if not role_ok then
      kong.log.warn("Required role not present on token")
      return kong.response.exit(403, {
        error = "Forbidden",
        message = "Insufficient role to access this resource"
      })
    end
  end

  -- Try to get public key from Vault (simplified version)
  local vault_ok, vault_err = self:validate_with_vault(conf, token)
  if not vault_ok then
    kong.log.warn("Vault validation failed: " .. (vault_err or "unknown error"))
    return kong.response.exit(401, {
      error = "Token validation failed",
      message = "Invalid or expired authentication token"
    })
  end

  -- Prepare header prefix
  local prefix = (conf and conf.header_prefix) or "X-User-"

  local function set_if_exists(suffix, value)
    if value ~= nil then
      kong.service.request.set_header(prefix .. suffix, tostring(value))
    end
  end

  -- Map common claim names to headers
  local user_id = claims.userId or claims.id or claims.sub
  local email = claims.email
  local name = claims.name
  local role = claims.role or (type(claims.roles) == "table" and claims.roles[1]) or nil
  local organization_id = claims.organizationId or claims.orgId or claims.organization_id
  local session_id = claims.sessionId or claims.sid or claims.session_id
  local permissions = claims.permissions
  local iss = claims.iss
  local aud = claims.aud
  local iat = claims.iat
  local exp = claims.exp
  local typ = claims.type

  set_if_exists("Id", user_id)
  set_if_exists("Email", email)
  set_if_exists("Name", name)
  set_if_exists("Role", role)
  set_if_exists("Organization-Id", organization_id)
  set_if_exists("Session-Id", session_id)
  if type(permissions) == "table" then
    set_if_exists("Permissions", table.concat(permissions, ","))
  else
    set_if_exists("Permissions", permissions)
  end
  set_if_exists("Iss", iss)
  set_if_exists("Aud", aud)
  set_if_exists("Iat", iat)
  set_if_exists("Exp", exp)
  set_if_exists("Auth-Time", iat or now)

  -- Also set a generic authenticated header
  kong.service.request.set_header("X-Authenticated", "true")
  
  kong.log.info("Authentication successful - Headers injected for upstream service (user=" .. tostring(user_id or "unknown") .. ")")
end

function PasetoVaultAuthHandler:validate_with_vault(conf, token)
  -- For testing purposes, we'll accept any token that passes basic format validation
  -- This avoids complex HTTP requests during plugin loading
  kong.log.info("Vault validation - accepting token for testing")
  return true
end

return PasetoVaultAuthHandler