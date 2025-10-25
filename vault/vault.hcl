# vault/vault.hcl
# Vault configuration file

# Storage backend
storage "file" {
  path = "/vault/data"
}

# Listener configuration
listener "tcp" {
  address     = "0.0.0.0:8200"
  tls_disable = 1
}

# API configuration
api_addr = "http://0.0.0.0:8200"
cluster_addr = "http://0.0.0.0:8201"

# UI configuration
ui = true

# Logging
log_level = "INFO"
log_file = "/vault/logs/vault.log"
log_rotate_duration = "24h"
log_rotate_max_files = 30

# Development mode settings (only for development)
disable_mlock = true

# Plugin directory
plugin_directory = "/vault/plugins"

# Seal configuration (for production, use auto-unseal)
# For development, we'll use the default shamir seal

# Maximum lease TTL
max_lease_ttl = "768h"
default_lease_ttl = "768h"

# Enable raw endpoint (for debugging, remove in production)
raw_storage_endpoint = true

# Telemetry (optional)
telemetry {
  prometheus_retention_time = "30s"
  disable_hostname = true
}