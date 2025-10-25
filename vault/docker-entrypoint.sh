#!/bin/sh
# vault/docker-entrypoint.sh
# Docker entrypoint script for Vault

set -e

# Function to log with timestamp
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

log "Starting Vault container..."

# Create necessary directories
mkdir -p /vault/data /vault/logs

# Set proper permissions
chown -R vault:vault /vault

# Start Vault server in background for development mode
if [ "$VAULT_DEV_MODE" = "true" ]; then
    log "Starting Vault in development mode..."
    exec vault server -dev \
        -dev-listen-address="0.0.0.0:8200" \
        -dev-root-token-id="$VAULT_DEV_ROOT_TOKEN_ID"
else
    log "Starting Vault in production mode..."
    exec vault server -config=/vault/config/vault.hcl
fi