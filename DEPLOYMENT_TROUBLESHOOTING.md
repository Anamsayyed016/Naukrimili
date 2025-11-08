# 🚨 Deployment Troubleshooting Guide

## Error: `dial tcp ***:***: connect: connection timed out`

This error means GitHub Actions **cannot connect to your server via SSH**. This is a **network/firewall issue**, not a code problem.

---

## ✅ Solution Steps

### 1. **Allow GitHub Actions IPs (Most Common Fix)**

**On your server:**

```bash
# Upload and run the allow-github-ips.sh script
cd /var/www/naukrimili
chmod +x server-setup/allow-github-ips.sh
sudo ./server-setup/allow-github-ips.sh
```

### 2. **Verify Firewall Rules**

```bash
# Check current rules
sudo ufw status numbered

# Ensure SSH port is open
sudo ufw allow 22/tcp

# Reload firewall
sudo ufw reload
```

### 3. **Test SSH Connection**

**From your local machine:**

```bash
# Test connection (replace with your details)
ssh root@your-server-ip -p 22 -v

# If using SSH key
ssh -i ~/.ssh/your-key root@your-server-ip -p 22 -v
```

**Expected output:** You should be able to log in successfully

### 4. **Verify GitHub Secrets**

**Go to:** `GitHub Repo → Settings → Secrets and variables → Actions`

**Required secrets:**
- `SSH_HOST` - Your server IP (e.g., `165.227.123.456`)
- `SSH_USERNAME` - SSH username (usually `root`)
- `SSH_KEY` - **Private SSH key** (entire content)
- `SSH_PORT` - SSH port (default: `22`)

**Example SSH_KEY format:**
```
-----BEGIN OPENSSH PRIVATE KEY-----
b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAABlwAAAAdzc2gtcn
... (your key content) ...
-----END OPENSSH PRIVATE KEY-----
```

### 5. **Check Server Status**

```bash
# Ensure server is running and accessible
ping your-server-ip

# Check SSH service
sudo systemctl status sshd

# Check if SSH port is listening
sudo netstat -tulpn | grep :22
```

---

## 🔒 Security Best Practices

### Option A: Whitelist GitHub IPs (Recommended)

✅ **Pros:** Secure, allows only GitHub Actions
❌ **Cons:** GitHub IPs can change

```bash
# Use the provided script
sudo ./server-setup/allow-github-ips.sh

# Or manually add rules
sudo ufw allow from 192.30.252.0/22 to any port 22
sudo ufw allow from 185.199.108.0/22 to any port 22
sudo ufw allow from 140.82.112.0/20 to any port 22
sudo ufw allow from 143.55.64.0/20 to any port 22
```

### Option B: Use Self-Hosted Runner (Most Secure)

✅ **Pros:** No firewall changes needed, fastest deployment
❌ **Cons:** Requires server resources

```bash
# On your server
cd /var/www
mkdir actions-runner && cd actions-runner

# Download runner (check latest version)
curl -o actions-runner-linux-x64-2.311.0.tar.gz -L \
  https://github.com/actions/runner/releases/download/v2.311.0/actions-runner-linux-x64-2.311.0.tar.gz

# Extract
tar xzf ./actions-runner-linux-x64-2.311.0.tar.gz

# Configure (get token from GitHub)
./config.sh --url https://github.com/YOUR_USERNAME/YOUR_REPO --token YOUR_TOKEN

# Install as service
sudo ./svc.sh install
sudo ./svc.sh start

# Update .github/workflows/deploy.yml
# Change: runs-on: ubuntu-latest
# To:     runs-on: self-hosted
```

### Option C: Deploy via Webhook (Alternative)

Instead of SSH from GitHub Actions, use a webhook on your server:

```bash
# Install webhook listener on server
npm install -g pm2-deploy

# Configure in your GitHub repo:
# Settings → Webhooks → Add webhook
# Payload URL: http://your-server-ip:9000/webhook
```

---

## 📊 Debugging Steps

### 1. Check GitHub Actions Logs

**Go to:** `GitHub Repo → Actions → Failed workflow → Deploy via SSH step`

**Look for:**
- Connection timeout
- Authentication failures
- Permission errors

### 2. Check Server Logs

```bash
# SSH authentication logs
sudo tail -f /var/log/auth.log

# Firewall logs
sudo tail -f /var/log/ufw.log

# Check failed SSH attempts
sudo grep "Failed password" /var/log/auth.log | tail -20
```

### 3. Test SSH Key

```bash
# On your server, check authorized_keys
cat ~/.ssh/authorized_keys

# Ensure correct permissions
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys

# Test from GitHub Actions IP (if you know it)
# Check https://api.github.com/meta for current IPs
```

---

## 🎯 Quick Fix Checklist

- [ ] Firewall allows SSH (port 22) from GitHub IPs
- [ ] SSH service is running (`sudo systemctl status sshd`)
- [ ] GitHub secrets are correctly configured
- [ ] Private SSH key is complete (includes BEGIN and END)
- [ ] Server is accessible from the internet
- [ ] Security groups (cloud provider) allow inbound SSH
- [ ] SSH key permissions are correct (600 for private key)
- [ ] `~/.ssh/authorized_keys` contains the matching public key

---

## 🆘 Still Not Working?

### Test with Manual Deployment

```bash
# SSH into server manually
ssh root@your-server-ip

# Run deployment script
cd /var/www/naukrimili
git pull origin main
npm ci
npm run build
pm2 restart naukrimili
```

**If manual deployment works but GitHub Actions fails:**
→ **100% firewall/network issue**

### Get GitHub's Current IPs

```bash
# Fetch GitHub's latest IP ranges
curl https://api.github.com/meta | jq -r '.actions[]'

# Add them to your firewall
```

---

## 📞 Common Error Messages

| Error | Cause | Fix |
|-------|-------|-----|
| `connection timed out` | Firewall blocking | Allow GitHub IPs |
| `connection refused` | SSH not running | `sudo systemctl start sshd` |
| `permission denied` | Wrong key/username | Check GitHub secrets |
| `host key verification failed` | SSH fingerprint changed | Add to known_hosts |

---

## ✅ Success Indicators

When deployment works, you'll see:

```
✅ Build completed
✅ Health check passed!
✅ Deployment completed successfully!
```

**PM2 Status:**
```bash
pm2 status
# Should show: naukrimili | online | 0 | 0s | 0 | 0%
```

**Health Check:**
```bash
curl http://localhost:3000/api/health
# Should return: {"status":"ok"}
```

---

## 🔄 After Fixing

1. **Commit and push changes**
2. **GitHub Actions will auto-deploy** (if on `main` branch)
3. **Or manually trigger:** GitHub → Actions → Deploy to Production → Run workflow

---

## 📚 Resources

- [GitHub Actions IP Ranges](https://api.github.com/meta)
- [SSH Action Documentation](https://github.com/appleboy/ssh-action)
- [UFW Firewall Guide](https://help.ubuntu.com/community/UFW)
- [PM2 Documentation](https://pm2.keymetrics.io/docs/usage/quick-start/)

