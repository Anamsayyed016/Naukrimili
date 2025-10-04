# Production Deployment Guide
<!-- Updated: 2025-01-04 12:40:00 - Fixed workflow with better error handling -->

## 🚀 Complete Solution for Production Deployment Issues

This guide provides a comprehensive solution for common production deployment issues including git merge conflicts, Node version mismatches, and PM2 startup failures.

## 📋 Issues Addressed

### ✅ Git Merge Conflicts
- **Problem**: Local changes blocking git pull
- **Solution**: Force clean git pull that overwrites local changes
- **Implementation**: `git reset --hard origin/main && git clean -fd`

### ✅ Node Version Mismatch
- **Problem**: Packages require Node 20 but using Node 18
- **Solution**: Automatic Node version detection and installation
- **Implementation**: Checks current version and installs Node 20 if needed

### ✅ PM2 Startup Failures
- **Problem**: PM2 process crashes, health check fails
- **Solution**: Enhanced PM2 management with proper error handling
- **Implementation**: Better process monitoring and health checks

## 🛠️ Files Included

### 1. `.github/workflows/deploy.yml`
- **Purpose**: GitHub Actions workflow for automated deployment
- **Features**:
  - Node 20.x setup
  - Force clean git pull
  - Comprehensive dependency installation
  - UI component creation
  - Enhanced health checks
  - PM2 process management

### 2. `scripts/universal-deploy.sh`
- **Purpose**: Universal deployment script for any tech stack
- **Features**:
  - Cross-platform compatibility
  - Configurable parameters
  - Automatic Node.js installation
  - Health check with retries
  - Comprehensive error handling
  - PM2 process management

### 3. `ecosystem.config.cjs`
- **Purpose**: PM2 configuration for production
- **Features**:
  - Production-optimized settings
  - Memory management
  - Health monitoring
  - Logging configuration
  - Auto-restart on failure

## 🚀 Quick Start

### Option 1: GitHub Actions (Recommended)
1. **Commit the files**:
   ```bash
   git add .github/workflows/deploy.yml ecosystem.config.cjs scripts/universal-deploy.sh
   git commit -m "Add production deployment solution"
   git push origin main
   ```

2. **Set up GitHub Secrets**:
   - `HOST`: Your server IP address
   - `SSH_USER`: SSH username (usually `root`)
   - `SSH_KEY`: Your private SSH key
   - `SSH_PORT`: SSH port (usually `22`)

3. **Deploy**: Push to main branch or trigger manually

### Option 2: Manual Deployment
1. **Upload the universal script**:
   ```bash
   scp scripts/universal-deploy.sh user@your-server:/root/
   ```

2. **Run the deployment**:
   ```bash
   ssh user@your-server
   chmod +x universal-deploy.sh
   ./universal-deploy.sh
   ```

## ⚙️ Configuration

### Environment Variables
```bash
export PROJECT_DIR="/root/jobportal"
export NODE_VERSION="20"
export APP_NAME="jobportal"
export APP_PORT="3000"
export HEALTH_CHECK_URL="http://localhost:3000/api/health"
export MAX_RETRIES="10"
export RETRY_DELAY="15"
```

### Command Line Options
```bash
./universal-deploy.sh --help
./universal-deploy.sh --dir /path/to/project --node-version 20 --port 3000
```

## 🔧 Customization

### For Different Tech Stacks

#### React/Vue/Angular
```bash
# Update build command in package.json
"build": "npm run build:production"

# Update health check URL
export HEALTH_CHECK_URL="http://localhost:3000"
```

#### Node.js/Express
```bash
# Update start command
"start": "node server.js"

# Update health check URL
export HEALTH_CHECK_URL="http://localhost:3000/health"
```

#### Python/Django/Flask
```bash
# Update build command
"build": "python manage.py collectstatic --noinput"

# Update start command
"start": "gunicorn app.wsgi:application --bind 0.0.0.0:3000"
```

## 📊 Monitoring

### Health Check Endpoints
The deployment script expects a health check endpoint. Create one in your application:

