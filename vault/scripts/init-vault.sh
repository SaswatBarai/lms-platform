#!/bin/sh
# vault/scripts/init-vault.sh
# Initialize Vault with necessary configurations

set -e

# Wait for Vault to be ready
echo "Waiting for Vault to be ready..."
until vault status > /dev/null 2>&1; do
    echo "Vault is not ready yet, waiting..."
    sleep 2
done

echo "Vault is ready!"

# Check if Vault is already initialized
if vault status | grep -q "Initialized.*true"; then
    echo "Vault is already initialized"
    exit 0
fi

echo "Initializing Vault..."

# Initialize Vault (development mode with 1 key share and 1 key threshold)
vault operator init -key-shares=1 -key-threshold=1 -format=json > /vault/data/init-keys.json

# Extract unseal key and root token
UNSEAL_KEY=$(cat /vault/data/init-keys.json | jq -r '.unseal_keys_b64[0]')
ROOT_TOKEN=$(cat /vault/data/init-keys.json | jq -r '.root_token')

# Unseal Vault
echo "Unsealing Vault..."
vault operator unseal $UNSEAL_KEY

# Authenticate with root token
export VAULT_TOKEN=$ROOT_TOKEN

# Enable KV v2 secrets engine at the path our application expects
echo "Enabling KV v2 secrets engine..."
vault secrets enable -version=2 -path=lms kv

# Create necessary policies
echo "Setting up policies..."
vault policy write auth-service /vault/policies/auth-service-policy.hcl
vault policy write kong-plugin /vault/policies/kong-plugin-policy.hcl

# Create tokens for services
echo "Creating service tokens..."

# Auth service token
AUTH_TOKEN=$(vault token create -policy=auth-service -ttl=8760h -format=json | jq -r '.auth.client_token')
echo "AUTH_SERVICE_TOKEN=$AUTH_TOKEN" >> /vault/data/service-tokens.env

# Kong plugin token  
KONG_TOKEN=$(vault token create -policy=kong-plugin -ttl=8760h -format=json | jq -r '.auth.client_token')
echo "KONG_PLUGIN_TOKEN=$KONG_TOKEN" >> /vault/data/service-tokens.env

echo "Vault initialization complete!"
echo "Root token: $ROOT_TOKEN"
echo "Service tokens saved to /vault/data/service-tokens.env"