# gateway/kong/Dockerfile
FROM kong:3.7

# Switch to root for plugin installation
USER root

# Create plugin directory
RUN mkdir -p /usr/local/share/lua/5.1/kong/plugins/paseto-vault-auth-lua

# Copy plugin source code
COPY plugins/paseto-vault-auth-lua/ /usr/local/share/lua/5.1/kong/plugins/paseto-vault-auth-lua/

# Copy Kong configuration
COPY kong/kong.yaml /etc/kong/kong.yaml

# Copy SSL certificates (if available)
COPY kong/ssl/ /etc/kong/ssl/

# Set Kong plugins environment variable to include our custom plugin
ENV KONG_PLUGINS=bundled,paseto-vault-auth-lua

# Switch back to kong user
USER kong

# Expose ports (already exposed by base image but explicit for clarity)
EXPOSE 8000 8001 8443 8444

# Health check
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
  CMD kong health

# Start Kong
CMD ["kong", "docker-start"]