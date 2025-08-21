# Job Portal Deployment Scripts

This directory contains comprehensive deployment scripts for the Job Portal application, supporting multiple platforms and deployment scenarios.

## 📁 Available Scripts

### 1. **deploy.sh** - Linux/macOS Bash Script
- **Platform**: Linux, macOS, WSL
- **Usage**: `./deploy.sh [COMMAND] [OPTIONS]`
- **Features**: Full deployment automation with colored output and logging

### 2. **deploy.bat** - Windows Batch Script
- **Platform**: Windows (Command Prompt)
- **Usage**: `deploy.bat [COMMAND] [OPTIONS]`
- **Features**: Windows-compatible deployment commands

### 3. **deploy.ps1** - PowerShell Script
- **Platform**: Windows (PowerShell 5.1+)
- **Usage**: `.\deploy.ps1 [COMMAND] [OPTIONS]`
- **Features**: Modern PowerShell deployment with advanced error handling

## 🚀 Quick Start

### First Time Setup
```bash
# Linux/macOS
./deploy.sh setup
./deploy.sh check

# Windows Command Prompt
deploy.bat setup
deploy.bat check

# Windows PowerShell
.\deploy.ps1 setup
.\deploy.ps1 check
```

### Production Deployment
```bash
# Linux/macOS
./deploy.sh deploy:prod

# Windows Command Prompt
deploy.bat deploy:prod

# Windows PowerShell
.\deploy.ps1 deploy:prod
```

## 📋 Available Commands

| Command | Description | Options |
|---------|-------------|---------|
| `setup` | Setup deployment environment | None |
| `check` | Check prerequisites | None |
| `backup` | Create backup of current deployment | None |
| `cleanup` | Clean up old backups | None |
| `install` | Install dependencies | `dev`, `production` |
| `build` | Build application | `dev`, `production`, `fast` |
| `start` | Start application | `dev`, `pm2`, `production` |
| `stop` | Stop application | `dev`, `pm2` |
| `restart` | Restart application | `dev`, `pm2` |
| `status` | Show application status | `dev`, `pm2` |
| `monitor` | Monitor application | `dev`, `pm2` |
| `deploy:prod` | Deploy to production | None |
| `deploy:hot` | Deploy with hot reload | None |
| `logs` | Show application logs | `dev`, `pm2` |
| `clean` | Clean build artifacts | None |
| `help` | Show help message | None |

## 🔧 Common Usage Examples

### Development Workflow
```bash
# Start development server
./deploy.sh start

# Build for development
./deploy.sh build

# Install new dependencies
./deploy.sh install
```

### Production Management
```bash
# Deploy to production
./deploy.sh deploy:prod

# Check production status
./deploy.sh status pm2

# View production logs
./deploy.sh logs pm2

# Monitor production
./deploy.sh monitor pm2
```

### Maintenance Tasks
```bash
# Create backup before changes
./deploy.sh backup

# Clean old backups
./deploy.sh cleanup

# Clean build artifacts
./deploy.sh clean

# Hot reload deployment
./deploy.sh deploy:hot
```

## 🏗️ Deployment Scenarios

### 1. **Initial Production Deployment**
```bash
# 1. Setup environment
./deploy.sh setup

# 2. Check prerequisites
./deploy.sh check

# 3. Deploy to production
./deploy.sh deploy:prod
```

### 2. **Code Update Deployment**
```bash
# 1. Backup current deployment
./deploy.sh backup

# 2. Deploy with hot reload
./deploy.sh deploy:hot

# 3. Verify deployment
./deploy.sh status pm2
```

### 3. **Emergency Rollback**
```bash
# 1. Stop current deployment
./deploy.sh stop pm2

# 2. Restore from backup
# (Manual process - copy from backups directory)

# 3. Restart application
./deploy.sh start pm2
```

## 📊 Monitoring and Logs

### Application Status
```bash
# Show PM2 status
./deploy.sh status pm2

# Show process information
./deploy.sh status
```

### Log Management
```bash
# View PM2 logs (last 50 lines)
./deploy.sh logs pm2

# View application logs
./deploy.sh logs

# Monitor in real-time
./deploy.sh monitor pm2
```

### System Monitoring
- **PM2 Dashboard**: `./deploy.sh monitor pm2`
- **Process Monitoring**: Use system tools (htop, top, Task Manager)
- **Log Files**: Located in `./logs/` directory

## 🔒 Security Considerations

### Environment Variables
- Ensure `.env` file is properly configured
- Use production environment variables for production deployments
- Never commit sensitive information to version control

