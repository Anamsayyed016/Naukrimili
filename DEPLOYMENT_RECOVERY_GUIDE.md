# 🔧 Production Deployment Troubleshooting & Recovery Guide

## 🚨 Quick Emergency Recovery

### If your website is DOWN:

```bash
# SSH to your server
ssh -i /path/to/private_key -p 22 root@srv1054971.hstgr.cloud

# Check PM2 status
pm2 status

# Restart application
pm2 restart jobportal

# Check logs
pm2 logs jobportal --lines 100

# If PM2 is broken, restore from backup
cd /var/www
rm -rf naukrimili
cp -r naukrimili-backup/backup-LATEST naukrimili
cd naukrimili
npm install --omit=dev
pm2 start ecosystem.config.cjs --env production
pm2 save --force
```

---

## 🔐 Secret Management & Validation

### 1. Generate NEXTAUTH_SECRET (32+ chars)

```bash
# On your local machine or server:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Example output: a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6
```

**Then add to GitHub Secrets:**
- Go to: https://github.com/Anamsayyed016/Naukrimili/settings/secrets/actions
- Secret name: `NEXTAUTH_SECRET`
- Paste the 64-character string

### 2. Generate/Format SSH_KEY Correctly

```bash
# If you have an existing private key:
cat ~/.ssh/id_rsa

# Copy entire key including -----BEGIN and -----END lines

# Add to GitHub Secrets:
# Secret name: SSH_KEY
# Value: (paste entire private key)

# ✅ The workflow will handle the formatting automatically
```

**Troubleshooting SSH key issues:**

```bash
# Test your key locally FIRST:
ssh -i ~/.ssh/id_rsa -p 22 -vv root@srv1054971.hstgr.cloud

# If permission denied:
chmod 600 ~/.ssh/id_rsa

# If no such file:
# Generate new key:
ssh-keygen -t rsa -b 4096 -f ~/.ssh/id_rsa -N ""

# Copy public key to server:
cat ~/.ssh/id_rsa.pub | ssh -p 22 root@srv1054971.hstgr.cloud "mkdir -p ~/.ssh && cat >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys"
```

### 3. Validate DATABASE_URL

```bash
# Format: postgresql://username:password@hostname:5432/database_name

# Test locally:
psql postgresql://user:pass@srv1054971.hstgr.cloud:5432/naukrimili -c "SELECT 1"

# Common issues:
# ❌ Missing protocol: should start with postgresql://
# ❌ Wrong port: should be 5432 (or your database port)
# ❌ Special chars in password: URL-encode them (@ → %40, # → %23)
```

### 4. Validate GOOGLE_CLIENT_ID and SECRET

```bash
# Both should be from Google Cloud Console
# https://console.cloud.google.com/apis/credentials

# Verify they're not empty:
# - GOOGLE_CLIENT_ID = long string ending in .apps.googleusercontent.com
# - GOOGLE_CLIENT_SECRET = shorter string (usually 24 chars)
```

---

## 🔑 SSH Key Creation & Setup (Complete Guide)

### If you DON'T have an SSH key:

```bash
# Step 1: Generate new key on your LOCAL machine
ssh-keygen -t rsa -b 4096 -f ~/.ssh/naukrimili_key -N ""

# Step 2: Copy public key to server
ssh-copy-id -i ~/.ssh/naukrimili_key.pub -p 22 root@srv1054971.hstgr.cloud

# Step 3: Verify it works
ssh -i ~/.ssh/naukrimili_key -p 22 root@srv1054971.hstgr.cloud "echo OK"

# Step 4: Get the PRIVATE key content (for GitHub Secrets)
cat ~/.ssh/naukrimili_key

# Step 5: Add to GitHub Secrets as "SSH_KEY"
```

### If you're having SSH key errors in workflow:

```bash
# Check key format in GitHub Actions runner:
ssh-keygen -l -f ~/.ssh/deploy_key

# Expected output: 4096 SHA256:... (RSA)

# If workflow shows "SSH_KEY: SET (XXX chars)" but connection fails:
# 1. Your SSH_KEY might not be the PRIVATE key (should be multiline)
# 2. The key might be in wrong format (PEM vs OpenSSH)
# 3. Public key might not be authorized on server
```

