# 🎯 Google OAuth & Gemini API Verification

## ⚡ Quick Start (Copy & Paste)

```bash
# SSH into your server, then run:
bash verify.sh
```

**Expected output:**
```
✅ Google OAuth: WORKING
✅ Gemini API: WORKING
✅ OAuth Endpoint: RESPONDING
✅ PM2 Status: ONLINE
```

---

## 📁 Files I Created for You

| File | Purpose | When to Use |
|------|---------|-------------|
| 🟢 **verify.sh** | Quick 10-sec check | Run first |
| 🟢 **verify-oauth-gemini.sh** | Detailed report | If quick check fails |
| 🟢 **verify-oauth-gemini.ps1** | Windows version | Testing from Windows |
| 📘 **VERIFY_NOW.md** | Start here guide | First time setup |
| 📘 **OAUTH_GEMINI_VERIFICATION_SUMMARY.md** | Complete reference | Deep dive |
| 📘 **quick-verify.md** | Troubleshooting | When fixing issues |
| 📘 **VERIFICATION_FILES_CREATED.md** | File catalog | Understanding what's what |

---

## 🔄 Verification Workflow

```
1. Upload scripts to server
   ↓
2. Make executable: chmod +x verify.sh
   ↓
3. Run: bash verify.sh
   ↓
4. Check results:
   → All Pass (4/4) ✅ → Test in browser
   → Some Fail (0-3) ❌ → Run detailed report
   ↓
5. If needed: bash verify-oauth-gemini.sh
   ↓
6. Fix issues and re-run
```

---

## ✅ What We're Checking

| Check | What It Does | Why It Matters |
|-------|--------------|----------------|
| **Google OAuth** | Looks for "✅ Google OAuth provider configured" in logs | Gmail sign-in button works |
| **Gemini API** | Looks for "✅ Gemini client initialized" in logs | AI resume parsing works |
| **OAuth Endpoint** | Tests `/api/auth/providers` API | Authentication system running |
| **PM2 Status** | Checks if server is online | Application is accessible |

---

## 🎯 What You Already Did

✅ Added Google OAuth credentials to `.env`:
```bash
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

✅ Added Gemini API key to `.env`:
```bash
GEMINI_API_KEY=your-gemini-api-key
```

✅ Restarted PM2:
```bash
pm2 delete naukrimili
pm2 start ecosystem.config.cjs
```

---

## 🧪 Testing Features

### Test Google OAuth:
1. Go to: https://naukrimili.com/auth/signin
2. Click "Sign in with Google"
3. Should redirect to Google login
4. After login → role selection → dashboard

### Test Gemini AI:
1. Log in to your account
2. Go to: https://naukrimili.com/resumes
3. Upload a resume (PDF/DOC/DOCX)
4. Should see:
   - Upload progress
   - AI processing
   - Auto-filled form
   - ATS score

---

## 🔧 Quick Troubleshooting

### Problem: OAuth check fails
```bash
cat .env | grep GOOGLE
pm2 restart naukrimili
sleep 10
bash verify.sh
```

### Problem: Gemini check fails
```bash
cat .env | grep GEMINI
pm2 restart naukrimili
sleep 10
bash verify.sh
```

### Problem: Server offline
```bash
pm2 status
pm2 logs naukrimili --err
pm2 restart naukrimili
```

### Problem: API not responding
```bash
pm2 logs naukrimili --lines 50
curl http://localhost:3000/api/auth/providers
```

---

## 📊 Understanding the Logs

### Good Logs (Success):
```
🔧 NextAuth Configuration:
   NEXTAUTH_URL: https://naukrimili.com
   NEXTAUTH_SECRET: ✅ Set

✅ Google OAuth provider configured successfully
✅ Gemini client initialized
```

### Bad Logs (Failure):
```
⚠️ Google OAuth credentials not properly configured
   GOOGLE_CLIENT_ID: Missing
   GOOGLE_CLIENT_SECRET: Missing

⚠️ GEMINI_API_KEY not found
```

---

## 📞 Get Help

### Generate full diagnostic report:
```bash
bash verify-oauth-gemini.sh > report.txt
cat report.txt
```

### Export logs:
```bash
pm2 logs naukrimili --lines 500 > logs.txt
grep -E "Google|Gemini|OAuth|Error" logs.txt
```

### Check environment:
```bash
echo "=== Environment Variables ==="
grep -E "GOOGLE|GEMINI" .env
echo "=== PM2 Status ==="
pm2 status
echo "=== Recent Logs ==="
pm2 logs naukrimili --lines 20 --nostream
```

---

## 🎯 Success Checklist

- [ ] Scripts uploaded to server
- [ ] Scripts made executable (`chmod +x`)
- [ ] `verify.sh` runs without errors
- [ ] All 4 checks pass (4/4)
- [ ] Google sign-in button appears on website
- [ ] Google login redirects correctly
- [ ] Resume upload page loads
- [ ] AI processes uploaded resumes

---

## 📚 Documentation Links

- **Quick Start**: [VERIFY_NOW.md](./VERIFY_NOW.md)
- **Complete Guide**: [OAUTH_GEMINI_VERIFICATION_SUMMARY.md](./OAUTH_GEMINI_VERIFICATION_SUMMARY.md)
- **Troubleshooting**: [quick-verify.md](./quick-verify.md)
- **File Catalog**: [VERIFICATION_FILES_CREATED.md](./VERIFICATION_FILES_CREATED.md)

---

## 🔐 Security Notes

✅ Scripts are read-only (don't modify anything)  
✅ No credentials are displayed  
✅ No external API calls  
✅ Safe to run multiple times  

---

## 🚀 Next Steps

1. **Now**: Upload scripts to server
2. **Next**: Run `bash verify.sh`
3. **Then**: Test features in browser
4. **Finally**: Monitor logs for issues

---

**Created**: October 11, 2025  
**Status**: ✅ Ready for Verification  
**Action**: Run `bash verify.sh` on server

🎉 Good luck with your verification!

