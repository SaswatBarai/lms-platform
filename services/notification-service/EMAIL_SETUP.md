# Email Configuration Guide for Notification Service

## Overview

The notification service supports two modes for sending emails:
1. **Console Mode** - Logs emails to console (recommended for development)
2. **Email Mode** - Sends actual emails via Gmail SMTP

## Quick Start

### For Development (Console Mode)

Set `EMAIL_MODE=console` in your docker-compose.yml:

```yaml
environment:
  - EMAIL_MODE=console
```

This will log all emails to the console instead of sending them. Perfect for:
- Local development
- Testing
- When you don't have Gmail credentials configured

### For Production (Email Mode)

Set `EMAIL_MODE=email` in your docker-compose.yml:

```yaml
environment:
  - EMAIL_MODE=email
  - MAIL_USER=your-email@gmail.com
  - MAIL_PASS=your-app-password
  - MAIL_HOST=smtp.gmail.com
  - MAIL_PORT=587
```

## Gmail Setup (For Email Mode)

### Step 1: Enable 2-Factor Authentication

1. Go to your Google Account: https://myaccount.google.com/
2. Navigate to Security
3. Enable 2-Step Verification

### Step 2: Generate App Password

1. Go to https://myaccount.google.com/apppasswords
2. Select "Mail" as the app
3. Select "Other" as the device and name it "LMS Platform"
4. Click "Generate"
5. Copy the 16-character password (no spaces)

### Step 3: Configure Environment Variables

Update your docker-compose.yml:

```yaml
environment:
  - MAIL_USER=your-gmail@gmail.com
  - MAIL_PASS=your-16-char-app-password  # From Step 2
  - EMAIL_MODE=email
```

## Troubleshooting

### Error: "read ECONNRESET"

**Cause**: Network connection to Gmail SMTP is being reset.

**Solutions**:
1. ✅ **Use Console Mode for Development**: Set `EMAIL_MODE=console`
2. Check if Gmail is blocking connections from Docker container
3. Verify DNS is working: `docker exec notification_service ping smtp.gmail.com`
4. Check firewall settings allowing outbound SMTP (port 587)

### Error: "BadCredentials" or "Username and Password not accepted"

**Cause**: Invalid Gmail credentials.

**Solutions**:
1. Verify 2FA is enabled on your Gmail account
2. Regenerate App Password (Step 2 above)
3. Ensure `MAIL_USER` matches the Gmail account exactly
4. Double-check `MAIL_PASS` has no typos or spaces

### Error: "ETIMEDOUT" or "ECONNECTION"

**Cause**: Network timeout connecting to Gmail.

**Solutions**:
1. Check internet connection
2. Verify Docker DNS settings (should have `8.8.8.8` configured)
3. Try increasing timeout in mail.config.ts
4. Use Console Mode as fallback

### Kafka Connection Errors (Initially Normal)

```
[BrokerPool] Failed to connect to seed broker
```

**Explanation**: This is normal during startup while Kafka is initializing. The service will retry and eventually connect (usually within 10-30 seconds).

**If it persists**:
1. Check if Kafka container is running: `docker ps | grep kafka`
2. Check Kafka logs: `docker logs kafka_cont`
3. Restart Kafka: `docker restart kafka_cont`

## Features

### Automatic Retry Logic

The service automatically retries failed email sends:
- Up to 2 retries with exponential backoff
- Fallback to console logging on failure (development mode)
- Detailed error logging for debugging

### Connection Pooling

Email transporter uses connection pooling for better performance:
- Max 5 concurrent connections
- 100 messages per connection
- 30-second connection timeout
- 60-second socket timeout

### Verification on Startup

The service verifies Gmail connection on startup:
- 3 retry attempts with 5-second delays
- Non-blocking verification (doesn't prevent startup)
- Automatic fallback to console mode if verification fails

## Environment Variables Reference

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `EMAIL_MODE` | `console` or `email` | - | Yes |
| `MAIL_USER` | Gmail address | - | If EMAIL_MODE=email |
| `MAIL_PASS` | Gmail App Password | - | If EMAIL_MODE=email |
| `MAIL_HOST` | SMTP host | `smtp.gmail.com` | No |
| `MAIL_PORT` | SMTP port | `587` | No |
| `NODE_ENV` | Environment | `development` | No |

## Recommended Configuration

### Development
```yaml
- EMAIL_MODE=console  # Fast, no setup needed
- NODE_ENV=development
```

### Staging/Production
```yaml
- EMAIL_MODE=email
- MAIL_USER=your-gmail@gmail.com
- MAIL_PASS=your-app-password
- NODE_ENV=production
```

## Testing Email Configuration

### Test in Console Mode

1. Set `EMAIL_MODE=console`
2. Trigger an OTP request
3. Check console logs for formatted OTP output

### Test in Email Mode

1. Set `EMAIL_MODE=email` with valid credentials
2. Trigger an OTP request
3. Check recipient's inbox
4. Monitor logs for success message

### Check Logs

```bash
# View notification service logs
docker logs notification_service

# Follow logs in real-time
docker logs -f notification_service

# Check last 100 lines
docker logs --tail 100 notification_service
```

## Support

If you continue to experience issues:

1. Enable debug logging by checking service logs
2. Verify all environment variables are set correctly
3. Test Gmail credentials outside Docker
4. Consider using a dedicated email service (SendGrid, Mailgun) for production

