# 🚀 DIRECT KVM2 SERVER DEPLOYMENT COMMANDS

## 📋 SERVER DETAILS:
- **Server IP:** 69.62.73.84
- **SSH Username:** root
- **Hostname:** srv939274.hstgr.cloud
- **OS:** AlmaLinux 9 with cPanel
- **Location:** India - Mumbai

## 🔧 DEPLOYMENT COMMANDS:

### 1️⃣ CONNECT TO YOUR SERVER:
```bash
ssh root@69.62.73.84
```

### 2️⃣ SETUP DEPLOYMENT DIRECTORY:
```bash
cd /var/www/html
rm -rf * .*  # Clean existing files
```

### 3️⃣ CLONE YOUR REPOSITORY:
```bash
git clone https://github.com/Anamsayyed016/Naukrimili.git .
```

### 4️⃣ INSTALL NODE.JS & PNPM:
```bash
# Install Node.js 18 LTS
curl -fsSL https://rpm.nodesource.com/setup_18.x | bash -
dnf install -y nodejs

# Install pnpm
npm install -g pnpm

# Install PM2 for process management
npm install -g pm2
```

### 5️⃣ BUILD THE PROJECT:
```bash
# Install dependencies
pnpm install

# Build for production
NODE_ENV=production pnpm run build
```

### 6️⃣ CONFIGURE WEB SERVER:
```bash
# Create .htaccess for cPanel
cat > .htaccess << 'EOF'
RewriteEngine On
RewriteBase /

# Handle Next.js static export
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ /index.html [L,QSA]

# Enable compression
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/html text/css application/javascript
</IfModule>

# Cache static files
<IfModule mod_expires.c>
    ExpiresActive On
    ExpiresByType text/css "access plus 1 year"
    ExpiresByType application/javascript "access plus 1 year"
    ExpiresByType image/* "access plus 1 year"
</IfModule>
EOF
```

### 7️⃣ COPY BUILD FILES:
```bash
# Copy static export files to web root
cp -r out/* /var/www/html/
# OR if using .next build
cp -r .next/static/* /var/www/html/static/ 2>/dev/null || true
cp -r public/* /var/www/html/
```

### 8️⃣ SET PERMISSIONS:
```bash
chown -R nobody:nobody /var/www/html
chmod -R 755 /var/www/html
```

### 9️⃣ START NODE.JS SERVICE (Optional):
```bash
# Start with PM2
pm2 start npm --name "naukrimili" -- start
pm2 save
pm2 startup
```

## 🔗 ACCESS YOUR SITE:

Your site will be available at:
- **IP Direct:** http://69.62.73.84
- **Hostname:** http://srv939274.hstgr.cloud
- **When domain connected:** http://yourdomain.com

## 🚀 ONE-COMMAND DEPLOYMENT SCRIPT:

Save this as `deploy.sh` and run it:

```bash
#!/bin/bash
cd /var/www/html
git clone https://github.com/Anamsayyed016/Naukrimili.git temp
mv temp/* .
mv temp/.* . 2>/dev/null || true
rmdir temp
curl -fsSL https://rpm.nodesource.com/setup_18.x | bash -
dnf install -y nodejs
npm install -g pnpm pm2
pnpm install
NODE_ENV=production pnpm run build
cp -r out/* . 2>/dev/null || cp -r .next/static/* ./static/ 2>/dev/null
cp -r public/* .
chown -R nobody:nobody /var/www/html
chmod -R 755 /var/www/html
echo "✅ Deployment completed! Visit http://69.62.73.84"
```

## 📞 QUICK TEST:
```bash
curl -I http://69.62.73.84
```

Your NaukriMili job portal will be live at **http://69.62.73.84** once deployed! 🚀
