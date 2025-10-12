# GitHub Secrets Setup Guide

## Problem Fixed

The GitHub Actions deployment was failing because SSH secrets weren't properly configured. The workflow has been updated to:

1. **Check if secrets exist** before attempting SSH deployment
2. **Skip SSH steps gracefully** if secrets are missing
3. **Still build the application** successfully even without secrets

## Required GitHub Secrets

Add these secrets to your GitHub repository:

### Go to: 
```
https://github.com/Anamsayyed016/Naukrimili/settings/secrets/actions
```

### Add These Secrets:

| Secret Name | Value | Description |
|------------|-------|-------------|
| `SSH_KEY` | Your private SSH key content | The SSH key you generated on the server |
| `SSH_USER` | `root` | The username to connect with |
| `SSH_PORT` | `65002` or `22` | Your SSH port |
| `HOST` | Your server IP | e.g., `your-server-ip.com` |

## Getting Your SSH Private Key

On your server, run:

```bash
# Display your private key
cat ~/.ssh/id_ed25519
```

Copy the ENTIRE output (including `-----BEGIN OPENSSH PRIVATE KEY-----` and `-----END OPENSSH PRIVATE KEY-----`)

## Step-by-Step Setup

### 1. Get Your SSH Key

```bash
# On your server
cat ~/.ssh/id_ed25519
```

### 2. Add to GitHub

1. Go to: https://github.com/Anamsayyed016/Naukrimili/settings/secrets/actions
2. Click "New repository secret"
3. Add each secret:

**SSH_KEY:**
- Name: `SSH_KEY`
- Value: Paste the entire private key from step 1

**SSH_USER:**
- Name: `SSH_USER`  
- Value: `root`

**SSH_PORT:**
- Name: `SSH_PORT`
- Value: `65002` (or `22` if that's your SSH port)

**HOST:**
- Name: `HOST`
- Value: Your server IP address

### 3. Test the Workflow

After adding all secrets:

```bash
# On your local machine, commit and push
git add .
git commit -m "Update deployment workflow"
git push origin main
```

The GitHub Action will now:
- ✅ Build your application
- ✅ Deploy to your server via SSH
- ✅ Start with PM2

## Current Status

✅ **SSH authentication fixed** - Git now uses SSH (no password needed)
✅ **Workflow updated** - Won't fail if secrets are missing
✅ **Build works** - Application builds successfully

⏳ **Next step** - Add GitHub secrets to enable auto-deployment

## Manual Deployment (If You Don't Want GitHub Actions)

You can also deploy manually on your server:

```bash
# On your server
cd /var/www/jobportal

# Pull latest code
git pull origin main

# Install dependencies
npm install --legacy-peer-deps --force

# Build
npm run build

# Restart PM2
pm2 restart jobportal
```

## Troubleshooting

### Error: "Permission denied (publickey)"

This means the SSH_KEY secret is not set or incorrect. Make sure you:
1. Copied the ENTIRE private key (including BEGIN/END lines)
2. Added it to GitHub secrets exactly as copied

### Error: "Host key verification failed"

The workflow now automatically handles host key scanning. If this still occurs, check that your HOST value is correct.

### Workflow Skips Deployment

If you see "SSH deployment skipped - secrets not configured":
- Check that ALL four secrets are added (SSH_KEY, SSH_USER, SSH_PORT, HOST)
- Make sure there are no typos in secret names
- Verify secrets are added to the repository, not your personal account

## Need Help?

Run this on your server to see current git config:

```bash
git remote -v
git config --list | grep user
```

