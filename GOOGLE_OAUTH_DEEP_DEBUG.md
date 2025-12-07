# 🔍 Google OAuth Deep Debug - Complete Analysis

**Credentials Provided:**
- Client ID: `493126917457-h7vj7vlrjhke57pbrang2b6pc0b0q88j.apps.googleusercontent.com`
- Client Secret: `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--`

**Status:** ❌ **Still Not Working** - Need to debug deeply

---

## 🔍 **Issues Found**

### **1. NextAuth Route Handler Issue** ✅ FIXED

**Problem:**
- Route handler was creating a **duplicate** NextAuth handler
- Config file creates handler → Route handler creates another handler
- This causes NextAuth to initialize twice

**Fix Applied:**
```typescript
// Before (WRONG):
import { authOptions } from "@/lib/nextauth-config"
const handler = NextAuth(authOptions)  // Duplicate!

// After (CORRECT):
import { handler } from "@/lib/nextauth-config"  // Use existing handler
```

---

### **2. Missing OAuth Authorization Parameters** ✅ FIXED

**Problem:**
- GoogleProvider didn't have explicit authorization params
- Missing `prompt`, `access_type`, `response_type`

**Fix Applied:**
```typescript
GoogleProvider({
  clientId: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  authorization: {
    params: {
      prompt: "consent",
      access_type: "offline",
      response_type: "code"
    }
  }
})
```

---

### **3. OAuth Button Redirect Logic** ✅ FIXED

**Problem:**
- Button uses `redirect: true` which might not work correctly
- No proper error handling when redirect fails

**Fix Applied:**
- Changed to `redirect: false` first to check result
- Manual redirect handling
- Better error messages

---

## 🚨 **Remaining Potential Issues**

### **Issue 1: Credentials Not Loaded on Server**

**Check:**
```bash
# On server, check if credentials are in PM2 environment
pm2 show naukrimili | grep -i "GOOGLE_CLIENT"
```

**If missing:**
- Credentials need to be exported during deployment
- Or set in `.env` file on server
- Or set in `ecosystem.config.cjs`

### **Issue 2: Google Cloud Console Redirect URI**

**CRITICAL:** Must match exactly:
```
https://naukrimili.com/api/auth/callback/google
```

**Check in Google Cloud Console:**
1. Go to: https://console.cloud.google.com/apis/credentials
2. Click on your OAuth 2.0 Client ID
3. Under "Authorized redirect URIs", ensure:
   - `https://naukrimili.com/api/auth/callback/google` ✅

**Note:** 
- Must be **exact match** (case-sensitive, no trailing slash)
- Must be **HTTPS** (not HTTP)
- Wait 5 minutes after adding for Google to propagate

### **Issue 3: OAuth Consent Screen**

**Check:**
1. Go to: https://console.cloud.google.com/apis/credentials/consent
2. Publishing status should be:
   - **"In production"** (recommended)
   - OR **"Testing"** with your email added as test user

**If "Testing":**
- Only test users can sign in
- Add your email to test users list

### **Issue 4: NEXTAUTH_URL Mismatch**

**Check:**
```bash
# On server
echo $NEXTAUTH_URL
# Should be: https://naukrimili.com
```

**If wrong:**
- Google OAuth will reject the callback
- Must match exactly with redirect URI

---

## ✅ **Fixes Applied**

1. ✅ Fixed NextAuth route handler (removed duplicate)
2. ✅ Added OAuth authorization parameters
3. ✅ Improved OAuth button error handling
4. ✅ Added better logging for debugging

---

## 🔧 **Next Steps to Debug**

### **Step 1: Check Server Environment**

Run on server:
```bash
pm2 show naukrimili | grep -E "GOOGLE|NEXTAUTH"
```

### **Step 2: Check Server Logs**

```bash
pm2 logs naukrimili --lines 50 | grep -i "google\|oauth\|auth"
```

Look for:
- `⚠️ Google OAuth credentials are missing` (credentials not loaded)
- `✅ Google OAuth provider configured` (credentials loaded)
- Any error messages

### **Step 3: Test API Endpoint**

```bash
curl https://naukrimili.com/api/auth/providers
```

Should return JSON with `google` provider if configured correctly.

### **Step 4: Check Browser Console**

1. Visit `https://naukrimili.com/auth/signin`
2. Open Developer Tools → Console
3. Click "Continue with Google"
4. Check console for errors

### **Step 5: Verify Google Cloud Console**

1. Redirect URI: `https://naukrimili.com/api/auth/callback/google`
2. OAuth Consent Screen: Published OR Testing with your email
3. Client ID matches: `493126917457-h7vj7vlrjhke57pbrang2b6pc0b0q88j...`

---

## 📋 **Complete Checklist**

- [ ] Credentials added to GitHub Secrets
- [ ] Credentials exported in deployment workflow
- [ ] Credentials loaded on server (check PM2)
- [ ] Redirect URI added to Google Cloud Console
- [ ] OAuth Consent Screen configured
- [ ] NEXTAUTH_URL set correctly on server
- [ ] Server logs checked for errors
- [ ] Browser console checked for errors
- [ ] API endpoint tested (`/api/auth/providers`)

---

## 🔑 **Your Credentials (for GitHub Secrets)**

**Secret 1:**
- Name: `GOOGLE_CLIENT_ID`
- Value: `493126917457-h7vj7vlrjhke57pbrang2b6pc0b0q88j.apps.googleusercontent.com`

**Secret 2:**
- Name: `GOOGLE_CLIENT_SECRET`
- Value: `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--`

---

## 🚀 **After Adding Secrets**

1. **Deploy again** (workflow will export credentials)
2. **Check PM2 environment** on server
3. **Restart PM2** if credentials not loaded: `pm2 restart naukrimili`
4. **Test** the button again
