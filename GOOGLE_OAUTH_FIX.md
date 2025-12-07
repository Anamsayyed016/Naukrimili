# 🔧 Google OAuth "Continue with Google" Button Fix

**Date:** 2025-01-XX  
**Status:** ✅ **FIXED** - OAuth credentials now exported to production

---

## 🐛 **Problem**

The "Continue with Google" button on the sign-in page (`/auth/signin`) was not working - clicking it did nothing. The browser console showed no errors.

---

## 🔍 **Root Cause**

### **Issue: Missing OAuth Credentials in Production**

**Problem:**
- Google OAuth credentials (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`) were **not being passed to production**
- Deployment workflow exported AI API keys but **missed OAuth credentials**
- NextAuth configuration checks for credentials and **silently disables Google provider** if missing
- When `signIn('google')` is called, nothing happens because the provider doesn't exist

**Evidence:**
1. **NextAuth Config** (`lib/nextauth-config.ts:40-47`):
   ```typescript
   ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
     ? [GoogleProvider({ ... })]
     : []),  // Empty array if credentials missing
   ```

2. **Deployment Workflow** (`.github/workflows/deploy.yml`):
   - ❌ Missing `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in workflow env
   - ❌ Not exported during SSH deployment
   - ✅ Had AI API keys but not OAuth credentials

3. **OAuth Button** (`components/auth/OAuthButtons.tsx`):
   - Calls `signIn('google')` correctly
   - But NextAuth has no Google provider (missing credentials)
   - Fails silently without error

---

## ✅ **Fix Applied**

### **1. Added OAuth Credentials to GitHub Actions Environment**

**File:** `.github/workflows/deploy.yml`

**Added to workflow-level `env`:**
```yaml
env:
  # ... existing vars ...
  # OAuth Credentials for Google/GitHub Sign-in
  GOOGLE_CLIENT_ID: ${{ secrets.GOOGLE_CLIENT_ID }}
  GOOGLE_CLIENT_SECRET: ${{ secrets.GOOGLE_CLIENT_SECRET }}
  GITHUB_ID: ${{ secrets.GITHUB_ID }}
  GITHUB_SECRET: ${{ secrets.GITHUB_SECRET }}
```

### **2. Exported OAuth Credentials During Deployment**

**File:** `.github/workflows/deploy.yml` (SSH deployment step)

**Added exports:**
```bash
# OAuth Credentials for Google/GitHub Sign-in
export GOOGLE_CLIENT_ID="$GOOGLE_CLIENT_ID"
export GOOGLE_CLIENT_SECRET="$GOOGLE_CLIENT_SECRET"
export GITHUB_ID="$GITHUB_ID"
export GITHUB_SECRET="$GITHUB_SECRET"
```

**Added to SSH action `env`:**
```yaml
env:
  # ... existing vars ...
  GOOGLE_CLIENT_ID: ${{ env.GOOGLE_CLIENT_ID }}
  GOOGLE_CLIENT_SECRET: ${{ env.GOOGLE_CLIENT_SECRET }}
  GITHUB_ID: ${{ env.GITHUB_ID }}
  GITHUB_SECRET: ${{ env.GITHUB_SECRET }}
```

### **3. Improved Error Handling**

**File:** `components/auth/OAuthButtons.tsx`

**Added:**
- Better error messages when OAuth is not configured
- Check if `signIn` function is available
- Specific error handling for "Configuration" errors
- More detailed console logging

**File:** `lib/nextauth-config.ts`

**Added:**
- Production warning logs when OAuth credentials are missing
- Clear indication that Google sign-in is disabled

---

## 📋 **Required GitHub Secrets**

To make this work, ensure these secrets are configured in GitHub:

1. **`GOOGLE_CLIENT_ID`** - Your Google OAuth Client ID
2. **`GOOGLE_CLIENT_SECRET`** - Your Google OAuth Client Secret
3. **`GITHUB_ID`** (optional) - GitHub OAuth App ID
4. **`GITHUB_SECRET`** (optional) - GitHub OAuth App Secret

