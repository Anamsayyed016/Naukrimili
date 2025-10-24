# 🔧 Deployment Troubleshooting Guide

## 🚨 Common Issues and Solutions

### 1. **GitHub Secrets Not Set**

#### ❌ Error:
```
Context access might be invalid: HOST, SSH_USER, SSH_KEY, SSH_PORT
```

#### ✅ Solution:
1. Go to your GitHub repository
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Add these secrets:
   - `HOST`: Your server IP address (e.g., `123.456.789.0`)
   - `SSH_USER`: SSH username (usually `root`)
   - `SSH_KEY`: Your private SSH key content
   - `SSH_PORT`: SSH port (usually `22`)

#### 🔍 How to get SSH key:
```bash
# On your local machine
cat ~/.ssh/id_rsa
# Copy the entire content including -----BEGIN and -----END lines
```

### 2. **SSH Connection Failed**

#### ❌ Error:
```
ssh: handshake failed
```

#### ✅ Solution:
1. **Test SSH connection manually:**
   ```bash
   ssh -i ~/.ssh/your_key user@your-server-ip
   ```

2. **Check SSH key format:**
   - Make sure the key starts with `-----BEGIN` and ends with `-----END`
   - No extra spaces or newlines

3. **Verify server access:**
   ```bash
   # Test connection
   ssh -o ConnectTimeout=10 user@server-ip "echo 'Connection successful'"
   ```

### 3. **Node.js Version Issues**

#### ❌ Error:
```
Unsupported engine { package: 'lru-cache@11.2.2', required: { node: '20 || >=***' }, current: { node: 'v18.20.8' } }
```

#### ✅ Solution:
The deployment script automatically installs Node.js 20.x, but if it fails:

```bash
# On your server
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
node --version  # Should show v20.x.x
```

### 4. **Build Failures**

#### ❌ Error:
```
Module not found: Can't resolve '@/components/ui/card'
```

#### ✅ Solution:
The deployment script creates UI components automatically. If it fails:

1. **Check if components are created:**
   ```bash
   ls -la components/ui/
   ```

2. **Manually create components:**
   ```bash
   mkdir -p components/ui lib
   # The deployment script will create the files
   ```

### 5. **PM2 Process Issues**

#### ❌ Error:
```
PM2 process not starting
```

#### ✅ Solution:
1. **Check PM2 status:**
   ```bash
   pm2 status
   pm2 logs jobportal
   ```

2. **Restart PM2:**
   ```bash
   pm2 kill
   pm2 start ecosystem.config.cjs --env production
   ```

3. **Check if port is in use:**
   ```bash
   lsof -i :3000
   # Kill process if needed
   lsof -ti:3000 | xargs kill -9
   ```

### 6. **Health Check Failures**

#### ❌ Error:
```
Health check failed after 10 attempts
```

#### ✅ Solution:
1. **Check if app is running:**
   ```bash
   pm2 status
   curl http://localhost:3000/api/health
   ```

2. **Check logs:**
   ```bash
   pm2 logs jobportal --lines 50
   ```

3. **Verify health endpoint exists:**
   ```bash
   # Check if health endpoint is implemented
   curl -v http://localhost:3000/api/health
   ```

## 🔍 Debug Commands

### Test SSH Connection
```bash
# Test SSH connection
ssh -i ~/.ssh/your_key -o ConnectTimeout=10 user@server-ip "echo 'SSH works'"
```

### Test Server Prerequisites
```bash
# Check Node.js
ssh user@server-ip "node --version"

# Check npm
ssh user@server-ip "npm --version"

# Check PM2
ssh user@server-ip "pm2 --version"

# Check git
ssh user@server-ip "git --version"
```

### Test Deployment Manually
```bash
# Run the debug script
chmod +x scripts/debug-deployment.sh
./scripts/debug-deployment.sh
```

## 📋 Pre-Deployment Checklist

### ✅ GitHub Secrets
- [ ] `HOST` is set to your server IP
- [ ] `SSH_USER` is set to your SSH username
- [ ] `SSH_KEY` contains your private SSH key
- [ ] `SSH_PORT` is set to your SSH port (usually 22)

### ✅ Server Prerequisites
- [ ] Server has internet access
- [ ] SSH access is working
- [ ] Project directory exists (`/root/jobportal`)
- [ ] Git is installed
- [ ] Node.js 20.x is installed (or will be installed)
- [ ] PM2 is installed
- [ ] Port 3000 is available

### ✅ Project Files
- [ ] `package.json` exists
- [ ] `ecosystem.config.cjs` exists
- [ ] `.github/workflows/deploy.yml` exists
- [ ] Health endpoint exists (`/api/health`)

## 🚀 Quick Fixes

### Fix 1: Reset Everything
```bash
# On your server
cd /root/jobportal
pm2 kill
git reset --hard origin/main
git clean -fd
rm -rf node_modules .next
npm install --legacy-peer-deps --force
npm run build
pm2 start ecosystem.config.cjs --env production
```

### Fix 2: Manual Deployment
```bash
# Run the universal deploy script
chmod +x scripts/universal-deploy.sh
./scripts/universal-deploy.sh
```

### Fix 3: Check Logs
```bash
# Check PM2 logs
pm2 logs jobportal --lines 100

# Check system logs
tail -f /var/log/jobportal/error.log
```

## 📞 Getting Help

### 1. **Check GitHub Actions Logs**
- Go to your repository
- Click **Actions** tab
- Click on the failed workflow
- Check the logs for specific errors

### 2. **Run Debug Script**
```bash
# Test everything
chmod +x scripts/debug-deployment.sh
./scripts/debug-deployment.sh
```

### 3. **Manual Testing**
```bash
# Test individual components
chmod +x scripts/test-deployment.sh
./scripts/test-deployment.sh
```

## 🎯 Success Indicators

### ✅ Deployment Successful When:
- [ ] GitHub Actions workflow completes without errors
- [ ] SSH connection is established
- [ ] Dependencies are installed
- [ ] Build completes successfully
- [ ] PM2 process starts
- [ ] Health check passes
- [ ] Application responds on port 3000

### 📊 Monitoring Commands
```bash
# Check deployment status
pm2 status

# Monitor logs
pm2 logs jobportal --lines 0

# Check health
curl http://localhost:3000/api/health

# Check system resources
htop
```

---

**If you're still having issues, run the debug script and share the output for further assistance.**
