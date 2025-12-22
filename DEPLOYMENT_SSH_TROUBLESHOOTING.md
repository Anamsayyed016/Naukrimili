# 🔧 Deployment SSH Troubleshooting Guide

## 🚨 Common SSH Deployment Failures

### **Issue 1: SSH_KEY Secret Missing or Invalid**

**Symptoms:**
- Error: `SSH_KEY secret is not set!`
- Error: `Invalid SSH key format - missing BEGIN marker`
- Error: `SSH key appears too small`

**Solution:**

1. **Go to GitHub Secrets:**
   - Navigate to: `https://github.com/Anamsayyed016/Naukrimili/settings/secrets/actions`

2. **Add/Update SSH_KEY Secret:**
   - Click "New repository secret" or edit existing `SSH_KEY`
   - Name: `SSH_KEY`
   - Value: Paste your **complete private SSH key** including:
     ```
     -----BEGIN OPENSSH PRIVATE KEY-----
     (key content here)
     -----END OPENSSH PRIVATE KEY-----
     ```

3. **Important Notes:**
   - ✅ Include the `-----BEGIN` and `-----END` lines
   - ✅ No extra spaces before/after
   - ✅ No extra blank lines
   - ✅ Use the **PRIVATE** key (not public key)
   - ✅ Copy the entire key from your local `~/.ssh/id_rsa` or `~/.ssh/id_ed25519`

4. **Get Your Private Key:**
   ```bash
   # On your local machine
   cat ~/.ssh/id_rsa
   # OR
   cat ~/.ssh/id_ed25519
   ```

---

### **Issue 2: Network Connectivity Error**

**Symptoms:**
- Error: `Cannot reach HOST:SSH_PORT`
- Error: `Network unreachable`
- Error: `Connection timeout`

**Solution:**

1. **Verify GitHub Secrets:**
   - `HOST` = Your server hostname/IP (e.g., `srv1054971.hstgr.cloud`)
   - `SSH_PORT` = Your SSH port (usually `22`)
   - `SSH_USER` = Your SSH username (usually `root`)

2. **Test Network Connectivity:**
   ```bash
   # Test from your local machine
   ping srv1054971.hstgr.cloud
   
   # Test SSH port
   telnet srv1054971.hstgr.cloud 22
   # OR
   nc -zv srv1054971.hstgr.cloud 22
   ```

3. **Check Server Status:**
   - Ensure server is running
   - Check firewall allows SSH (port 22)
   - Verify server is accessible from internet

4. **GitHub Actions IP Allowlist:**
   - If your server has IP allowlist, add GitHub Actions IPs
   - See: https://api.github.com/meta (for GitHub Actions IP ranges)

---

### **Issue 3: SSH Authentication Failure**

**Symptoms:**
- Error: `ssh: handshake failed: unable to authenticate`
- Error: `Permission denied (publickey)`
- Error: `No supported authentication methods`

**Solution:**

1. **Verify Public Key on Server:**
   ```bash
   # SSH into your server
   ssh root@srv1054971.hstgr.cloud
   
   # Check authorized_keys
   cat ~/.ssh/authorized_keys
   ```

2. **Add Public Key to Server:**
   ```bash
   # On your local machine, get public key
   cat ~/.ssh/id_rsa.pub
   # OR
   cat ~/.ssh/id_ed25519.pub
   
   # On server, add to authorized_keys
   echo "YOUR_PUBLIC_KEY_HERE" >> ~/.ssh/authorized_keys
   chmod 600 ~/.ssh/authorized_keys
   chmod 700 ~/.ssh
   ```

3. **Verify Key Match:**
   - The private key in GitHub secret `SSH_KEY` must match the public key in server's `~/.ssh/authorized_keys`
   - Extract public key from private key:
     ```bash
     ssh-keygen -y -f ~/.ssh/id_rsa > ~/.ssh/id_rsa.pub
     ```

4. **Test SSH Manually:**
   ```bash
   # Test from your local machine
   ssh -i ~/.ssh/id_rsa -p 22 root@srv1054971.hstgr.cloud
   ```
   - If this works, use the **same private key** in GitHub secret `SSH_KEY`

---

### **Issue 4: Wrong SSH User or Port**

**Symptoms:**
- Error: `Permission denied`
- Error: `Connection refused`

