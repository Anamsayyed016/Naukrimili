# 🔧 DATABASE_URL Validation Error - Fix Guide

## ❌ Error Message

```
Error validating datasource db: the URL must start with the protocol postgresql:// or postgres://
```

## 🔍 Root Cause

The `DATABASE_URL` in your GitHub Secrets is either:
- Missing or empty
- Has incorrect format (doesn't start with `postgresql://` or `postgres://`)
- Contains extra whitespace or quotes
- Has malformed connection string

## ✅ Solution

### Step 1: Check GitHub Secrets

1. Go to your GitHub repository
2. Navigate to: **Settings** → **Secrets and variables** → **Actions**
3. Find the `DATABASE_URL` secret
4. Click **Update** or **Add secret** if it doesn't exist

### Step 2: Set Correct Format

The `DATABASE_URL` must follow this exact format:

```
postgresql://username:password@host:port/database
```

**Example:**
```
postgresql://jobportal_user:your_password@localhost:5432/jobportal
```

**For remote databases:**
```
postgresql://user:pass@db.example.com:5432/naukrimili
```

### Step 3: Common Issues to Avoid

❌ **Wrong formats:**
- `postgres://...` (should be `postgresql://` or `postgres://`)
- `mysql://...` (PostgreSQL only)
- `DATABASE_URL=postgresql://...` (don't include variable name)
- Missing `://` after protocol
- Extra spaces or quotes around the URL

✅ **Correct format:**
```
postgresql://username:password@host:port/database
```

### Step 4: Validate Locally (Optional)

You can test your DATABASE_URL format locally:

```bash
# Set your DATABASE_URL
export DATABASE_URL="postgresql://user:pass@host:5432/db"

# Run validation script
./scripts/validate-database-url.sh
```

### Step 5: Test Prisma Connection

After updating the secret, test if Prisma can connect:

```bash
# Generate Prisma client (validates connection)
npx prisma generate

# Or validate schema
npx prisma validate
```

## 📋 Verification Checklist

- [ ] DATABASE_URL exists in GitHub Secrets
- [ ] Starts with `postgresql://` or `postgres://`
- [ ] Contains `://` after protocol
- [ ] Has format: `protocol://user:pass@host:port/database`
- [ ] No extra spaces or quotes
- [ ] Database server is accessible
- [ ] User has proper permissions

## 🔄 After Fixing

1. **Commit and push** your changes (if any)
2. **Re-run the GitHub Actions workflow**
3. The workflow will now validate DATABASE_URL before Prisma operations
4. If validation passes, Prisma will generate successfully

## 🆘 Still Having Issues?

If the error persists after fixing the secret:

1. **Check the workflow logs** - Look for the validation output
2. **Verify database accessibility** - Ensure the database server is reachable
3. **Check user permissions** - Database user must have proper access
4. **Test connection manually** - Use `psql` or database client to verify

## 📝 Example GitHub Secret Value

When adding/updating the secret in GitHub, enter ONLY the connection string:

```
postgresql://jobportal_user:secure_password123@your-db-host.com:5432/jobportal
```

**Do NOT include:**
- Variable name: `DATABASE_URL=...`
- Quotes: `"postgresql://..."`
- Extra spaces

---

**Status:** ✅ Enhanced validation added to workflow - will catch errors early with clear messages

