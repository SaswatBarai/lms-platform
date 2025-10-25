# Kong Plugin Policy
# Allows Kong plugins to read public keys and validate tokens

# Read PASETO public keys
path "lms/data/paseto/keys/public" {
  capabilities = ["read"]
}

path "lms/metadata/paseto/keys/public" {
  capabilities = ["read"]
}

# Read key metadata for validation
path "lms/data/paseto/keys/metadata" {
  capabilities = ["read"]
}

# Token self-management
path "auth/token/renew-self" {
  capabilities = ["update"]
}

path "auth/token/lookup-self" {
  capabilities = ["read"]
}

# System health for monitoring
path "sys/health" {
  capabilities = ["read"]
}