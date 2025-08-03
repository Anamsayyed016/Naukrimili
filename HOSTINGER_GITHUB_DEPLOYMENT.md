# 🚀 Hostinger + GitHub Auto-Deployment Setup

## ✅ **Why GitHub Integration is Better**

- **Automatic Deployments**: Push to GitHub → Auto-deploy to Hostinger
- **Version Control**: Track all changes and rollback if needed
- **No Manual Uploads**: No more FTP or file manager uploads
- **Team Collaboration**: Multiple developers can work together
- **Deployment History**: Track all deployments and changes

---

## 📋 **STEP 1: Prepare Your GitHub Repository**

### **1. Create GitHub Repository**
```bash
# If you haven't already, create a new repository on GitHub
# Go to: https://github.com/new
# Repository name: naukrimili-jobportal
# Make it Public or Private (your choice)
```

### **2. Push Your Code to GitHub**
```bash
# Initialize git (if not already done)
git init

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit: NaukriMili job portal"

# Add GitHub remote
git remote add origin https://github.com/YOUR_USERNAME/naukrimili-jobportal.git

# Push to GitHub
git push -u origin main
```

### **3. Verify Repository Structure**
Your GitHub repository should contain:
- ✅ `package.json`
- ✅ `server.js`
- ✅ `.htaccess`
- ✅ `next.config.mjs`
- ✅ `prisma/` folder
- ✅ `app/` folder
- ✅ All other project files

---

## 🔧 **STEP 2: Configure Hostinger GitHub Integration**

### **1. Access Hostinger Control Panel**
- Log into your Hostinger account
- Go to "Websites" → "Manage"

### **2. Enable GitHub Integration**
- Look for "Git" or "GitHub" in the left sidebar
- Click "Connect GitHub" or "Git Integration"
- If not available, go to "Advanced" → "Git"

### **3. Connect Your GitHub Account**
- Click "Connect GitHub Account"
- Authorize Hostinger to access your GitHub
- Select your repository: `naukrimili-jobportal`

### **4. Configure Deployment Settings**
```
Repository: YOUR_USERNAME/naukrimili-jobportal
Branch: main (or master)
Build Command: npm run hostinger-build
Start Command: npm run hostinger-start
Node.js Version: 18.x or higher
```

---

## 🌍 **STEP 3: Environment Variables Setup**

### **1. Add Environment Variables in Hostinger**
- Go to "Environment Variables" or "App Settings"
- Add the following variables:

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

### **2. Replace Placeholder Values**
- Replace `yourdomain.com` with your actual domain
- Add your actual API keys and database credentials
- Generate a secure `NEXTAUTH_SECRET`

---

## 🚀 **STEP 4: First Deployment**

### **1. Trigger Initial Deployment**
- In Hostinger, click "Deploy" or "Build"
- Hostinger will pull from GitHub and build your app
- Monitor the build logs for any errors

### **2. Check Deployment Status**
- Watch the build process in Hostinger dashboard
- Look for any error messages
- Verify the deployment completes successfully

### **3. Test Your Deployment**
- Visit your domain: `https://yourdomain.com`
- Test API health: `https://yourdomain.com/api/health`
- Test job search: `https://yourdomain.com/jobs`

---

## 🔄 **STEP 5: Automatic Deployments**

### **How It Works**
1. **Make Changes**: Edit your code locally
2. **Commit & Push**: `git add . && git commit -m "Update" && git push`
3. **Auto-Deploy**: Hostinger automatically detects changes and deploys
4. **Live**: Your changes are live in minutes!

### **Example Workflow**
```bash
# Make changes to your code
# Then push to GitHub
git add .
git commit -m "Add new job search feature"
git push origin main

# Hostinger automatically deploys the changes!
```

---

## 📊 **STEP 6: Monitoring & Management**

### **Deployment History**
- View all deployments in Hostinger dashboard
- See build logs and status
- Rollback to previous versions if needed

### **Build Logs**
- Monitor build process in real-time
- Debug any deployment issues
- Check for dependency or build errors

### **Performance Monitoring**
- Monitor your app's performance
- Check server logs for errors
- Track user analytics

---

## 🛠️ **STEP 7: Advanced Configuration**

### **Custom Build Commands**
If needed, you can customize the build process:

```bash
# In Hostinger settings, set build command to:
npm install && npm run hostinger-build

# And start command to:
npm run hostinger-start
```

### **Branch Deployments**
- Deploy from different branches (staging, development)
- Set up multiple environments
- Test changes before going live

### **Environment-Specific Variables**
- Set different environment variables for different branches
- Use staging environment for testing
- Production environment for live site

---

## 🆘 **TROUBLESHOOTING**

### **Common Issues**

#### **Build Fails**
```bash
# Check build logs in Hostinger
# Common causes:
# 1. Missing dependencies
# 2. Environment variables not set
# 3. Node.js version mismatch
```

#### **GitHub Connection Issues**
```bash
# Reconnect GitHub account
# Check repository permissions
# Verify repository URL
```

#### **Deployment Not Triggering**
```bash
# Check GitHub webhook settings
# Verify branch name (main vs master)
# Check repository settings
```

### **Performance Tips**
- ✅ Use `.gitignore` to exclude unnecessary files
- ✅ Optimize build process
- ✅ Monitor deployment times
- ✅ Set up staging environment

---

## 🎯 **SUCCESS CHECKLIST**

- [ ] **GitHub repository** created and connected
- [ ] **Code pushed** to GitHub
- [ ] **Hostinger GitHub integration** enabled
- [ ] **Environment variables** configured
- [ ] **First deployment** successful
- [ ] **Automatic deployments** working
- [ ] **Website live** and functional
- [ ] **Monitoring** set up

---

## 🚀 **BENEFITS OF GITHUB INTEGRATION**

### **For Development**
- ✅ **Version Control**: Track all changes
- ✅ **Collaboration**: Multiple developers
- ✅ **Rollback**: Easy to revert changes
- ✅ **History**: Complete change history

### **For Deployment**
- ✅ **Automatic**: No manual uploads needed
- ✅ **Fast**: Deployments in minutes
- ✅ **Reliable**: Consistent deployment process
- ✅ **Monitoring**: Build logs and status

### **For Maintenance**
- ✅ **Easy Updates**: Just push to GitHub
- ✅ **Testing**: Deploy to staging first
- ✅ **Backup**: Code safely stored on GitHub
- ✅ **Documentation**: Changes tracked in commits

---

**🎉 Congratulations! Your NaukriMili job portal now has automatic deployments!**

**Next**: Push your code to GitHub and connect it to Hostinger for seamless deployments! 