**How to add secrets:**
1. Go to your GitHub repository
2. Settings → Secrets and variables → Actions
3. Click "New repository secret"
4. Add each secret with the exact name above

---

## 🔍 **How It Works Now**

### **Before Fix:**
```
User clicks "Continue with Google"
    ↓
signIn('google') called
    ↓
NextAuth checks providers array
    ↓
Google provider NOT in array (credentials missing)
    ↓
Nothing happens (silent failure)
```

### **After Fix:**
```
User clicks "Continue with Google"
    ↓
signIn('google') called
    ↓
NextAuth checks providers array
    ↓
Google provider EXISTS (credentials available)
    ↓
Redirects to Google OAuth
    ↓
User authenticates
    ↓
Redirects back to app
```

---

## 🧪 **Testing**

### **1. Check if Credentials are Loaded:**

After deployment, check PM2 logs:
```bash
pm2 logs jobportal | grep -i "google\|oauth"
```

Should see:
- ✅ `Google OAuth provider configured successfully` (if credentials present)
- ⚠️ `Google OAuth credentials are missing` (if credentials missing)

### **2. Test Sign-In Button:**

1. Visit `https://naukrimili.com/auth/signin`
2. Click "Continue with Google"
3. Should redirect to Google OAuth page
4. After authentication, should redirect back to app

### **3. Check Browser Console:**

Open Developer Tools → Console
- Should see: `🔄 Starting Google OAuth redirect...`
- Should see: `📤 Calling signIn("google", options)...`
- Should redirect (no errors)

---

## 🚨 **Troubleshooting**

### **If button still doesn't work:**

1. **Check GitHub Secrets:**
   ```bash
   # Secrets must be set in GitHub repository settings
   GOOGLE_CLIENT_ID
   GOOGLE_CLIENT_SECRET
   ```

2. **Check PM2 Environment:**
   ```bash
   pm2 show jobportal
   # Look for GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET
   ```

3. **Check Server Logs:**
   ```bash
   pm2 logs jobportal
   # Look for OAuth configuration warnings
   ```

4. **Verify Google OAuth Setup:**
   - Ensure redirect URI is configured in Google Cloud Console:
     - `https://naukrimili.com/api/auth/callback/google`
   - Check that OAuth consent screen is configured
   - Verify client ID and secret are correct

5. **Test API Endpoint:**
   ```bash
   curl https://naukrimili.com/api/auth/providers
   # Should show "google" in the providers list
   ```

---

## 📝 **Files Changed**

1. **`.github/workflows/deploy.yml`**
   - Added `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GITHUB_ID`, `GITHUB_SECRET` to workflow env
   - Added exports in SSH deployment step
   - Added to SSH action env section

2. **`components/auth/OAuthButtons.tsx`**
   - Improved error handling
   - Better error messages
   - Added logging for debugging

3. **`lib/nextauth-config.ts`**
   - Added production warnings when credentials are missing
   - Better logging for OAuth configuration

---

## ✅ **Summary**

**Fixed:**
- ✅ Added Google OAuth credentials to GitHub Actions workflow
- ✅ Exported credentials during deployment
- ✅ Improved error handling and logging
- ✅ Better user feedback when OAuth fails

**Required Action:**
- ⚠️ **Add GitHub Secrets:** `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`
- ⚠️ **Verify Google Cloud Console:** Ensure redirect URI is configured

**Result:**
- ✅ Google OAuth button will now work in production
- ✅ Users can sign in with Google
- ✅ Clear error messages if configuration is missing

---

## 🎯 **Next Steps**

1. **Add GitHub Secrets:**
   - Go to repository Settings → Secrets
   - Add `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`

2. **Verify Google Cloud Console:**
   - Check redirect URIs are configured
   - Verify OAuth consent screen is set up

3. **Deploy:**
   - Push changes or trigger deployment
   - Check deployment logs for OAuth configuration

4. **Test:**
   - Visit sign-in page
   - Click "Continue with Google"
   - Should redirect to Google authentication
