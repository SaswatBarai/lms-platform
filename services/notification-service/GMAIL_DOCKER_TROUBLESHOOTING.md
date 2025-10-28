# Gmail SMTP Connection Issues in Docker - Troubleshooting Guide

## 🚨 The Problem

You're seeing this error:
```
[mail] ❌ Verification attempt 3/3 failed: read ECONNRESET
[mail] ⚠️  Gmail transporter verification failed after all retries
```

This happens when Docker containers try to connect to Gmail's SMTP server (`smtp.gmail.com:587`) and Gmail resets the connection.

## 🔍 Why This Happens

1. **Gmail Security Blocks**: Gmail's security systems may block connections from unknown/suspicious IPs (Docker container IPs)
2. **Docker Network Isolation**: Docker's network setup can interfere with SMTP connections
3. **ISP/Firewall Blocking**: Some ISPs or firewalls block outbound SMTP traffic from Docker
4. **IPv6 Issues**: Docker + Gmail + IPv6 can sometimes cause connection resets

## ✅ Solutions (In Order of Recommendation)

### Solution 1: Use Console Mode (Recommended for Development) ⭐

**Best for local development and testing.**

Set in `docker-compose.yml`:
```yaml
- EMAIL_MODE=console
```

**Benefits:**
- ✅ No configuration needed
- ✅ Instant setup
- ✅ See OTPs directly in logs
- ✅ No external dependencies
- ✅ Perfect for development

**How it works:**
When set to `console`, emails are displayed in a formatted box in your Docker logs:
```
╔══════════════════════════════════════════════════════════════╗
║               🚀 DEVELOPMENT OTP (FALLBACK MODE)             ║
╠══════════════════════════════════════════════════════════════╣
║  📧 Email: user@example.com                                  ║
║  🔐 OTP Code: 123456                                         ║
║  ⏰ Time: 10/28/2025, 8:00:00 PM                            ║
║  ⚠️  Gmail not connected, using console fallback            ║
╚══════════════════════════════════════════════════════════════╝
```

**To use:**
1. Set `EMAIL_MODE=console` in docker-compose.yml
2. Rebuild: `docker-compose up --build -d notification-service`
3. Watch logs: `docker logs -f notification_service`
4. OTPs will appear in logs when triggered

---

### Solution 2: Use Host Network Mode (Linux Only)

**For actual email sending in development on Linux.**

Modify `docker-compose.yml`:
```yaml
notification-service:
  # ... other config
  network_mode: "host"  # Add this line
  # Remove the 'networks' section for this service
  environment:
    # ... existing env vars
    - KAFKA_BROKERS=localhost:9094  # Change to localhost
    - EMAIL_MODE=email
```

**Limitations:**
- ❌ Only works on Linux
- ❌ Exposes service on host's network
- ❌ Port conflicts possible

---

### Solution 3: Enable IPv4 Only for Gmail

**Force IPv4 connections to Gmail.**

Update `services/notification-service/src/config/mail.config.ts`:

```typescript
export const transporter = nodemailer.createTransport({
    service: 'gmail',
    host: env.MAIL_HOST,
    port: env.MAIL_PORT,
    secure: false,
    auth: {
        user: env.MAIL_USER,
        pass: env.MAIL_PASS
    },
    tls: {
        rejectUnauthorized: false,
        ciphers: 'SSLv3'
    },
    pool: true,
    maxConnections: 5,
    connectionTimeout: 60000,
    greetingTimeout: 30000,
    socketTimeout: 75000,
    dnsTimeout: 30000,
    // Force IPv4
    family: 4,
    debug: env.NODE_ENV === 'development',
    logger: env.NODE_ENV === 'development'
});
```

**Then rebuild:**
```bash
docker-compose up --build -d notification-service
```

---

### Solution 4: Use Gmail Less Secure Apps Alternative

**⚠️ Not recommended - Gmail deprecated this in 2022**

Instead, ensure:
1. **2-Factor Authentication is ENABLED** on your Gmail
2. Generate an **App Password** specifically for this application
3. Use the 16-character app password (no spaces)

**Steps:**
1. Go to https://myaccount.google.com/security
2. Enable 2-Step Verification
3. Go to https://myaccount.google.com/apppasswords
4. Create app password for "Mail" → "Other" → "LMS Platform"
5. Copy the 16-character password
6. Update `MAIL_PASS` in docker-compose.yml

---

### Solution 5: Use a Different SMTP Provider

**Best for production deployments.**

**Option A: SendGrid (Free tier available)**
```yaml
environment:
  - MAIL_HOST=smtp.sendgrid.net
  - MAIL_PORT=587
  - MAIL_USER=apikey
  - MAIL_PASS=your_sendgrid_api_key
  - EMAIL_MODE=email
```

**Option B: Mailgun**
```yaml
environment:
  - MAIL_HOST=smtp.mailgun.org
  - MAIL_PORT=587
  - MAIL_USER=your_mailgun_username
  - MAIL_PASS=your_mailgun_password
  - EMAIL_MODE=email
```

