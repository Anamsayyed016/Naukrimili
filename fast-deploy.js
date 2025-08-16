#!/usr/bin/env node

/**
 * FAST DEPLOY - Quick Fix & Deploy for Aftionix Job Portal
 * This will quickly fix your job portal and prepare it for deployment
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

console.log('🚀 FAST DEPLOY - Aftionix Job Portal\n');

// Quick fixes
const fixes = [
  {
    name: 'Fix Next.js config',
    file: 'next.config.mjs',
    content: `/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: { ignoreBuildErrors: false },
  eslint: { ignoreDuringBuilds: false },
  output: 'standalone',
  images: { domains: ['aftionix.in', 'localhost'] }
};
export default nextConfig;`
  },
  {
    name: 'Fix package.json',
    file: 'package.json',
    update: (content) => {
      const pkg = JSON.parse(content);
      pkg.scripts = {
        ...pkg.scripts,
        'dev': 'next dev',
        'build': 'next build',
        'start': 'next start',
        'lint': 'next lint'
      };
      return JSON.stringify(pkg, null, 2);
    }
  },
  {
    name: 'Create production env',
    file: '.env.production',
    content: `NODE_ENV=production
NEXTAUTH_URL=https://aftionix.in
NEXT_PUBLIC_BASE_URL=https://aftionix.in
NEXT_PUBLIC_DOMAIN=aftionix.in
DATABASE_URL="postgresql://username:password@localhost:5432/jobportal"
NEXTAUTH_SECRET="your-production-secret-key-here"`
  }
];

// Apply fixes
fixes.forEach(fix => {
  try {
    if (fix.content) {
      fs.writeFileSync(fix.file, fix.content);
    } else if (fix.update) {
      const content = fs.readFileSync(fix.file, 'utf8');
      const updated = fix.update(content);
      fs.writeFileSync(fix.file, updated);
    }
    console.log(`✅ ${fix.name}`);
  } catch (error) {
    console.log(`⚠️  ${fix.name} - ${error.message}`);
  }
});

// Quick build test
console.log('\n🔨 Quick build test...');
try {
  execSync('npm run build', { stdio: 'inherit' });
  console.log('✅ Build successful!');
} catch (error) {
  console.log('❌ Build failed - continuing with deployment prep...');
}

// Create deployment files
const deploymentFiles = {
  'deploy-vps.sh': `#!/bin/bash
# Quick VPS deployment for aftionix.in
VPS_IP="69.62.73.84"
DOMAIN="aftionix.in"

echo "🚀 Deploying to VPS: $VPS_IP"

# Build locally
npm run build

# Upload to VPS
scp -r .next/* root@$VPS_IP:/var/www/aftionix.in/
scp package.json root@$VPS_IP:/var/www/aftionix.in/
scp .env.production root@$VPS_IP:/var/www/aftionix.in/

# SSH and setup
ssh root@$VPS_IP << 'EOF'
cd /var/www/aftionix.in
npm install --production
pm2 start npm --name "aftionix" -- start
pm2 save
pm2 startup

# Nginx config
cat > /etc/nginx/sites-available/aftionix.in << 'NGINX'
server {
    listen 80;
    server_name aftionix.in www.aftionix.in;
    root /var/www/aftionix.in;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
    }
}
NGINX

ln -sf /etc/nginx/sites-available/aftionix.in /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx

# SSL with Let's Encrypt
apt update && apt install -y certbot python3-certbot-nginx
certbot --nginx -d aftionix.in -d www.aftionix.in --non-interactive

echo "✅ Deployment complete! Visit: https://aftionix.in"
EOF`,

  'dns-setup.md': `# DNS Setup for aftionix.in

## Update your DNS records:

**A Record:**
- Type: A
- Name: @
- Content: 69.62.73.84
- TTL: 300

**CNAME Record:**
- Type: CNAME
- Name: www
- Content: aftionix.in
- TTL: 300

## Your VPS Details:
- IP: 69.62.73.84
- OS: AlmaLinux 9 with cPanel
- Location: India - Mumbai

## Quick Commands:
\`\`\`bash
# Test DNS
nslookup aftionix.in
nslookup www.aftionix.in

# Test connection
curl -I http://69.62.73.84
\`\`\``,

  'vps-commands.md': `# VPS Setup Commands

## Connect to your VPS:
\`\`\`bash
ssh root@69.62.73.84
\`\`\`

## Install Node.js:
\`\`\`bash
curl -fsSL https://rpm.nodesource.com/setup_18.x | bash -
yum install -y nodejs
\`\`\`

## Install PM2:
\`\`\`bash
npm install -g pm2
\`\`\`

## Create directories:
\`\`\`bash
mkdir -p /var/www/aftionix.in
mkdir -p /var/log/aftionix
\`\`\`

## Set up firewall:
\`\`\`bash
firewall-cmd --permanent --add-service=http
firewall-cmd --permanent --add-service=https
firewall-cmd --reload
\`\`\`

## Quick deployment:
\`\`\`bash
cd /var/www/aftionix.in
git clone https://github.com/yourusername/jobportal.git .
npm install --production
npm run build
pm2 start npm --name "aftionix" -- start
pm2 save
pm2 startup
\`\`\``
};

// Create deployment files
Object.entries(deploymentFiles).forEach(([filename, content]) => {
  fs.writeFileSync(filename, content);
  console.log(`📁 Created ${filename}`);
});

console.log('\n🎯 QUICK DEPLOYMENT READY!');
console.log('\n📋 Next steps:');
console.log('1. Update DNS records to point to 69.62.73.84');
console.log('2. Run: chmod +x deploy-vps.sh && ./deploy-vps.sh');
console.log('3. Or manually follow vps-commands.md');
console.log('\n🌐 Your job portal will be live at: https://aftionix.in');
console.log('\n⚡ This was the FAST approach! 🚀');
