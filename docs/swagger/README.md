# Swagger/OpenAPI Documentation for Auth Service

This directory contains the OpenAPI 3.0 specification for the LMS Auth Service.

## 📁 Structure

```
docs/swagger/
├── openapi.yaml          # Main OpenAPI specification file
├── components/           # Reusable components
│   ├── schemas.yaml     # Data models and schemas
│   ├── security.yaml    # Security schemes (PASETO auth)
│   └── responses.yaml   # Common response definitions
└── paths/               # Endpoint definitions (optional - can use $ref)
    ├── organization.yaml
    ├── student.yaml
    └── ...
```

## 🚀 Accessing the Documentation

Once the service is running, access the Swagger UI at:

- **Direct Service**: http://localhost:4001/api-docs
- **Via Kong Gateway**: http://localhost:8000/auth/api/api-docs (if routed)

## ✏️ Editing Documentation

### Hot Reload

The Swagger docs are mounted as a volume in Docker, so you can:

1. Edit any YAML file in `docs/swagger/`
2. Refresh your browser at `/api-docs`
3. Changes appear immediately - **no container restart needed!**

### Adding New Endpoints

1. Open `docs/swagger/openapi.yaml`
2. Add your endpoint under the `paths:` section
3. Reference schemas from `components/schemas.yaml`
4. Save and refresh the browser

### Example: Adding a New Endpoint

```yaml
paths:
  /your-new-endpoint:
    post:
      tags:
        - YourTag
      summary: Your endpoint summary
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/YourRequestSchema'
      responses:
        '200':
          description: Success
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/YourResponseSchema'
        '400':
          $ref: '#/components/responses/BadRequest'
```

## 📝 Best Practices

1. **Keep it modular**: Use `$ref` to reference components instead of duplicating
2. **Use tags**: Group related endpoints with tags
3. **Add examples**: Include request/response examples for clarity
4. **Document errors**: Define all possible error responses
5. **Keep it updated**: Update docs when you change endpoints

## 🔧 Configuration

The Swagger setup is configured in:
- `services/auth-service/src/config/swagger.ts` - Swagger setup utility
- `services/auth-service/src/app.ts` - Integration (only in non-production)
- `docker-compose.yml` - Volume mount configuration

## 🛡️ Security

- Swagger UI is **only enabled in non-production** environments
- To enable in production, remove the `if (process.env.NODE_ENV !== 'production')` check in `app.ts`
- Authentication is documented using PASETO v4 bearer tokens

## 📚 Resources

- [OpenAPI 3.0 Specification](https://swagger.io/specification/)
- [Swagger UI Documentation](https://swagger.io/tools/swagger-ui/)
- [OpenAPI Guide](https://swagger.io/docs/)

