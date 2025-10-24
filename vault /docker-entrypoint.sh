
#!/bin/bash
set -e

# Start Vault in background
vault server -config=/vault/config/vault.hcl &
VAULT_PID=$!

# Wait for Vault to be ready
sleep 5

# Set Vault address
export VAULT_ADDR='http://127.0.0.1:8200'

# Initialize Vault if not already initialized
if ! vault status > /dev/null 2>&1; then
    echo "Initializing Vault..."
    
    # Initialize and capture keys
    INIT_OUTPUT=$(vault operator init -key-shares=1 -key-threshold=1 -format=json)
    
    # Extract keys
    UNSEAL_KEY=$(echo $INIT_OUTPUT | jq -r '.unseal_keys_b64[0]')
    ROOT_TOKEN=$(echo $INIT_OUTPUT | jq -r '.root_token')
    
    # Save keys to files (for development only)
    echo $UNSEAL_KEY > /vault/data/unseal_key
    echo $ROOT_TOKEN > /vault/data/root_token
    
    # Unseal Vault
    vault operator unseal $UNSEAL_KEY
    
    # Login with root token
    vault auth $ROOT_TOKEN
    
    echo "Vault initialized successfully!"
else
    echo "Vault already initialized. Checking seal status..."
    
    if vault status | grep -q "Sealed.*true"; then
        echo "Vault is sealed. Unsealing..."
        UNSEAL_KEY=$(cat /vault/data/unseal_key)
        vault operator unseal $UNSEAL_KEY
    fi
    
    # Login with root token
    ROOT_TOKEN=$(cat /vault/data/root_token)
    vault auth $ROOT_TOKEN
fi

# Setup policies and secrets engine
/vault/scripts/setup-policies.sh

# Keep Vault running
wait $VAULT_PID
