# vault/Dockerfile
FROM hashicorp/vault:1.15

# Install curl for health checks
RUN apk add --no-cache curl

# Create vault user and directories
RUN addgroup vault && \
    adduser -D -s /bin/sh -G vault vault

# Create necessary directories
RUN mkdir -p /vault/data /vault/logs /vault/config /vault/policies && \
    chown -R vault:vault /vault

# Copy configuration files
COPY vault.hcl /vault/config/
COPY policies/ /vault/policies/
COPY scripts/ /vault/scripts/

# Make scripts executable
RUN chmod +x /vault/scripts/*.sh

# Set working directory
WORKDIR /vault

# Expose port
EXPOSE 8200

# Health check
HEALTHCHECK --interval=30s --timeout=10s --retries=5 --start-period=30s \
  CMD vault status || exit 1

# Use the vault user
USER vault

# Start vault server
CMD ["vault", "server", "-config=/vault/config/vault.hcl"]