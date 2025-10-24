
path "secret/data/lms/paseto/keys/public" {
  capabilities = ["read"]
}

path "secret/metadata/lms/paseto/keys/public" {
  capabilities = ["read"]
}

# Allow token lookup
path "auth/token/lookup-self" {
  capabilities = ["read"]
}
