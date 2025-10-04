# Job Portal Deployment Guide

## Quick Start Commands

### For Windows (Local Development)
```powershell
# Start the application
.\deploy.ps1 start

# Deploy/update
.\deploy.ps1 deploy

# Check status
.\deploy.ps1 status

# View logs
.\deploy.ps1 logs
```

### For Linux Server (Production)

#### 1. Initial Server Setup
```bash
# Upload and run the setup script on your server
scp server-setup.sh root@aftionix.in:/root/
ssh root@aftionix.in
chmod +x server-setup.sh
./server-setup.sh
```

#### 2. SSL Certificate Setup
```bash
# After server setup, get SSL certificate
certbot --nginx -d aftionix.in -d www.aftionix.in
```

#### 3. Daily Management Commands
```bash
# Deploy updates
./deploy.sh deploy

# Check status
./deploy.sh status

# View logs
./deploy.sh logs

# Restart application
./deploy.sh restart

# Health check
./deploy.sh health
```

## Manual Linux Commands

### Essential Commands
```bash
# Check application status
pm2 status jobportal

# View logs
pm2 logs jobportal

# Restart application
pm2 restart jobportal

# Stop application
pm2 stop jobportal

# Start application
pm2 start ecosystem.config.cjs --env production

# Save PM2 configuration
pm2 save

# Setup PM2 startup
pm2 startup

# Check Nginx status
systemctl status nginx

# Check PostgreSQL status
systemctl status postgresql

# View Nginx logs
tail -f /var/log/nginx/aftionix.in.access.log
tail -f /var/log/nginx/aftionix.in.error.log

# Check application logs
tail -f /var/log/jobportal/combined.log
tail -f /var/log/jobportal/error.log
```

### Database Commands
```bash
# Connect to PostgreSQL
sudo -u postgres psql

# Connect to jobportal database
sudo -u postgres psql -d jobportal

# List databases
sudo -u postgres psql -l

# Backup database
sudo -u postgres pg_dump jobportal > jobportal_backup_$(date +%Y%m%d).sql

# Restore database
sudo -u postgres psql jobportal < jobportal_backup_20241201.sql
```

### System Monitoring
```bash
# Check system resources
htop
free -h
df -h

# Check running processes
ps aux | grep -E "(node|pm2|nginx|postgres)"

# Check port usage
netstat -tlnp | grep :3000
netstat -tlnp | grep :80
netstat -tlnp | grep :443

# Check disk usage
du -sh /var/www/jobportal
du -sh /var/log/jobportal
```

### Troubleshooting
```bash
# Check PM2 logs
pm2 logs jobportal --lines 100

# Check Nginx configuration
nginx -t

# Reload Nginx
systemctl reload nginx

# Check firewall
ufw status

# Check system logs
journalctl -u nginx
journalctl -u postgresql
```

## Environment Variables

Make sure these are set in your production environment:

```bash
NODE_ENV=production
PORT=3000
NODE_OPTIONS=--max-old-space-size=4096
NEXT_TELEMETRY_DISABLED=1
NEXT_PUBLIC_SKIP_GOOGLE_FONTS=true
NEXT_PUBLIC_APP_URL=https://aftionix.in
NEXTAUTH_URL=https://aftionix.in
NEXTAUTH_SECRET=jobportal-secret-key-2024-aftionix-production-deployment
JWT_SECRET=jobportal-jwt-secret-2024-aftionix-production
DATABASE_URL=postgresql://jobportal_user:secure_password_2024@localhost:5432/jobportal
```

## Security Checklist

- [ ] SSL certificate installed and working
- [ ] Firewall configured (ports 22, 80, 443 only)
- [ ] Database passwords are secure
- [ ] Nginx security headers configured
- [ ] Rate limiting enabled
- [ ] Log rotation configured
- [ ] Monitoring script running
- [ ] Regular backups scheduled

## Backup Strategy

```bash
# Daily backup script
#!/bin/bash
BACKUP_DIR="/var/backups/jobportal"
DATE=$(date +%Y%m%d_%H%M%S)

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup database
sudo -u postgres pg_dump jobportal > $BACKUP_DIR/jobportal_db_$DATE.sql

# Backup application files
tar -czf $BACKUP_DIR/jobportal_app_$DATE.tar.gz /var/www/jobportal

# Backup logs
tar -czf $BACKUP_DIR/jobportal_logs_$DATE.tar.gz /var/log/jobportal

# Clean old backups (keep 7 days)
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete
```

## Performance Optimization

- **Memory**: 2GB max restart, 4GB Node.js heap
- **Caching**: Nginx static file caching
- **Compression**: Gzip enabled
- **Rate Limiting**: API and auth endpoints protected
- **Monitoring**: Automated health checks every 5 minutes

Your job portal is now ready for production! 🚀