#### Next.js
```javascript
// pages/api/health.js or app/api/health/route.js
export default function handler(req, res) {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
}
```

#### Express.js
```javascript
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
```

#### Django
```python
# views.py
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt

@csrf_exempt
def health_check(request):
    return JsonResponse({'status': 'ok', 'timestamp': datetime.now().isoformat()})
```

## 🐛 Troubleshooting

### Common Issues

#### 1. Node Version Issues
```bash
# Check current version
node --version

# Install specific version
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

#### 2. PM2 Issues
```bash
# Check PM2 status
pm2 status

# View logs
pm2 logs jobportal

# Restart application
pm2 restart jobportal

# Kill all processes
pm2 kill
```

#### 3. Port Conflicts
```bash
# Check what's using the port
lsof -i :3000

# Kill process on port
lsof -ti:3000 | xargs kill -9
```

#### 4. Git Issues
```bash
# Force clean pull
git fetch origin
git reset --hard origin/main
git clean -fd
git pull origin main
```

## 📈 Performance Optimization

### Memory Management
- **Node.js**: `--max-old-space-size=4096`
- **PM2**: `max_memory_restart: '2G'`
- **Monitoring**: Health check every 30 seconds

### Build Optimization
- **Caching**: npm cache and .next cache
- **Parallel**: Multiple dependency installations
- **Cleanup**: Remove unnecessary files

### Process Management
- **Auto-restart**: On failure
- **Health monitoring**: Regular checks
- **Logging**: Comprehensive logs

## 🔒 Security

### SSH Key Setup
```bash
# Generate SSH key
ssh-keygen -t ed25519 -C "deployment@yourcompany.com"

# Add to server
ssh-copy-id -i ~/.ssh/id_ed25519.pub user@your-server

# Test connection
ssh user@your-server
```

### Environment Variables
```bash
# Never commit secrets
echo "*.env" >> .gitignore
echo "secrets/" >> .gitignore

# Use GitHub Secrets for sensitive data
```

## 📝 Logs

### PM2 Logs
```bash
# View all logs
pm2 logs

# View specific app logs
pm2 logs jobportal

# View error logs only
pm2 logs jobportal --err

# Clear logs
pm2 flush
```

### Application Logs
```bash
# View system logs
tail -f /var/log/jobportal/combined.log

# View error logs
tail -f /var/log/jobportal/error.log
```

## 🎯 Success Metrics

### Deployment Success Indicators
- ✅ Git pull completes without conflicts
- ✅ Node.js version is 20.x
- ✅ All dependencies install successfully
- ✅ Build completes without errors
- ✅ PM2 process starts successfully
- ✅ Health check passes within 10 attempts
- ✅ Application responds on configured port

### Monitoring Commands
```bash
# Check deployment status
pm2 status

# Monitor logs in real-time
pm2 logs jobportal --lines 0

# Check system resources
htop
```

## 🚀 Advanced Features

### Blue-Green Deployment
```bash
# Deploy to staging first
./universal-deploy.sh --dir /root/jobportal-staging

# Test staging
curl http://staging.yourdomain.com/api/health

# Switch to production
./universal-deploy.sh --dir /root/jobportal
```

### Rollback Strategy
```bash
# Rollback to previous version
git reset --hard HEAD~1
./universal-deploy.sh
```

### Zero-Downtime Deployment
```bash
# Use PM2 reload for zero downtime
pm2 reload ecosystem.config.cjs --env production
```

## 📞 Support

### Debug Commands
```bash
# Full system check
./universal-deploy.sh --retries 1 --wait 5

# Verbose logging
DEBUG=* ./universal-deploy.sh

# Dry run (check only)
./universal-deploy.sh --help
```

### Common Solutions
1. **Permission Issues**: `chmod +x scripts/universal-deploy.sh`
2. **Node Issues**: Reinstall Node.js 20.x
3. **PM2 Issues**: `pm2 kill && pm2 start ecosystem.config.cjs`
4. **Git Issues**: Force clean pull
5. **Port Issues**: Check and kill conflicting processes

---

**This deployment solution is production-ready and handles all common deployment issues automatically.**
