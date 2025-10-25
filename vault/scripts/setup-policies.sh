#!/bin/sh
# vault/scripts/setup-policies.sh
# Setup Vault policies for LMS services

set -e

echo "Setting up Vault policies..."

# Wait for Vault to be ready and authenticated
until vault auth -method=token > /dev/null 2>&1; do
    echo "Waiting for Vault authentication..."
    sleep 2
done

# Create auth-service policy
vault policy write auth-service - <<EOF
# Allow auth-service to manage its secrets
path "lms/data/paseto/*" {
  capabilities = ["create", "read", "update", "delete", "list"]
}

path "lms/metadata/paseto/*" {
  capabilities = ["read", "list"]
}

# Allow reading auth configuration
path "lms/data/auth-config" {
  capabilities = ["read"]
}

# Allow token self-renewal
path "auth/token/renew-self" {
  capabilities = ["update"]
}

path "auth/token/lookup-self" {
  capabilities = ["read"]
}
EOF

# Create kong-plugin policy
vault policy write kong-plugin - <<EOF
# Allow Kong plugin to read PASETO public keys
path "lms/data/paseto/keys/public" {
  capabilities = ["read"]
}

# Allow reading key metadata
path "lms/metadata/paseto/keys/public" {
  capabilities = ["read"]
}

# Allow token self-operations
path "auth/token/renew-self" {
  capabilities = ["update"]
}

path "auth/token/lookup-self" {
  capabilities = ["read"]
}
EOF

echo "Policies setup complete!"