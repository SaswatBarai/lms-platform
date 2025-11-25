# Swagger Setup Instructions

## Quick Start

1. **Install dependencies** (if not already installed):
   ```bash
   cd services/auth-service
   pnpm install
   ```

2. **Rebuild the container**:
   ```bash
   docker-compose up -d --build auth-service
   ```

3. **Access Swagger UI**:
   - Open http://localhost:8000/auth/api/api-docs in your browser (via Kong Gateway)
   - Or http://localhost:4001/api-docs (direct service access)

## File Locations

- **Swagger Config**: `services/auth-service/src/config/swagger.ts`
- **Swagger Docs**: `services/auth-service/docs/swagger/openapi.yaml`
- **Docker Mount**: `./services/auth-service/docs/swagger:/app/swagger:ro` (in docker-compose.yml)

## How It Works

1. The `swagger.ts` utility loads `openapi.yaml` from the mounted volume
2. Swagger UI is served at `/api-docs` endpoint
3. Documentation is hot-reloaded - edit YAML files and refresh browser
4. Only enabled in non-production environments by default

## Troubleshooting

### Swagger UI not loading?

1. Check if the service is running: `docker-compose ps`
2. Check logs: `docker-compose logs auth-service`
3. Verify the volume mount: `docker-compose exec auth-service ls -la /app/swagger`
4. Check if NODE_ENV is set to 'production' (Swagger is disabled in production)

### YAML syntax errors?

- Validate your YAML at https://editor.swagger.io/
- Check for indentation issues (YAML is sensitive to spaces)
- Ensure all `$ref` paths are correct

### Changes not appearing?

- Make sure you're editing files in `docs/swagger/` (not inside the container)
- Refresh your browser (hard refresh: Ctrl+Shift+R or Cmd+Shift+R)
- Check that the volume mount is working correctly