---

## 🛠️ Database & Prisma Troubleshooting

### Migrations keep failing?

```bash
# SSH to server
ssh root@srv1054971.hstgr.cloud

cd /var/www/naukrimili

# Check Prisma version
npx prisma --version

# Check migration status
npx prisma migrate status

# Manually run migrations (with rollback safety)
npx prisma migrate deploy --skip-generate

# If it fails, check database:
psql $DATABASE_URL -c "\dt"  # List all tables

# If you need to reset migrations (DANGEROUS - backs up first):
cp -r /var/www/naukrimili /var/www/naukrimili.backup-$(date +%s)
npx prisma migrate reset --force --skip-generate
```

### Prisma client not generated?

```bash
# On server or local:
rm -rf node_modules/.prisma
npx prisma generate --schema=prisma/schema.prisma

# Verify it worked:
ls -la node_modules/.prisma/client

# If error "Cannot find module @prisma/client":
npm install --save @prisma/client
npx prisma generate
```

---

## PM2 Restart Issues

### PM2 fails to start?

```bash
# SSH to server
ssh root@srv1054971.hstgr.cloud

cd /var/www/naukrimili

# Check PM2 status
pm2 status
pm2 logs jobportal --lines 50

# If process exists but failed:
pm2 delete jobportal
pm2 delete all  # If many failed

# Verify ecosystem.config.cjs exists and is valid
cat ecosystem.config.cjs | head -30

# Manually start (for testing)
NODE_ENV=production pm2 start ecosystem.config.cjs
sleep 2
pm2 logs

# If "Cannot find module":
npm install --omit=dev
npm audit fix --force

# If port 3000 already in use:
lsof -i :3000
kill -9 <PID>

pm2 start ecosystem.config.cjs --env production
```

### PM2 auto-startup not working on reboot?

```bash
# Regenerate PM2 startup hook
pm2 startup

# Run the command it outputs (it will say something like):
# sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u root --hp /root

# Then save:
pm2 save --force

# Test it:
pm2 resurrect  # Should restore all apps
```

---

## 📊 Health Check Debugging

### Health endpoint returns 500?

```bash
# SSH to server
ssh root@srv1054971.hstgr.cloud

# Check if app is actually running
curl http://localhost:3000/api/health

# If connection refused: PM2 hasn't started yet
pm2 logs jobportal --lines 50  # See why it crashed

# Check database connection
export DATABASE_URL="..."
npm exec -- node -e "const {prisma} = require('./lib/prisma'); prisma.\$connect().then(() => console.log('✅ DB OK')).catch(e => console.log('❌', e.message))"

# Check if NEXTAUTH_SECRET is set
echo $NEXTAUTH_SECRET

# If health endpoint still fails after 30 seconds:
# 1. Check PM2 logs for startup errors
# 2. Check database migrations completed: npx prisma migrate status
# 3. Check environment variables are all set
```

---

## 🚀 Build Artifacts Verification

### .next directory becomes empty during build?

```bash
# On GitHub Actions runner (in workflow):
# This is likely a tar extraction issue

# Solution: Use tar -xzf instead of zstd
# The new deploy-production.yml uses tar -czf (gzip) instead of zstd

# If old workflow is still failing:
# 1. Delete old .github/workflows/deploy.yml
# 2. Use new .github/workflows/deploy-production.yml
# 3. Push and re-run

# Verify locally that bundle extracts correctly:
cd /tmp
tar -xzf /path/to/release.tar.gz
ls -la .next  # Should have files

# If .next is empty after extraction:
# The original .next was empty - check build logs
```

---

## 🚨 Disaster Recovery (Nuclear Option)

### If nothing works, restore from backup:

