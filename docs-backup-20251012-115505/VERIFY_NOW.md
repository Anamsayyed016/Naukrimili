# 🚀 Run This Now!

## Copy and paste these commands in your SSH terminal:

### Option 1: Quick Check (10 seconds)
```bash
bash verify.sh
```

### Option 2: Full Detailed Report (30 seconds)
```bash
bash verify-oauth-gemini.sh
```

---

## What You Should See ✅

```
✅ Google OAuth: WORKING
✅ Gemini API: WORKING
✅ OAuth Endpoint: RESPONDING
✅ PM2 Status: ONLINE

📊 Result: 4/4 checks passed
🎉 SUCCESS! All systems are working correctly!
```

---

## If Something Fails ❌

### Quick Fix:
```bash
# Restart PM2
pm2 restart naukrimili

# Wait 10 seconds
sleep 10

# Try again
bash verify.sh
```

### Check Logs:
```bash
# View last 50 lines
pm2 logs naukrimili --lines 50

# Look for these messages:
# ✅ Google OAuth provider configured successfully
# ✅ Gemini client initialized
```

---

## Test in Browser 🌐

After verification passes, test these:

1. **Google OAuth:**
   - Go to: https://naukrimili.com/auth/signin
   - Click "Sign in with Google"
   - Should redirect to Google login

2. **Gemini AI:**
   - Go to: https://naukrimili.com/resumes
   - Upload a resume
   - Should see AI processing

---

## Need Help? 📞

Run this to get full diagnostic report:
```bash
bash verify-oauth-gemini.sh > report.txt
cat report.txt
```

Then share the `report.txt` file.

---

**Files Created for You:**
- ✅ `verify.sh` - Quick 10-second check
- ✅ `verify-oauth-gemini.sh` - Full detailed report
- ✅ `verify-oauth-gemini.ps1` - Windows PowerShell version
- ✅ `OAUTH_GEMINI_VERIFICATION_SUMMARY.md` - Complete guide
- ✅ `quick-verify.md` - Troubleshooting guide

**Next Step:** SSH into your server and run `bash verify.sh`

