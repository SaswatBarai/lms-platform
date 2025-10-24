# vault/Dockerfile
FROM hashicorp/vault:1.15.2

# Copy configuration
COPY vault.hcl /vault/config/vault.hcl
COPY policies/ /vault/policies/
COPY scripts/ /vault/scripts/

# Create data directory
RUN mkdir -p /vault/data && \
    mkdir -p /vault/logs && \
    chown -R vault:vault /vault

# Make scripts executable
RUN chmod +x /vault/scripts/*.sh

EXPOSE 8200 8201

# Custom entrypoint to initialize Vault
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
CMD ["vault", "server", "-config=/vault/config/vault.hcl"]
