# Self-signed certificate for development
# In production, replace with proper SSL certificates

# Generate self-signed certificate for development
# openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes \
#   -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"

# Placeholder files - replace with actual certificates
# cert.pem and key.pem should be placed here for SSL/TLS termination