# 🚀 VPS Setup Complete Guide

## ✅ **Your Current Setup:**
- **Project Directory**: `/var/www/jobportal`
- **Deployment Commands**: 
  ```bash
  cd /var/www/jobportal
  pm2 stop jobportal
  git pull origin main
  npm ci
  npm run build:fast
  pm2 start ecosystem.config.cjs --env production
  ```

## 🔧 **GitHub Actions Workflow Updated**

The workflow now uses your exact directory and commands:

```yaml
script: |
  echo "Starting deployment to Hostinger VPS..."
  # Navigate to project directory
  cd /var/www/jobportal
  
  # Stop PM2 process
  pm2 stop jobportal
  
  # Pull latest changes
  git pull origin main
  
  # Install dependencies and build
  npm ci
  npm run build:fast
  
  # Start PM2 process with production environment
  pm2 start ecosystem.config.cjs --env production
  
  echo "Deployment completed successfully!"
```

## 🔑 **SSH Key Setup for GitHub Actions**

### Step 1: Generate SSH Key on VPS
```bash
# On your VPS, generate SSH key for GitHub Actions
ssh-keygen -t rsa -b 4096 -f ~/.ssh/github_deploy -N "" -C "github-deploy@jobportal"

# Add to authorized_keys
cat ~/.ssh/github_deploy.pub >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
chmod 700 ~/.ssh
```

### Step 2: Get the Keys
```bash
# Display public key (for GitHub repository secrets)
echo "=== PUBLIC KEY ==="
cat ~/.ssh/github_deploy.pub

echo ""
echo "=== PRIVATE KEY ==="
cat ~/.ssh/github_deploy
```

### Step 3: Update GitHub Secrets
Go to: https://github.com/Anamsayyed016/Naukrimili/settings/secrets/actions

Add these secrets:
- **HOST**: `69.62.73.84`
- **SSH_USER**: `root`
- **SSH_KEY**: [Copy the private key from step 2]
- **SSH_PORT**: `22`

## 🧪 **Test the Setup**

### Test SSH Connection
```bash
# Test from your local machine
ssh -i ~/.ssh/github_deploy root@69.62.73.84
```

### Test Manual Deployment
```bash
# On your VPS, run the manual deployment script
chmod +x deploy-manual.sh
./deploy-manual.sh
```

### Test GitHub Actions
```bash
# Push changes to trigger deployment
git add .
git commit -m "Test automated deployment"
git push origin main
```

## 🔍 **Troubleshooting**

### If SSH connection fails:
```bash
# Check SSH service
systemctl status ssh

# Check firewall
ufw status

# Check SSH logs
tail -f /var/log/auth.log
```

### If PM2 fails:
```bash
# Check PM2 status
pm2 status

# Check PM2 logs
pm2 logs jobportal --lines 20

# Restart PM2
pm2 restart jobportal
```

### If build fails:
```bash
# Check Node.js version
node --version

# Check npm version
npm --version

# Clear npm cache
npm cache clean --force

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

## 📋 **Quick Commands Reference**

### Manual Deployment:
```bash
cd /var/www/jobportal
pm2 stop jobportal
git pull origin main
npm ci
npm run build:fast
pm2 start ecosystem.config.cjs --env production
```

### Check Status:
```bash
pm2 status
pm2 logs jobportal --lines 10
curl http://localhost:3000/api/health
```

### Restart Services:
```bash
pm2 restart jobportal
systemctl restart nginx
```

This setup should now work perfectly with your existing workflow! 🎉
