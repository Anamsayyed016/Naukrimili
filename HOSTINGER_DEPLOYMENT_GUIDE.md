# 🚀 NaukriMili - Hostinger Deployment Guide

## ✅ **PRE-DEPLOYMENT CHECKLIST**

Your project is now ready for deployment! Here's what we've prepared:

- ✅ **Build completed successfully** (63 pages, 40+ API routes)
- ✅ **Dependencies installed** (1161 packages)
- ✅ **Prisma schema fixed** (database models ready)
- ✅ **Server configuration** (server.js ready)
- ✅ **Apache configuration** (.htaccess ready)
- ✅ **Environment template** (env.hostinger.example)

---

## 📤 **STEP 1: UPLOAD TO HOSTINGER**

### **Option A: Using Hostinger File Manager**

1. **Access Hostinger Control Panel**
   - Log in to your Hostinger account
   - Go to "Websites" → "Manage"
   - Click "File Manager"

2. **Navigate to public_html**
   - Open the `public_html` folder
   - Delete any existing files (backup if needed)

3. **Upload Your Project**
   - Select all files from your local project folder
   - Upload them to `public_html/`
   - **Important**: Make sure `.next/` folder is included

### **Option B: Using FTP (Recommended)**

1. **Get FTP Credentials**
   - In Hostinger control panel, go to "Files" → "FTP Accounts"
   - Note your FTP hostname, username, and password

2. **Connect via FTP Client**
   - Use FileZilla, WinSCP, or any FTP client
   - Connect to your Hostinger FTP server
   - Navigate to `public_html/`

3. **Upload Files**
   - Upload your entire project folder
   - Ensure all files are uploaded (including hidden files)

---

## 🔧 **STEP 2: CONFIGURE HOSTINGER**

### **Enable Node.js**

1. **Access Node.js Settings**
   - In Hostinger control panel, go to "Advanced" → "Node.js"
   - Click "Enable Node.js"

2. **Configure Node.js**
   - **Node.js Version**: Select 18.x or higher
   - **Startup File**: Set to `server.js`
   - **App URL**: Your domain (e.g., `https://yourdomain.com`)
   - **App Root**: Leave as `/public_html`

3. **Save Configuration**
   - Click "Save" to apply settings
   - Wait for Node.js to be activated

### **Domain Configuration**

1. **Point Domain to Project**
   - Go to "Domains" → "Manage"
   - Ensure your domain points to the correct directory

2. **Enable SSL Certificate**
   - Go to "SSL" → "Manage"
   - Enable SSL for your domain
   - Wait for certificate to be issued

---

## 🌍 **STEP 3: ENVIRONMENT VARIABLES**

### **Create .env.local File**

1. **In Hostinger File Manager**
   - Navigate to `public_html/`
   - Create a new file named `.env.local`

2. **Add Environment Variables**
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

3. **Replace Placeholder Values**
   - Replace `yourdomain.com` with your actual domain
   - Add your actual API keys and database credentials
   - Generate a secure `NEXTAUTH_SECRET` (use: `openssl rand -base64 32`)

---

## 🧪 **STEP 4: TEST YOUR DEPLOYMENT**

### **Initial Testing**

1. **Test Homepage**
   - Visit `https://yourdomain.com`
   - Should load the NaukriMili homepage

2. **Test API Endpoints**
   - Visit `https://yourdomain.com/api/health`
   - Should return health status

3. **Test Job Search**
   - Navigate to `/jobs`
   - Test job search functionality

### **Advanced Testing**

1. **User Registration/Login**
   - Test user registration at `/auth/register`
   - Test login at `/auth/login`

2. **Admin Dashboard**
   - Test admin access at `/admin/dashboard`

3. **File Uploads**
   - Test resume upload functionality

---

## 🔍 **STEP 5: TROUBLESHOOTING**

### **Common Issues & Solutions**

#### **500 Internal Server Error**
```bash
# Check Node.js logs in Hostinger control panel
# Common causes:
# 1. Missing environment variables
# 2. Database connection issues
# 3. Incorrect startup file
```

#### **API Routes Not Working**
```bash
# Verify .htaccess file is uploaded
# Check if server.js is set as startup file
# Ensure all API routes are built correctly
```

#### **Database Connection Issues**
```bash
# Verify MongoDB connection string
# Check if MongoDB Atlas IP whitelist includes Hostinger IPs
# Ensure database user has correct permissions
```

#### **Static Assets Not Loading**
```bash
# Check if .next/static/ folder exists
# Verify file permissions (755 for folders, 644 for files)
# Clear browser cache
```

### **Performance Optimization**

1. **Enable Compression**
   - Gzip compression is handled by Next.js
   - Verify in browser dev tools

2. **Optimize Images**
   - Use Next.js Image component
   - Implement lazy loading

3. **Monitor Performance**
   - Use browser dev tools
   - Check page load times

---

## 📊 **STEP 6: MONITORING & MAINTENANCE**

### **Regular Monitoring**

1. **Check Server Logs**
   - Access logs in Hostinger control panel
   - Monitor for errors and performance issues

2. **Database Monitoring**
   - Monitor MongoDB Atlas dashboard
   - Check connection pool usage

3. **Performance Monitoring**
   - Use browser dev tools
   - Monitor Core Web Vitals

### **Updates & Maintenance**

1. **Keep Dependencies Updated**
   ```bash
   npm update
   npm audit fix
   ```

2. **Database Backups**
   - Set up regular MongoDB Atlas backups
   - Test restore procedures

3. **Security Updates**
   - Monitor for security vulnerabilities
   - Update dependencies regularly

---

## 🎯 **DEPLOYMENT SUCCESS CHECKLIST**

- [ ] **Files uploaded** to Hostinger public_html/
- [ ] **Node.js enabled** and configured
- [ ] **Startup file** set to server.js
- [ ] **Environment variables** configured in .env.local
- [ ] **SSL certificate** enabled
- [ ] **Homepage loads** correctly
- [ ] **API endpoints** respond
- [ ] **User registration/login** works
- [ ] **Job search** functionality works
- [ ] **Admin dashboard** accessible
- [ ] **File uploads** working (if configured)
- [ ] **Mobile responsiveness** tested
- [ ] **Performance** optimized

---

## 🆘 **SUPPORT & RESOURCES**

### **Hostinger Support**
- **Documentation**: https://support.hostinger.com/
- **Node.js Guide**: https://support.hostinger.com/en/articles/1583299-how-to-use-node-js
- **Live Chat**: Available in Hostinger control panel

### **Project Documentation**
- **API Documentation**: Check `/api/health` endpoint
- **Deployment Guide**: This file
- **Troubleshooting**: See HOSTINGER_DEPLOYMENT.md

### **Emergency Contacts**
- **Hostinger Support**: Available 24/7
- **Project Issues**: Check GitHub repository
- **Database Issues**: MongoDB Atlas support

---

## 🚀 **NEXT STEPS AFTER DEPLOYMENT**

1. **Set up monitoring** (error tracking, analytics)
2. **Configure backups** (database, files)
3. **Set up CI/CD** (optional, for future updates)
4. **Optimize performance** (caching, CDN)
5. **Security hardening** (firewall, rate limiting)
6. **SEO optimization** (meta tags, sitemap)

---

**🎉 Congratulations! Your NaukriMili job portal is now live on Hostinger!**

**Your website URL**: `https://yourdomain.com`
**Admin Dashboard**: `https://yourdomain.com/admin/dashboard`
**API Health Check**: `https://yourdomain.com/api/health` 