**Solution:**

1. **Verify SSH_USER:**
   - Check what user you use to SSH manually
   - Common values: `root`, `ubuntu`, `admin`, `deploy`

2. **Verify SSH_PORT:**
   - Default is `22`
   - Some servers use custom ports (e.g., `2222`, `2200`)
   - Check your server's SSH configuration:
     ```bash
     # On server
     grep Port /etc/ssh/sshd_config
     ```

3. **Update GitHub Secrets:**
   - `SSH_USER` = Your actual SSH username
   - `SSH_PORT` = Your actual SSH port

---

## 🔍 **Step-by-Step Debugging**

### **Step 1: Verify All Secrets Are Set**

Go to: `https://github.com/Anamsayyed016/Naukrimili/settings/secrets/actions`

**Required Secrets:**
- ✅ `HOST` = `srv1054971.hstgr.cloud` (or your server)
- ✅ `SSH_USER` = `root` (or your username)
- ✅ `SSH_PORT` = `22` (or your port)
- ✅ `SSH_KEY` = (complete private key)
- ✅ `NEXTAUTH_SECRET` = (32+ characters)
- ✅ `DATABASE_URL` = (PostgreSQL connection string)

### **Step 2: Test SSH Locally**

```bash
# Test SSH connection from your local machine
ssh -i ~/.ssh/id_rsa -p 22 root@srv1054971.hstgr.cloud

# If this works, copy the private key to GitHub secret SSH_KEY
cat ~/.ssh/id_rsa
```

### **Step 3: Verify Server Configuration**

```bash
# SSH into server
ssh root@srv1054971.hstgr.cloud

# Check SSH service
systemctl status sshd

# Check authorized_keys
cat ~/.ssh/authorized_keys

# Check SSH config
cat /etc/ssh/sshd_config | grep -E "Port|PermitRootLogin|PubkeyAuthentication"
```

### **Step 4: Check GitHub Actions Logs**

1. Go to: `https://github.com/Anamsayyed016/Naukrimili/actions`
2. Click on failed workflow run
3. Expand "Setup SSH" or "Test SSH connection" step
4. Look for specific error messages
5. Follow the error-specific troubleshooting above

---

## ✅ **Quick Fix Checklist**

- [ ] `SSH_KEY` secret contains complete private key (with BEGIN/END lines)
- [ ] `HOST` secret matches your server hostname/IP
- [ ] `SSH_USER` secret matches your SSH username
- [ ] `SSH_PORT` secret matches your SSH port
- [ ] Public key is in server's `~/.ssh/authorized_keys`
- [ ] Server SSH service is running
- [ ] Server firewall allows SSH connections
- [ ] Can SSH manually from local machine
- [ ] Private key in GitHub matches the key you use locally

---

## 🆘 **Still Having Issues?**

1. **Check GitHub Actions Logs:**
   - Look for specific error messages
   - Check which step failed

2. **Test SSH Manually:**
   ```bash
   ssh -vvv -i ~/.ssh/id_rsa -p 22 root@srv1054971.hstgr.cloud
   ```
   - The `-vvv` flag shows detailed debug info

3. **Verify Key Format:**
   ```bash
   # Check if key is valid
   ssh-keygen -l -f ~/.ssh/id_rsa
   ```

4. **Contact Support:**
   - Share the specific error message from GitHub Actions logs
   - Include the output of manual SSH test

---

## 📝 **Example: Correct SSH_KEY Format**

```
-----BEGIN OPENSSH PRIVATE KEY-----
b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAAAMwAAAAtzc2gtZW
QyNTUxOQAAACCJzB7jn4YVj2bB2/iY40isQ8VSz3kQCJ1c5qn0dto92gAAAJD2DbLP9g2y
zwAAAAtzc2gtZWQyNTUxOQAAACCJzB7jn4YVj2bB2/iY40isQ8VSz3kQCJ1c5qn0dto92g
AAAECBBbXnayE0lpJspicw+PzjUu7ICqRC1/zL4tlNA8KJ7InMHuOfhhWPZsHb+JjjSKxD
xVLPeRAInVzmqfR22j3aAAAADWdpdGh1Yi1kZXBsb3k=
-----END OPENSSH PRIVATE KEY-----
```

**Note:** This is just an example. Use YOUR actual private key!

