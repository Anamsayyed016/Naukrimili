# 🚀 **PRODUCTION DEPLOYMENT GUIDE - Complete Server Setup**

## 📋 **OVERVIEW**

This guide provides a complete solution for deploying your job portal to production with automatic deployment, monitoring, and chunk issue prevention.

---

## 🛠️ **FILES CREATED**

### **1. Core Deployment Scripts**
- `auto-deploy-server.sh` - Main deployment script for every production change
- `deploy-production.sh` - Enhanced deployment with aggressive cache busting
- `emergency-chunk-cleanup.sh` - Emergency script for immediate chunk fixes

### **2. Monitoring & Management**
- `monitor-server.sh` - Continuous health monitoring and auto-fix
- `ecosystem.config.cjs` - PM2 process management configuration
- `setup-production-server.sh` - Complete server setup script

### **3. Configuration Files**
- `next.config.mjs` - Enhanced with aggressive cache busting headers
- `setup-oauth.js` - OAuth configuration helper

---

## 🚀 **QUICK START**

### **Step 1: Server Setup (One-time)**
```bash
# Upload setup script to your server
scp setup-production-server.sh root@your-server:/root/

# Run setup script
ssh root@your-server
chmod +x setup-production-server.sh
./setup-production-server.sh
```

### **Step 2: Deploy Your Application**
```bash
# Upload your project files
scp -r . root@your-server:/root/jobportal/

# Run deployment
ssh root@your-server
cd /root/jobportal
chmod +x *.sh
./auto-deploy-server.sh
```

### **Step 3: Monitor Your Application**
```bash
# Check status
./monitor-server.sh status

# Start continuous monitoring
./monitor-server.sh monitor
```

---

## 📊 **AUTOMATIC DEPLOYMENT FEATURES**

### **🔄 Auto Deploy Server Script (`auto-deploy-server.sh`)**

#### **What it does:**
- ✅ **Git Integration** - Pulls latest changes from repository
- ✅ **Dependency Management** - Installs/updates npm packages
- ✅ **Prisma Generation** - Generates database client
- ✅ **Build Process** - Creates optimized production build
- ✅ **Chunk Management** - Prevents old chunk issues
- ✅ **Process Management** - Restarts application with PM2
- ✅ **Backup System** - Creates backups before deployment
- ✅ **Health Verification** - Ensures application is running

#### **Usage:**
```bash
# Full deployment
./auto-deploy-server.sh

# Individual commands
./auto-deploy-server.sh backup    # Create backup only
./auto-deploy-server.sh build     # Build only
./auto-deploy-server.sh restart   # Restart only
./auto-deploy-server.sh verify    # Verify deployment
./auto-deploy-server.sh status    # Show PM2 status
./auto-deploy-server.sh logs      # Show logs
```

### **📊 Monitor Server Script (`monitor-server.sh`)**

#### **What it monitors:**
- ✅ **Application Health** - HTTP response checks
- ✅ **PM2 Process Status** - Process state monitoring
- ✅ **Memory Usage** - Memory consumption tracking
- ✅ **Chunk Errors** - Detects chunk-related errors
- ✅ **Auto-Fix** - Automatically fixes common issues

#### **Usage:**
```bash
# One-time health check
./monitor-server.sh check

# Start continuous monitoring
./monitor-server.sh monitor

# Show current status
./monitor-server.sh status

# Attempt to fix issues
./monitor-server.sh fix
```

---

## 🔧 **CONFIGURATION**

### **1. Update Project Directory**
Edit these files and update the `PROJECT_DIR` variable:
- `auto-deploy-server.sh`
- `monitor-server.sh`
- `ecosystem.config.cjs`

### **2. Update PM2 Configuration**
Edit `ecosystem.config.cjs`:
```javascript
{
  name: 'jobportal',
  cwd: '/root/jobportal', // Update this path
  // ... other settings
}
```

