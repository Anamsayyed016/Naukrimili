# Your GitHub Secrets Setup

## SSH Keys Generated Successfully! ✅

Your SSH keys have been generated and are ready to use.

## Step 1: Copy Public Key to Your VPS

**Copy this public key to your VPS `~/.ssh/authorized_keys` file:**

```
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIGAgCllFE9SzEh0cqqH2ZwXCUGmTGxKiKmH8ZthEBkfT github-actions-deploy
```

**On your VPS, run:**
```bash
mkdir -p ~/.ssh
echo "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIGAgCllFE9SzEh0cqqH2ZwXCUGmTGxKiKmH8ZthEBkfT github-actions-deploy" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
chmod 700 ~/.ssh
```

## Step 2: Set GitHub Repository Secrets

Go to: https://github.com/Anamsayyed016/Naukrimili/settings/secrets/actions

Click **"New repository secret"** for each of these:

### 1. HOST Secret
- **Name:** `HOST`
- **Value:** Your VPS IP address or domain name

### 2. SSH_USER Secret
- **Name:** `SSH_USER`
- **Value:** `root` (or `ubuntu` if that's your VPS username)

### 3. SSH_KEY Secret
- **Name:** `SSH_KEY`
- **Value:** Copy this entire private key:
```
-----BEGIN OPENSSH PRIVATE KEY-----
b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAAAMwAAAAtzc2gtZW
QyNTUxOQAAACBgIApZRRPUsxIdHKqh9mcFwlBpkxsSoiph/GbYRAZH0wAAAJh/r9dmf6/X
ZgAAAAtzc2gtZWQyNTUxOQAAACBgIApZRRPUsxIdHKqh9mcFwlBpkxsSoiph/GbYRAZH0w
AAAECIL/vT+Iq3FeYo0NEjeFk2y+5aC3+Xr6hchuzWi5TfQGAgCllFE9SzEh0cqqH2ZwXC
UGmTGxKiKmH8ZthEBkfTAAAAFWdpdGh1Yi1hY3Rpb25zLWRlcGxveQ==
-----END OPENSSH PRIVATE KEY-----
```

### 4. SSH_PORT Secret
- **Name:** `SSH_PORT`
- **Value:** `22`

## Step 3: Test Your Setup

After setting up all secrets:

1. Go to: https://github.com/Anamsayyed016/Naukrimili/actions
2. Click **"Production Deployment"** workflow
3. Click **"Run workflow"** button
4. Select **main** branch
5. Click **"Run workflow"**

## Quick Test Commands

Test SSH connection manually:
```bash
ssh -i ~/.ssh/github_actions_deploy root@YOUR_VPS_IP
```

## Your Key Files Location
- **Private Key:** `C:\Users\anams\.ssh\github_actions_deploy`
- **Public Key:** `C:\Users\anams\.ssh\github_actions_deploy.pub`

## Next Steps
1. Copy the public key to your VPS
2. Set all 4 GitHub secrets
3. Run the deployment workflow
4. Check the Actions logs for any issues

Your deployment should work once all secrets are properly configured!
