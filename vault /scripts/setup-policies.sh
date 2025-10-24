

export VAULT_ADDR='http://127.0.0.1:8200'
ROOT_TOKEN=$(cat /vault/data/root_token)
vault auth $ROOT_TOKEN

echo "Setting up Vault policies and authentication..."

# Enable KV secrets engine
vault secrets enable -path=secret kv-v2

# Create policies
vault policy write auth-service-policy /vault/policies/auth-service-policy.hcl
vault policy write kong-plugin-policy /vault/policies/kong-plugin-policy.hcl

# Create tokens for services
AUTH_SERVICE_TOKEN=$(vault write -field=token auth/token/create \
    policies="auth-service-policy" \
    ttl=24h \
    renewable=true)

KONG_PLUGIN_TOKEN=$(vault write -field=token auth/token/create \
    policies="kong-plugin-policy" \
    ttl=24h \
    renewable=true)

# Save tokens for services to pick up
echo $AUTH_SERVICE_TOKEN > /vault/data/auth_service_token
echo $KONG_PLUGIN_TOKEN > /vault/data/kong_plugin_token

echo "Vault setup complete!"
echo "Auth Service Token: $AUTH_SERVICE_TOKEN"
echo "Kong Plugin Token: $KONG_PLUGIN_TOKEN"
