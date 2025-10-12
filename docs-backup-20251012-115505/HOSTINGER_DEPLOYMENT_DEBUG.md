# Hostinger VPS Deployment Debug Guide 🔧

## Current Deployment Script Analysis

Your current script is good, but here are some improvements and debugging tips:

### **Current Script:**
```bash
echo "Starting deployment to Hostinger VPS..."
cd /home/***/jobportal
git pull origin main
npm install
npm run build
pm2 restart jobportal
echo "Deployment completed successfully!"
```

## 🚀 Improved Deployment Script

### **Enhanced Version with OAuth Cleanup:**
```bash
echo "🚀 Starting deployment to Hostinger VPS..."

# Navigate to project directory
cd /home/***/jobportal

# Pull latest changes
echo "📥 Pulling latest changes..."
git pull origin main

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build the application
echo "🔨 Building application..."
npm run build

# Clean OAuth users from database
echo "🗑️ Cleaning OAuth users from database..."
node scripts/clear-oauth-users-simple.js

# Restart the application
echo "🔄 Restarting application..."
pm2 restart jobportal

# Check application status
echo "✅ Checking application status..."
pm2 status

echo "🎉 Deployment completed successfully!"
```

## 🔧 Debugging Tips

### **1. Enable Debug Mode**
Add `debug: true` to your SSH action:
```yaml
with:
  debug: true
```

### **2. Increase Timeouts**
```yaml
timeout: 60s
command_timeout: 15m
```

### **3. Check Each Step**
Add error handling:
```bash
set -e  # Exit on any error

echo "🚀 Starting deployment..."
cd /home/***/jobportal || { echo "❌ Failed to navigate to directory"; exit 1; }

echo "📥 Pulling changes..."
git pull origin main || { echo "❌ Git pull failed"; exit 1; }

echo "📦 Installing dependencies..."
npm install || { echo "❌ NPM install failed"; exit 1; }

echo "🔨 Building application..."
npm run build || { echo "❌ Build failed"; exit 1; }

echo "🗑️ Cleaning OAuth users..."
node scripts/clear-oauth-users-simple.js || { echo "❌ OAuth cleanup failed"; exit 1; }

echo "🔄 Restarting application..."
pm2 restart jobportal || { echo "❌ PM2 restart failed"; exit 1; }

echo "✅ Checking status..."
pm2 status

echo "🎉 Deployment completed!"
```

## 🐛 Common Issues & Solutions

### **Issue 1: Permission Denied**
```bash
# Fix file permissions
chmod +x scripts/clear-oauth-users-simple.js
chown -R $USER:$USER /home/***/jobportal
```

### **Issue 2: Node.js Not Found**
```bash
# Check Node.js version
node --version
npm --version

# If not found, install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### **Issue 3: PM2 Not Found**
```bash
# Install PM2 globally
npm install -g pm2

# Or use npx
npx pm2 restart jobportal
```

### **Issue 4: Database Connection Issues**
```bash
# Check environment variables
cat .env

# Test database connection
node -e "
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
prisma.\$connect().then(() => {
  console.log('✅ Database connected');
  prisma.\$disconnect();
}).catch(err => {
  console.error('❌ Database connection failed:', err);
  process.exit(1);
});
"
```

### **Issue 5: Build Failures**
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Check for TypeScript errors
npm run build 2>&1 | tee build.log
```

## 📋 Complete GitHub Actions Workflow

### **Enhanced Workflow File:**
```yaml
name: Deploy to Hostinger VPS

on:
  push:
    branches: [ main ]
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - name: Deploy to Hostinger VPS
      uses: appleboy/ssh-action@v0.1.5
      with:
        host: ${{ secrets.HOSTINGER_HOST }}
        username: ${{ secrets.HOSTINGER_USERNAME }}
        key: ${{ secrets.HOSTINGER_SSH_KEY }}
        script: |
          set -e
          echo "🚀 Starting deployment to Hostinger VPS..."
          
          # Navigate to project directory
          cd /home/${{ secrets.HOSTINGER_USERNAME }}/jobportal
          
          # Pull latest changes
          echo "📥 Pulling latest changes..."
          git pull origin main
          
          # Install dependencies
          echo "📦 Installing dependencies..."
          npm install
          
          # Build the application
          echo "🔨 Building application..."
          npm run build
          
          # Clean OAuth users from database
          echo "🗑️ Cleaning OAuth users from database..."
          node scripts/clear-oauth-users-simple.js
          
          # Restart the application
          echo "🔄 Restarting application..."
          pm2 restart jobportal
          
          # Check application status
          echo "✅ Checking application status..."
          pm2 status
          
          echo "🎉 Deployment completed successfully!"
        port: 22
        sync: false
        use_insecure_cipher: false
        timeout: 60s
        command_timeout: 15m
        proxy_port: 22
        proxy_timeout: 30s
        proxy_use_insecure_cipher: false
        script_stop: false
        debug: true
```

## 🔍 Manual Debugging Commands

### **SSH into your server and run:**
```bash
# Check current directory
pwd

# Check if files exist
ls -la scripts/clear-oauth-users-simple.js

# Test the script manually
node scripts/clear-oauth-users-simple.js

# Check PM2 status
pm2 status
pm2 logs jobportal

# Check application logs
tail -f /var/log/your-app.log
```

## 🎯 Quick Fixes

### **If deployment fails:**
1. **Check logs**: `pm2 logs jobportal`
2. **Restart manually**: `pm2 restart jobportal`
3. **Check status**: `pm2 status`
4. **Test database**: Run the OAuth cleanup script manually

### **If OAuth cleanup fails:**
1. **Check permissions**: `chmod +x scripts/clear-oauth-users-simple.js`
2. **Test locally**: Run the script on your local machine first
3. **Check database**: Verify DATABASE_URL is set correctly

## 📞 Support Commands

### **Emergency Rollback:**
```bash
# Revert to previous commit
git reset --hard HEAD~1
pm2 restart jobportal
```

### **Check Everything:**
```bash
# Full system check
echo "=== System Status ==="
pm2 status
echo "=== Application Logs ==="
pm2 logs jobportal --lines 50
echo "=== Database Test ==="
node scripts/clear-oauth-users-simple.js
```

---

**Status**: ✅ Ready for deployment with OAuth cleanup and debugging support
