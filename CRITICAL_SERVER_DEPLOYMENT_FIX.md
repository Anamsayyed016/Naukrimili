# 🚨 CRITICAL: Server Deployment Fix Guide

## ⚠️ Issue: server.cjs and ecosystem.config.cjs Missing After Deployment

This guide addresses the critical issue where PM2 fails to start because required files are missing after deployment.

---

## ✅ SOLUTION: Complete Deployment Process

### **Step 1: SSH to Your Server**
```bash
ssh your_user@your_server_ip
```

### **Step 2: Navigate to Project Directory**
```bash
cd /var/www/jobportal  # or your project path
# Or: cd /path/to/naukrimili
```

### **Step 3: Verify Current Status**
```bash
# Check if files exist
ls -la server.cjs ecosystem.config.cjs

# If missing, these files MUST be present:
# - server.cjs (219 lines)
# - ecosystem.config.cjs (136 lines)
```

### **Step 4: Pull Latest Code (CRITICAL)**
```bash
# This will restore the missing files
git pull origin main

# Verify files are now present
ls -la server.cjs ecosystem.config.cjs
```

### **Step 5: Run Verification Script**
```bash
# This checks ALL required files
bash verify-deployment.sh

# Expected output: "✅ All checks passed!"
# If errors, follow the suggested fixes
```

### **Step 6: Complete Deployment**
```bash
# Use the automated script
bash deploy-to-server.sh

# This will:
# 1. Pull code (already done)
# 2. Install dependencies
# 3. Generate Prisma client
# 4. Build application
# 5. Create .next/BUILD_ID
# 6. Restart PM2
```

---

## 🔧 Manual Deployment (If Script Fails)

```bash
# 1. Install dependencies
npm install --production --legacy-peer-deps

# 2. Generate Prisma Client
npx prisma generate

# 3. Build Next.js
export NODE_ENV=production
npm run build

# 4. Verify build artifacts
ls -la .next/BUILD_ID .next/server/

# 5. Stop PM2 (if running)
pm2 stop naukrimili

# 6. Start PM2 with config
pm2 start ecosystem.config.cjs --env production

# 7. Check status
pm2 status
pm2 logs naukrimili --lines 50
```

---

## 🐛 Troubleshooting: Files Still Missing?

### **Problem: server.cjs not found**

**Cause:** File was deleted or not pulled from Git

**Fix:**
```bash
# Check if file is in Git
git ls-files | grep server.cjs

# If found, restore it
git checkout main -- server.cjs

# If not in Git repo, the file was never committed
# Contact developer to commit the file
```

### **Problem: ecosystem.config.cjs not found**

**Cause:** Same as above

**Fix:**
```bash
# Restore from Git
git checkout main -- ecosystem.config.cjs

# Verify PM2 config is valid
pm2 ecosystem ecosystem.config.cjs
```

### **Problem: .next/BUILD_ID or .next/server missing**

**Cause:** Build didn't complete successfully

**Fix:**
```bash
# Check build logs
npm run build 2>&1 | tee build.log

# Common issues:
# - Out of memory: Add swap space or use NODE_OPTIONS=--max-old-space-size=4096
# - TypeScript errors: Already disabled in next.config.mjs
# - Prisma not generated: Run npx prisma generate first

# Quick fix:
export NODE_OPTIONS="--max-old-space-size=4096"
npm run build
```

### **Problem: PM2 starts but crashes immediately**

**Cause:** Environment variables missing

**Fix:**
```bash
# Check .env file exists
ls -la .env

# Verify critical variables
grep "DATABASE_URL" .env
grep "NEXTAUTH_SECRET" .env

# If missing, create .env:
cat > .env << 'EOF'
DATABASE_URL="your_database_url"
NEXTAUTH_SECRET="naukrimili-secret-key-2024-production-deployment"
NEXTAUTH_URL="https://naukrimili.com"
NEXT_PUBLIC_APP_URL="https://naukrimili.com"
# ... other variables
EOF

# Restart PM2
pm2 restart naukrimili
```

---

## ✅ Verification Checklist

After deployment, verify:

- [ ] `server.cjs` exists in root directory
- [ ] `ecosystem.config.cjs` exists in root directory  
- [ ] `.next/BUILD_ID` exists
- [ ] `.next/server/` directory exists
- [ ] `node_modules/@prisma/client` exists
- [ ] `.env` file exists with DATABASE_URL
- [ ] PM2 status shows "online"
- [ ] Application accessible at https://naukrimili.com
- [ ] PDF upload works (test at /resumes/upload)

---

## 🎯 Quick Commands Reference

```bash
# Status check
pm2 status

# View logs
pm2 logs naukrimili --lines 100

# Restart
pm2 restart naukrimili

# Stop
pm2 stop naukrimili

# View detailed process info
pm2 show naukrimili

# Monitor in real-time
pm2 monit

# Save PM2 configuration
pm2 save

# Setup PM2 startup
pm2 startup
```

---

## 📊 Expected File Structure After Deployment

```
/var/www/jobportal/
├── server.cjs              ✅ REQUIRED (219 lines)
├── ecosystem.config.cjs    ✅ REQUIRED (136 lines)
├── package.json            ✅ REQUIRED
├── .env                    ✅ REQUIRED
├── .next/                  ✅ REQUIRED (created by build)
│   ├── BUILD_ID            ✅ REQUIRED
│   ├── server/             ✅ REQUIRED
│   └── ...
├── node_modules/           ✅ REQUIRED
│   ├── @prisma/client/     ✅ REQUIRED
│   └── ...
├── prisma/
│   ├── schema.prisma       ✅ REQUIRED
│   └── ...
└── app/
    └── ...
```

---

## 🚀 Success Indicators

After successful deployment, you should see:

```bash
$ pm2 status
┌─────────────┬────┬─────────┬──────┬────────┬─────────┐
│ Name        │ id │ mode    │ pid  │ status │ restart │
├─────────────┼────┼─────────┼──────┼────────┼─────────┤
│ naukrimili  │ 0  │ fork    │ 1234 │ online │ 0       │
└─────────────┴────┴─────────┴──────┴────────┴─────────┘
```

And in logs:
```
✅ Next.js app prepared successfully
🔌 Socket.io server initialized successfully
🎉 Server ready on http://0.0.0.0:3000
```

---

## 📞 Still Having Issues?

If deployment continues to fail:

1. Run verification script: `bash verify-deployment.sh`
2. Check PM2 logs: `pm2 logs naukrimili --lines 200`
3. Check build log: `npm run build 2>&1 | tee build-error.log`
4. Check disk space: `df -h`
5. Check memory: `free -h`
6. Check Node version: `node -v` (should be >= 18)

---

**✅ All required files are now in the repository and ready for deployment!**

