# 🔑 SSH Setup Guide for GitHub Actions Deployment

## 🚨 **CRITICAL: SSH Authentication Failed**

Your GitHub Actions deployment failed because SSH keys are not properly configured. Follow this guide to fix it.

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

## 🔧 **STEP-BY-STEP SSH KEY SETUP**

### **Step 1: Generate SSH Key Pair (on your local machine)**

```bash
# Generate new SSH key pair
ssh-keygen -t ed25519 -C "github-actions-deployment" -f ~/.ssh/github_actions

# This creates:
# - ~/.ssh/github_actions (private key)
# - ~/.ssh/github_actions.pub (public key)
```

### **Step 2: Add Public Key to Hostinger Server**

```bash
# Copy your public key content
cat ~/.ssh/github_actions.pub

# SSH to your Hostinger server
ssh root@69.62.73.84

# Add the public key to authorized_keys
mkdir -p ~/.ssh
echo "YOUR_PUBLIC_KEY_CONTENT_HERE" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
chmod 700 ~/.ssh

# Test the key
ssh -i ~/.ssh/github_actions root@69.62.73.84
```

### **Step 3: Add Private Key to GitHub Secrets**

1. **Go to your GitHub repository**
2. **Click Settings → Secrets and variables → Actions**
3. **Click "New repository secret"**
4. **Add each secret:**

#### **SSH_HOST**
```
Name: SSH_HOST
Value: 69.62.73.84
```

#### **SSH_USER**
```
Name: SSH_USER
Value: root
```

#### **SSH_PORT**
```
Name: SSH_PORT
Value: 22
```

#### **SSH_PRIVATE_KEY**
```
Name: SSH_PRIVATE_KEY
Value: [Copy entire content of ~/.ssh/github_actions file]
```

## 🔍 **VERIFY SSH KEY CONTENT**

Your private key should look like this:
```
-----BEGIN OPENSSH PRIVATE KEY-----
b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAAAMwAAAAtzc2gtZW
QyNTUxOQAAACD... [many more lines] ...
-----END OPENSSH PRIVATE KEY-----
```

**⚠️ IMPORTANT**: Copy the ENTIRE content, including the BEGIN and END lines!

## 🚀 **TESTING THE SETUP**

### **Option 1: Test Locally**
```bash
# Test SSH connection with your key
ssh -i ~/.ssh/github_actions root@69.62.73.84

# If successful, you'll see your server prompt
```

### **Option 2: Test GitHub Actions**
1. **Push a small change to trigger deployment**
2. **Check Actions tab for deployment status**
3. **Look for "Setup SSH" step success**

## 🔧 **TROUBLESHOOTING**

### **Common Issues:**

#### **1. Permission Denied**
```bash
# Fix key permissions
chmod 600 ~/.ssh/github_actions
chmod 700 ~/.ssh
```

#### **2. Key Not Found**
```bash
# Verify key exists
ls -la ~/.ssh/github_actions*

# Check key format
ssh-keygen -l -f ~/.ssh/github_actions
```

#### **3. Server Connection Failed**
```bash
# Test basic connectivity
ping 69.62.73.84

# Test SSH port
telnet 69.62.73.84 22
```

## 📱 **ALTERNATIVE: MANUAL DEPLOYMENT**

If SSH continues to fail, use manual deployment:

```bash
# On your Hostinger server
cd /var/www/jobportal
sudo ./deploy.sh
```

## 🎯 **EXPECTED RESULT**

After successful SSH setup:

1. ✅ **GitHub Actions will automatically deploy**
2. ✅ **PostgreSQL will be automatically installed**
3. ✅ **Mock data will be automatically disabled**
4. ✅ **Real database will be automatically activated**
5. ✅ **Your website will work with real data**

## 🆘 **NEED HELP?**

If you're still having issues:

1. **Check Hostinger firewall settings**
2. **Verify SSH is enabled on your VPS**
3. **Contact Hostinger support**
4. **Use manual deployment as backup**

## 🚀 **READY TO DEPLOY?**

Once SSH keys are configured:

1. **Push any change to main branch**
2. **GitHub Actions will automatically run**
3. **PostgreSQL will be automatically set up**
4. **Mock data will be automatically removed**
5. **Real database will be automatically activated**

**Your website will work exactly the same, but with real data instead of mock data!** 🎉
