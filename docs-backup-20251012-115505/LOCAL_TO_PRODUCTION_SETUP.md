# Local to Production Deployment Setup

## ✅ What's Been Done

1. **SSH Key Generated** on your local machine
2. **Git Remote Changed** to use SSH (no more passwords!)
3. **GitHub Workflow Updated** to auto-deploy when you push

## 🔑 Your SSH Public Key

```
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAILrK8z9QF8k/i2D59ovYRaQydXEqdASVV4DNa4EN+HwT anamsayyed58@gmail.com
```

## 📋 Complete Setup Steps

### Step 1: Add SSH Key to GitHub (Local Machine)

1. Go to: **https://github.com/settings/ssh/new**
2. **Title:** `Local Development Machine`
3. **Key:** Paste the SSH key above (already in your clipboard)
4. Click **"Add SSH key"**

### Step 2: Add Server SSH Secrets to GitHub (For Auto-Deploy)

Go to: **https://github.com/Anamsayyed016/Naukrimili/settings/secrets/actions**

Add these 4 secrets:

| Secret Name | Value |
|------------|-------|
| `SSH_KEY` | Server private key (see below) |
| `SSH_USER` | `root` |
| `SSH_PORT` | `65002` (or your SSH port) |
| `HOST` | Your server IP/hostname |

**Server SSH_KEY value:**
```
-----BEGIN OPENSSH PRIVATE KEY-----
b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAAAMwAAAAtzc2gtZW
QyNTUxOQAAACAtejac1D2AUwcEQCXgDwb+bHAtzs9llOwz4dKe1NOTGAAAAKA/7rlAP+65
QAAAAAtzc2gtZWQyNTUxOQAAACAtejac1D2AUwcEQCXgDwb+bHAtzs9llOwz4dKe1NOTGA
AAAEAdmcU1Az4YiEI53kAm/B53teM2ACmPagmh4MmWt/TJky16NpzUPYBTBwRAJeAPBv5s
cC3Oz2WU7DPh0p7U05MYAAAAFmFuYW1zYXl5ZWQ1OEBnbWFpbC5jb20BAgMEBQYH
-----END OPENSSH PRIVATE KEY-----
```

### Step 3: Test SSH Connection

Run this to verify GitHub recognizes your SSH key:

```powershell
ssh -T git@github.com
```

Expected output: `Hi Anamsayyed016! You've successfully authenticated...`

### Step 4: Push Changes and Auto-Deploy

Now when you make changes locally:

```powershell
# Make your code changes

# Stage changes
git add .

# Commit changes
git commit -m "Your commit message"

# Push to GitHub (will auto-deploy to production!)
git push origin main
```

## 🚀 How It Works

```
┌─────────────────┐
│ Your Computer   │
│ (Local Machine) │
└────────┬────────┘
         │
         │ git push origin main
         │
         ▼
┌─────────────────┐
│    GitHub       │
│  (Repository)   │
└────────┬────────┘
         │
         │ GitHub Actions Workflow
         │ 1. Build app
         │ 2. Copy to server via SSH
         │ 3. Restart PM2
         │
         ▼
┌─────────────────┐
│ Production      │
│ Server          │
│ (naukrimili.com)   │
└─────────────────┘
```

## 🔄 Complete Workflow

### On Local Machine (Windows):

```powershell
# Edit files
code app/jobs/JobsClient.tsx

# Commit changes
git add .
git commit -m "Updated jobs client"

# Push (triggers auto-deployment)
git push origin main
```

### What Happens Automatically:

1. ✅ GitHub receives your push
2. ✅ GitHub Actions workflow starts
3. ✅ Builds your Next.js app
4. ✅ Connects to your server via SSH
5. ✅ Copies files to `/var/www/jobportal`
6. ✅ Installs dependencies
7. ✅ Restarts PM2
8. ✅ Your site is live at https://naukrimili.com

### On Server (After Push):

You can monitor the deployment:

```bash
# Watch PM2 logs
pm2 logs jobportal

# Check status
pm2 status

# View deployment logs
tail -f /var/www/jobportal/logs/out.log
```

## 🎯 Quick Commands

### Local Machine:

```powershell
# Check git status
git status

# See what changed
git diff

# Push to production
git push origin main

# Pull latest changes
git pull origin main

# Check remote URL (should be SSH)
git remote -v
```

### Server:

```bash
# Check PM2 status
pm2 status

# View logs
pm2 logs jobportal --lines 50

# Restart app
pm2 restart jobportal

# Check if site is running
curl http://localhost:3000
```

## 📊 Monitor Deployments

Watch your deployments at:
**https://github.com/Anamsayyed016/Naukrimili/actions**

Green checkmark = Successful deployment ✅
Red X = Failed deployment ❌

## 🐛 Troubleshooting

### "Permission denied (publickey)"

**Local machine:**
- Make sure you added your SSH key to GitHub
- Test: `ssh -T git@github.com`

**GitHub Actions:**
- Make sure all 4 secrets are added correctly
- Check the SSH_KEY secret is complete (including BEGIN/END lines)

### "Push rejected"

```powershell
git pull origin main --rebase
git push origin main
```

### Changes not deploying

1. Check GitHub Actions: https://github.com/Anamsayyed016/Naukrimili/actions
2. Look for errors in the workflow
3. Check server logs: `pm2 logs jobportal`

## ✅ Verification Checklist

Before pushing:
- [ ] Added SSH key to GitHub (local machine)
- [ ] Added 4 secrets to GitHub Actions
- [ ] Tested SSH connection: `ssh -T git@github.com`
- [ ] Git remote uses SSH (not HTTPS)

Your setup is complete! Just push to deploy! 🚀

