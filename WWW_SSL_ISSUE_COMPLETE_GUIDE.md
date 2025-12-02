# 🔐 WWW SSL Certificate Issue - Complete Guide

## 📋 Problem Statement

**Issue:** `www.naukrimili.com` shows `ERR_SSL_PROTOCOL_ERROR` in browser  
**Status:** `https://naukrimili.com` works perfectly ✅  
**Impact:** Users cannot access website via www subdomain ❌

---

## 🔍 Root Cause Analysis

### What's Happening:

1. **Browser Request:**
   ```
   User types: www.naukrimili.com
   Browser initiates: HTTPS connection (port 443)
   ```

2. **SSL Handshake:**
   ```
   ┌─────────────┐                    ┌──────────────┐
   │   Browser   │ ──────────────────> │    Server    │
   │             │ "Hello, I want SSL" │              │
   └─────────────┘                    └──────────────┘
   
   ┌─────────────┐                    ┌──────────────┐
   │   Browser   │ <────────────────── │    Server    │
   │             │  "Here's my cert"   │              │
   └─────────────┘                    └──────────────┘
   ```

3. **Certificate Validation:**
   ```
   Browser checks certificate:
   ├─ Subject: CN=naukrimili.com
   ├─ SAN (Subject Alternative Names):
   │  └─ DNS: naukrimili.com ✅
   │  └─ DNS: www.naukrimili.com ❌ MISSING!
   └─ Result: CERTIFICATE_MISMATCH
   ```

4. **Error:**
   ```
   ERR_SSL_PROTOCOL_ERROR
   "This site can't provide a secure connection"
   ```

### Technical Details:

```bash
# Your current certificate only covers:
Certificate Subject Alternative Name:
  DNS:naukrimili.com

# It should cover:
Certificate Subject Alternative Name:
  DNS:naukrimili.com
  DNS:www.naukrimili.com  ← MISSING!
```

---

## 🎯 Why Your Code Is Not The Issue

### Your Middleware (middleware.ts) is CORRECT:

```typescript:35:88:middleware.ts
// This redirect logic is CORRECT
if (hasWww) {
  url.hostname = hostname.replace(/^www\./, '');
}

// It redirects www → non-www at HTTP layer
// BUT: SSL handshake happens BEFORE this code runs!
```

**Flow Diagram:**

```
┌─────────────────────────────────────────────────────┐
│ 1. TCP Connection (Port 443)                       │
│    ✅ Successful                                     │
└────────────────┬────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────┐
│ 2. SSL/TLS Handshake                               │
│    ❌ FAILS HERE - Certificate doesn't cover www   │
│    Browser shows: ERR_SSL_PROTOCOL_ERROR           │
└────────────────┬────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────┐
│ 3. HTTP Request                                     │
│    ❌ NEVER REACHES - Connection already failed    │
└────────────────┬────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────┐
│ 4. Next.js Middleware (middleware.ts)               │
│    ❌ NEVER EXECUTES - No HTTP request made        │
└─────────────────────────────────────────────────────┘
```

**Key Point:** Your code works perfectly, but it never gets to run because the SSL handshake fails first!

---

## ✅ Solution: Regenerate SSL Certificate

### Option 1: Automated Fix (RECOMMENDED)

We've created a comprehensive fix script for you:

```bash
# On your server (Hostinger VPS), run:

# 1. First, diagnose the issue (optional but recommended)
bash DIAGNOSE_WWW_SSL_ISSUE.sh

# 2. Apply the fix
bash FIX_WWW_SSL_CERTIFICATE.sh
```

### Option 2: Manual Fix

If you prefer to fix it manually:

```bash
# 1. Stop Nginx
sudo systemctl stop nginx

# 2. Regenerate certificate for BOTH domains
sudo certbot certonly \
  --standalone \
  --domains naukrimili.com,www.naukrimili.com \
  --expand \
  --force-renewal

# 3. Verify certificate includes both domains
sudo openssl x509 -in /etc/letsencrypt/live/naukrimili.com/fullchain.pem \
  -text -noout | grep -A 1 "Subject Alternative Name"

# 4. Start Nginx
sudo systemctl start nginx

# 5. Test both domains
curl -I https://naukrimili.com
curl -I https://www.naukrimili.com
```

### Option 3: Using Nginx Plugin (Easiest)

```bash
# This method lets certbot handle everything
sudo certbot --nginx -d naukrimili.com -d www.naukrimili.com --expand

# Certbot will:
# 1. Generate certificate for both domains
# 2. Update Nginx configuration automatically
# 3. Reload Nginx
```

---

## 🧪 Testing & Verification

