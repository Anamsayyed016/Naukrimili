# 🔐 GitHub Secrets Setup Guide

## ❌ **Current Error:**
```
❌ ERROR: DATABASE_URL not set!
❌ ERROR: NEXTAUTH_SECRET not set!
```

## ✅ **Solution: Add Required Secrets to GitHub**

### **Step 1: Navigate to Secrets**
1. Go to your GitHub repository
2. Click **Settings** (top menu)
3. Click **Secrets and variables** → **Actions** (left sidebar)
4. Click **New repository secret**

### **Step 2: Add Required Secrets**

Add these secrets **one by one**:

#### **🔴 CRITICAL (Required for deployment):**

1. **`DATABASE_URL`**
   - **Value:** Your PostgreSQL connection string
   - **Format:** `postgresql://username:password@host:5432/database?connection_limit=10&pool_timeout=20&connect_timeout=10&socket_timeout=30`
   - **Example:** `postgresql://user:pass@localhost:5432/jobportal?connection_limit=10&pool_timeout=20`

2. **`NEXTAUTH_SECRET`**
   - **Value:** A random secret string (at least 32 characters)
   - **Generate:** Run `openssl rand -base64 32` or use any secure random string generator
   - **Example:** `naukrimili-secret-key-2024-production-deployment-random-string-here`

#### **🟡 IMPORTANT (Required for AI features):**

3. **`OPENAI_API_KEY`**
   - **Value:** Your OpenAI API key
   - **Format:** Starts with `sk-`
   - **Get from:** https://platform.openai.com/api-keys

4. **`GEMINI_API_KEY`**
   - **Value:** Your Google Gemini API key
   - **Format:** Starts with `AIzaSy`
   - **Get from:** https://ai.google.dev/

5. **`GROQ_API_KEY`**
   - **Value:** Your Groq API key
   - **Format:** Starts with `gsk_`
   - **Get from:** https://console.groq.com/keys

6. **`GOOGLE_CLOUD_OCR_API_KEY`**
   - **Value:** Your Google Cloud API key
   - **Format:** Starts with `AIzaSy`
   - **Get from:** https://console.cloud.google.com/apis/credentials

7. **`GOOGLE_CLOUD_API_KEY`**
   - **Value:** Your Google Cloud API key (can be same as OCR key)
   - **Format:** Starts with `AIzaSy`

8. **`AFFINDA_API_KEY`**
   - **Value:** Your Affinda API key
   - **Format:** Starts with `aff_`
   - **Get from:** https://affinda.com/

9. **`AFFINDA_WORKSPACE_ID`**
   - **Value:** Your Affinda workspace ID
   - **Format:** Alphanumeric string
   - **Get from:** Affinda dashboard

#### **🟢 OPTIONAL (For SSH deployment):**

10. **`HOST`** - Your server IP/hostname
11. **`SSH_USER`** - SSH username
12. **`SSH_KEY`** - SSH private key
13. **`SSH_PORT`** - SSH port (usually 22)

### **Step 3: Verify Secrets**

After adding all secrets, verify they're set:

1. Go to **Settings** → **Secrets and variables** → **Actions**
2. You should see all secrets listed
3. **Important:** Secret names are **case-sensitive** - must match exactly

### **Step 4: Test Deployment**

1. Push to `main` branch or manually trigger workflow
2. Check workflow logs
3. Look for: `✅ Required secrets are set`

## 🔍 **Troubleshooting**

### **If secrets are still not working:**

1. **Check secret names:**
   - Must be exactly: `DATABASE_URL` (not `database_url` or `Database_Url`)
   - Must be exactly: `NEXTAUTH_SECRET` (not `nextauth_secret`)

2. **Check secret values:**
   - No extra spaces before/after
   - No quotes in the secret value (GitHub adds them automatically)
   - Full connection string for DATABASE_URL

3. **Verify workflow file:**
   - Check `.github/workflows/deploy.yml`
   - Ensure it references `${{ secrets.DATABASE_URL }}` (not `${{ env.DATABASE_URL }}`)

4. **Check workflow logs:**
   - Look for the validation step output
   - Should show: `✅ Required secrets are set`

### **Common Mistakes:**

❌ **Wrong:**
```yaml
env:
  DATABASE_URL: ${{ env.DATABASE_URL }}  # Wrong - env doesn't have it
```

✅ **Correct:**
```yaml
env:
  DATABASE_URL: ${{ secrets.DATABASE_URL }}  # Correct - from secrets
```

## 📋 **Quick Checklist**

- [ ] `DATABASE_URL` secret added
- [ ] `NEXTAUTH_SECRET` secret added
- [ ] `OPENAI_API_KEY` secret added (optional but recommended)
- [ ] `GEMINI_API_KEY` secret added (optional but recommended)
- [ ] `GROQ_API_KEY` secret added (optional but recommended)
- [ ] All secret names match exactly (case-sensitive)
- [ ] Workflow file uses `${{ secrets.XXX }}` not `${{ env.XXX }}`
- [ ] Pushed changes to trigger deployment

## 🚀 **After Setup**

Once secrets are added:

1. **Trigger deployment:**
   ```bash
   git commit --allow-empty -m "Trigger deployment"
   git push origin main
   ```

2. **Monitor workflow:**
   - Go to **Actions** tab
   - Watch the deployment workflow
   - Check for `✅ Required secrets are set` message

3. **Verify on server:**
   ```bash
   ssh user@server
   cd /var/www/naukrimili
   cat .env | grep -E "DATABASE_URL|NEXTAUTH_SECRET"
   ```

---

**Need Help?** Check the workflow logs for specific error messages. The validation step will tell you exactly which secrets are missing.

