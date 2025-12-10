# 🔐 DATABASE_URL GitHub Secret Setup Guide

## ⚠️ CRITICAL: Your deployment is failing because DATABASE_URL is not set in GitHub Secrets

## 📋 Step-by-Step Instructions

### 1. Navigate to GitHub Repository Settings
1. Go to your GitHub repository: `https://github.com/Anamsayyed016/Naukrimili`
2. Click on **Settings** (top right of repository page)
3. In the left sidebar, click **Secrets and variables** → **Actions**

### 2. Add or Update DATABASE_URL Secret
1. Click **"New repository secret"** button (or find existing `DATABASE_URL` and click **Update**)
2. **Name**: `DATABASE_URL` (must be exactly this, case-sensitive)
3. **Secret**: Paste your PostgreSQL connection string:

```
postgresql://postgres:Naukrimili%40123@127.0.0.1:5432/naukrimili?connection_limit=10&pool_timeout=20&connect_timeout=10&socket_timeout=30
```

**Important Notes:**
- ✅ **NO quotes** around the value (no `"` or `'`)
- ✅ **NO whitespace** before or after
- ✅ Must start with `postgresql://` or `postgres://`
- ✅ URL-encode special characters (e.g., `@` becomes `%40`)

### 3. Verify the Secret
1. After adding, you should see `DATABASE_URL` in your secrets list
2. The value will be hidden (showing only `••••••••`)
3. You can click **Update** to verify it's set correctly

### 4. Test the Deployment
1. Go to **Actions** tab in your repository
2. Click on the failed workflow run
3. Click **"Re-run jobs"** → **"Re-run failed jobs"**
4. The build should now succeed

## 🔍 Your Current DATABASE_URL (from server)

Based on your server configuration, use this value:

```
postgresql://postgres:Naukrimili%40123@127.0.0.1:5432/naukrimili?connection_limit=10&pool_timeout=20&connect_timeout=10&socket_timeout=30
```

**Breakdown:**
- Protocol: `postgresql://`
- Username: `postgres`
- Password: `Naukrimili@123` (URL-encoded as `Naukrimili%40123`)
- Host: `127.0.0.1`
- Port: `5432` (default PostgreSQL port)
- Database: `naukrimili`
- Parameters: Connection pool settings

## ✅ Verification Checklist

- [ ] DATABASE_URL secret exists in GitHub Secrets
- [ ] Value starts with `postgresql://` or `postgres://`
- [ ] No quotes or whitespace around the value
- [ ] Special characters are URL-encoded (`@` → `%40`)
- [ ] Workflow can access the secret (check workflow logs)

## 🚨 Common Issues

### Issue: "DATABASE_URL is not set or empty"
**Solution:** Make sure the secret name is exactly `DATABASE_URL` (case-sensitive)

### Issue: "DATABASE_URL must start with 'postgresql://'"
**Solution:** Check for typos, ensure it starts with `postgresql://` or `postgres://`

### Issue: "DATABASE_URL has invalid format"
**Solution:** Verify the format: `postgresql://username:password@host:port/database`

### Issue: Secret exists but still failing
**Solution:** 
1. Check if the secret is in the correct repository (not organization secrets)
2. Ensure the workflow has access to secrets
3. Try updating the secret (sometimes GitHub needs a refresh)

## 📞 Need Help?

If you continue to have issues:
1. Check the GitHub Actions workflow logs for specific error messages
2. Verify your PostgreSQL server is accessible from GitHub Actions runners
3. Ensure your database credentials are correct

---

**Last Updated:** December 10, 2025

