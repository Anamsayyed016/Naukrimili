# Manual Server Fix via Hostinger Control Panel

Since SSH is not accessible, follow these steps through Hostinger's control panel:

## Step 1: Access Hostinger Control Panel
1. Log into your Hostinger account
2. Go to your VPS management panel
3. Access the **File Manager** or **Terminal**

## Step 2: Upload Files (if using File Manager)
Upload these files to `/var/www/jobportal/`:
- All the `.sh` scripts we created
- `ecosystem.optimized.cjs`
- `nginx-fix.conf`

## Step 3: Run These Commands in Terminal

### Option A: Quick Fix (Copy-paste this entire block)
```bash
cd /var/www/jobportal
pm2 stop all
pm2 delete all
pkill -f node
git pull origin main
npm ci --only=production --legacy-peer-deps
npx prisma generate
NODE_OPTIONS="--max-old-space-size=4096" NEXT_TELEMETRY_DISABLED=1 npx next build --no-lint
pm2 start ecosystem.config.cjs --env production
systemctl restart nginx
pm2 status
```

### Option B: Step by Step
```bash
# 1. Navigate to project
cd /var/www/jobportal

# 2. Stop all processes
pm2 stop all
pm2 delete all
pkill -f node

# 3. Pull latest code
git pull origin main

# 4. Install dependencies
npm ci --only=production --legacy-peer-deps

# 5. Generate Prisma client
npx prisma generate

# 6. Build application
NODE_OPTIONS="--max-old-space-size=4096" NEXT_TELEMETRY_DISABLED=1 npx next build --no-lint

# 7. Start PM2
pm2 start ecosystem.config.cjs --env production

# 8. Restart nginx
systemctl restart nginx

# 9. Check status
pm2 status
curl http://localhost:3000/api/health
```

## Step 4: Update Nginx Configuration
```bash
# Backup current config
cp /etc/nginx/sites-available/default /etc/nginx/sites-available/default.backup

# Create new config
cat > /etc/nginx/sites-available/jobportal << 'EOF'
server {
    listen 80;
    server_name mum.hostingerps.com;
    
    proxy_connect_timeout 60s;
    proxy_send_timeout 60s;
    proxy_read_timeout 60s;
    send_timeout 60s;
    
    proxy_buffering on;
    proxy_buffer_size 128k;
    proxy_buffers 4 256k;
    proxy_busy_buffers_size 256k;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

# Test nginx config
nginx -t

# Reload nginx
systemctl reload nginx
```

## Step 5: Verify Everything Works
```bash
# Check PM2 status
pm2 status

# Check if app responds locally
curl http://localhost:3000/api/health

# Check nginx status
systemctl status nginx

# View logs if needed
pm2 logs jobportal
tail -f /var/log/nginx/error.log
```

## Step 6: Save PM2 Configuration
```bash
pm2 save
pm2 startup
```

## Troubleshooting
If you still get 504 errors:
1. Check memory usage: `free -h`
2. Check disk space: `df -h`
3. Check if port 3000 is in use: `netstat -tlnp | grep :3000`
4. Restart the server: `reboot`

## Expected Results
After running these commands:
- ✅ PM2 should show your app as "online"
- ✅ `curl http://localhost:3000/api/health` should return a response
- ✅ Your website should load without 504 errors
- ✅ Build time should be much faster (under 2 minutes)
