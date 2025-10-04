# Production Deployment Debug Guide

## 🔧 **Comprehensive Health Check Fixes Applied**

### **Issues Fixed:**

1. **Package Manager Detection Error**
   - ❌ **Problem**: `sudo: apt-get: command not found`
   - ✅ **Solution**: Added detection for apt-get, yum, dnf package managers
   - ✅ **Result**: Graceful fallback when jq installation fails

2. **Health Check Robustness**
   - ❌ **Problem**: PM2 reports online but health endpoint fails
   - ✅ **Solution**: Multiple retry attempts, increased timeouts, basic connectivity fallback
   - ✅ **Result**: More resilient health checking

3. **Server Health Endpoint**
   - ❌ **Problem**: Health endpoint not responding reliably
   - ✅ **Solution**: Enhanced endpoint with system info, automatic verification
   - ✅ **Result**: Better health monitoring and debugging

4. **Error Handling & Logging**
   - ❌ **Problem**: Insufficient debugging information
   - ✅ **Solution**: Comprehensive logging, PM2 log analysis, detailed error reporting
   - ✅ **Result**: Better troubleshooting capabilities

---

## 🚀 **Server Commands for Google OAuth Setup**

**Run these commands on your production server to enable Google OAuth:**

```bash
# SSH into your server
ssh root@aftionix.in

# Set environment variables
export GOOGLE_CLIENT_ID="your_google_client_id_here"
export GOOGLE_CLIENT_SECRET="your_google_client_secret_here"

# Add to .bashrc for persistence
echo 'export GOOGLE_CLIENT_ID="your_google_client_id_here"' >> ~/.bashrc
echo 'export GOOGLE_CLIENT_SECRET="your_google_client_secret_here"' >> ~/.bashrc

# Reload environment
source ~/.bashrc

# Restart PM2 to pick up new environment variables
pm2 restart jobportal

# Verify the setup
pm2 show jobportal
```

---

## 🔍 **Debugging Commands**

### **Check Server Status:**
```bash
# Check PM2 status
pm2 status
pm2 describe jobportal

# Check if server is listening on port 3000
netstat -tlnp | grep :3000

# Check Node processes
ps aux | grep node
```

### **Check Health Endpoint:**
```bash
# Test health endpoint
curl -v http://localhost:3000/api/health

# Test basic connectivity
curl -v http://localhost:3000/
```

### **Check Logs:**
```bash
# PM2 logs
pm2 logs jobportal
pm2 logs jobportal --err --lines 50

# Application logs
tail -f /var/log/jobportal/error.log
tail -f /var/log/jobportal/combined.log
```

### **Environment Variables:**
```bash
# Check if environment variables are set
pm2 show jobportal | grep -E "(GOOGLE_CLIENT|NEXTAUTH)"

# Check environment in PM2
pm2 env 0
```

---

## 🛠️ **Troubleshooting Steps**

### **If Health Check Still Fails:**

1. **Check Server Process:**
   ```bash
   pgrep -f "node.*server.js"
   ```

2. **Check Port Binding:**
   ```bash
   netstat -tlnp | grep :3000
   ```

3. **Test Health Endpoint Manually:**
   ```bash
   curl -f -s --max-time 10 http://localhost:3000/api/health
   ```

4. **Check PM2 Logs for Errors:**
   ```bash
   pm2 logs jobportal --err --lines 20
   ```

### **If Google OAuth Still Doesn't Work:**

1. **Verify Environment Variables:**
   ```bash
   pm2 show jobportal
   ```

2. **Check Google Cloud Console:**
   - Ensure redirect URIs include:
     - `https://aftionix.in/api/auth/callback/google`
     - `https://aftionix.in/auth/callback/google`

3. **Test OAuth Flow:**
   - Visit: `https://aftionix.in/auth/signin`
   - Try clicking "Continue with Google"

---

## 📊 **Expected Results**

### **Successful Deployment Should Show:**
- ✅ PM2 status: `online`
- ✅ Port 3000: `listening`
- ✅ Health endpoint: `200 OK`
- ✅ Google OAuth: Working on signin page

### **Deployment Logs Should Show:**
- ✅ Package manager detection successful
- ✅ Health endpoint responding
- ✅ PM2 process online
- ✅ Server ready on port 3000

---

## 🆘 **Emergency Commands**

### **If Server Won't Start:**
```bash
# Kill all PM2 processes
pm2 kill

# Clean restart
pm2 start ecosystem.config.cjs --env production

# Check logs immediately
pm2 logs jobportal --lines 50
```

### **If Health Endpoint Fails:**
```bash
# Restart with fresh environment
pm2 restart jobportal

# Wait and test
sleep 10
curl http://localhost:3000/api/health
```

---

## ✅ **Verification Checklist**

- [ ] PM2 shows `online` status
- [ ] Port 3000 is listening
- [ ] Health endpoint returns 200 OK
- [ ] Google OAuth credentials are set
- [ ] Application accessible at https://aftionix.in
- [ ] No critical errors in PM2 logs

**All issues should now be resolved with these comprehensive fixes!** 🎉