### 1. Verify Certificate After Fix:

```bash
# Check certificate details
sudo certbot certificates

# Expected output:
# Certificate Name: naukrimili.com
#   Domains: naukrimili.com www.naukrimili.com  ← Both should be here
#   Expiry Date: 2024-XX-XX
#   Certificate Path: /etc/letsencrypt/live/naukrimili.com/fullchain.pem
```

### 2. Test SSL Connection:

```bash
# Test naukrimili.com
openssl s_client -connect naukrimili.com:443 -servername naukrimili.com < /dev/null

# Test www.naukrimili.com
openssl s_client -connect www.naukrimili.com:443 -servername www.naukrimili.com < /dev/null

# Both should show: "Verify return code: 0 (ok)"
```

### 3. Browser Testing:

```
⚠️  IMPORTANT: Clear browser cache first!

Chrome/Edge:
  1. Press Ctrl+Shift+Delete
  2. Select "Cached images and files"
  3. Click "Clear data"

Firefox:
  1. Press Ctrl+Shift+Delete
  2. Select "Cache"
  3. Click "Clear Now"

Then test:
  ✅ https://naukrimili.com
  ✅ https://www.naukrimili.com
  
Both should load without SSL errors
```

### 4. Online SSL Test:

Visit these sites to verify your SSL certificate:

- **SSL Labs:** https://www.ssllabs.com/ssltest/analyze.html?d=www.naukrimili.com
- **WhyNoPadlock:** https://www.whynopadlock.com/results/www.naukrimili.com

Both should show Grade A and no certificate errors.

---

## 📊 Expected Results After Fix

### Before Fix:

| URL | Status | SSL | Accessible |
|-----|--------|-----|------------|
| `https://naukrimili.com` | ✅ 200 | ✅ Valid | ✅ Yes |
| `https://www.naukrimili.com` | ❌ SSL Error | ❌ Invalid | ❌ No |

### After Fix:

| URL | Status | SSL | Accessible |
|-----|--------|-----|------------|
| `https://naukrimili.com` | ✅ 200 | ✅ Valid | ✅ Yes |
| `https://www.naukrimili.com` | ✅ 301 → naukrimili.com | ✅ Valid | ✅ Yes |

**Note:** After the fix, both URLs will have valid SSL. Your middleware will then redirect `www` to non-www at the HTTP level (as intended).

---

## 🔄 Certificate Auto-Renewal

### Setup (Included in Fix Script):

```bash
# Add to crontab for automatic renewal
sudo crontab -e

# Add this line:
0 12 * * * /usr/bin/certbot renew --quiet --post-hook 'systemctl reload nginx'
```

### Manual Renewal Test:

```bash
# Test renewal (dry run - doesn't actually renew)
sudo certbot renew --dry-run

# Force renewal (if needed)
sudo certbot renew --force-renewal
```

### Certbot Auto-Renewal:

Good news! Certbot installs a systemd timer automatically:

```bash
# Check if timer is active
sudo systemctl status certbot.timer

# View renewal history
sudo certbot certificates
```

---

## 🚨 Common Issues & Troubleshooting

### Issue 1: Port 443 Already in Use

```bash
# Error: Port 443 is already in use

# Solution: Stop Nginx first
sudo systemctl stop nginx
sudo certbot certonly --standalone ...
sudo systemctl start nginx
```

### Issue 2: DNS Not Resolving

```bash
# Check DNS resolution
dig www.naukrimili.com
nslookup www.naukrimili.com

# Should return your server IP
# If not, update DNS in your domain registrar:
# CNAME: www → naukrimili.com
# OR
# A: www → [Your Server IP]
```

### Issue 3: Firewall Blocking

```bash
# Check if port 443 is open
sudo ufw status
sudo netstat -tulpn | grep :443

# Open port 443 if needed
sudo ufw allow 443/tcp
```

### Issue 4: Certificate Still Shows Old Domains

```bash
# Clear Nginx cache
sudo rm -rf /var/cache/nginx/*

# Reload Nginx (not just restart)
sudo nginx -s reload

# Or fully restart
sudo systemctl restart nginx
```

### Issue 5: Browser Still Shows Error

```
This is usually browser cache!

1. Hard refresh: Ctrl+F5
2. Clear SSL cache:
   Chrome: chrome://net-internals/#sockets → "Flush socket pools"
   Edge: edge://net-internals/#sockets → "Flush socket pools"
3. Clear all browsing data: Ctrl+Shift+Delete
4. Try incognito/private window
5. Try different browser
6. Wait 5-10 minutes for DNS propagation
```

---

## 📁 Files Created for This Fix

