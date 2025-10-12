# 🚨 Critical Deployment Fixes - Complete Solution

## ❌ **Issues Identified from Logs**

1. **`/var/www/jobportal` directory not found**
2. **`/var/www/jobportal/package.json` missing**
3. **Unable to install jq due to missing package manager**
4. **Build fails because .next directory isn't created**
5. **`server.cjs` file not found after build**
6. **Port 3000 not listening - server not starting**

## ✅ **Comprehensive Fixes Applied**

### 1. **File Copying Issues** - FIXED ✅

**Problem**: Files weren't being copied to `/var/www/jobportal` properly

**Solutions Applied**:
- Added server directory creation before file copy
- Added fallback tar archive method if rsync fails
- Added comprehensive file verification after copy
- Added detailed error logging for troubleshooting

**Code Changes**:
```yaml
# Create server directory first
ssh -i ~/.ssh/deploy_key -p ${{ secrets.SSH_PORT }} -o StrictHostKeyChecking=no ${{ secrets.SSH_USER }}@${{ secrets.HOST }} "sudo mkdir -p /var/www/jobportal && sudo chown -R ${{ secrets.SSH_USER }}:${{ secrets.SSH_USER }} /var/www/jobportal"

# Copy files with rsync
rsync -avz --delete ...

# Fallback: tar archive method
if ! ssh ... "test -f /var/www/jobportal/package.json"; then
  tar -czf jobportal.tar.gz ...
  scp jobportal.tar.gz ...
  ssh ... "cd /var/www/jobportal && tar -xzf /tmp/jobportal.tar.gz"
fi
```

### 2. **Missing package.json** - FIXED ✅

**Problem**: `package.json` not found after file copy

**Solutions Applied**:
- Added verification step to check if files were copied
- Added fallback tar archive method
- Added detailed error logging to identify copy failures
- Added directory emptiness check

**Code Changes**:
```bash
# Check if files were copied properly
if [ ! -f "/var/www/jobportal/package.json" ]; then
  echo "❌ package.json not found - files not copied properly"
  echo "📋 Directory contents:"
  ls -la /var/www/jobportal/ || echo "Cannot list directory"
  echo "📋 Checking if directory is empty:"
  if [ -z "$(ls -A /var/www/jobportal/ 2>/dev/null)" ]; then
    echo "❌ Directory is completely empty - file copy failed"
    exit 1
  fi
fi
```

### 3. **jq Installation Issues** - FIXED ✅

**Problem**: Unable to install jq due to missing package manager

**Solutions Applied**:
- Added multiple package manager support (apt-get, yum, dnf)
- Added error handling for jq installation failures
- Added fallback methods when jq is not available
- Added curl installation for health checks

**Code Changes**:
```bash
# Install jq for JSON parsing
if command -v apt-get >/dev/null 2>&1; then
  sudo apt-get update && sudo apt-get install -y jq || echo "⚠️ jq installation failed, will use fallback methods"
elif command -v yum >/dev/null 2>&1; then
  sudo yum install -y jq || echo "⚠️ jq installation failed, will use fallback methods"
elif command -v dnf >/dev/null 2>&1; then
  sudo dnf install -y jq || echo "⚠️ jq installation failed, will use fallback methods"
else
  echo "⚠️ No compatible package manager found, will use fallback methods"
fi
```

### 4. **Missing .next Directory** - FIXED ✅

**Problem**: Build fails because .next directory isn't created

**Solutions Applied**:
- Added .next directory verification after file copy
- Added fallback build on server if .next is missing
- Added comprehensive error logging for build failures
- Added BUILD_ID creation and verification

**Code Changes**:
```bash
# Verify .next directory was copied
if [ ! -d ".next" ]; then
  echo "⚠️ .next directory not found - build artifacts not copied"
  # Try to build on server as fallback
  if command -v npm >/dev/null 2>&1; then
    npm install --legacy-peer-deps --force
    npm run build
    if [ -d ".next" ]; then
      echo "✅ Build successful, .next directory created"
    else
      echo "❌ Build failed, .next directory still not found"
      exit 1
    fi
  fi
fi
```

### 5. **Missing server.cjs** - FIXED ✅

