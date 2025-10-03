# GitHub Secrets Setup Guide

This guide will help you set up the required GitHub secrets for your deployment workflow.

## Required Secrets

Your deployment workflow needs these 4 secrets:

1. **HOST** - Your VPS server IP or domain
2. **SSH_USER** - Username for SSH connection (usually 'root' or 'ubuntu')
3. **SSH_KEY** - Your private SSH key (entire content of private key file)
4. **SSH_PORT** - SSH port (usually 22)

## Method 1: Using PowerShell Scripts (Recommended)

### Step 1: Generate SSH Keys
```powershell
# Run the SSH key generation script
.\scripts\generate-ssh-keys.ps1
```

### Step 2: Set up GitHub Secrets
```powershell
# Run the GitHub secrets setup script
.\scripts\setup-github-secrets.ps1
```

## Method 2: Manual Setup

### Step 1: Generate SSH Keys (if you don't have them)

#### Using Git Bash or WSL:
```bash
# Generate ED25519 key (recommended)
ssh-keygen -t ed25519 -C "github-actions-deploy"

# Or generate RSA key
ssh-keygen -t rsa -b 4096 -C "github-actions-deploy"
```

#### Using PowerShell (if OpenSSH is available):
```powershell
# Generate ED25519 key
ssh-keygen -t ed25519 -C "github-actions-deploy" -f "$env:USERPROFILE\.ssh\github_actions_deploy" -N '""'

# Or generate RSA key
ssh-keygen -t rsa -b 4096 -C "github-actions-deploy" -f "$env:USERPROFILE\.ssh\github_actions_deploy" -N '""'
```

### Step 2: Copy Public Key to VPS

1. Copy your public key content:
```bash
# Display public key
cat ~/.ssh/github_actions_deploy.pub
```

2. Add it to your VPS authorized_keys:
```bash
# On your VPS
mkdir -p ~/.ssh
echo "YOUR_PUBLIC_KEY_CONTENT" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
chmod 700 ~/.ssh
```

### Step 3: Set GitHub Secrets

1. Go to your GitHub repository
2. Click **Settings** > **Secrets and variables** > **Actions**
3. Click **New repository secret** for each secret:

#### HOST
- **Name**: `HOST`
- **Value**: Your VPS IP or domain (e.g., `192.168.1.100` or `myserver.com`)

#### SSH_USER
- **Name**: `SSH_USER`
- **Value**: SSH username (usually `root` or `ubuntu`)

#### SSH_KEY
- **Name**: `SSH_KEY`
- **Value**: Your entire private key content (including `-----BEGIN` and `-----END` lines)

#### SSH_PORT
- **Name**: `SSH_PORT`
- **Value**: SSH port (usually `22`)

## Method 3: Using GitHub CLI

If you have GitHub CLI installed:

```bash
# Set HOST
echo "YOUR_VPS_IP" | gh secret set HOST

# Set SSH_USER
echo "root" | gh secret set SSH_USER

# Set SSH_KEY
cat ~/.ssh/github_actions_deploy | gh secret set SSH_KEY

# Set SSH_PORT
echo "22" | gh secret set SSH_PORT
```

## Verify Setup

After setting up all secrets:

1. Go to your repository on GitHub
2. Click **Actions** tab
3. Click **Production Deployment** workflow
4. Click **Run workflow** button
5. Select **main** branch and click **Run workflow**

## Troubleshooting

### SSH Connection Issues
- Verify your VPS IP/domain is correct
- Check if SSH port is correct (usually 22)
- Ensure your public key is in VPS `~/.ssh/authorized_keys`
- Test SSH connection manually: `ssh -p 22 root@YOUR_VPS_IP`

### GitHub Secrets Issues
- Double-check secret names are exactly: `HOST`, `SSH_USER`, `SSH_KEY`, `SSH_PORT`
- Ensure SSH_KEY includes the entire private key content
- Verify there are no extra spaces or characters

### Build Issues
- Check if your VPS has Node.js 20+ installed
- Ensure your VPS has enough disk space
- Verify your VPS can access the internet for npm installs

## Security Notes

- Never commit private keys to your repository
- Use GitHub secrets for sensitive information
- Regularly rotate your SSH keys
- Keep your VPS updated and secure

## Need Help?

If you encounter issues:
1. Check the GitHub Actions logs for specific error messages
2. Verify all secrets are set correctly
3. Test SSH connection manually
4. Check VPS system resources and logs