### 1. `FIX_WWW_SSL_CERTIFICATE.sh`
Automated fix script that:
- Diagnoses current certificate
- Backs up configuration
- Regenerates certificate with both domains
- Verifies the fix
- Sets up auto-renewal

### 2. `DIAGNOSE_WWW_SSL_ISSUE.sh`
Diagnostic script that:
- Checks certificate details
- Verifies domain coverage
- Tests SSL connections
- Identifies the exact problem

### 3. `WWW_SSL_ISSUE_COMPLETE_GUIDE.md`
This comprehensive guide explaining:
- Root cause analysis
- Why code isn't the issue
- Step-by-step solutions
- Testing procedures
- Troubleshooting tips

---

## 🎓 Understanding SSL/TLS Layers

### Network Stack:

```
┌─────────────────────────────────────────┐
│  Layer 7: Application (HTTP/HTTPS)      │ ← Your middleware runs here
│  - Next.js middleware.ts                │
│  - URL redirects                        │
│  - CORS headers                         │
└────────────────┬────────────────────────┘
                 │
┌────────────────▼────────────────────────┐
│  Layer 5-6: Session/Presentation        │
│  - SSL/TLS Encryption                   │ ← SSL certificate validated here
│  - Certificate verification             │ ← Problem occurs at this layer
└────────────────┬────────────────────────┘
                 │
┌────────────────▼────────────────────────┐
│  Layer 4: Transport (TCP)               │
│  - Port 443                             │
│  - Connection establishment             │
└────────────────┬────────────────────────┘
                 │
┌────────────────▼────────────────────────┐
│  Layer 3: Network (IP)                  │
│  - Routing                              │
└────────────────┬────────────────────────┘
                 │
┌────────────────▼────────────────────────┐
│  Layer 1-2: Physical/Data Link          │
│  - Ethernet/WiFi                        │
└─────────────────────────────────────────┘
```

**Key Point:** SSL validation (Layer 5-6) happens BEFORE HTTP processing (Layer 7), so your application code never gets a chance to run when SSL fails.

---

## 🔐 SSL Certificate Best Practices

### 1. Always Include www Subdomain:

```bash
# ✅ Correct: Include both
--domains naukrimili.com,www.naukrimili.com

# ❌ Wrong: Only root domain
--domains naukrimili.com
```

### 2. Use Wildcard Certificates (Optional):

```bash
# Covers all subdomains: www, api, admin, etc.
--domains naukrimili.com,*.naukrimili.com

# Note: Requires DNS validation
```

### 3. Monitor Certificate Expiry:

```bash
# Check expiry date
sudo openssl x509 -in /etc/letsencrypt/live/naukrimili.com/fullchain.pem \
  -noout -enddate

# Set up monitoring alerts
```

### 4. Test After Any Changes:

```bash
# Always test both URLs
curl -I https://naukrimili.com
curl -I https://www.naukrimili.com

# Check SSL Labs rating
https://www.ssllabs.com/ssltest/
```

---

## 📞 Support & Additional Resources

### Let's Encrypt Documentation:
- **Certbot:** https://certbot.eff.org/
- **Documentation:** https://letsencrypt.org/docs/

### SSL Testing Tools:
- **SSL Labs:** https://www.ssllabs.com/ssltest/
- **SSL Checker:** https://www.sslshopper.com/ssl-checker.html
- **WhyNoPadlock:** https://www.whynopadlock.com/

### Nginx SSL Configuration:
- **Mozilla SSL Config:** https://ssl-config.mozilla.org/
- **Nginx SSL Guide:** https://nginx.org/en/docs/http/configuring_https_servers.html

---

## ✅ Summary Checklist

After applying the fix, verify:

- [ ] Certificate generated for both domains
- [ ] Nginx configuration includes both domains
- [ ] Nginx restarted successfully
- [ ] `https://naukrimili.com` works ✅
- [ ] `https://www.naukrimili.com` works ✅
- [ ] SSL Labs test shows Grade A
- [ ] Auto-renewal configured
- [ ] Browser cache cleared
- [ ] Both URLs tested in incognito mode
- [ ] Backup created

---

## 🎉 Conclusion

**The Issue:** SSL certificate didn't include `www.naukrimili.com` subdomain  
**The Fix:** Regenerate certificate with `--domains naukrimili.com,www.naukrimili.com`  
**The Result:** Both URLs work with valid SSL certificates  

**Your codebase is perfect!** No code changes needed. This was purely a server-side SSL certificate configuration issue.

---

**Last Updated:** December 2, 2025  
**Created For:** NaukriMili Job Portal  
**Issue Type:** SSL Certificate Configuration

