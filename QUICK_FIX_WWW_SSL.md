# ⚡ Quick Fix: WWW SSL Certificate Issue

## 🎯 Problem
`www.naukrimili.com` shows `ERR_SSL_PROTOCOL_ERROR` but `https://naukrimili.com` works fine.

## 🔍 Root Cause
SSL certificate only covers `naukrimili.com`, not `www.naukrimili.com`.

## ✅ Solution (Choose One)

### Option 1: Automated Fix (RECOMMENDED) ⭐

```bash
# SSH into your server
ssh your-user@your-server

# Navigate to project directory
cd /path/to/jobportal

# Run the diagnostic (optional)
bash DIAGNOSE_WWW_SSL_ISSUE.sh

# Apply the fix
bash FIX_WWW_SSL_CERTIFICATE.sh
```

**Done!** The script handles everything automatically.

---

### Option 2: Manual Fix (3 Commands)

```bash
# 1. Stop Nginx
sudo systemctl stop nginx

# 2. Regenerate certificate with BOTH domains
sudo certbot certonly --standalone \
  --domains naukrimili.com,www.naukrimili.com \
  --expand --force-renewal

# 3. Start Nginx
sudo systemctl start nginx
```

**Done!** Certificate now includes both domains.

---

### Option 3: Using Nginx Plugin (Easiest)

```bash
# One command does it all
sudo certbot --nginx -d naukrimili.com -d www.naukrimili.com --expand
```

**Done!** Certbot handles Nginx configuration automatically.

---

## 🧪 Verify Fix

```bash
# Check certificate includes both domains
sudo certbot certificates

# Should show:
# Domains: naukrimili.com www.naukrimili.com
```

## 🌐 Test in Browser

1. **Clear browser cache:** `Ctrl + Shift + Delete`
2. **Visit:** `https://www.naukrimili.com`
3. **Should work!** ✅

## 📝 Important Notes

- ✅ **Your code is correct** - No code changes needed
- ✅ **This is a server configuration issue** - SSL certificate only
- ✅ **Takes 5 minutes to fix**
- ✅ **Auto-renewal will be set up** for future
- ⏰ **Wait 5-10 minutes** after fix for DNS propagation
- 🧹 **Clear browser cache** before testing

## ❓ Still Not Working?

```bash
# Check Nginx is running
sudo systemctl status nginx

# Check certificate details
sudo openssl x509 -in /etc/letsencrypt/live/naukrimili.com/fullchain.pem \
  -text -noout | grep -A 1 "Subject Alternative Name"

# Restart Nginx
sudo systemctl restart nginx

# Clear browser SSL cache
# Chrome: chrome://net-internals/#sockets → "Flush socket pools"
```

## 📚 Full Documentation

For detailed explanation, see: `WWW_SSL_ISSUE_COMPLETE_GUIDE.md`

---

**Time to Fix:** 5 minutes  
**Difficulty:** Easy  
**Requires:** Root/sudo access to server  
**Downtime:** ~30 seconds (during certificate generation)

