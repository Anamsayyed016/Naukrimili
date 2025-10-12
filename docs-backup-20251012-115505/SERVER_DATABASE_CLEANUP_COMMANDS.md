# Server Database Cleanup Commands 🗑️

## Quick Commands for Server Database Cleanup

### 1. **Direct Database Cleanup (Recommended)**
```bash
# Navigate to your project directory
cd /path/to/your/jobportal

# Run the server database reset script
node scripts/server-reset-database.js
```

### 2. **Using SQL Script (Alternative)**
```bash
# Make the script executable
chmod +x scripts/server-clear-database.sh

# Run the cleanup script
./scripts/server-clear-database.sh
```

### 3. **Manual SQL Commands**
```bash
# Connect to your database and run:
mysql -u your_username -p your_database_name < scripts/clear-database.sql
```

### 4. **Production Deployment with Cleanup**
```bash
# Make the deployment script executable
chmod +x scripts/deploy-cleanup.sh

# Run deployment with database cleanup
./scripts/deploy-cleanup.sh
```

## Environment Variables Required

Make sure these are set in your server environment:

```bash
# Database connection
DATABASE_URL="postgresql://username:password@localhost:5432/database_name"

# For production reset (safety override)
FORCE_RESET=true
```

## Step-by-Step Server Commands

### **Option 1: Using Node.js Script (Easiest)**
```bash
# 1. SSH into your server
ssh user@your-server.com

# 2. Navigate to project directory
cd /var/www/jobportal

# 3. Pull latest changes
git pull origin main

# 4. Install dependencies
npm install

# 5. Clean the database
node scripts/server-reset-database.js

# 6. Restart the application
pm2 restart jobportal
# OR
systemctl restart your-app-service
```

### **Option 2: Using SQL Directly**
```bash
# 1. Connect to your database
psql -U your_username -d your_database_name

# 2. Run the cleanup SQL
\i scripts/clear-database.sql

# 3. Exit database
\q
```

### **Option 3: Using Prisma CLI**
```bash
# 1. Navigate to project
cd /var/www/jobportal

# 2. Run Prisma command
npx prisma db execute --file ./scripts/clear-database.sql

# 3. Restart application
pm2 restart jobportal
```

## Safety Commands

### **Backup Before Cleanup**
```bash
# Create backup before cleanup
pg_dump -U your_username -d your_database_name > backup_$(date +%Y%m%d_%H%M%S).sql

# Or for MySQL
mysqldump -u your_username -p your_database_name > backup_$(date +%Y%m%d_%H%M%S).sql
```

### **Verify Cleanup**
```bash
# Check if database is clean
node -e "
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
prisma.user.count().then(count => {
  console.log('Users in database:', count);
  prisma.\$disconnect();
});
"
```

## Production Server Commands

### **For PM2 (Process Manager)**
```bash
# Stop the application
pm2 stop jobportal

# Clean database
node scripts/server-reset-database.js

# Start the application
pm2 start jobportal

# Check status
pm2 status
```

### **For Systemd Service**
```bash
# Stop the service
sudo systemctl stop jobportal

# Clean database
node scripts/server-reset-database.js

# Start the service
sudo systemctl start jobportal

# Check status
sudo systemctl status jobportal
```

### **For Docker**
```bash
# Stop container
docker stop jobportal-container

# Clean database (if database is in container)
docker exec -it jobportal-db psql -U username -d database -f /scripts/clear-database.sql

# Start container
docker start jobportal-container
```

## Hostinger Specific Commands

### **For Hostinger VPS**
```bash
# SSH into Hostinger
ssh root@your-hostinger-ip

# Navigate to project
cd /home/your-username/jobportal

# Clean database
node scripts/server-reset-database.js

# Restart with PM2
pm2 restart all
```

### **For Hostinger Shared Hosting**
```bash
# Use cPanel File Manager or FTP to upload scripts
# Then run via cPanel Terminal or SSH (if available)

# Clean database
node scripts/server-reset-database.js
```

## Verification Commands

### **Check Database Status**
```bash
# Count users
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
# Check if app is running
curl -I http://your-domain.com

# Check logs
pm2 logs jobportal
# OR
tail -f /var/log/your-app.log
```

## Troubleshooting

### **Permission Issues**
```bash
# Make scripts executable
chmod +x scripts/*.sh

# Fix file ownership
chown -R www-data:www-data /var/www/jobportal
```

### **Database Connection Issues**
```bash
# Test database connection
node -e "
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
prisma.\$connect().then(() => {
  console.log('Database connected successfully');
  prisma.\$disconnect();
}).catch(err => {
  console.error('Database connection failed:', err);
});
"
```

## Quick Reference

| Command | Purpose |
|---------|---------|
| `node scripts/server-reset-database.js` | Clean all database data |
| `./scripts/deploy-cleanup.sh` | Deploy with cleanup |
| `pm2 restart jobportal` | Restart PM2 process |
| `systemctl restart jobportal` | Restart systemd service |
| `git pull origin main` | Pull latest code |

---

**⚠️ WARNING**: These commands will delete ALL data from your database. Make sure to backup important data before running them.

**✅ SAFE**: The scripts include safety checks and confirmations for production environments.