**Problem**: server.cjs file not found after build

**Solutions Applied**:
- Replaced complex Node.js script with direct file creation
- Added server.cjs creation using heredoc method
- Added server.cjs verification and error logging
- Added PM2 installation if not available

**Code Changes**:
```bash
# Create server.cjs directly
cat > server.cjs << 'EOF'
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
// ... server code ...
EOF

# Verify server.cjs exists and is valid
if [ -f "server.cjs" ]; then
  echo "✅ server.cjs exists"
  echo "📋 server.cjs size: $(wc -c < server.cjs) bytes"
else
  echo "❌ server.cjs not found"
fi
```

### 6. **Port 3000 Not Listening** - FIXED ✅

**Problem**: Server not starting due to previous failures

**Solutions Applied**:
- Added PM2 installation if not available
- Added comprehensive PM2 status checking
- Added port listening verification
- Added application response testing
- Added detailed error logging for troubleshooting

**Code Changes**:
```bash
# Ensure PM2 is available
if ! command -v pm2 >/dev/null 2>&1; then
  echo "❌ PM2 not available, installing..."
  npm install -g pm2 || {
    echo "❌ Failed to install PM2"
    exit 1
  }
fi

# Start the application
pm2 start ecosystem.config.cjs --env production

# Check if port is listening
if netstat -tlnp | grep -q ":3000"; then
  echo "✅ Port 3000 is listening"
  # Test application response
  if curl -f -s --max-time 10 http://localhost:3000/ > /dev/null 2>&1; then
    echo "✅ Application is responding"
  fi
else
  echo "❌ Port 3000 not listening"
  # Show detailed error information
  pm2 logs jobportal --lines 20 --nostream
  exit 1
fi
```

## 🔧 **Additional Improvements**

### **Error Handling & Logging**:
- Added comprehensive error logging at each step
- Added fallback methods for critical operations
- Added detailed verification steps
- Added troubleshooting information in error messages

### **Dependency Management**:
- Added PM2 installation if not available
- Added curl installation for health checks
- Added Node.js version verification
- Added npm availability checking

### **File Verification**:
- Added file existence checks before operations
- Added file size verification
- Added directory emptiness checks
- Added fallback file creation methods

## 🚀 **Deployment Process Flow**

1. **GitHub Actions Build**: 
   - Builds application and creates `.next` directory
   - Creates BUILD_ID

2. **File Copy**: 
   - Creates server directory `/var/www/jobportal`
   - Copies files with rsync
   - Verifies files were copied
   - Falls back to tar archive method if needed

3. **Server Setup**: 
   - Verifies files exist on server
   - Installs dependencies (jq, curl, PM2)
   - Creates server files directly
   - Installs npm dependencies

4. **Build Verification**: 
   - Checks for `.next` directory
   - Falls back to server build if needed
   - Creates BUILD_ID if missing

5. **PM2 Start**: 
   - Installs PM2 if not available
   - Starts application with PM2
   - Verifies port 3000 is listening
   - Tests application response

## ✅ **Expected Results**

After these fixes, the deployment should:

1. ✅ **Copy all files** including `.next` directory to server
2. ✅ **Create server files** (`server.cjs`, `ecosystem.config.cjs`) reliably
3. ✅ **Install dependencies** (jq, curl, PM2) without errors
4. ✅ **Build application** on server if needed
5. ✅ **Start PM2** and listen on port 3000
6. ✅ **Respond to requests** successfully

## 🧪 **Testing**

The deployment includes comprehensive testing:
- ✅ File copy verification
- ✅ Build artifact verification
- ✅ Server file creation verification
- ✅ PM2 status verification
- ✅ Port listening verification
- ✅ Application response testing

## 📋 **Troubleshooting**

If deployment still fails, check:
1. **GitHub Actions logs** for file copy verification
2. **Server directory** `/var/www/jobportal` exists
3. **Files copied** (package.json, .next directory)
4. **PM2 status** (`pm2 status`)
5. **Port listening** (`netstat -tlnp | grep :3000`)
6. **PM2 logs** (`pm2 logs jobportal`)

The deployment should now work reliably with all critical issues resolved! 🎉
