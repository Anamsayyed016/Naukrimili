# 🔧 GitHub Workflow Troubleshooting Guide

## 🚨 **Current Issues Identified:**

### 1. **Workflow File Problems**
- **Issue**: Current workflow is 968 lines with massive inline component creation
- **Problem**: Error-prone and difficult to debug
- **Solution**: Use the optimized workflow file I created

### 2. **Missing GitHub Secrets**
The workflow requires these secrets in your GitHub repository:

#### Required Secrets:
1. **HOST**: Your VPS IP address (e.g., `69.62.73.84`)
2. **SSH_USER**: SSH username (e.g., `root`)
3. **SSH_KEY**: Your private SSH key
4. **SSH_PORT**: SSH port (e.g., `22`)

#### How to Set Secrets:
1. Go to your GitHub repository
2. Click on **Settings** tab
3. Click on **Secrets and variables** → **Actions**
4. Click **New repository secret**
5. Add each secret with the exact names above

### 3. **SSH Key Setup**
If you don't have SSH keys set up:

```bash
# Generate new SSH key pair
ssh-keygen -t ed25519 -C "your-email@example.com"

# Copy public key to your VPS
ssh-copy-id root@YOUR_VPS_IP

# Copy private key content for GitHub secret
cat ~/.ssh/id_ed25519
```

### 4. **VPS Directory Setup**
Ensure the project directory exists on your VPS:

```bash
# SSH into your VPS
ssh root@YOUR_VPS_IP

# Create project directory
mkdir -p /root/jobportal
cd /root/jobportal

# Initialize git if needed
git init
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
```

## 🔧 **Quick Fix Steps:**

### Step 1: Replace Current Workflow
1. Delete the current `.github/workflows/deploy.yml`
2. Rename `.github/workflows/deploy-optimized.yml` to `deploy.yml`

### Step 2: Verify GitHub Secrets
Check that all required secrets are set in your repository settings.

### Step 3: Test SSH Connection
```bash
# Test SSH connection manually
ssh -i ~/.ssh/id_ed25519 root@YOUR_VPS_IP
```

### Step 4: Check VPS Prerequisites
```bash
# On your VPS, ensure these are installed:
node --version  # Should be 18+
npm --version   # Should be 8+
pm2 --version   # Should be installed globally
```

## 🐛 **Common Error Solutions:**

### Error: "SSH handshake failed"
- **Cause**: Wrong SSH key or user
- **Fix**: Regenerate SSH keys and update GitHub secrets

### Error: "Permission denied"
- **Cause**: Wrong SSH user or key permissions
- **Fix**: Check SSH key permissions: `chmod 600 ~/.ssh/id_ed25519`

### Error: "Directory not found"
- **Cause**: Project directory doesn't exist on VPS
- **Fix**: Create directory: `mkdir -p /root/jobportal`

### Error: "PM2 not found"
- **Cause**: PM2 not installed on VPS
- **Fix**: Install PM2: `npm install -g pm2`

### Error: "Build failed"
- **Cause**: Missing dependencies or build issues
- **Fix**: Check build logs and ensure all dependencies are installed

## 📋 **Verification Checklist:**

- [ ] GitHub secrets are properly set
- [ ] SSH connection works manually
- [ ] VPS has Node.js 18+ installed
- [ ] VPS has PM2 installed globally
- [ ] Project directory exists on VPS
- [ ] Git repository is properly configured on VPS
- [ ] Optimized workflow file is in place

## 🚀 **Next Steps:**

1. **Immediate**: Replace the current workflow with the optimized version
2. **Verify**: Check all GitHub secrets are set correctly
3. **Test**: Run the workflow manually using "workflow_dispatch"
4. **Monitor**: Check the Actions tab for any remaining errors

## 📞 **If Still Failing:**

1. Check the GitHub Actions logs for specific error messages
2. Verify all secrets are correctly set
3. Test SSH connection manually
4. Check VPS logs: `pm2 logs jobportal`
5. Ensure the VPS has sufficient resources (RAM, disk space)

The optimized workflow should resolve most deployment issues! 🎉
