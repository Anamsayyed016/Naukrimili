# 🚀 Hostinger KVM + GitHub SSH Deployment

## ✅ **Your GitHub Repository**
- **SSH URL**: `git@github.com:Anamsayyed016/Naukrimili.git`
- **Repository**: `Anamsayyed016/Naukrimili`
- **Status**: Ready for deployment

---

## 📋 **STEP 1: Get Hostinger SSH Access**

### **1. Access Your KVM Panel**
- Log into Hostinger KVM control panel
- Look for "SSH" or "Terminal" section
- Note your SSH credentials:
  - **Hostname/IP**: Your server IP
  - **Username**: Your KVM username
  - **Password/Key**: Your SSH password or key

### **2. Test SSH Connection**
```bash
# Connect to your Hostinger server
ssh root@69.62.73.84

# You should see a welcome message
```

---

## 🔧 **STEP 2: Deploy Your Application**

### **1. Connect to Your Server**
```bash
ssh root@69.62.73.84
```

### **2. Navigate to Your Domain Directory**
```bash
# Go to your domain directory
cd /home/root/public_html/
# or wherever your domain files are located

# List current files
ls -la
```

### **3. Clone Your GitHub Repository**
```bash
# Clone your repository
git clone git@github.com:Anamsayyed016/Naukrimili.git .

# If SSH key not set up, use HTTPS instead:
# git clone https://github.com/Anamsayyed016/Naukrimili.git .
```

### **4. Install Dependencies and Build**
```bash
# Install Node.js dependencies
npm install

# Build for production
npm run hostinger-build

# Check if build was successful
ls -la .next/
```

---

## 🌍 **STEP 3: Set Up Environment Variables**

### **1. Create Environment File**
```bash
# Create .env.local file
nano .env.local
```

### **2. Add Your Environment Variables**
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

# Job APIs (Optional)
ADZUNA_APP_ID=your-adzuna-app-id
ADZUNA_API_KEY=your-adzuna-api-key
REED_API_KEY=your-reed-api-key

# AWS S3 (Optional for file uploads)
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=us-east-1
S3_BUCKET_NAME=your-s3-bucket-name

# Hostinger Specific
PORT=3000
HOST=0.0.0.0
```

### **3. Save and Exit**
- Press `Ctrl+X` to exit
- Press `Y` to save
- Press `Enter` to confirm

---

## 🚀 **STEP 4: Start Your Application**

### **1. Install PM2 (Process Manager)**
```bash
# Install PM2 globally
npm install -g pm2

# Check if PM2 is installed
pm2 --version
```

### **2. Start Your Application**
```bash
# Start your application with PM2
pm2 start server.js --name "naukrimili"

# Save PM2 configuration
pm2 save

# Set PM2 to start on boot
pm2 startup

# Check if application is running
pm2 status
```

### **3. Check Application Logs**
```bash
# View application logs
pm2 logs naukrimili

# View real-time logs
pm2 logs naukrimili --lines 50
```

---

## 🔄 **STEP 5: Set Up Auto-Deployment**

### **1. Create Deploy Script**
```bash
# Create deployment script
nano deploy.sh
```

### **2. Add Deployment Logic**
```bash
#!/bin/bash
echo "Starting deployment..."

# Navigate to project directory
cd /home/root/public_html/

# Pull latest changes
git pull origin main

# Install dependencies
npm install

# Build application
npm run hostinger-build

# Restart application
pm2 restart naukrimili

echo "Deployment completed!"
```

### **3. Make Script Executable**
```bash
# Make script executable
chmod +x deploy.sh

# Test the script
./deploy.sh
```

---

## 🧪 **STEP 6: Test Your Deployment**

### **1. Check Application Status**
```bash
# Check if PM2 is running
pm2 status

# Check application logs
pm2 logs naukrimili

# Check if port 3000 is listening
netstat -tlnp | grep :3000
```

### **2. Test Your Website**
- Visit your domain: `https://yourdomain.com`
- Test API health: `https://yourdomain.com/api/health`
- Test job search: `https://yourdomain.com/jobs`

### **3. Check Server Resources**
```bash
# Check system resources
htop

# Check disk space
df -h

# Check memory usage
free -h
```

---

## 🔍 **STEP 7: Troubleshooting**

### **Common Issues**

#### **Git Clone Issues**
```bash
# If SSH key not set up, use HTTPS
git clone https://github.com/Anamsayyed016/Naukrimili.git .

# Or set up SSH key
ssh-keygen -t rsa -b 4096 -C "your-email@example.com"
cat ~/.ssh/id_rsa.pub
# Add this key to your GitHub account
```

#### **Port Issues**
```bash
# Check if port 3000 is open
netstat -tlnp | grep :3000

# If using firewall, allow port 3000
sudo ufw allow 3000
```

#### **Permission Issues**
```bash
# Fix file permissions
chmod -R 755 /home/username/public_html/
chown -R username:username /home/username/public_html/
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

## 📊 **STEP 8: Monitoring & Updates**

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

- [ ] **SSH access** to Hostinger server
- [ ] **GitHub repository** cloned successfully
- [ ] **Dependencies installed** (npm install)
- [ ] **Application built** (npm run hostinger-build)
- [ ] **Environment variables** configured
- [ ] **PM2 running** your application
- [ ] **Domain accessible** and working
- [ ] **Auto-deployment** script created

---

## 🆘 **Quick Commands Reference**

```bash
# Connect to server
ssh root@69.62.73.84

# Navigate to project
cd /home/username/public_html/

# Update application
git pull origin main
npm install
npm run hostinger-build
pm2 restart naukrimili

# Check status
pm2 status
pm2 logs naukrimili

# View system resources
htop
df -h
```

---

**🎉 Your NaukriMili job portal is now ready for SSH deployment!**

**Next**: Connect to your Hostinger server via SSH and follow these steps! 