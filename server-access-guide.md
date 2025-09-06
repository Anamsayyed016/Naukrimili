# Server Access Troubleshooting Guide

## If you can't access the server terminal:

### 1. SSH Connection Issues
```bash
# Try these commands from your local machine:
ssh -v root@69.62.73.84
ssh -o ConnectTimeout=30 root@69.62.73.84
ssh -o ServerAliveInterval=60 root@69.62.73.84
```

### 2. Alternative Access Methods
- **Hostinger Control Panel**: Log into your Hostinger account and use the terminal from there
- **VNC/Console Access**: Check if Hostinger provides console access
- **File Manager**: Use Hostinger's file manager to upload scripts

### 3. Upload Scripts via File Manager
1. Upload these files to `/var/www/jobportal/`:
   - `fix-504-error.sh`
   - `debug-server.sh`
   - `nginx-fix.conf`
   - `ecosystem.optimized.cjs`

2. Make them executable:
```bash
chmod +x fix-504-error.sh debug-server.sh
```

3. Run the fix:
```bash
./fix-504-error.sh
```

## Quick Fix Commands (if you get terminal access):

### Step 1: Check what's running
```bash
pm2 status
ps aux | grep node
netstat -tlnp | grep :3000
```

### Step 2: Kill everything and restart
```bash
pm2 stop all
pm2 delete all
pkill -f node
systemctl restart nginx
```

### Step 3: Navigate and rebuild
```bash
cd /var/www/jobportal
git pull origin main
npm ci --only=production --legacy-peer-deps
npx prisma generate
NODE_OPTIONS="--max-old-space-size=4096" npx next build --no-lint
```

### Step 4: Start with optimized config
```bash
pm2 start ecosystem.optimized.cjs --env production
pm2 save
pm2 startup
```

### Step 5: Test
```bash
curl http://localhost:3000/api/health
pm2 logs jobportal
```

## Emergency Fix (if nothing works):

### Reset everything:
```bash
cd /var/www/jobportal
pm2 stop all
pm2 delete all
pkill -f node
rm -rf .next
npm ci --only=production --legacy-peer-deps
npx prisma generate
npm run build:ultra-fast
pm2 start ecosystem.optimized.cjs --env production
systemctl restart nginx
```

## Check nginx configuration:
```bash
nginx -t
systemctl status nginx
tail -f /var/log/nginx/error.log
```

## Monitor resources:
```bash
htop
free -h
df -h
```
