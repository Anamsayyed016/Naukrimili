# 🔐 GitHub Secrets Setup Guide

**Date:** 2025-01-XX  
**Purpose:** Secure credential management for production deployment

---

## ✅ **Yes, Store Secrets in GitHub Secrets**

GitHub Secrets is the **secure and recommended** way to store sensitive credentials like OAuth client secrets. Here's why:

### **Security Features:**
- ✅ **Encrypted at rest** - Secrets are encrypted in GitHub's secure storage
- ✅ **Encrypted in transit** - Secrets are only transmitted over HTTPS
- ✅ **Access-controlled** - Only accessible during workflow runs
- ✅ **Not visible** - Repository collaborators cannot see secret values
- ✅ **Not logged** - Secrets are masked in workflow logs
- ✅ **Industry standard** - Used by millions of projects worldwide

---

## 📋 **Secrets to Add**

### **Required for Google OAuth:**

| Secret Name | Description | Where to Get |
|------------|-------------|--------------|
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID | Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Client Secret | Google Cloud Console |

### **Optional (for GitHub OAuth):**

| Secret Name | Description | Where to Get |
|------------|-------------|--------------|
| `GITHUB_ID` | GitHub OAuth App Client ID | GitHub Developer Settings |
| `GITHUB_SECRET` | GitHub OAuth App Client Secret | GitHub Developer Settings |

---

## 🔧 **How to Add Secrets**

### **Step 1: Access GitHub Secrets**

1. Go to your GitHub repository
2. Click **Settings** (top menu)
3. In left sidebar, click **Secrets and variables** → **Actions**
4. Click **New repository secret** button

### **Step 2: Add Each Secret**

For each secret:

1. **Name:** Enter exact name (e.g., `GOOGLE_CLIENT_ID`)
2. **Secret:** Paste the value (e.g., your Google OAuth Client ID)
3. Click **Add secret**

### **Step 3: Verify Secrets**

After adding, you should see:
- ✅ `GOOGLE_CLIENT_ID`
- ✅ `GOOGLE_CLIENT_SECRET`
- ✅ `GITHUB_ID` (if using GitHub OAuth)
- ✅ `GITHUB_SECRET` (if using GitHub OAuth)

**Note:** You can only see secret **names**, not values (this is by design for security).

---

## 🔍 **Where Secrets Are Used**

### **1. Deployment Workflow** (`.github/workflows/deploy.yml`)

Secrets are referenced in the workflow:
```yaml
env:
  GOOGLE_CLIENT_ID: ${{ secrets.GOOGLE_CLIENT_ID }}
  GOOGLE_CLIENT_SECRET: ${{ secrets.GOOGLE_CLIENT_SECRET }}
```

### **2. Exported During Deployment**

Secrets are exported as environment variables:
```bash
export GOOGLE_CLIENT_ID="$GOOGLE_CLIENT_ID"
export GOOGLE_CLIENT_SECRET="$GOOGLE_CLIENT_SECRET"
```

### **3. Loaded by PM2**

PM2 loads environment variables from `ecosystem.config.cjs`:
```javascript
GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
```

---

## 🔒 **Security Best Practices**

### **✅ DO:**

1. **Store all secrets in GitHub Secrets**
   - OAuth credentials
   - Database passwords
   - API keys
   - Private keys

2. **Use descriptive secret names**
   - `GOOGLE_CLIENT_ID` (not `GOOGLE_ID` or `GID`)
   - Match environment variable names

3. **Rotate secrets regularly**
   - Change passwords/keys every 90 days
   - Update GitHub Secrets immediately after rotation

4. **Use different secrets per environment**
   - Development secrets (for testing)
   - Production secrets (for live site)

### **❌ DON'T:**

1. **Don't hardcode secrets in code**
   ```javascript
   // ❌ BAD
   const clientSecret = "GOCSPX-abc123...";
   
   // ✅ GOOD
   const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
   ```

2. **Don't commit secrets to git**
   - Never commit `.env` files with real secrets
   - Never commit `ecosystem.config.cjs` with hardcoded secrets

3. **Don't share secrets in logs**
   - Secrets are automatically masked in GitHub Actions logs
   - Avoid logging secrets in application code

4. **Don't expose secrets in client-side code**
   - Secrets should only be in server-side code
   - Client IDs are okay (they're public), but secrets are not

---

## 📊 **Current Status**

### **✅ Already Configured:**

- ✅ Workflow references secrets correctly
- ✅ `ecosystem.config.cjs` uses `process.env` (not hardcoded)
- ✅ Secrets are exported during deployment

### **⚠️ Action Required:**

1. **Add secrets to GitHub:**
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`

2. **Get values from:**
   - Google Cloud Console → APIs & Services → Credentials
   - Look for "OAuth 2.0 Client IDs"

---

## 🧪 **Testing**

After adding secrets, test by:

1. **Trigger a deployment:**
   - Push code or manually trigger workflow
   - Watch deployment logs

2. **Check PM2 environment:**
   ```bash
   pm2 show jobportal
   # Look for GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET
   ```

3. **Test Google OAuth:**
   - Visit `https://naukrimili.com/auth/signin`
   - Click "Continue with Google"
   - Should redirect to Google authentication

---

## 🔍 **Troubleshooting**

### **Secret Not Found:**

**Error:** `Warning: Secret 'GOOGLE_CLIENT_ID' is not set`

**Solution:**
1. Check secret name is exactly correct (case-sensitive)
2. Verify secret exists in GitHub Settings → Secrets
3. Re-run workflow after adding secret

### **Secret Not Working:**

**Error:** Google OAuth still not working after adding secrets

**Solution:**
1. Check secret value is correct (no extra spaces)
2. Verify Google Cloud Console redirect URI matches:
   - `https://naukrimili.com/api/auth/callback/google`
3. Check PM2 logs: `pm2 logs jobportal | grep -i google`

---

## ✅ **Summary**

**Answer: YES, add client secrets to GitHub Secrets!**

- ✅ Secure and encrypted
- ✅ Standard practice
- ✅ Workflow already configured
- ✅ Just need to add the actual values

**Next Steps:**
1. Get your Google OAuth credentials from Google Cloud Console
2. Add them to GitHub Secrets
3. Deploy (workflow will automatically use them)

---

## 📚 **References**

- [GitHub Secrets Documentation](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [Google OAuth Setup](https://console.cloud.google.com/apis/credentials)
- [NextAuth.js Environment Variables](https://next-auth.js.org/configuration/options)
