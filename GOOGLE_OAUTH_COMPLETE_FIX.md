# 🔧 Google OAuth Complete Fix Guide

**Your Credentials:**
- Client ID: `493126917457-h7vj7vlrjhke57pbrang2b6pc0b0q88j.apps.googleusercontent.com`
- Client Secret: `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--`

---

## ✅ **Fixes Applied**

### **1. Fixed NextAuth Route Handler** ✅
- Route handler now uses existing handler (no duplicate)

### **2. Added OAuth Authorization Parameters** ✅
- Added `prompt: "consent"`
- Added `access_type: "offline"`
- Added `response_type: "code"`

### **3. Improved Error Handling** ✅
- Better error messages in OAuth button
- Manual redirect handling

### **4. Created Debug Endpoint** ✅
- New endpoint: `/api/auth/providers`
- Shows which providers are configured

---

## 🔑 **Add to GitHub Secrets**

1. Go to: **Repository → Settings → Secrets and variables → Actions**
2. Click **"New repository secret"**

**Secret 1:**
- Name: `GOOGLE_CLIENT_ID`
- Value: `493126917457-h7vj7vlrjhke57pbrang2b6pc0b0q88j.apps.googleusercontent.com`

**Secret 2:**
- Name: `GOOGLE_CLIENT_SECRET`
- Value: `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--`

---

## 🔍 **Critical Checks**

### **1. Google Cloud Console - Redirect URI**

**MUST be configured exactly:**
```
https://naukrimili.com/api/auth/callback/google
```

**Steps:**
1. Go to: https://console.cloud.google.com/apis/credentials
2. Click on your OAuth 2.0 Client ID (the one starting with `493126917457...`)
3. Scroll to **"Authorized redirect URIs"**
4. Click **"+ ADD URI"**
5. Add: `https://naukrimili.com/api/auth/callback/google`
6. **Save**
7. Wait 5 minutes for Google to propagate

### **2. OAuth Consent Screen**

**Check:**
1. Go to: https://console.cloud.google.com/apis/credentials/consent
2. Publishing status should be:
   - **"In production"** ✅ (recommended)
   - OR **"Testing"** with your email in test users

---

## 🧪 **Testing Steps**

### **Test 1: Check Providers Endpoint**

Visit in browser:
```
https://naukrimili.com/api/auth/providers
```

Should show:
```json
{
  "success": true,
  "providers": {
    "google": {
      "id": "google",
      "name": "Google",
      "configured": true
    }
  }
}
```

### **Test 2: Check Server Logs**

On server, run:
```bash
pm2 logs naukrimili --lines 100 | grep -i "google\|oauth"
```

Look for:
- ✅ `Google OAuth provider configured successfully`
- ❌ `Google OAuth credentials are missing` (if credentials not loaded)

### **Test 3: Check Browser Console**

1. Visit: `https://naukrimili.com/auth/signin`
2. Open Developer Tools (F12) → Console tab
3. Click "Continue with Google"
4. Check console for errors

---

## 🚨 **Common Issues & Solutions**

### **Issue: "Configuration" Error**

**Cause:** Google provider not in NextAuth providers array
**Fix:** Check if credentials are loaded on server

### **Issue: Redirect URI Mismatch**

**Cause:** Redirect URI not configured in Google Cloud Console
**Fix:** Add exact URI: `https://naukrimili.com/api/auth/callback/google`

### **Issue: Consent Screen Error**

**Cause:** App is in "Testing" mode without test users
**Fix:** Either publish app OR add your email to test users

### **Issue: Button Does Nothing**

**Cause:** 
- Credentials not loaded on server
- NextAuth provider not configured
- JavaScript error in browser

**Fix:** 
- Check server logs
- Check browser console
- Verify credentials in PM2 environment

---

## 📋 **Complete Verification Checklist**

- [ ] Credentials added to GitHub Secrets
- [ ] Deployment workflow exports credentials (already done)
- [ ] Redirect URI added to Google Cloud Console
- [ ] OAuth Consent Screen configured (Published or Testing with your email)
- [ ] Credentials loaded on server (check PM2)
- [ ] `/api/auth/providers` endpoint shows Google as configured
- [ ] Server logs show "Google OAuth provider configured"
- [ ] Browser console shows no errors when clicking button

---

## 🔧 **Server Commands to Run**

After deploying, on your server:

```bash
# 1. Check if credentials are loaded
pm2 show naukrimili | grep -E "GOOGLE_CLIENT|NEXTAUTH"

# 2. Check server logs
pm2 logs naukrimili --lines 50 | grep -i "google\|oauth"

# 3. Restart if needed (to reload env vars)
pm2 restart naukrimili
```

---

## ✅ **Summary**

**Fixes Applied:**
- ✅ Fixed NextAuth route handler
- ✅ Added OAuth authorization parameters  
- ✅ Improved error handling
- ✅ Created debug endpoint

**Your Credentials (paste into GitHub Secrets):**
- `GOOGLE_CLIENT_ID`: `493126917457-h7vj7vlrjhke57pbrang2b6pc0b0q88j.apps.googleusercontent.com`
- `GOOGLE_CLIENT_SECRET`: `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--`

**Critical Configuration:**
- Redirect URI: `https://naukrimili.com/api/auth/callback/google` (must be in Google Cloud Console)

**Next Steps:**
1. Add secrets to GitHub
2. Verify redirect URI in Google Cloud Console
3. Deploy
4. Test with debug endpoint
5. Test the button
