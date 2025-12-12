# SSH Deployment Connectivity Debugging Guide

## Current Issue
The deployment is failing with: `ssh: connect to host *** port ***: Connection timed out`

This means the GitHub Actions workflow **cannot reach your server** at the HOST:PORT combination you've configured.

---

## Step-by-Step Diagnostics

### ⚠️ CRITICAL: First Check - Verify Secret Values

The GitHub Actions workflow is now masking your secrets (showing ***), but **YOU** need to verify they're correct:

1. **Open GitHub repository**: https://github.com/Anamsayyed016/Naukrimili
2. **Go to Settings** → **Secrets and variables** → **Actions**
3. **Check each secret exists**:
   - `HOST` 
   - `SSH_USER`
   - `SSH_PORT`
   - `SSH_KEY`
   - `NEXTAUTH_SECRET`
   - `DATABASE_URL`

4. **Verify the values** (click each to view):
   - `HOST`: Should be an **IP address** (e.g., `192.168.1.100`) or **domain** (e.g., `naukrimili.com` or `vps.hostinger.com`)
   - `SSH_USER`: Should be a **username** (e.g., `root`, `ubuntu`, or your Hostinger user)
   - `SSH_PORT`: Should be a **number** (e.g., `22` for standard SSH, or custom port like `2222`)
   - `SSH_KEY`: Should start with `-----BEGIN OPENSSH PRIVATE KEY-----` (not RSA)

### ✅ Common Issues & Fixes

#### Issue 1: Wrong HOST or SSH_PORT
**Symptom**: "Connection timed out" consistently
**Fix**: 
- For **Hostinger**: Check your Hostinger control panel for the actual SSH hostname/IP
- It might be something like `srv12345.hostinger.com` or an IP address
- SSH port is usually `22`, but Hostinger sometimes uses custom ports

**Action**:
```bash
# Run this on YOUR LOCAL MACHINE (not in GitHub)
ssh -v -p SSH_PORT your-user@your-host

# Example:
ssh -v -p 22 root@srv12345.hostinger.com
```

If this fails locally, then your HOST/PORT/USER are wrong.

#### Issue 2: SSH Key in Wrong Format
**Symptom**: SSH connection test in GitHub fails, SSH key validation warning
**Fix**: 
- The secret must be an **OpenSSH private key**
- Start with: `-----BEGIN OPENSSH PRIVATE KEY-----`
- NOT: `-----BEGIN RSA PRIVATE KEY-----` or `-----BEGIN EC PRIVATE KEY-----`

**How to verify**:
1. Go to GitHub Secrets
2. Click on `SSH_KEY`
3. The first line must show: `-----BEGIN OPENSSH PRIVATE KEY-----`

**If it's the wrong format**, regenerate the key:
```bash
# On your LOCAL machine
ssh-keygen -t ed25519 -f ~/.ssh/naukrimili_deploy_key -N ""
# OR
ssh-keygen -t rsa -b 4096 -f ~/.ssh/naukrimili_deploy_key -N ""

# Then copy the PRIVATE key to GitHub:
cat ~/.ssh/naukrimili_deploy_key
# Paste the entire content into GitHub Secret `SSH_KEY`

# And add the PUBLIC key to your server's ~/.ssh/authorized_keys
cat ~/.ssh/naukrimili_deploy_key.pub
# Paste this into /root/.ssh/authorized_keys on the server
```

#### Issue 3: Server SSH Port Not Accessible
**Symptom**: "Connection timed out" after confirming HOST/PORT/USER are correct
**Fix**: 
- Check Hostinger firewall allows SSH port inbound
- Check if server is online and SSH daemon is running

**Debug on the server**:
```bash
# SSH into your server manually (should work first!)
ssh -v -p 22 root@your-server

# Then check if SSH is running
sudo systemctl status ssh
# or
sudo systemctl status sshd

# Check if SSH is listening on the port
sudo netstat -tulnp | grep ssh
# or
sudo ss -tulnp | grep ssh
```

#### Issue 4: GitHub Actions IP Blocked
**Symptom**: Local SSH works, but GitHub Actions fails with timeout
**Fix**: 
- Your firewall is blocking GitHub's IP ranges
- This is rare but possible

**Solution**: 
- If using Hostinger, check their control panel for firewall settings
- Add GitHub's IP range (or remove firewall restrictions for development)

---

## Latest Deployment Diagnostics Added

The workflow now includes a **"Test server connectivity"** step that runs:

1. **Netcat test**: `nc -zv -w 3 HOST PORT`
   - Tests TCP connection to PORT
   - Shows if port is reachable

2. **Bash TCP socket test**: `exec 3<>/dev/tcp/HOST/PORT`
   - Cross-platform test (doesn't need netcat)
   - Confirms port is accepting connections

3. **Detailed error messages** with next steps

When you push next, look at the GitHub Actions log for this step to see:
- ✅ If connection succeeds (problem is elsewhere)
- ❌ If connection fails (confirms HOST/PORT issue)

---

## Quick Checklist

Before pushing to trigger deployment, verify:

- [ ] GitHub Secret `HOST` is set to correct server IP/domain
- [ ] GitHub Secret `SSH_PORT` is set to correct port (usually 22)
- [ ] GitHub Secret `SSH_USER` is set to correct user (root, ubuntu, etc.)
- [ ] GitHub Secret `SSH_KEY` starts with `-----BEGIN OPENSSH PRIVATE KEY-----`
- [ ] That same SSH_KEY is added to `/root/.ssh/authorized_keys` on the server
- [ ] Server is reachable: `ssh -v -p SSH_PORT USER@HOST` works from YOUR machine
- [ ] SSH daemon is running on server: `systemctl status ssh`

---

## What to Do Next

1. **Verify all secrets locally first**:
   ```bash
   # From your machine, test connection
   ssh -v -p YOUR_SSH_PORT YOUR_SSH_USER@YOUR_HOST
   # This should work before GitHub Actions will work
   ```

2. **If local SSH works**, push your code to trigger GitHub Actions and check the new "Test server connectivity" step

3. **If local SSH fails**, you've found the real problem - fix HOST/PORT/USER first

4. **Provide feedback** with:
   - Do local SSH connections work? (yes/no)
   - What's the exact error from local SSH?
   - What HOST, PORT are you using?

---

## Environment Variables Summary

These should be configured in GitHub Settings → Secrets:

```
HOST=srv12345.hostinger.com           (or your server IP)
SSH_USER=root                         (or your username)
SSH_PORT=22                           (or custom port)
SSH_KEY=-----BEGIN OPENSSH PRIVATE... (full private key)
NEXTAUTH_SECRET=your-secret-here
DATABASE_URL=postgresql://user:pass@localhost/jobportal
```

Deployment will fail if **any** of these are missing or incorrect.

---

## Contact Information for Hostinger

If you need to find your Hostinger SSH credentials:
1. Log in to Hostinger Control Panel
2. Go to Hosting → SSH Access
3. Look for "SSH Host", "SSH Username", "SSH Port"
4. These map to `HOST`, `SSH_USER`, `SSH_PORT` in GitHub

If you need to set up SSH key:
1. Go to Hosting → SSH Keys
2. Add your public key (`~/.ssh/naukrimili_deploy_key.pub`)
3. Or request Hostinger to generate one for you

---

**Last Updated**: December 6, 2025  
**Next Step**: Push code and check GitHub Actions "Test server connectivity" step output
