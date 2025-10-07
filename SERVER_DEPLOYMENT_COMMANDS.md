# 🚀 Server Deployment Commands

## Copy and paste these commands on your VPS server:

### Step 1: Navigate to project and pull changes
```bash
cd /var/www/jobportal
git pull origin main
```

### Step 2: Run the automated deployment script
```bash
chmod +x scripts/deploy-complete-fix.sh
bash scripts/deploy-complete-fix.sh
```

---

## ⚡ Quick Manual Deployment (if script fails)

```bash
# Stop and clear PM2
cd /var/www/jobportal
pm2 delete jobportal
rm -rf /root/.pm2/dump.pm2*
pm2 cleardump

# Install and build
npm install --legacy-peer-deps --force
npm run build

# Start PM2 fresh
pm2 start ecosystem.config.cjs --env production
pm2 save
```

---

## 🔍 Verification Commands

### Check PM2 Status
```bash
pm2 list
pm2 logs jobportal --lines 50
```

### Test Database Connection
```bash
PGPASSWORD=job123 psql -U jobportal_user -h localhost -d jobportal -c "SELECT COUNT(*) FROM \"Job\";"
```

### Test API Endpoint
```bash
curl "http://localhost:3000/api/jobs/56"
```

### Monitor Real-time
```bash
pm2 monit
```

---

## ✅ What's Fixed

1. ✅ **Database Configuration**
   - Fixed `ecosystem.config.cjs` with correct credentials
   - Updated both `env` and `env_production` sections
   - Credentials: `jobportal_user:job123`

2. ✅ **Error Boundaries**
   - Global error boundary (`app/error.tsx`)
   - Root error boundary (`app/global-error.tsx`)
   - Jobs-specific error boundary (`app/jobs/error.tsx`)

3. ✅ **Favicon & Icons**
   - Dynamic favicon generation (`app/icon.tsx`)
   - iOS icon support (`app/apple-icon.tsx`)
   - Fallback SVG icon (`public/favicon.svg`)

4. ✅ **MIME Type Issues**
   - Fixed by proper build deployment
   - Fresh build eliminates cached issues

---

## 🆘 If Issues Persist

### Database Auth Error?
```bash
sudo -u postgres psql -c "ALTER USER jobportal_user WITH PASSWORD 'job123';"
PGPASSWORD=job123 psql -U jobportal_user -h localhost -d jobportal -c "SELECT 1;"
```

### PM2 Not Picking Up Env?
```bash
pm2 delete all
rm -rf /root/.pm2/dump.pm2*
pm2 start ecosystem.config.cjs --env production
pm2 save
```

### Build Errors?
```bash
rm -rf .next node_modules package-lock.json
npm install --legacy-peer-deps --force
npm run build
```

---

## 📊 Expected Results After Deployment

- ✅ No authentication errors in PM2 logs
- ✅ Job search returns real jobs (not just samples)
- ✅ API endpoints respond correctly
- ✅ Favicon appears in browser
- ✅ No console errors (MIME, React, 404)
- ✅ Error boundaries catch and display errors gracefully

---

## 🧪 Test URLs After Deployment

1. **Job Search**: https://aftionix.in/jobs?query=software+engineer
2. **Job Details**: https://aftionix.in/jobs/56
3. **API Test**: https://aftionix.in/api/jobs/56

Check browser console (F12) - should be clean with no errors!