### PM2 Security
- PM2 runs with production environment variables
- Application runs on configured port (default: 3000)
- Consider using reverse proxy (nginx) for production

### Backup Security
- Backups are stored locally in `./backups/` directory
- Implement off-site backup strategy for production
- Regularly test backup restoration procedures

## 🐛 Troubleshooting

### Common Issues

#### 1. **PM2 Not Found**
```bash
# Install PM2 globally
npm install -g pm2

# Or use the check command
./deploy.sh check
```

#### 2. **Port Already in Use**
```bash
# Check what's using the port
netstat -tulpn | grep :3000

# Stop conflicting processes
./deploy.sh stop pm2
```

#### 3. **Build Failures**
```bash
# Clean build artifacts
./deploy.sh clean

# Reinstall dependencies
./deploy.sh install

# Try building again
./deploy.sh build
```

#### 4. **Permission Issues**
```bash
# Make script executable (Linux/macOS)
chmod +x deploy.sh

# Run as administrator (Windows)
# Right-click PowerShell/Command Prompt → "Run as administrator"
```

### Debug Mode
```bash
# Enable verbose logging
set -x  # Add to script for debugging

# Check log files
tail -f ./logs/deploy.log
```

## 📁 Directory Structure

```
jobportal/
├── deploy.sh              # Linux/macOS deployment script
├── deploy.bat             # Windows batch deployment script
├── deploy.ps1             # Windows PowerShell deployment script
├── ecosystem.pm2.js       # PM2 configuration
├── logs/                  # Deployment logs
│   └── deploy.log        # Main deployment log
├── backups/               # Deployment backups
│   └── backup-YYYYMMDD-HHMMSS/
├── .next/                 # Next.js build output
├── node_modules/          # Dependencies
└── package.json           # Project configuration
```

## 🔄 Integration with Existing Scripts

### Package.json Scripts
The deployment scripts integrate with your existing npm scripts:

```json
{
  "scripts": {
    "deploy:prod": "npm run build && npm start",
    "deploy:pm2": "pm2 start ecosystem.pm2.js --env production",
    "deploy:pm2:reload": "pm2 reload ecosystem.pm2.js --env production",
    "deploy:pm2:stop": "pm2 stop jobportal",
    "deploy:pm2:logs": "pm2 logs jobportal",
    "deploy:pm2:monit": "pm2 monit"
  }
}
```

### PM2 Ecosystem
Uses your existing `ecosystem.pm2.js` configuration for:
- Process naming (`jobportal`)
- Environment variables
- Log file locations
- Memory limits and restart policies

## 🌐 Platform-Specific Notes

### Linux/macOS
- Scripts use bash with colored output
- File permissions may need adjustment
- Consider using `sudo` for global npm installations

### Windows
- Batch script supports Windows 10+ ANSI colors
- PowerShell script requires PowerShell 5.1+
- Use Windows-compatible path separators

### WSL (Windows Subsystem for Linux)
- Use `deploy.sh` script
- Ensure Node.js is installed in WSL environment
- Consider file system performance implications

## 📈 Performance Optimization

### Build Optimization
```bash
# Fast build (skips linting)
./deploy.sh build fast

# Production build (optimized)
./deploy.sh build production

# Clean build (removes cache)
./deploy.sh clean
./deploy.sh build
```

### Memory Management
- PM2 automatically restarts on memory limits
- Monitor memory usage with `./deploy.sh monitor pm2`
- Adjust memory limits in `ecosystem.pm2.js`

## 🔧 Customization

### Environment-Specific Configurations
```bash
# Create environment-specific scripts
cp deploy.sh deploy-staging.sh
cp deploy.sh deploy-production.sh

# Modify configurations for each environment
# Update PROJECT_NAME, ports, and environment variables
```

### Additional Commands
```bash
# Add custom deployment steps
# Example: Database migrations
deploy_database() {
    log "Running database migrations..."
    npm run db:migrate
    success "Database migrations completed"
}
```

## 📞 Support

### Getting Help
```bash
# Show all available commands
./deploy.sh help

# Check script syntax
bash -n deploy.sh

# Run with debugging
bash -x deploy.sh setup
```

### Log Analysis
- Check `./logs/deploy.log` for detailed deployment history
- Use `./deploy.sh logs pm2` for application logs
- Monitor real-time with `./deploy.sh monitor pm2`

---

**Note**: These scripts are designed to work with your existing Next.js job portal application. Ensure all prerequisites are met before running deployment commands. For production deployments, always test in a staging environment first.
