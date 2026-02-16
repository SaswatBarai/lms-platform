# API Docs (Scalar) Setup Instructions

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

3. **Access API docs**:
   - Open http://localhost:4001/api-docs in your browser

## File Locations

- **API docs config**: `services/auth-service/src/config/api-docs.ts`
- **OpenAPI spec**: `docs/openapi/openapi.yaml`
- **Docker Mount**: `./services/auth-service/docs/openapi:/app/openapi:ro` (in docker-compose.yml)

## How It Works

1. The `api-docs.ts` utility loads `openapi.yaml` from the mounted volume
2. Scalar API Reference is served at `/api-docs` endpoint
3. Documentation is hot-reloaded - edit YAML files and refresh browser
4. Only enabled in non-production environments by default

## Troubleshooting

### API docs not loading?

1. Check if the service is running: `docker-compose ps`
2. Check logs: `docker-compose logs auth-service`
3. Verify the volume mount: `docker-compose exec auth-service ls -la /app/openapi`
4. Check if NODE_ENV is set to 'production' (API docs are disabled in production)

### YAML syntax errors?

- Validate your YAML at https://editor.swagger.io/
- Check for indentation issues (YAML is sensitive to spaces)
- Ensure all `$ref` paths are correct

### Changes not appearing?

- Make sure you're editing files in `docs/openapi/` or `services/auth-service/docs/openapi/` (not inside the container)
- Refresh your browser (hard refresh: Ctrl+Shift+R or Cmd+Shift+R)
- Check that the volume mount is working correctly

