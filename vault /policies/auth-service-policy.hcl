
path "secret/data/lms/paseto/keys/*" {
  capabilities = ["create", "read", "update", "delete", "list"]
}

path "secret/metadata/lms/paseto/keys/*" {
  capabilities = ["create", "read", "update", "delete", "list"]
}

# Allow reading auth method info
path "auth/token/lookup-self" {
  capabilities = ["read"]
}
