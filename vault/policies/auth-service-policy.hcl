# Auth Service Policy
# Allows the auth service to manage PASETO keys and authentication data

# PASETO key management
path "lms/data/paseto/*" {
  capabilities = ["create", "read", "update", "delete", "list"]
}

path "lms/metadata/paseto/*" {
  capabilities = ["read", "list"]
}

# Auth configuration
path "lms/data/auth-config" {
  capabilities = ["read", "update"]
}

# Token management
path "auth/token/renew-self" {
  capabilities = ["update"]
}

path "auth/token/lookup-self" {
  capabilities = ["read"]
}

# System health checks
path "sys/health" {
  capabilities = ["read"]
}

# List mounted secrets engines
path "sys/mounts" {
  capabilities = ["read"]
}