**Option C: AWS SES**
```yaml
environment:
  - MAIL_HOST=email-smtp.us-east-1.amazonaws.com
  - MAIL_PORT=587
  - MAIL_USER=your_ses_username
  - MAIL_PASS=your_ses_password
  - EMAIL_MODE=email
```

**Benefits:**
- ✅ Reliable delivery
- ✅ Better for production
- ✅ Higher sending limits
- ✅ Better analytics
- ✅ No Docker network issues

---

### Solution 6: SMTP Relay Container

**Run your own SMTP relay inside Docker.**

Add to `docker-compose.yml`:
```yaml
services:
  mailhog:
    image: mailhog/mailhog:latest
    container_name: mailhog
    ports:
      - "1025:1025"  # SMTP
      - "8025:8025"  # Web UI
    networks:
      - lms-network

  notification-service:
    # ... existing config
    environment:
      # ... other vars
      - MAIL_HOST=mailhog
      - MAIL_PORT=1025
      - MAIL_USER=""
      - MAIL_PASS=""
      - EMAIL_MODE=email
```

**Benefits:**
- ✅ Catches all emails
- ✅ Web UI to view emails at http://localhost:8025
- ✅ No external SMTP needed
- ✅ Perfect for development/testing

**Access emails:**
Open http://localhost:8025 in your browser to see all sent emails.

---

## 🧪 Testing Your Configuration

### Test 1: Check DNS Resolution
```bash
docker exec notification_service nslookup smtp.gmail.com
```
Should resolve to Gmail's IP addresses.

### Test 2: Check Connectivity
```bash
docker exec notification_service nc -zv smtp.gmail.com 587
```
Should show "succeeded" if port is reachable.

### Test 3: Check Logs
```bash
docker logs -f notification_service | grep mail
```
Watch for verification messages.

### Test 4: Trigger an Email
Create an organization account and watch for OTP in logs.

---

## 📊 Current Service Behavior

Your notification service is **smart** and has automatic fallback:

1. **On Startup**: Tries to verify Gmail connection (3 attempts with 5s delays)
2. **If Fails**: Falls back to console mode automatically in development
3. **OTP Emails**: Uses console fallback if Gmail isn't connected
4. **Welcome Emails**: Skips if Gmail isn't connected (non-critical)

This means **your service works even without Gmail** - you'll just see OTPs in logs instead of emails.

---

## 🎯 Recommended Setup by Environment

### Development (Local)
```yaml
- EMAIL_MODE=console  # ⭐ Best choice
```
- View OTPs in logs
- No configuration needed
- Fast and reliable

### Staging
```yaml
- EMAIL_MODE=email
# Use MailHog or similar
- MAIL_HOST=mailhog
- MAIL_PORT=1025
```
- Test actual email delivery
- View emails in web UI
- No external service needed

### Production
```yaml
- EMAIL_MODE=email
# Use SendGrid, Mailgun, or AWS SES
- MAIL_HOST=smtp.sendgrid.net
- MAIL_USER=apikey
- MAIL_PASS=your_api_key
```
- Reliable delivery
- Proper monitoring
- Better deliverability

---

## 🔧 Quick Fix Commands

### Restart notification service
```bash
docker-compose restart notification-service
```

### Rebuild notification service
```bash
docker-compose up --build -d notification-service
```

### View real-time logs
```bash
docker logs -f notification_service
```

### Check environment variables
```bash
docker exec notification_service env | grep -E 'MAIL|EMAIL'
```

---

## ❓ FAQ

**Q: Why does Gmail work on my host but not in Docker?**  
A: Docker containers have different IP addresses and network routes. Gmail may block container IPs or Docker's network configuration may interfere with SMTP.

**Q: Is console mode production-ready?**  
A: No, console mode is for development only. Use a proper SMTP service for production.

**Q: Will my application fail if Gmail doesn't connect?**  
A: No, the service has automatic fallback and will continue working. In development, it uses console logging.

**Q: Can I use my personal Gmail?**  
A: Yes, but you need 2FA enabled and must generate an App Password specifically for this application.

**Q: What's the difference between EMAIL_MODE=console and EMAIL_MODE=email?**  
A: `console` logs emails to stdout (perfect for dev), `email` sends actual emails via SMTP (for staging/production).

---

## 📚 Additional Resources

- [Nodemailer Gmail Setup](https://nodemailer.com/usage/using-gmail/)
- [Google App Passwords](https://support.google.com/accounts/answer/185833)
- [Docker Networking](https://docs.docker.com/network/)
- [SendGrid Setup](https://sendgrid.com/docs/for-developers/sending-email/integrations/)
- [MailHog for Testing](https://github.com/mailhog/MailHog)

---

**Need Help?** Check the service logs or review the `EMAIL_SETUP.md` file for more configuration options.

