# LMS Platform Documentation

Welcome to the LMS Platform documentation directory.

## 📚 Available Documentation

### [Auth Service API Documentation](./auth-service-api.md)
Complete API reference for the authentication and authorization service:
- 🔐 Organization and College authentication
- 📝 Detailed endpoint documentation with examples
- ❌ Error codes and troubleshooting
- 🧪 Testing guides and curl examples
- 🔒 Security features and single-device login

**Quick Access Links:**
- **Base URL:** `http://localhost:8000/auth/api/...`
- **Organization Registration:** [Create Organization](./auth-service-api.md#1-create-organization-account)
- **College Management:** [College Endpoints](./auth-service-api.md#-college-endpoints)
- **Authentication Testing:** [Test Protected Route](./auth-service-api.md#test-protected-route)

### Other Documentation

- [Single Device Login Implementation](../SINGLE_DEVICE_LOGIN.md)
- [College Single Device Login Summary](../COLLEGE_SINGLE_DEVICE_LOGIN_SUMMARY.md)

## 🚀 Quick Start

1. **Start the services:**
   ```bash
   docker-compose up -d
   ```

2. **Test organization registration:**
   ```bash
   curl -X POST http://localhost:8000/auth/api/create-organization \
     -H "Content-Type: application/json" \
     -d '{
       "name": "Your University",
       "email": "admin@your-university.edu",
       "password": "SecurePass123!",
       "recoveryEmail": "recovery@your-university.edu",
       "address": "Your Address",
       "phone": "+1234567890"
     }'
   ```

3. **Check the API documentation:** [Auth Service API](./auth-service-api.md)

## 📞 Support

- **API Issues:** Check the [Error Codes section](./auth-service-api.md#-error-codes)
- **Authentication:** Review [Security Features](./auth-service-api.md#-security-features)
- **Testing:** Use the provided [curl examples](./auth-service-api.md#-testing-examples)

---

**Last Updated:** October 28, 2024