```bash
ssh root@srv1054971.hstgr.cloud

# List backups
ls -la /var/www/naukrimili-backup/

# Restore latest
LATEST=$(ls -t /var/www/naukrimili-backup/backup-* | head -1)
rm -rf /var/www/naukrimili
cp -r "$LATEST" /var/www/naukrimili

# Or from GitHub (if you have release tags):
cd /var/www
git clone https://github.com/Anamsayyed016/Naukrimili.git naukrimili-new
cd naukrimili-new
git checkout v1.0.0  # Your last stable version

npm ci --omit=dev
npx prisma generate
npx prisma migrate deploy

pm2 start ecosystem.config.cjs --env production
pm2 save --force
```

---

## ✅ Pre-Deployment Checklist

Before pushing to main and triggering deployment:

- [ ] `npm run build` succeeds locally
- [ ] `.next` folder has 100+ files
- [ ] `pm2 start ecosystem.config.cjs` works locally
- [ ] `curl http://localhost:3000/api/health` returns 200
- [ ] All secrets are in GitHub (run validation step first)
- [ ] SSH key works locally: `ssh -i ~/.ssh/id_rsa root@srv1054971.hstgr.cloud`
- [ ] Database URL is accessible: `psql $DATABASE_URL -c "SELECT 1"`
- [ ] NEXTAUTH_SECRET is 32+ characters
- [ ] No uncommitted changes (clean working directory)

---

## 📋 Secrets Validation Command

Run this before deployment to validate everything:

```bash
#!/bin/bash
echo "🔐 Validating production secrets..."

# Check all required secrets exist
REQUIRED=("HOST" "SSH_USER" "SSH_PORT" "SSH_KEY" "NEXTAUTH_SECRET" "DATABASE_URL" "GOOGLE_CLIENT_ID" "GOOGLE_CLIENT_SECRET")

for secret in "${REQUIRED[@]}"; do
  if [ -z "${!secret}" ]; then
    echo "❌ $secret is empty"
  else
    LEN=${#!secret}
    echo "✅ $secret: $LEN chars"
  fi
done

# Validate NEXTAUTH_SECRET length
if [ ${#NEXTAUTH_SECRET} -lt 32 ]; then
  echo "❌ NEXTAUTH_SECRET must be 32+ chars"
fi

# Validate SSH_KEY format
if ! echo "$SSH_KEY" | grep -q "BEGIN.*PRIVATE"; then
  echo "❌ SSH_KEY doesn't look like a private key"
fi

# Validate DATABASE_URL format
if ! echo "$DATABASE_URL" | grep -q "^postgresql://"; then
  echo "❌ DATABASE_URL should start with postgresql://"
fi

echo "✅ Validation complete"
```

---

## 🔧 Common Commands Cheat Sheet

```bash
# View application logs (follow in real-time)
pm2 logs jobportal -f

# Monitor resources
pm2 monit

# Restart application
pm2 restart jobportal

# Stop application
pm2 stop jobportal

# Start application
pm2 start ecosystem.config.cjs --env production

# Check if running
pm2 list

# Kill everything
pm2 kill

# Check port 3000 usage
lsof -i :3000

# Check .env file
cat /var/www/naukrimili/.env | head -20

# View recent changes
cd /var/www/naukrimili && git log --oneline -5

# Check disk space
df -h /var/www

# Check total build size
du -sh /var/www/naukrimili

# Check if database is reachable
psql $DATABASE_URL -c "SELECT VERSION()"

# Manual health check
curl -v http://localhost:3000/api/health
```

---

## 📞 Still Having Issues?

1. **Check GitHub Actions logs**: Go to your repository → Actions → Latest run → "Deploy to Production"
2. **Check PM2 logs on server**: `pm2 logs jobportal --lines 100`
3. **Check build artifacts**: GitHub Actions → Latest run → "Artifacts" section
4. **Test SSH locally first**: `ssh -i ~/.ssh/id_rsa -vv root@srv1054971.hstgr.cloud`
5. **Verify environment**: `ssh root@srv1054971.hstgr.cloud "node --version && npm --version && pm2 --version"`

---

**Last Updated**: December 2025  
**Production URL**: https://naukrimili.com  
**Deployment Method**: GitHub Actions → Hostinger VPS (SSH)  
**Zero-Downtime**: ✅ Enabled (temp folder swap)  
**Auto-Backup**: ✅ Enabled (keeps last 3 backups)
