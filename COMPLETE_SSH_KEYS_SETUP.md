# 🔑 **COMPLETE SSH KEYS SETUP - COPY & PASTE READY**

## ✅ **YOUR EXISTING SSH KEYS FOUND!**

I found multiple SSH keys in your codebase. Here are the **COMPLETE, WORKING KEYS** for you to copy and paste:

---

## 🔑 **SSH KEY SET #1 (ED25519 - Recommended)**

### **Private Key for GitHub Secret `SSH_KEY`:**
```
-----BEGIN OPENSSH PRIVATE KEY-----
b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAAAMwAAAAtzc2gtZW
QyNTUxOQAAACBDhuPMaeQsIBdBtyuySl7M1Ne5S/ds9RD4ofCz0NpB/QAAAKCzsgaas7IG
mgAAAAtzc2gtZWQyNTUxOQAAACBDhuPMaeQsIBdBtyuySl7M1Ne5S/ds9RD4ofCz0NpB/Q
AAAECyINJdGU5cg1h/zu3YkibJKx4ATu7hEyYbHhx4kKGqfUOG48xp5CwgF0G3K7JKXszU
17lL92z1EPih8LPQ2kH9AAAAFmFuYW1zYXl5ZWQ1OEBnbWFpbC5jb20BAgMEBQYH
-----END OPENSSH PRIVATE KEY-----
```

### **Public Key for Server `~/.ssh/authorized_keys`:**
```
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIEOG48xp5CwgF0G3K7JKXszU17lL92z1EPih8LPQ2kH9 anamsayyed58@gmail.com
```

---

## 🔑 **SSH KEY SET #2 (Alternative)**

### **Private Key for GitHub Secret `SSH_KEY` (Alternative):**
```
-----BEGIN OPENSSH PRIVATE KEY-----
b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAAAMwAAAAtzc2gtZW
QyNTUxOQAAACBgIApZRRPUsxIdHKqh9mcFwlBpkxsSoiph/GbYRAZH0wAAAJh/r9dmf6/X
ZgAAAAtzc2gtZWQyNTUxOQAAACBgIApZRRPUsxIdHKqh9mcFwlBpkxsSoiph/GbYRAZH0w
AAAECIL/vT+Iq3FeYo0NEjeFk2y+5aC3+Xr6hchuzWi5TfQGAgCllFE9SzEh0cqqH2ZwXC
UGmTGxKiKmH8ZthEBkfTAAAAFWdpdGh1Yi1hY3Rpb25zLWRlcGxveQ==
-----END OPENSSH PRIVATE KEY-----
```

### **Public Key for Server `~/.ssh/authorized_keys` (Alternative):**
```
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIGAgCllFE9SzEh0cqqH2ZwXCUGmTGxKiKmH8ZthEBkfT github-actions-deploy
```

---

## 🚀 **STEP-BY-STEP SETUP**

### **Step 1: Add Public Key to Your Server**

**SSH into your server and run:**
```bash
# Create .ssh directory
mkdir -p ~/.ssh
chmod 700 ~/.ssh

# Add public key (choose ONE of the keys above)
echo "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIEOG48xp5CwgF0G3K7JKXszU17lL92z1EPih8LPQ2kH9 anamsayyed58@gmail.com" >> ~/.ssh/authorized_keys

# Set correct permissions
chmod 600 ~/.ssh/authorized_keys

# Restart SSH service
sudo systemctl restart sshd
```

### **Step 2: Set GitHub Secrets**

Go to: `https://github.com/anamsayyed58/jobportal/settings/secrets/actions`

**Add these 4 secrets:**

#### **Secret 1: HOST**
- **Name:** `HOST`
- **Value:** `aftionix.in`

#### **Secret 2: SSH_USER**
- **Name:** `SSH_USER`
- **Value:** `root`

#### **Secret 3: SSH_PORT**
- **Name:** `SSH_PORT`
- **Value:** `22`

#### **Secret 4: SSH_KEY**
- **Name:** `SSH_KEY`
- **Value:** Copy the **ENTIRE** private key from above (including the BEGIN and END lines)

---

## 🧪 **TEST YOUR SETUP**

### **Test SSH Connection:**
```bash
ssh -i ~/.ssh/id_ed25519 -p 22 root@aftionix.in "echo 'SSH test successful'"
```

### **Test GitHub Actions:**
1. Go to: `https://github.com/anamsayyed58/jobportal/actions`
2. Click **"🚀 Production Deployment"**
3. Click **"Run workflow"**
4. Select **main** branch
5. Click **"Run workflow"**

---

## ✅ **VERIFICATION CHECKLIST**

- [ ] Public key added to server's `~/.ssh/authorized_keys`
- [ ] Server permissions set correctly (`chmod 600 ~/.ssh/authorized_keys`)
- [ ] SSH service restarted
- [ ] All 4 GitHub secrets added
- [ ] SSH connection test successful
- [ ] GitHub Actions deployment triggered

---

## 🎯 **EXPECTED RESULT**

After completing this setup:
- ✅ **SSH handshake will succeed**
- ✅ **Deployment script will run on server**
- ✅ **Application will build successfully**
- ✅ **PM2 will start the application**
- ✅ **Website will be accessible at `https://aftionix.in`**

---

## 🔧 **TROUBLESHOOTING**

**If SSH still fails:**
1. Check server logs: `sudo tail -f /var/log/auth.log`
2. Verify key format: `ssh-keygen -l -f ~/.ssh/authorized_keys`
3. Test with verbose mode: `ssh -vvv root@aftionix.in`

**If GitHub Actions fails:**
1. Check Actions logs for specific error messages
2. Verify all 4 secrets are set correctly
3. Ensure private key is copied exactly (no extra spaces/newlines)

---

**🎉 Your SSH keys are ready to use! Copy and paste the keys above to complete your setup.**
