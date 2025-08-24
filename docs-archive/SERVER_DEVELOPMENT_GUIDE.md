# 🚀 Direct Server Development Guide

## Quick Setup for Working Directly with Server

Your server: `69.62.73.84`

### 1. 🔧 Initial Server Setup (Run Once)

```powershell
# Setup server environment
.\sync-to-server.ps1 setup

# Full deployment
.\sync-to-server.ps1 deploy
```

### 2. 🔄 Daily Development Workflow

```powershell
# Sync your changes to server
.\sync-to-server.ps1 sync

# Check if server is running
.\sync-to-server.ps1 status

# View server logs
.\sync-to-server.ps1 logs

# Connect to server directly
.\sync-to-server.ps1 shell
```

### 3. 🖥️ Direct Server Commands

```bash
# SSH into server
ssh root@69.62.73.84

# Navigate to project
cd /root/jobportal

# Check service status
systemctl status jobportal

# Restart application
systemctl restart jobportal

# View logs
journalctl -u jobportal -f

# Manual start (for development)
NODE_ENV=production node server.js
```

### 4. 📁 Server File Structure

```
/root/jobportal/          # Your project files
├── .next/                # Built Next.js files
├── public/               # Static assets
├── package.json          # Dependencies
├── server.js             # Production server
└── .env.local            # Environment variables
```

### 5. 🌐 Access Your Application

- **Server URL**: `http://69.62.73.84`
- **Port**: 3000 (proxied through Nginx on port 80)

### 6. ⚡ Quick Commands

```powershell
# Windows (Local Development)
.\sync-to-server.ps1 sync    # Build and deploy
.\sync-to-server.ps1 status  # Check status
.\sync-to-server.ps1 shell   # Open SSH

# Linux/Server Commands
systemctl restart jobportal  # Restart app
systemctl status jobportal   # Check status
journalctl -u jobportal -f   # Live logs
```

### 7. 🔄 Development Cycle

1. **Edit locally** in VS Code
2. **Test locally**: `pnpm dev`
3. **Sync to server**: `.\sync-to-server.ps1 sync`
4. **Test on server**: Visit `http://69.62.73.84`
5. **Check logs**: `.\sync-to-server.ps1 logs`

### 8. 🛠️ Troubleshooting

```bash
# If service fails to start
systemctl status jobportal
journalctl -u jobportal --no-pager

# Manual check
cd /root/jobportal
node server.js

# Check port usage
netstat -tlnp | grep :3000

# Restart nginx
systemctl restart nginx
```

### 9. 📦 File Sync Process

The sync script automatically:
- ✅ Builds project locally (`pnpm build`)
- ✅ Uploads built files to server
- ✅ Restarts the service
- ✅ Shows status

### 10. 🚀 Production Ready

Your server setup includes:
- ✅ **Systemd service** (auto-restart)
- ✅ **Nginx reverse proxy** (port 80 → 3000)
- ✅ **Process management** (automatic startup)
- ✅ **Log management** (journalctl)

**Start working directly with your server now!**
