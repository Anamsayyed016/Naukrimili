# 🔑 SSH Setup Guide for GitHub Actions Deployment

## 🚨 **CRITICAL: SSH Authentication Failed - PERMISSION ISSUES DETECTED**

Your GitHub Actions deployment failed due to SSH key permission problems and authentication failures. Follow this guide to fix it.

## 🚨 **CURRENT ERROR ANALYSIS**

```
Load key "/home/runner/.ssh/id_ed25519": error in libcrypto
Permission denied, please try again.
Permission denied, please try again.
***@***: Permission denied (publickey,gssapi-keyex,gssapi-with-mic,password)
```

**Root Causes:**
1. **SSH Key Permission Issues**: Key file has wrong permissions
2. **Authentication Method Failure**: Server rejects the key
3. **Key Format Problems**: Key might be corrupted or wrong format

## 📋 **REQUIRED GITHUB SECRETS**

You need to add these secrets to your GitHub repository:

### **1. SSH_HOST**
- **Value**: Your Hostinger server IP address
- **Example**: `69.62.73.84`

### **2. SSH_USER**
- **Value**: Your Hostinger username
- **Example**: `root`

### **3. SSH_PORT**
- **Value**: SSH port (usually 22)
- **Example**: `22`

### **4. SSH_PRIVATE_KEY**
- **Value**: Your private SSH key content
- **Example**: The entire content of your private key file

## 🔧 **STEP-BY-STEP SSH KEY SETUP (FIXED VERSION)**

### **Step 1: Generate NEW SSH Key Pair (CRITICAL - OLD KEY IS CORRUPTED)**

```bash
# DELETE OLD KEYS FIRST
rm -f ~/.ssh/github_actions*
rm -f ~/.ssh/id_ed25519*

# Generate NEW SSH key pair
ssh-keygen -t ed25519 -C "github-actions-deployment" -f ~/.ssh/github_actions -N ""

# This creates:
# - ~/.ssh/github_actions (private key)
# - ~/.ssh/github_actions.pub (public key)

# Verify key format
ssh-keygen -l -f ~/.ssh/github_actions
```

### **Step 2: Add Public Key to Hostinger Server (FRESH INSTALL)**

```bash
# Copy your NEW public key content
cat ~/.ssh/github_actions.pub

# SSH to your Hostinger server (using password or existing key)
ssh root@69.62.73.84

# REMOVE OLD KEYS AND ADD NEW ONE
rm -f ~/.ssh/authorized_keys
mkdir -p ~/.ssh
echo "YOUR_NEW_PUBLIC_KEY_CONTENT_HERE" > ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
chmod 700 ~/.ssh

# Test the NEW key
ssh -i ~/.ssh/github_actions root@69.62.73.84
```

### **Step 3: Add NEW Private Key to GitHub Secrets**

1. **Go to your GitHub repository**
2. **Click Settings → Secrets and variables → Actions**
3. **DELETE OLD SSH_PRIVATE_KEY secret first**
4. **Click "New repository secret"**
5. **Add the NEW secret:**

#### **SSH_PRIVATE_KEY**
```
Name: SSH_PRIVATE_KEY
Value: [Copy ENTIRE content of ~/.ssh/github_actions file]
```

## 🔍 **VERIFY SSH KEY CONTENT (CRITICAL)**

Your NEW private key should look like this:
```
-----BEGIN OPENSSH PRIVATE KEY-----
b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAAAMwAAAAtzc2gtZW
QyNTUxOQAAACD... [many more lines] ...
-----END OPENSSH PRIVATE KEY-----
```

**⚠️ CRITICAL CHECKS:**
- ✅ **BEGIN and END lines must be present**
- ✅ **No extra spaces or characters**
- ✅ **Key is exactly as generated**
- ✅ **No line breaks in the middle**

## 🚀 **TESTING THE NEW SETUP**

### **Option 1: Test Locally (RECOMMENDED)**
```bash
# Test SSH connection with your NEW key
ssh -i ~/.ssh/github_actions -o StrictHostKeyChecking=no root@69.62.73.84

# If successful, you'll see your server prompt
# Type 'exit' to return to local machine
```

### **Option 2: Test GitHub Actions**
1. **Push a small change to trigger deployment**
2. **Check Actions tab for deployment status**
3. **Look for "Setup SSH with Debug" step success**
4. **Check "Test SSH Connection" step success**

## 🔧 **TROUBLESHOOTING (SPECIFIC TO YOUR ERROR)**

### **1. Permission Denied (libcrypto error)**
```bash
# Fix key permissions
chmod 600 ~/.ssh/github_actions
chmod 700 ~/.ssh

# Verify key format
ssh-keygen -l -f ~/.ssh/github_actions
```

### **2. Authentication Failed (publickey rejected)**
```bash
# Check server-side key
ssh root@69.62.73.84 "cat ~/.ssh/authorized_keys"

# Verify key matches your public key
cat ~/.ssh/github_actions.pub
```

### **3. Key Format Issues**
```bash
# Regenerate key if format is wrong
rm -f ~/.ssh/github_actions*
ssh-keygen -t ed25519 -C "github-actions-deployment" -f ~/.ssh/github_actions -N ""
```

## 📱 **ALTERNATIVE: MANUAL DEPLOYMENT (BACKUP PLAN)**

If SSH continues to fail, use manual deployment:

```bash
# On your Hostinger server
cd /var/www/jobportal
sudo ./deploy.sh
```

This will:
- ✅ **Set up PostgreSQL manually**
- ✅ **Disable mock data**
- ✅ **Activate real database**
- ✅ **Same end result**

## 🎯 **EXPECTED RESULT AFTER FIX**

After successful SSH setup:

1. ✅ **GitHub Actions will automatically deploy**
2. ✅ **PostgreSQL will be automatically installed**
3. ✅ **Mock data will be automatically disabled**
4. ✅ **Real database will be automatically activated**
5. ✅ **Your website will work with real data**

## 🆘 **IMMEDIATE ACTION REQUIRED**

### **1. Generate NEW SSH Key (REQUIRED)**
```bash
ssh-keygen -t ed25519 -C "github-actions-deployment" -f ~/.ssh/github_actions -N ""
```

### **2. Update Server (REQUIRED)**
```bash
# Copy new public key to server
ssh root@69.62.73.84
echo "YOUR_NEW_PUBLIC_KEY" > ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

### **3. Update GitHub Secrets (REQUIRED)**
- **Delete old SSH_PRIVATE_KEY**
- **Add new SSH_PRIVATE_KEY with NEW key content**

## 🚀 **READY TO FIX?**

**The issue is clear: Your SSH key is corrupted or has wrong permissions.**

**Follow these steps in order:**
1. 🔑 **Generate NEW SSH key pair**
2. 🖥️ **Update server with NEW public key**
3. 🔐 **Update GitHub with NEW private key**
4. 🚀 **Push to trigger deployment**

**Your deployment will work perfectly after fixing the SSH key!** 🎉

## 🆘 **NEED HELP?**

If you're still having issues:

1. **Check Hostinger firewall settings**
2. **Verify SSH is enabled on your VPS**
3. **Contact Hostinger support**
4. **Use manual deployment as backup**

**The SSH key permission issue is the root cause - fix that and everything works!** 🔧
