# 🚨 Hostinger Deployment Troubleshooting

## Most Common Issues & Quick Fixes

### 1. ❌ **500 Internal Server Error**

**Symptoms:**
- White screen with "500 Internal Server Error"
- Website won't load at all
- Server logs show application errors

**Solutions:**

#### A. Check Node.js Configuration
```bash
# In Hostinger Control Panel:
1. Go to "Advanced" → "Node.js"
2. Verify Node.js is ENABLED
3. Check Node.js Version: Should be 18.x or 20.x
4. Startup File: Must be "server.js"
5. App Root: Should be "/public_html" or your project folder
```

#### B. Verify Environment Variables
```bash
# Create .env.local file in your public_html/ directory
# Copy from .env.hostinger template and update values:

NODE_ENV=production
NEXTAUTH_URL=https://YOURACTUALDOMAIIN.com
NEXTAUTH_SECRET=generate-a-32-character-secret
MONGODB_URI=your-actual-mongodb-connection-string
```

#### C. Check File Permissions
```bash
# In Hostinger File Manager:
- Folders: 755 permissions
- Files: 644 permissions
- server.js: 755 permissions (executable)
```

### 2. 🔌 **API Routes Not Working**

**Symptoms:**
- Homepage loads but `/api/*` routes return 404
- Job search doesn't work
- Authentication fails

**Solutions:**

#### A. Verify .htaccess File
Your `.htaccess` should be in the root directory:
```apache
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ /index.html [QSA,L]
```

#### B. Check Server.js Configuration
Ensure your `server.js` handles all routes:
```javascript
// Should have this pattern:
app.prepare().then(() => {
  createServer(async (req, res) => {
    const parsedUrl = parse(req.url, true);
    await handle(req, res, parsedUrl);
  }).listen(port);
});
```

### 3. 🗄️ **Database Connection Errors**

**Symptoms:**
- "Database connection failed"
- "ENOTFOUND" errors in logs
- User registration/login not working

**Solutions:**

#### A. MongoDB Atlas Configuration
```bash
1. Check MongoDB Atlas dashboard
2. Verify cluster is running
3. Add Hostinger IP to whitelist:
   - Go to Network Access
   - Add: 0.0.0.0/0 (allow all) for testing
   - Later restrict to specific IPs
```

#### B. Connection String Format
```bash
# Correct format:
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/naukrimili?retryWrites=true&w=majority

# Common mistakes:
- Missing database name
- Special characters in password not URL-encoded
- Wrong cluster URL
```

### 4. 📂 **Static Files Not Loading**

**Symptoms:**
- Images, CSS, JS files return 404
- Styling is broken
- Next.js static assets missing

**Solutions:**

#### A. Verify Build Output
```bash
# Ensure these folders exist in public_html/:
.next/
.next/static/
.next/server/
public/
```

#### B. Check File Upload
```bash
# Common upload mistakes:
- .next folder not uploaded
- File corruption during upload
- Incomplete upload process
```

### 5. 🔐 **Authentication Issues**

**Symptoms:**
- Google OAuth not working
- "OAuth error" messages
- Login redirects fail

**Solutions:**

#### A. Google OAuth Configuration
```bash
# In Google Cloud Console:
1. Authorized JavaScript origins:
   - https://yourdomain.com
   
2. Authorized redirect URIs:
   - https://yourdomain.com/api/auth/callback/google
```

#### B. Environment Variables
```bash
# Check these are correct:
NEXTAUTH_URL=https://yourdomain.com
GOOGLE_CLIENT_ID=your-actual-client-id
GOOGLE_CLIENT_SECRET=your-actual-client-secret
```

## 🔍 **Diagnostic Steps**

### Step 1: Test Basic Functionality
```bash
# Test these URLs in browser:
1. https://yourdomain.com (Homepage)
2. https://yourdomain.com/api/health (Health check)
3. https://yourdomain.com/api/jobs/debug (Debug info)
```

### Step 2: Check Hostinger Logs
```bash
# In Hostinger Control Panel:
1. Go to "Files" → "Logs"
2. Check error.log and access.log
3. Look for specific error messages
```

### Step 3: Test Environment Variables
```javascript
// Add this to your server.js temporarily for debugging:
console.log('Environment Check:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('NEXTAUTH_URL:', process.env.NEXTAUTH_URL);
console.log('MONGODB_URI:', !!process.env.MONGODB_URI);
```

## 🛠️ **Fix Commands**

### Rebuild and Redeploy
```bash
# Local commands (run before uploading):
cd your-project-directory
npm install
npm run hostinger-build

# Then upload all files including .next/ folder
```

### Reset Node.js Application
```bash
# In Hostinger Control Panel:
1. Go to Node.js settings
2. Click "Restart" button
3. Wait 30-60 seconds
4. Test your website
```

### Clear Browser Cache
```bash
# For testing:
1. Open browser in incognito/private mode
2. Or clear browser cache completely
3. Hard refresh with Ctrl+F5
```

## 📋 **Deployment Checklist**

Before asking for help, verify:

- [ ] ✅ Node.js is enabled in Hostinger control panel
- [ ] ✅ Node.js version is 18+ 
- [ ] ✅ Startup file is set to "server.js"
- [ ] ✅ .env.local file exists with all required variables
- [ ] ✅ NEXTAUTH_URL matches your actual domain
- [ ] ✅ MongoDB connection string is correct
- [ ] ✅ .next/ folder is uploaded
- [ ] ✅ SSL certificate is enabled
- [ ] ✅ Domain DNS is properly configured

## 🆘 **Getting Help**

### What to Check First:
1. **Hostinger Control Panel Logs**: Check for specific error messages
2. **Browser Developer Tools**: Check console for JavaScript errors
3. **Network Tab**: Check if API calls are failing

### Information to Provide:
- Exact error message from logs
- Your domain name (if comfortable sharing)
- Node.js version in Hostinger
- Whether homepage loads or not
- Specific functionality that's broken

### Quick Test URLs:
Replace `yourdomain.com` with your actual domain:
```
Homepage: https://yourdomain.com
Health: https://yourdomain.com/api/health
Jobs API: https://yourdomain.com/api/jobs
Debug: https://yourdomain.com/api/jobs/debug
```

## 🚀 **Still Need Help?**

If you've tried all the above solutions, please share:
1. **What specific error are you seeing?**
2. **What does the Hostinger error log show?**
3. **Which part of the website is not working?**
4. **Have you completed the deployment checklist above?**

The most common issue is environment variables not being set correctly on the server, followed by Node.js configuration problems in the Hostinger control panel.
