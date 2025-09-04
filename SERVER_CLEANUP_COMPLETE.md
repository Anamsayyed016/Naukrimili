# Server Database Cleanup - Complete Implementation ✅

## 🎯 What You Need to Run on Your Server

### **Quick Commands (Copy & Paste Ready)**

#### **For Linux/Unix Servers:**
```bash
# 1. SSH into your server
ssh user@your-server.com

# 2. Navigate to project directory
cd /var/www/jobportal

# 3. Pull latest changes
git pull origin main

# 4. Clean the database
node scripts/server-reset-database.js

# 5. Restart your application
pm2 restart jobportal
```

#### **For Windows Servers:**
```powershell
# 1. Navigate to project directory
cd C:\path\to\your\jobportal

# 2. Pull latest changes
git pull origin main

# 3. Clean the database
node scripts/server-reset-database.js

# 4. Restart your application
pm2 restart jobportal
```

## 📁 Files Created for Server Cleanup

### **1. Main Cleanup Script**
- `scripts/server-reset-database.js` - **Main script to run on server**
- Clears all users and related data
- Includes safety checks for production

### **2. SQL Script**
- `scripts/clear-database.sql` - Direct SQL commands
- Can be run directly on database

### **3. Shell Scripts (Linux/Unix)**
- `scripts/server-clear-database.sh` - Bash script wrapper
- `scripts/deploy-cleanup.sh` - Full deployment with cleanup

### **4. PowerShell Scripts (Windows)**
- `scripts/server-clear-database.ps1` - PowerShell wrapper
- `scripts/deploy-cleanup.ps1` - Full deployment with cleanup

### **5. Documentation**
- `SERVER_DATABASE_CLEANUP_COMMANDS.md` - Complete command reference

## 🚀 Step-by-Step Server Commands

### **Option 1: Direct Node.js (Recommended)**
```bash
# On your server, run:
node scripts/server-reset-database.js
```

### **Option 2: Using SQL Directly**
```bash
# Connect to your database and run:
psql -U your_username -d your_database_name -f scripts/clear-database.sql
```

### **Option 3: Using Prisma CLI**
```bash
# Run Prisma command:
npx prisma db execute --file ./scripts/clear-database.sql
```

## 🔧 Environment Setup Required

Make sure these environment variables are set on your server:

```bash
# Database connection
DATABASE_URL="postgresql://username:password@localhost:5432/database_name"

# For production reset (safety override)
FORCE_RESET=true
```

## 🛡️ Safety Features

### **Production Safety**
- Scripts check for production environment
- Requires `FORCE_RESET=true` for production
- Confirmation prompts before deletion

### **Backup Commands**
```bash
# Create backup before cleanup
pg_dump -U your_username -d your_database_name > backup_$(date +%Y%m%d_%H%M%S).sql
```

## 📋 Server-Specific Commands

### **For PM2 (Process Manager)**
```bash
pm2 stop jobportal
node scripts/server-reset-database.js
pm2 start jobportal
pm2 status
```

### **For Systemd Service**
```bash
sudo systemctl stop jobportal
node scripts/server-reset-database.js
sudo systemctl start jobportal
sudo systemctl status jobportal
```

### **For Docker**
```bash
docker stop jobportal-container
docker exec -it jobportal-db psql -U username -d database -f /scripts/clear-database.sql
docker start jobportal-container
```

### **For Hostinger VPS**
```bash
ssh root@your-hostinger-ip
cd /home/your-username/jobportal
node scripts/server-reset-database.js
pm2 restart all
```

## ✅ Verification Commands

### **Check Database Status**
```bash
node -e "
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
Promise.all([
  prisma.user.count(),
  prisma.job.count(),
  prisma.company.count()
]).then(([users, jobs, companies]) => {
  console.log('Users:', users);
  console.log('Jobs:', jobs);
  console.log('Companies:', companies);
  prisma.\$disconnect();
});
"
```

### **Check Application Status**
```bash
curl -I http://your-domain.com
pm2 logs jobportal
```

## 🎯 Quick Reference

| Command | Purpose |
|---------|---------|
| `node scripts/server-reset-database.js` | **Main cleanup command** |
| `./scripts/server-clear-database.sh` | Linux wrapper script |
| `.\scripts\server-clear-database.ps1` | Windows wrapper script |
| `pm2 restart jobportal` | Restart PM2 process |
| `git pull origin main` | Pull latest code |

## 📞 Support Commands

### **If Scripts Don't Work**
```bash
# Manual cleanup using Prisma
npx prisma studio
# Then manually delete all records

# Or direct SQL
psql -U username -d database -c "DELETE FROM User; DELETE FROM Job; DELETE FROM Company;"
```

### **Check Script Permissions**
```bash
# Make scripts executable (Linux)
chmod +x scripts/*.sh

# Check file permissions
ls -la scripts/
```

## 🎉 Ready to Use!

All scripts are ready and tested. Simply run the main command on your server:

```bash
node scripts/server-reset-database.js
```

This will clean your server database just like we did locally, giving you a fresh start for new users! 🚀

---

**Status**: ✅ COMPLETE - All server cleanup commands ready for deployment
