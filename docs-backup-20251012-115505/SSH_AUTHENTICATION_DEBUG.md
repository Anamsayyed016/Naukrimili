# 🔐 SSH AUTHENTICATION DEBUG GUIDE

## 🚨 **CURRENT ISSUE**

**Error:** `ssh: handshake failed: ssh: unable to authenticate, attempted methods [none publickey], no supported methods remain`

**Status:** SSH key authentication failing in GitHub Actions deployment

---

## 🔍 **ROOT CAUSE ANALYSIS**

### **Possible Causes:**
1. **SSH Key Format Issue** - Key not in correct format
2. **SSH Key Permissions** - Wrong file permissions on server
3. **SSH Key Location** - Key not in correct location on server
4. **SSH Key Type** - Server expects different key type (RSA vs ED25519)
5. **SSH Configuration** - Server SSH config blocking key auth
6. **GitHub Secrets** - SSH key not properly stored in secrets

---

## 🛠️ **DEBUGGING STEPS IMPLEMENTED**

### **1. Enhanced SSH Key Setup** ✅
```yaml
# Added to deploy.yml:
- name: 📥 Prepare SSH Key
  run: |
    mkdir -p ~/.ssh
    chmod 700 ~/.ssh
    
    # Create SSH key file with proper format
    echo "${{ secrets.SSH_KEY }}" > ~/.ssh/id_rsa
    chmod 600 ~/.ssh/id_rsa
    
    # Add host to known_hosts
    ssh-keyscan -p ${{ secrets.SSH_PORT }} ${{ secrets.HOST }} >> ~/.ssh/known_hosts
    chmod 644 ~/.ssh/known_hosts
    
    # Verify SSH key format
    echo "🔍 Verifying SSH key format..."
    head -1 ~/.ssh/id_rsa
    echo "🔍 SSH key file size: $(wc -c < ~/.ssh/id_rsa) bytes"
    
    # Test SSH connection with verbose output
    ssh -v -o StrictHostKeyChecking=no -i ~/.ssh/id_rsa -p ${{ secrets.SSH_PORT }} ${{ secrets.SSH_USER }}@${{ secrets.HOST }} "echo 'SSH connection successful'"
```

### **2. Enhanced SCP Action** ✅
```yaml
- name: 📤 Copy files to server
  uses: appleboy/scp-action@v0.1.7
  with:
    host: ${{ secrets.HOST }}
    username: ${{ secrets.SSH_USER }}
    key: ${{ secrets.SSH_KEY }}
    port: ${{ secrets.SSH_PORT }}
    source: "."
    target: "/var/www/jobportal"
    strip_components: 0
    timeout: 30s
    command_timeout: 10m
```

---

## 🔧 **MANUAL VERIFICATION STEPS**

### **Step 1: Verify SSH Key on Server**
```bash
# On your server (88.222.242.74):
ls -la ~/.ssh/
cat ~/.ssh/authorized_keys
```

### **Step 2: Check SSH Key Format**
```bash
# The key should look like this:
ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABgQC... deployment@naukrimili.com
# OR
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAI... deployment@naukrimili.com
```

### **Step 3: Verify SSH Configuration**
```bash
# On server, check SSH config:
sudo nano /etc/ssh/sshd_config

# Look for these settings:
PubkeyAuthentication yes
AuthorizedKeysFile .ssh/authorized_keys
PasswordAuthentication no  # (should be no for security)
```

---

## 🚀 **ALTERNATIVE SOLUTIONS**

### **Solution 1: Use Password Authentication (Temporary)**
```yaml
- name: 📤 Copy files to server
  uses: appleboy/scp-action@v0.1.7
  with:
    host: ${{ secrets.HOST }}
    username: ${{ secrets.SSH_USER }}
    password: ${{ secrets.SSH_PASSWORD }}  # Add this to GitHub secrets
    port: ${{ secrets.SSH_PORT }}
    source: "."
    target: "/var/www/jobportal"
```

### **Solution 2: Use Different SSH Key Type**
```bash
# Generate ED25519 key instead of RSA:
ssh-keygen -t ed25519 -C "deployment@naukrimili.com" -f ~/.ssh/id_ed25519

# Add to server:
ssh-copy-id -i ~/.ssh/id_ed25519.pub root@88.222.242.74
```

### **Solution 3: Use SSH Agent**
```yaml
- name: 📥 Setup SSH Agent
  run: |
    eval "$(ssh-agent -s)"
    echo "${{ secrets.SSH_KEY }}" | ssh-add -
    ssh-add -l
```

---

## 📋 **GITHUB SECRETS CHECKLIST**

### **Required Secrets:**
- ✅ `HOST` - Your server IP (88.222.242.74)
- ✅ `SSH_USER` - Username (root)
- ✅ `SSH_PORT` - Port (22)
- ❓ `SSH_KEY` - **NEEDS VERIFICATION**

### **SSH_KEY Secret Format:**
```
-----BEGIN OPENSSH PRIVATE KEY-----
b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAAAMwAAAAtzc2gtZW
...
-----END OPENSSH PRIVATE KEY-----
```

**OR**

```
-----BEGIN RSA PRIVATE KEY-----
MIIEpAIBAAKCAQEA...
...
-----END RSA PRIVATE KEY-----
```

---

## 🔍 **DEBUGGING COMMANDS**

### **Local SSH Test:**
```bash
# Test SSH connection locally:
ssh -v -i ~/.ssh/id_rsa -p 22 root@88.222.242.74

# Test with different key:
ssh -v -i ~/.ssh/id_ed25519 -p 22 root@88.222.242.74
```

### **Server SSH Logs:**
```bash
# On server, check SSH logs:
sudo tail -f /var/log/auth.log
# OR
sudo journalctl -u ssh -f
```

---

## 🎯 **IMMEDIATE ACTION ITEMS**

### **1. Verify GitHub Secret** ⚠️
- Check if `SSH_KEY` secret contains the **PRIVATE KEY** (not public key)
- Ensure it includes `-----BEGIN` and `-----END` lines
- Verify no extra spaces or characters

### **2. Test SSH Key Locally** ⚠️
```bash
# Generate new key if needed:
ssh-keygen -t rsa -b 4096 -C "deployment@naukrimili.com"

# Copy to server:
ssh-copy-id -i ~/.ssh/id_rsa.pub root@88.222.242.74

# Test connection:
ssh -i ~/.ssh/id_rsa root@88.222.242.74
```

### **3. Update GitHub Secret** ⚠️
- Copy the **PRIVATE KEY** content to `SSH_KEY` secret
- Include the entire key with headers and footers

---

## 🚨 **EMERGENCY WORKAROUND**

If SSH continues to fail, use this temporary solution:

```yaml
- name: 📤 Copy files to server (Password Auth)
  uses: appleboy/scp-action@v0.1.7
  with:
    host: ${{ secrets.HOST }}
    username: ${{ secrets.SSH_USER }}
    password: ${{ secrets.SSH_PASSWORD }}  # Add this secret
    port: ${{ secrets.SSH_PORT }}
    source: "."
    target: "/var/www/jobportal"
```

---

## 📊 **STATUS**

- ✅ **TailwindCSS Issue:** RESOLVED
- ❌ **SSH Authentication:** NEEDS VERIFICATION
- ⚠️ **Next Action:** Verify SSH key in GitHub secrets

---

**🎯 Priority: Verify SSH_KEY secret format and test SSH connection locally**
