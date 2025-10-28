-- gateway/plugins/paseto-vault-auth-lua/schema.lua
local typedefs = require "kong.db.schema.typedefs"

local schema = {
  name = "paseto-vault-auth-lua",
  fields = {
    { consumer = typedefs.no_consumer },
    { protocols = typedefs.protocols_http },
    { config = {
        type = "record",
        fields = {
          { vault_address = { type = "string", default = "http://vault:8200" } },
          { vault_token = { type = "string", default = "dev-root-token" } },
          { header_prefix = { type = "string", default = "X-User-" } },
          { cache_timeout = { type = "number", default = 3600 } },
          { skip_path_prefixes = { 
              type = "array", 
              elements = { type = "string" },
              default = {"/health", "/metrics", "/api/create-organization", "/api/verify-organization-otp", "/api/resend-organization-otp", "/api/login-organization", "/api/login-college", "/api/test-create-organization"}
            }
          },
          { required_roles = { 
              type = "array", 
              elements = { type = "string" },
              default = {}
            }
          },
          { redis_host = { type = "string", default = "redis" } },
          { redis_port = { type = "number", default = 6379 } },
          { redis_password = { type = "string" } },
          { redis_database = { type = "number", default = 0 } },
          { redis_timeout = { type = "number", default = 2000 } },
          { validate_session = { type = "boolean", default = true } },
        },
      },
    },
  },
}

return schema