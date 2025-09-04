# 🚀 Hostinger KVM Hosting - GitHub Deployment Guide

## ✅ **KVM Hosting vs Shared Hosting**

**KVM Hosting** gives you more control but a different interface:
- ✅ **Full server access** (SSH, root access)
- ✅ **Custom server configuration**
- ✅ **Multiple domains and applications**
- ✅ **Docker support** (if available)

---

## 📋 **STEP 1: Access Your KVM Control Panel**

### **1. Log into Hostinger KVM Panel**
- Go to your Hostinger KVM control panel
- Look for "Websites" or "Domains" section
- You should see your domain listed

### **2. Find Your Domain**
- Click on your domain name
- Look for "Manage" or "Settings" options
- You might see "File Manager" or "SSH Access"

---

## 🔧 **STEP 2: Deploy Your Application**

### **Option A: Using File Manager (Easiest)**

1. **Access File Manager**
   - Look for "File Manager" in your KVM panel
   - Navigate to `public_html/` or your domain directory

2. **Upload Your Project**
   - Upload all files from your local project
   - Ensure `.next/` folder is included
   - Upload `server.js`, `package.json`, etc.

3. **Set Up Node.js**
   - Look for "Node.js" or "Applications" in your panel
   - Enable Node.js for your domain
   - Set startup file to `server.js`

### **Option B: Using SSH (Recommended for KVM)**

1. **Get SSH Access**
   - In your KVM panel, look for "SSH" or "Terminal"
   - Note your SSH credentials (hostname, username, password/key)

2. **Connect via SSH**
   ```bash
   # Use PuTTY (Windows) or Terminal (Mac/Linux)
   ssh username@your-server-ip
   ```

3. **Navigate to Your Domain Directory**
   ```bash
   cd /home/username/public_html/
   # or wherever your domain files are located
   ```

4. **Clone Your GitHub Repository**
   ```bash
   git clone https://github.com/Anamsayyed016/Naukrimili.git .
   ```

5. **Install Dependencies and Build**
   ```bash
   npm install
   npm run hostinger-build
   ```

---

## 🌍 **STEP 3: Environment Variables Setup**

### **1. Create .env.local File**
```bash
# Via SSH or File Manager
nano .env.local
```

### **2. Add Environment Variables**
```env
# App Configuration
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://yourdomain.com
NEXTAUTH_URL=https://yourdomain.com
NEXTAUTH_SECRET=your-secret-key-here

# Database (MongoDB Atlas recommended)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/naukrimili

# Authentication
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# AI Services (Optional)
OPENAI_API_KEY=your-openai-api-key
GEMINI_API_KEY=AIzaSyDYhmLEfBFlowxKZQ4qHZOkbq0NLSqOCoY

# Job APIs (Optional)
ADZUNA_APP_ID=your-adzuna-app-id
ADZUNA_API_KEY=your-adzuna-api-key
REED_API_KEY=your-reed-api-key
GOOGLE_JOBS_API_KEY=AIzaSyDYhmLEfBFlowxKZQ4qHZOkbq0NLSqOCoY
GOOGLE_CSE_API_KEY=AIzaSyDYhmLEfBFlowxKZQ4qHZOkbq0NLSqOCoY

# AWS S3 (Optional for file uploads)
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=us-east-1
S3_BUCKET_NAME=your-s3-bucket-name

# Hostinger Specific
PORT=3000
HOST=0.0.0.0
```

---

## 🚀 **STEP 4: Start Your Application**

### **Option A: Using PM2 (Recommended)**

1. **Install PM2**
   ```bash
   npm install -g pm2
   ```

2. **Start Your Application**
   ```bash
   pm2 start server.js --name "naukrimili"
   pm2 save
   pm2 startup
   ```

### **Option B: Using Screen/Tmux**

1. **Create a Screen Session**
   ```bash
   screen -S naukrimili
   ```

