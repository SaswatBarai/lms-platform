# gateway/kong/Dockerfile
FROM kong:3.7

# Copy Kong configuration
COPY kong.yaml /etc/kong/kong.yaml

# Copy SSL certificates (if available)
COPY ssl/ /etc/kong/ssl/

# Expose ports (already exposed by base image but explicit for clarity)
EXPOSE 8000 8001 8443 8444

# Health check
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
  CMD kong health

# Start Kong
CMD ["kong", "docker-start"]