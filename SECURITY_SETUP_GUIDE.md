# 🛡️ Complete Security Setup Guide for naukrimili.com

## Overview

This guide provides comprehensive security measures to protect your website from malware, ensure uptime, and implement all necessary security best practices.

## Quick Start

### 1. Check Current Security Status

```bash
cd /var/www/naukrimili
bash scripts/check-security-status.sh
```

This will show you:
- ✅ Malware processes/files status
- ✅ Cron jobs status
- ✅ Application health
- ✅ Security monitoring status
- ✅ Firewall status
- ✅ File permissions
- ✅ Next.js version security

### 2. Run One-Time Security Hardening

```bash
cd /var/www/naukrimili
bash scripts/security-hardening-setup.sh
```

This sets up:
- 🔐 SSH hardening (disables root login, password auth)
- 🔥 Firewall rules (blocks malicious IPs)
- 📁 File permissions (secures .env, uploads)
- 🛡️ System hardening (kernel parameters, services)
- 📊 Security monitoring (installs as systemd service)
- 💾 Automated backups (daily at 2 AM)

**⚠️ IMPORTANT:** Test SSH connection before restarting SSH service!

### 3. Install Continuous Security Monitoring

```bash
cd /var/www/naukrimili
bash scripts/security-monitor-and-harden.sh install
```

This installs a systemd service that:
- 🔍 Continuously monitors for malware (every 5 minutes)
- 🚨 Automatically removes detected malware
- 🔄 Monitors application health and auto-restarts if needed
- 📊 Logs all security events
- 🛡️ Applies security hardening

### 4. Check Monitoring Status

```bash
# Check if monitoring is running
systemctl status naukrimili-security-monitor

# View real-time logs
journalctl -u naukrimili-security-monitor -f

# Or check logs directly
tail -f /var/log/naukrimili-security/monitor.log
tail -f /var/log/naukrimili-security/alerts.log
```

## Security Features

### ✅ Malware Protection

- **Real-time Detection**: Scans for xmrig, syssls, systemhelper, cryptominers
- **Automatic Removal**: Kills malware processes and removes files
- **Cron Job Protection**: Removes malicious cron jobs
- **Service Protection**: Disables and removes malicious systemd services
- **Network Protection**: Blocks known malicious IPs (45.131.184.34)

### ✅ Uptime Protection

- **Health Monitoring**: Checks application every 5 minutes
- **Auto-Recovery**: Automatically restarts application if it goes down
- **PM2 Integration**: Monitors PM2 process status
- **HTTP Health Checks**: Verifies application is responding

### ✅ System Hardening

- **SSH Security**:
  - Disables root login
  - Disables password authentication (key-only)
  - Limits authentication attempts
  - Uses secure key-based auth

- **Firewall**:
  - Blocks malicious IPs
  - Allows only necessary ports (22, 80, 443)
  - Configures iptables/firewalld/ufw

- **File Permissions**:
  - .env file: 600 (owner read/write only)
  - Upload directories: 755 (directories), 644 (files)
  - Project files: 755 (directories), 644 (files)

- **Kernel Hardening**:
  - Disables IP forwarding
  - Enables TCP SYN cookies
  - Disables ICMP redirects
  - Configures secure network parameters

### ✅ Monitoring & Logging

- **Security Logs**: `/var/log/naukrimili-security/monitor.log`
- **Alert Logs**: `/var/log/naukrimili-security/alerts.log`
- **Systemd Integration**: Runs as systemd service
- **Automatic Log Rotation**: Keeps logs manageable

### ✅ Backup Automation

- **Daily Backups**: Runs at 2 AM daily
- **Database Backups**: Backs up Prisma database
- **File Backups**: Backs up .env, config files
- **Retention**: Keeps last 7 days of backups
- **Location**: `/var/backups/naukrimili/`

## Manual Security Checks

### Check for Malware

```bash
# Check processes
ps aux | grep -E "xmrig|syssls|systemhelper|minerd"

# Check files
find /tmp /var/tmp /dev/shm -type f -iname "*xmrig*" -o -iname "*syssls*"

# Check cron jobs
crontab -l
grep -r "xmrig\|syssls" /etc/cron.d /etc/cron.daily

# Check systemd services
systemctl list-unit-files | grep -E "syssls|systemhelper"
```

### Check Application Health

```bash
# PM2 status
pm2 status

# Application logs
pm2 logs naukrimili --lines 50

# HTTP health check
curl -I http://127.0.0.1:3000
```

### Check Security Monitoring

```bash
# Service status
systemctl status naukrimili-security-monitor

# Recent alerts
tail -20 /var/log/naukrimili-security/alerts.log

# Recent logs
tail -20 /var/log/naukrimili-security/monitor.log
```

## Troubleshooting

### Security Monitoring Not Running

```bash
# Install/restart service
bash scripts/security-monitor-and-harden.sh install
systemctl restart naukrimili-security-monitor
```

### Application Goes Down

The monitoring service will automatically restart it. Check logs:

```bash
pm2 logs naukrimili
journalctl -u naukrimili-security-monitor
```

### Malware Detected

The monitoring service will automatically remove it. Check alerts:

```bash
tail -f /var/log/naukrimili-security/alerts.log
```

### SSH Issues After Hardening

If you can't connect via SSH:

1. **Don't panic** - you may have console access
2. **Restore SSH config**:
   ```bash
   cp /etc/ssh/sshd_config.backup.* /etc/ssh/sshd_config
   systemctl restart sshd
   ```

## Maintenance

### Update Security Scripts

```bash
cd /var/www/naukrimili
git pull  # If using git
# Or manually update scripts
```

### Review Security Logs Weekly

```bash
# Check for any alerts
grep "ALERT" /var/log/naukrimili-security/alerts.log

# Review monitoring activity
tail -100 /var/log/naukrimili-security/monitor.log
```

### Test Security Measures

```bash
# Run security status check
bash scripts/check-security-status.sh

# Run manual security scan
bash scripts/vps-malware-scan.sh
```

## Best Practices

1. **Regular Updates**: Keep Next.js and dependencies updated
2. **Monitor Logs**: Check security logs weekly
3. **Backup Verification**: Verify backups are working
4. **Access Control**: Use SSH keys, not passwords
5. **Firewall**: Keep firewall rules updated
6. **Monitoring**: Keep security monitoring service running

## Support

If you encounter issues:

1. Check security status: `bash scripts/check-security-status.sh`
2. Review logs: `tail -f /var/log/naukrimili-security/monitor.log`
3. Check application: `pm2 status` and `pm2 logs naukrimili`
4. Review alerts: `tail -f /var/log/naukrimili-security/alerts.log`

## Summary

✅ **Malware Protection**: Real-time detection and removal  
✅ **Uptime Protection**: Auto-recovery and health monitoring  
✅ **System Hardening**: SSH, firewall, file permissions  
✅ **Monitoring**: Continuous security monitoring  
✅ **Backups**: Automated daily backups  
✅ **Logging**: Comprehensive security logs  

Your website is now protected with enterprise-grade security measures!