### **3. Update Domain/URL**
Edit `monitor-server.sh`:
```bash
APP_URL="http://localhost:3000"  # Update with your domain
```

---

## 🚨 **EMERGENCY PROCEDURES**

### **Chunk Issues (Cannot read properties of undefined)**
```bash
# Run emergency cleanup
./emergency-chunk-cleanup.sh

# Or use the monitor script
./monitor-server.sh fix
```

### **Application Not Starting**
```bash
# Check PM2 status
pm2 status

# View logs
pm2 logs jobportal

# Restart application
pm2 restart jobportal

# Or use deployment script
./auto-deploy-server.sh restart
```

### **Memory Issues**
```bash
# Check memory usage
pm2 list

# Restart if high memory usage
pm2 restart jobportal

# Or use monitor script
./monitor-server.sh fix
```

---

## 📈 **MONITORING & MAINTENANCE**

### **Daily Monitoring**
```bash
# Check application status
./monitor-server.sh status

# View recent logs
pm2 logs jobportal --lines 50

# Check system resources
htop
```

### **Weekly Maintenance**
```bash
# Check for updates
./auto-deploy-server.sh

# Clean old backups
find /root/backups/jobportal -type d -mtime +7 -exec rm -rf {} \;

# Check log files
ls -la /var/log/jobportal/
```

### **Monthly Maintenance**
```bash
# Update system packages
apt update && apt upgrade -y

# Check disk space
df -h

# Review logs
tail -f /var/log/auto-deploy.log
```

---

## 🔍 **TROUBLESHOOTING**

### **Common Issues & Solutions**

#### **1. Chunk Errors**
```bash
# Symptoms: "Cannot read properties of undefined (reading 'length')"
# Solution: Run emergency cleanup
./emergency-chunk-cleanup.sh
```

#### **2. Application Not Responding**
```bash
# Symptoms: 500 errors, timeout
# Solution: Check PM2 status and restart
pm2 status
pm2 restart jobportal
```

#### **3. High Memory Usage**
```bash
# Symptoms: Slow performance, crashes
# Solution: Restart application
pm2 restart jobportal
```

#### **4. Build Failures**
```bash
# Symptoms: Deployment fails
# Solution: Check logs and clean build
pm2 logs jobportal
rm -rf .next node_modules
npm install
npm run build
```

---

## 📋 **DEPLOYMENT WORKFLOW**

### **For Every New Production Change:**

1. **Make changes locally**
2. **Commit and push to Git**
3. **SSH to production server**
4. **Run deployment script:**
   ```bash
   cd /root/jobportal
   ./auto-deploy-server.sh
   ```
5. **Verify deployment:**
   ```bash
   ./monitor-server.sh status
   ```
6. **Test in browser (incognito mode)**

### **Automated Monitoring:**
- **Cron jobs** run every 5 minutes to check health
- **Auto-fix** attempts to resolve common issues
- **Log rotation** keeps logs manageable
- **Backup system** preserves previous versions

---

## 🎯 **EXPECTED RESULTS**

After setup, you should have:

- ✅ **Automatic deployments** - Just run `./auto-deploy-server.sh`
- ✅ **Health monitoring** - Continuous monitoring with auto-fix
- ✅ **Chunk issue prevention** - No more "Cannot read properties" errors
- ✅ **Process management** - PM2 handles application lifecycle
- ✅ **Backup system** - Automatic backups before each deployment
- ✅ **Log management** - Centralized logging with rotation
- ✅ **Emergency procedures** - Quick fixes for common issues

---

## 🚀 **READY FOR PRODUCTION**

Your production server is now configured with:
- **Complete automation** for deployments
- **Robust monitoring** and health checks
- **Chunk issue prevention** and fixes
- **Process management** with PM2
- **Backup and recovery** systems
- **Emergency procedures** for quick fixes

**Run `./setup-production-server.sh` on your server to get started!** 🎉
