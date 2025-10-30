-- gateway/plugins/paseto-vault-auth-lua/handler.lua

local cjson = require "cjson.safe"
local redis = require "resty.redis"

local PasetoVaultAuthHandler = {
  PRIORITY = 1000,
  VERSION = "1.0.0",
}

function PasetoVaultAuthHandler:access(conf)
  
  -- Get the request path
  local path = kong.request.get_path()
  
  -- Skip authentication for certain paths
  local skip_paths = (conf and conf.skip_path_prefixes) or {"/health", "/metrics", "/api/create-organization", "/api/verify-organization-otp", "/api/resend-organization-otp", "/api/login-organization", "/api/login-college", "/api/test-create-organization"}
  
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
    -- Accept standard PASETO format: v4.public.<base64url(payload+signature)>
    -- PASETO v4 format: payload (JSON) + signature (64 bytes)
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
    
    -- PASETO v4.public format: The decoded data contains JSON payload + 64-byte Ed25519 signature
    -- The signature is the LAST 64 bytes
    -- We need to extract just the JSON part (everything except the last 64 bytes)
    local payload_len = #payload_raw
    if payload_len <= 64 then
      return nil, "Payload too short to contain signature"
    end
    
    -- Extract JSON payload (remove last 64 bytes which is the signature)
    local json_payload = string.sub(payload_raw, 1, payload_len - 64)
    
    -- Parse the JSON
    local obj, err = cjson.decode(json_payload)
    if not obj then
      -- If that didn't work, try the old method as fallback
      local start_pos = string.find(payload_raw, "{", 1, true)
      local last_close = nil
      local search_from = 1
      while true do
        local s, e = string.find(payload_raw, "}", search_from, true)
        if not s then break end
        last_close = e
        search_from = e + 1
      end
      if start_pos and last_close and last_close > start_pos then
        local candidate_json = string.sub(payload_raw, start_pos, last_close)
        obj, err = cjson.decode(candidate_json)
      end
      
      if not obj then
        return nil, "Payload JSON decode failed: " .. (err or "unknown")
      end
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

  -- Extract session and user info for validation
  local user_type = claims.type
  local user_id = claims.id -- For organizations/colleges, id is the user id
  local session_id = claims.sessionId or claims.sid or claims.session_id
  
  -- Validate session in Redis (single device login check for organizations and colleges)
  if user_type == "organization" or user_type == "college" then
    local session_ok, session_err = self:validate_session_in_redis(conf, user_id, session_id, user_type, claims)
    if not session_ok then
      kong.log.warn("Session validation failed for " .. user_type .. ": " .. (session_err or "unknown error"))
      return kong.response.exit(401, {
        error = "Session invalid",
        message = "Your session has been invalidated. Please login again.",
        reason = session_err
      })
    end
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

function PasetoVaultAuthHandler:connect_to_redis(conf)
  local red = redis:new()
  red:set_timeout(conf.redis_timeout or 2000)
  
  local ok, err = red:connect(conf.redis_host or "redis", conf.redis_port or 6379)
  if not ok then
    kong.log.err("Failed to connect to Redis: " .. (err or "unknown error"))
    return nil, err
  end
  
  -- Authenticate if password is provided
  if conf.redis_password then
    local res, err = red:auth(conf.redis_password)
    if not res then
      kong.log.err("Failed to authenticate with Redis: " .. (err or "unknown error"))
      return nil, err
    end
  end
  
  -- Select database
  if conf.redis_database and conf.redis_database ~= 0 then
    local res, err = red:select(conf.redis_database)
    if not res then
      kong.log.err("Failed to select Redis database: " .. (err or "unknown error"))
      return nil, err
    end
  end
  
  return red, nil
end

