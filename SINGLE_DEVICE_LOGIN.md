# Single Device Login Implementation

## Overview
This implementation ensures that organizations can only be logged in from one device at a time. When an organization logs in from a new device, any existing sessions on other devices are automatically invalidated.

## How It Works

### 1. Login Flow (Auth Service)
When an organization logs in (`/api/login-organization`):

1. **Session Creation**: A new unique `sessionId` is generated using `crypto.randomBytes(16).toString('hex')`

2. **Redis Storage**: The session is stored in Redis with the following structure:
   ```
   Key: activeSession:org:{organizationId}
   Fields:
     - sessionId: <unique-session-id>
     - organizationId: <org-id>
     - active: 'true'
   Expiry: 1 day
   ```

3. **Token Generation**: The `sessionId` is embedded in the PASETO access token payload:
   ```json
   {
     "id": "org-id",
     "email": "org@example.com",
     "name": "Organization Name",
     "role": "admin",
     "type": "organization",
     "sessionId": "unique-session-id"
   }
   ```

4. **Previous Session Invalidation**: If an existing session is found in Redis, it's automatically overwritten with the new session, effectively logging out the previous device.

### 2. Request Validation (Kong Gateway)

Every authenticated request goes through the Kong `paseto-vault-auth-lua` plugin:

1. **Token Extraction**: The plugin extracts the Bearer token from the Authorization header

2. **Token Decoding**: The PASETO token is decoded to extract claims (including `sessionId` and `id`)

3. **Session Validation** (for organizations only):
   - Connects to Redis
   - Retrieves the stored session: `activeSession:org:{organizationId}`
   - Checks if `active` field is `'true'`
   - **CRITICAL CHECK**: Compares the `sessionId` from the token with the `sessionId` stored in Redis
   - If they don't match → Session has been invalidated by a new login → Request rejected with 401

4. **Request Forwarding**: If validation passes, the request is forwarded to the upstream service with user headers

## Configuration

### Kong Plugin Configuration (kong.yaml)
```yaml
plugins:
  - name: paseto-vault-auth-lua
    config:
      redis_host: redis          # Redis server hostname
      redis_port: 6379           # Redis server port
      redis_database: 0          # Redis database number
      redis_timeout: 2000        # Connection timeout in ms
      validate_session: true     # Enable/disable session validation
      # ... other config
```

### Available Redis Config Options
- `redis_host`: Redis server hostname (default: "redis")
- `redis_port`: Redis server port (default: 6379)
- `redis_password`: Redis password (optional)
- `redis_database`: Redis database number (default: 0)
- `redis_timeout`: Connection timeout in milliseconds (default: 2000)
- `validate_session`: Enable/disable session validation (default: true)

## Flow Diagram

```
User A logs in (Device 1)
  ↓
Auth Service generates sessionId_A
  ↓
Redis: activeSession:org:123 → { sessionId: sessionId_A, active: 'true' }
  ↓
User A gets access token with sessionId_A
  ↓
User A makes requests → Kong validates sessionId_A matches Redis → ✅ Success

---

User A logs in (Device 2) - SAME USER, NEW DEVICE
  ↓
Auth Service generates NEW sessionId_B
  ↓
Redis: activeSession:org:123 → { sessionId: sessionId_B, active: 'true' } (overwrites)
  ↓
User A gets NEW access token with sessionId_B
  ↓
Device 1 makes request with old token (sessionId_A)
  ↓
Kong compares: sessionId_A (from token) != sessionId_B (from Redis) → ❌ 401 Unauthorized
  ↓
Device 2 makes request with new token (sessionId_B)
  ↓
Kong compares: sessionId_B (from token) == sessionId_B (from Redis) → ✅ Success
```

## Error Responses

When a session is invalidated, users receive:
```json
{
  "error": "Session invalid",
  "message": "Your session has been invalidated. Please login again.",
  "reason": "Session has been invalidated by another login"
}
```

## Benefits

1. **Security**: Prevents unauthorized access from multiple devices
2. **Session Control**: Organizations maintain control over active sessions
3. **Automatic Invalidation**: No manual session management required
4. **Transparent**: Users are immediately notified when logged out from another device

## Testing

To test single device login:

1. Login from Device/Browser 1
2. Make authenticated requests → Should succeed
3. Login from Device/Browser 2 (same credentials)
4. Make authenticated requests from Device 2 → Should succeed
5. Try to make authenticated requests from Device 1 → Should fail with 401

## Notes

- Session validation only applies to `type: "organization"` users
- Session validation can be disabled by setting `validate_session: false` in plugin config
- Redis connection pooling is used for performance (keepalive)
- Session TTL is 1 day (configurable in auth service)

