# See what’s listening on 8200
sudo lsof -nP -iTCP:9093 -sTCP:LISTEN

# Kill common Vault dev processes binding 8200
# sudo pkill -f 'vault server -dev' || true
# sudo pkill -f 'dumb-init .*vault server' || true

# # If Vault is running as a service, stop it (ignore errors if not present)
# sudo systemctl stop vault || true

# As a fallback, kill anything using the port
sudo fuser -k 9093/tcp || true

# Verify the port is free
ss -ltnp | grep -E ':9093(\s|$)' || echo 'Port 9093 is now free'

