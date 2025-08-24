# Automated Deployment Setup

This guide will help you set up automatic deployment from GitHub to your Hostinger server.

## Prerequisites

- SSH access to your server
- GitHub repository with your code
- SSH key pair generated

## Step 1: Add SSH Key to Server

On your server, add your public SSH key to authorized_keys:

```bash
# On your server (69.62.73.84)
echo "YOUR_PUBLIC_SSH_KEY_CONTENT" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

## Step 2: Copy Deployment Script to Server

Copy the `deploy.sh` file to your server:

```bash
# From your local machine
scp deploy.sh root@69.62.73.84:/var/www/jobportal/
ssh root@69.62.73.84 "chmod +x /var/www/jobportal/deploy.sh"
```

## Step 3: Add GitHub Secrets

Go to your GitHub repository → Settings → Secrets and variables → Actions

Add these secrets:

- `HOSTINGER_HOST`: your server IP or hostname
- `HOSTINGER_USER`: ssh user, e.g. `root` or your panel user
- `HOSTINGER_SSH_KEY`: your private SSH key (no passphrase) or use a deploy key
- `HOSTINGER_PORT`: `22` (optional)
- Optionally customize:
  - `HOSTINGER_APP_DIR` (default `/var/www/jobportal`)
  - `HOSTINGER_REPO_URL` (auto-detected)
  - `HOSTINGER_BRANCH` (default `main`)

## Step 4: Test Deployment

1. Push the workflow file to your repository
2. Go to Actions tab in GitHub
3. The deployment should start automatically
4. Check the logs for any errors

## How It Works

1. Every push to `main` triggers `.github/workflows/hostinger-deploy.yml`
2. Action SSHes to your server using saved secrets
3. It clones/pulls your repo into `$HOSTINGER_APP_DIR`, installs deps, runs Prisma generate/migrate, builds, and starts via PM2

## Manual Deployment

You can also trigger deployment manually:
1. Go to Actions tab
2. Click "Deploy to Hostinger"
3. Click "Run workflow"

## Troubleshooting

- Check GitHub Actions logs for SSH connection errors
- Verify SSH key is correctly added to server
- Ensure `deploy.sh` is executable on server
- Check server logs: `journalctl -u jobportal -f`
