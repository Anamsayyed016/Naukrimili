# 🛡️ Disaster Recovery Plan - NaukriMili

## ✅ Current Backup Status

**All Critical Files Are Saved:**
- ✅ All code changes committed to git (185+ commits)
- ✅ All changes pushed to GitHub
- ✅ Production server running latest code
- ✅ PM2 auto-restart enabled

---

## 🔄 Auto-Recovery Features Already in Place

### 1. **PM2 Process Manager**
Your app is configured to auto-restart on crashes:
```bash
# Check PM2 status
pm2 status

# View logs in real-time
pm2 logs naukrimili --lines 100
```

### 2. **Database Resilience** (Already Implemented)
- ✅ Connection retry logic (3 attempts)
- ✅ Graceful shutdown handling
- ✅ Health check endpoint: `/api/health/database`
- ✅ Auto-reconnect on connection loss

### 3. **Git Version Control**
- ✅ All code in GitHub
- ✅ Can rollback anytime with: `git checkout <commit-hash>`

---

## 🚨 If Website Goes Down - Recovery Steps

### **Quick Check Commands:**
```bash
# 1. Check if app is running
pm2 status

# 2. If stopped, restart it
pm2 restart naukrimili

# 3. Check logs for errors
pm2 logs naukrimili --lines 50

# 4. Check database connection
curl http://localhost:3000/api/health/database
```

### **If App Won't Start:**
```bash
# 1. Navigate to directory
cd /var/www/naukrimili

# 2. Pull latest code
git pull origin main

# 3. Rebuild
npm run build

# 4. Restart with PM2
pm2 restart naukrimili --update-env
```

---

## 📦 Database Backup (RECOMMENDED)

### **Create Backup Scripts:**

**1. Auto Backup Script** (scripts/auto-backup.sh):
```bash
#!/bin/bash
# Create daily database backups

BACKUP_DIR="/var/www/naukrimili/backups/db"
mkdir -p $BACKUP_DIR

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/naukrimili_$TIMESTAMP.sql.gz"

# Extract DB credentials from .env
source .env

# Backup database
pg_dump $DATABASE_URL | gzip > $BACKUP_FILE

# Keep only last 7 days of backups
find $BACKUP_DIR -name "*.sql.gz" -mtime +7 -delete

echo "✅ Backup created: $BACKUP_FILE"
```

**2. Set up daily cron job:**
```bash
# Add to crontab
crontab -e

# Add this line (runs daily at 2 AM)
0 2 * * * /var/www/naukrimili/scripts/auto-backup.sh
```

---

## 🔧 PM2 Startup Configuration

### **Ensure PM2 Starts on Server Reboot:**
```bash
# Save PM2 process list
pm2 save

# Generate startup script
pm2 startup

# Follow the command it gives you
```

---

## 📊 Health Monitoring

### **Monitor Your Website:**
```bash
# 1. Check application health
curl https://naukrimili.com/api/health

# 2. Check database health
curl https://naukrimili.com/api/health/database

# 3. Check PM2 process
pm2 monit
```

---

## 🎯 Files That MUST Be Backed Up

**Already Backed Up (in Git):**
- ✅ All source code
- ✅ Configuration files
- ✅ Database schema (prisma/schema.prisma)

**NOT in Git (Backup Separately):**
- ⚠️ `.env` file (DATABASE_URL, API keys, secrets)
- ⚠️ `uploads/` folder (user resumes, if any)
- ⚠️ Database data (PostgreSQL)

---

## 🚀 Quick Recovery Commands

**If you need to restore from scratch:**
```bash
# 1. Clone repository
git clone https://github.com/Anamsayyed016/Naukrimili.git
cd Naukrimili

# 2. Install dependencies
npm install

# 3. Copy your backed up .env file
cp /backup/.env .env

# 4. Run database migrations
npx prisma migrate deploy

# 5. Build application
npm run build

# 6. Start with PM2
pm2 start ecosystem.config.cjs --update-env

# 7. Save PM2 config
pm2 save
```

---

## ✅ Your Current Protection Level

| Feature | Status | Protection Level |
|---------|--------|------------------|
| **Code Backup** | GitHub | 🟢 High |
| **PM2 Auto-Restart** | Enabled | 🟢 High |
| **Database Retry** | Enabled | 🟢 High |
| **Health Checks** | Enabled | 🟢 High |
| **Database Backup** | Manual | 🟡 Medium |
| **Environment Backup** | Local only | 🟡 Medium |

---

## 📞 Emergency Contacts

**Server Host:** Hostinger (srv1054971.hstgr.cloud)
**Repository:** https://github.com/Anamsayyed016/Naukrimili
**Node Version:** v20.19.2
**PM2 Process:** naukrimili (ID: 0)

---

**Your website is well-protected! All critical code is saved and backed up.** 🎉

