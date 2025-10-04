# 🔑 GitHub Secrets Setup Guide

## Required Secrets for Deployment

Your deployment workflow requires these GitHub Secrets to be configured:

### 1. Go to GitHub Secrets Settings
- Navigate to: `https://github.com/anamsayyed58/jobportal/settings/secrets/actions`
- Click **"New repository secret"** for each secret below

### 2. Add These Secrets:

#### **HOST**
- **Name**: `HOST`
- **Value**: `aftionix.in` (or your server IP address)

#### **SSH_USER**
- **Name**: `SSH_USER`
- **Value**: `root`

#### **SSH_KEY**
- **Name**: `SSH_KEY`
- **Value**: Your private SSH key (see below for generation)

#### **SSH_PORT**
- **Name**: `SSH_PORT`
- **Value**: `22`

## 🔑 Generate SSH Key (If You Don't Have One)

### On Your Server:
```bash
# Generate SSH key
ssh-keygen -t ed25519 -C "github-deploy@jobportal" -f ~/.ssh/github_deploy -N ""

# Add to authorized_keys
cat ~/.ssh/github_deploy.pub >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
chmod 700 ~/.ssh

# Display the keys
echo "=== PUBLIC KEY (for authorized_keys) ==="
cat ~/.ssh/github_deploy.pub

echo ""
echo "=== PRIVATE KEY (for GitHub Secrets) ==="
cat ~/.ssh/github_deploy
```

### Copy the Private Key
- Copy the **PRIVATE KEY** output (starts with `-----BEGIN OPENSSH PRIVATE KEY-----`)
- Paste it as the value for the `SSH_KEY` secret in GitHub

## ✅ Verify Setup

After adding all secrets, your GitHub Secrets page should show:
- ✅ HOST
- ✅ SSH_USER  
- ✅ SSH_KEY
- ✅ SSH_PORT

## 🚀 Test Deployment

Once secrets are configured:
1. Go to: `https://github.com/anamsayyed58/jobportal/actions`
2. Click **"🚀 Production Deployment"**
3. Click **"Run workflow"**
4. Select **main** branch
5. Click **"Run workflow"**

The deployment should now work without the "missing secrets" errors!