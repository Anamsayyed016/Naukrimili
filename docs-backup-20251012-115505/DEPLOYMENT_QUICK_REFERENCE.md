# 🚀 Deployment Quick Reference

## 📋 Essential Commands

### Setup & Check
```bash
# PowerShell (Windows)
.\deploy.ps1 setup
.\deploy.ps1 check

# Batch (Windows)
.\deploy.bat setup
.\deploy.bat check

# Bash (Linux/macOS)
./deploy.sh setup
./deploy.sh check
```

### Production Deployment
```bash
# Full production deployment
.\deploy.ps1 deploy:prod

# Hot reload (zero downtime)
.\deploy.ps1 deploy:hot
```

### Application Management
```bash
# Start with PM2
.\deploy.ps1 start pm2

# Check status
.\deploy.ps1 status pm2

# View logs
.\deploy.ps1 logs pm2

# Monitor
.\deploy.ps1 monitor pm2
```

### Maintenance
```bash
# Create backup
.\deploy.ps1 backup

# Clean build
.\deploy.ps1 clean

# Clean old backups
.\deploy.ps1 cleanup
```

## 🔄 Common Workflows

### New Deployment
```bash
.\deploy.ps1 setup
.\deploy.ps1 check
.\deploy.ps1 deploy:prod
```

### Update Existing
```bash
.\deploy.ps1 backup
.\deploy.ps1 deploy:hot
.\deploy.ps1 status pm2
```

### Troubleshooting
```bash
.\deploy.ps1 stop pm2
.\deploy.ps1 clean
.\deploy.ps1 build
.\deploy.ps1 start pm2
```

## 📊 Status Commands

| Command | What it shows |
|---------|---------------|
| `.\deploy.ps1 status pm2` | PM2 process status |
| `.\deploy.ps1 logs pm2` | Application logs |
| `.\deploy.ps1 monitor pm2` | Real-time monitoring |

## 🆘 Help
```bash
# Show all commands
.\deploy.ps1 help

# Show specific help
.\deploy.ps1 [command] --help
```

---

**💡 Tip**: Use PowerShell for best experience on Windows. Batch script is available for compatibility.
