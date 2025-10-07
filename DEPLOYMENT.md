# Deployment Guide

## 🚀 Quick Deployment on Server

### Step 1: Upload Changes to Server

```bash
# On your local machine, commit and push changes
git add .
git commit -m "Fix: Database credentials, error boundaries, and favicon"
git push origin main
```

### Step 2: Deploy on Server

SSH into your server and run:

```bash
# Navigate to project
cd /var/www/jobportal

# Pull latest changes
git pull origin main

# Run deployment script
chmod +x scripts/deploy-complete-fix.sh
bash scripts/deploy-complete-fix.sh
```

## 📋 Manual Deployment Steps

If the automated script fails, follow these steps:

### 1. Stop PM2
```bash
cd /var/www/jobportal
pm2 delete jobportal
```

### 2. Clear PM2 Cache
```bash
rm -rf /root/.pm2/dump.pm2*
pm2 cleardump
```

### 3. Update Dependencies
```bash
npm install --legacy-peer-deps --force
```

### 4. Build Application
```bash
npm run build
```

### 5. Start PM2 with Fresh Config
```bash
pm2 start ecosystem.config.cjs --env production
pm2 save
```

### 6. Verify Deployment
```bash
# Check PM2 status
pm2 list

# Check logs
pm2 logs jobportal --lines 50

# Test database connection
PGPASSWORD=job123 psql -U jobportal_user -h localhost -d jobportal -c "SELECT COUNT(*) FROM \"Job\";"

# Test API endpoint
curl "http://localhost:3000/api/jobs/56"
```

## 🔍 Troubleshooting

### Database Connection Issues

If you see authentication errors:

1. **Verify PostgreSQL password:**
   ```bash
   sudo -u postgres psql -c "ALTER USER jobportal_user WITH PASSWORD 'job123';"
   ```

2. **Test connection:**
   ```bash
   PGPASSWORD=job123 psql -U jobportal_user -h localhost -d jobportal -c "SELECT 1;"
   ```

3. **Check `.env` file:**
   ```bash
   cat .env
   # Should contain: DATABASE_URL="postgresql://jobportal_user:job123@localhost:5432/jobportal"
   ```

4. **Verify ecosystem.config.cjs:**
   ```bash
   grep "DATABASE_URL" ecosystem.config.cjs
   # Should show: jobportal_user:job123
   ```

### PM2 Environment Issues

If PM2 is not picking up new environment variables:

```bash
# Completely reset PM2
pm2 delete all
rm -rf /root/.pm2/dump.pm2*
pm2 cleardump

# Start fresh
pm2 start ecosystem.config.cjs --env production
pm2 save
```

### Build Issues

If build fails:

```bash
# Clear Next.js cache
rm -rf .next

# Clear node_modules
rm -rf node_modules package-lock.json

# Reinstall and rebuild
npm install --legacy-peer-deps --force
npm run build
```

## ✅ What Was Fixed

### 1. **Favicon & Icons**
- Added `app/icon.tsx` - generates favicon dynamically
- Added `app/apple-icon.tsx` - iOS icon support
- Added `public/favicon.svg` - fallback SVG icon

### 2. **Error Boundaries**
- Added `app/error.tsx` - page-level error boundary
- Added `app/global-error.tsx` - app-level error boundary  
- Added `app/jobs/error.tsx` - jobs-specific error boundary

### 3. **Database Configuration**
- Fixed `ecosystem.config.cjs` with correct credentials
- Updated both `env` and `env_production` sections
- Credentials: `jobportal_user:job123`

### 4. **Job Search Fix**
- Enhanced `/api/jobs` to prioritize real jobs
- Integrated external API calls (Adzuna, Indeed, ZipRecruiter)
- Sample jobs only generated as last resort
- Fixed sample job ID parsing in SEO URLs

## 🧪 Testing After Deployment

1. **Test Job Search:**
   ```
   https://aftionix.in/jobs?query=software+engineer
   ```

2. **Test Job Details:**
   ```
   https://aftionix.in/jobs/56
   ```

3. **Check Console (F12):**
   - No MIME type errors
   - No React errors
   - No 404 errors

4. **Verify Database:**
   ```bash
   pm2 logs jobportal --lines 50
   # Should show no authentication errors
   ```

## 📝 Post-Deployment Checklist

- [ ] PM2 is running without errors
- [ ] Database connection successful
- [ ] API endpoints responding correctly
- [ ] No console errors in browser
- [ ] Favicon appears in browser tab
- [ ] Job search returns results
- [ ] Job details pages load correctly
- [ ] External job apply buttons work

## 🆘 Support

If issues persist:

1. **Check PM2 logs:**
   ```bash
   pm2 logs jobportal --lines 100
   ```

2. **Check environment variables:**
   ```bash
   pm2 env jobportal
   ```

3. **Monitor in real-time:**
   ```bash
   pm2 monit
   ```

4. **Restart if needed:**
   ```bash
   pm2 restart jobportal --update-env
   ```
