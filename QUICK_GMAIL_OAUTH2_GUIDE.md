# ⚡ Quick Gmail OAuth2 Setup Guide

**NaukriMili Job Portal - Email Notification System**

---

## ✅ BACKEND STATUS

Your backend code is **100% ready**. Just need configuration.

---

## 🚀 5-MINUTE SETUP

### Step 1: Google Cloud Console (5 min)

1. **Enable Gmail API:**
   - https://console.cloud.google.com/apis/library
   - Search "Gmail API" → Enable

2. **Create OAuth2 Client:**
   - https://console.cloud.google.com/apis/credentials
   - CREATE CREDENTIALS → OAuth client ID
   - Type: Web application
   - Redirect URI: `https://developers.google.com/oauthplayground`
   - Save Client ID and Client Secret

### Step 2: Generate Refresh Token (3 min)

1. **Open OAuth Playground:**
   - https://developers.google.com/oauthplayground

2. **Configure:**
   - Settings (⚙️) → Use your own OAuth credentials
   - Enter your Client ID and Secret

3. **Authorize:**
   - Select scope: `https://www.googleapis.com/auth/gmail.send`
   - Authorize APIs → Sign in with `info@naukrimili.com`

4. **Get Token:**
   - Exchange authorization code for tokens
   - Copy Refresh Token

### Step 3: Configure Environment (1 min)

Create `.env` file:

```env
GMAIL_API_CLIENT_ID=your_client_id.apps.googleusercontent.com
GMAIL_API_CLIENT_SECRET=your_client_secret
GMAIL_API_REFRESH_TOKEN=your_refresh_token
GMAIL_SENDER=NaukriMili <naukrimili@naukrimili.com>
GMAIL_FROM_NAME=NaukriMili
```

### Step 4: Test (1 min)

```bash
# Run diagnostic
node scripts/diagnose-gmail-oauth2.js --send-email

# Start app
pm2 start ecosystem.config.cjs --env production

# Check logs
pm2 logs naukrimili
```

**Expected:** `✅ Gmail OAuth2 service initialized successfully`

---

## 🔧 TROUBLESHOOTING

### Error: `invalid_grant`
**Fix:** Regenerate refresh token (Step 2)

### Error: `403 Forbidden`
**Fix:** Enable Gmail API (Step 1.1)

### Error: `credentials not configured`
**Fix:** Check .env file exists and has correct values

### Error: `placeholder values`
**Fix:** Replace `your_` values with real credentials

---

## 📋 VERIFICATION CHECKLIST

- [ ] Gmail API enabled in Google Cloud Console
- [ ] OAuth2 Client created (Web application)
- [ ] Redirect URI: `https://developers.google.com/oauthplayground`
- [ ] Refresh token generated with `gmail.send` scope
- [ ] Environment variables set in .env
- [ ] Application started successfully
- [ ] Test email sent and received

---

## 📧 EMAIL FEATURES READY

Once configured, these work automatically:

- ✅ Welcome emails on signup
- ✅ Job application notifications
- ✅ Application status updates
- ✅ Custom notifications
- ✅ Test email API endpoint

---

## 🛠️ USEFUL COMMANDS

```bash
# Diagnostic
node scripts/diagnose-gmail-oauth2.js

# Test email
node scripts/diagnose-gmail-oauth2.js --send-email

# Auto-fix
node scripts/fix-gmail-oauth2.js

# Setup wizard (Linux/Mac)
./scripts/setup-gmail-oauth2.sh

# Start app
pm2 start ecosystem.config.cjs
pm2 logs naukrimili

# Restart after config change
pm2 restart naukrimili
```

---

## 📖 FULL DOCUMENTATION

- **Comprehensive Guide:** `GMAIL_OAUTH2_FINAL_REPORT.md`
- **Audit Report:** `GMAIL_OAUTH2_COMPREHENSIVE_AUDIT.md`
- **Diagnostic Script:** `scripts/diagnose-gmail-oauth2.js`
- **Auto-fix Script:** `scripts/fix-gmail-oauth2.js`
- **Setup Script:** `scripts/setup-gmail-oauth2.sh`

---

## ✨ WHAT'S ALREADY DONE

✅ Gmail OAuth2 mailer service (720 lines, production-ready)  
✅ Automatic token refresh  
✅ Welcome email integration with OAuth signup  
✅ Test API endpoint  
✅ Error detection & retry logic  
✅ 6+ email templates  
✅ RFC 2822 compliant formatting  
✅ Attachment support  
✅ No SMTP conflicts  

**You're 10 minutes away from working email notifications! 🎉**