function PasetoVaultAuthHandler:validate_session_in_redis(conf, user_id, session_id, user_type, claims)
  -- Skip validation if disabled in config
  if conf.validate_session == false then
    kong.log.info("Session validation disabled in config")
    return true, nil
  end

  -- Only validate for organization and college types
  if user_type ~= "organization" and user_type ~= "college" then
    kong.log.info("Session validation skipped - user type: " .. tostring(user_type))
    return true, nil
  end

  if not user_id or not session_id then
    kong.log.warn("Missing user_id or session_id for validation")
    return false, "Missing session information"
  end
  
  -- Connect to Redis
  local red, err = self:connect_to_redis(conf)
  if not red then
    kong.log.err("Redis connection failed: " .. (err or "unknown"))
    -- In case of Redis failure, we can choose to fail open or closed
    -- For now, fail closed (reject request)
    return false, "Session validation unavailable"
  end
  
  -- Get the active session from Redis
  -- Use different Redis key patterns based on user type
  local key
  if user_type == "organization" then
    key = "activeSession:org:" .. user_id
  elseif user_type == "college" then
    key = "activeSession:college:" .. user_id
  else
    kong.log.warn("Unsupported user type for session validation: " .. user_type)
    return false, "Unsupported user type"
  end
  
  -- Get both active status and stored sessionId
  local active_value, err1 = red:hget(key, "active")
  local stored_session_id, err2 = red:hget(key, "sessionId")
  
  -- For college users, also get organizationId while connection is still active
  local stored_org_id = nil
  local err3 = nil
  if user_type == "college" then
    stored_org_id, err3 = red:hget(key, "organizationId")
  end
  
  -- Put connection back into pool AFTER getting all needed data
  local ok, err_pool = red:set_keepalive(10000, 100)
  if not ok then
    kong.log.warn("Failed to set Redis keepalive: " .. (err_pool or "unknown"))
  end
  
  if err1 or err2 or err3 then
    kong.log.err("Redis error: " .. (err1 or err2 or err3 or "unknown"))
    return false, "Session validation failed"
  end
  
  -- Check if session exists
  if active_value == ngx.null or active_value == nil then
    kong.log.warn("No active session found in Redis for " .. user_type .. ": " .. user_id)
    return false, "No active session found"
  end
  
  -- Check if session is active
  if active_value ~= 'true' then
    kong.log.warn("Session is not active for " .. user_type .. ": " .. user_id)
    return false, "Session is not active"
  end
  
  -- Check if stored sessionId exists
  if stored_session_id == ngx.null or stored_session_id == nil then
    kong.log.warn("No sessionId found in Redis for " .. user_type .. ": " .. user_id)
    return false, "Invalid session"
  end
  
  -- CRITICAL: Verify that the sessionId in the token matches the one in Redis
  -- This ensures single device login - if user logs in from another device,
  -- the old sessionId will no longer match and the old device will be logged out
  if stored_session_id ~= session_id then
    kong.log.warn("SessionId mismatch for " .. user_type .. ": " .. user_id ..
                  ". Token session: " .. session_id ..
                  ", Redis session: " .. stored_session_id)
    return false, "Session has been invalidated by another login"
  end

  -- For college users, validate that the organizationId in token matches Redis data
  if user_type == "college" and claims then
    local token_org_id = claims.organizationId or claims.orgId or claims.organization_id

    if stored_org_id == ngx.null or stored_org_id == nil then
      kong.log.warn("No organizationId found in Redis for college: " .. user_id)
      return false, "College organization validation failed"
    end

    if token_org_id ~= stored_org_id then
      kong.log.warn("OrganizationId mismatch for college: " .. user_id ..
                    ". Token org: " .. tostring(token_org_id) ..
                    ", Redis org: " .. stored_org_id)
      return false, "College does not belong to specified organization"
    end

    kong.log.info("College organization validation successful for college: " .. user_id)
  end

  kong.log.info("Session validation successful for " .. user_type .. ": " .. user_id .. ", session: " .. session_id)
  return true, nil
end

return PasetoVaultAuthHandler