2. **Start Your Application**
   ```bash
   npm run hostinger-start
   ```

3. **Detach Screen**
   - Press `Ctrl+A` then `D`

---

## 🔄 **STEP 5: Set Up Auto-Deployment**

### **Option A: GitHub Webhooks**

1. **Create a Deploy Script**
   ```bash
   # Create deploy.sh
   nano deploy.sh
   ```

2. **Add Deployment Logic**
   ```bash
   #!/bin/bash
   cd /home/username/public_html/
   git pull origin main
   npm install
   npm run hostinger-build
   pm2 restart naukrimili
   ```

3. **Make it Executable**
   ```bash
   chmod +x deploy.sh
   ```

4. **Set Up GitHub Webhook**
   - Go to your GitHub repository settings
   - Add webhook pointing to your server
   - Configure to trigger on push events

### **Option B: Manual Deployment**

```bash
# Every time you want to update:
git pull origin main
npm install
npm run hostinger-build
pm2 restart naukrimili
```

---

## 🧪 **STEP 6: Test Your Deployment**

### **1. Check Application Status**
```bash
# Check if PM2 is running
pm2 status

# Check application logs
pm2 logs naukrimili
```

### **2. Test Your Website**
- Visit your domain: `https://yourdomain.com`
- Test API health: `https://yourdomain.com/api/health`
- Test job search: `https://yourdomain.com/jobs`

### **3. Check Server Logs**
```bash
# Check application logs
pm2 logs naukrimili

# Check system logs
tail -f /var/log/nginx/error.log
```

---

## 🔍 **STEP 7: Troubleshooting**

### **Common KVM Issues**

#### **Port Issues**
```bash
# Check if port 3000 is open
netstat -tlnp | grep :3000

# If using firewall, allow port 3000
ufw allow 3000
```

#### **Permission Issues**
```bash
# Fix file permissions
chmod -R 755 /home/username/public_html/
chown -R username:username /home/username/public_html/
```

#### **Node.js Issues**
```bash
# Check Node.js version
node --version

# Update Node.js if needed
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

#### **PM2 Issues**
```bash
# Restart PM2
pm2 restart all

# Check PM2 logs
pm2 logs

# Reset PM2
pm2 delete all
pm2 start server.js --name "naukrimili"
```

---

## 📊 **STEP 8: Monitoring & Maintenance**

### **1. Monitor Application**
```bash
# Check PM2 status
pm2 status

# Monitor system resources
htop

# Check disk space
df -h
```

### **2. Update Application**
```bash
# Pull latest changes
git pull origin main

# Install new dependencies
npm install

# Build and restart
npm run hostinger-build
pm2 restart naukrimili
```

### **3. Backup Strategy**
```bash
# Backup your application
tar -czf backup-$(date +%Y%m%d).tar.gz /home/username/public_html/

# Backup database (if local)
mysqldump -u username -p database_name > backup.sql
```

---

## 🎯 **SUCCESS CHECKLIST**

- [ ] **SSH access** configured
- [ ] **GitHub repository** cloned
- [ ] **Dependencies installed**
- [ ] **Environment variables** set
- [ ] **Application built** successfully
- [ ] **PM2 running** your application
- [ ] **Domain accessible** and working
- [ ] **Auto-deployment** configured (optional)

---

## 🆘 **KVM-Specific Support**

### **Hostinger KVM Support**
- **SSH Access**: Full server control
- **Custom Configurations**: Nginx, Apache, etc.
- **Multiple Applications**: Run multiple Node.js apps
- **Docker Support**: Containerized deployments (if available)

### **Useful Commands**
```bash
# Check system info
uname -a

# Check disk usage
df -h

# Check memory usage
free -h

# Check running processes
ps aux | grep node

# Check network connections
netstat -tlnp
```

---

**🎉 Your NaukriMili job portal is now ready for KVM hosting!**

**Next**: Follow the SSH deployment steps or use the File Manager to upload your files! 