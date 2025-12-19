# 🛡️ Production Security System - Complete Details

## Overview

Your production environment now has a **comprehensive, automated security system** that continuously monitors, detects, and removes malicious files and processes that could affect your website.

## How It Works

### 1. **Automated Deployment Integration**

When you deploy via GitHub Actions:
- ✅ Security scripts are automatically included in the deployment bundle
- ✅ Security check runs immediately after deployment
- ✅ Security monitoring service is automatically installed and started
- ✅ No manual intervention required

### 2. **Real-Time Malware Detection**

The security monitor runs **every 5 minutes** and checks for:

#### **Malware Processes**
- `xmrig` - Cryptocurrency miner
- `syssls` - Cryptocurrency miner  
- `systemhelper` - Malicious helper process
- `minerd` - CPU miner
- `cpuminer` - CPU miner
- Bot download attempts (`wget`/`curl` to malicious IPs)

**Action**: Automatically kills these processes immediately when detected

#### **Malware Files**
Scans these locations for malicious files:
- `/tmp` - Temporary files
- `/var/tmp` - Temporary files
- `/dev/shm` - Shared memory
- `/root` - Root directory
- `/etc/init.d` - Startup scripts
- `/etc/systemd/system` - System services
- `/etc/rc.d` - Boot scripts

**Action**: Automatically deletes malicious files when found

#### **Malicious Persistence Mechanisms**
- **Cron Jobs**: Checks user crontab and system cron directories
- **Systemd Services**: Checks for malicious services (`syssls.service`, `systemhelper.service`)
- **Init Scripts**: Checks `/etc/init.d/` for malicious startup scripts
- **Boot Scripts**: Checks `/etc/rc.d/rc.local` for malicious boot commands

**Action**: Automatically removes malicious entries

### 3. **Application Health Monitoring**

- **PM2 Status Check**: Verifies application is running
- **HTTP Health Check**: Tests if application responds on port 3000
- **Auto-Recovery**: Automatically restarts application if it goes down

**Action**: 
- If app is stopped → Auto-restart
- If app not responding → Full restart with cleanup
- Prevents website downtime

### 4. **Network Security**

- **Suspicious Connections**: Monitors for connections to known malicious IPs
- **High CPU Usage**: Detects unusual CPU usage (potential mining)
- **Firewall Rules**: Automatically blocks malicious IPs (45.131.184.34)

**Action**: Blocks suspicious network activity

### 5. **File Integrity Monitoring**

Checks critical files for suspicious modifications:
- `/etc/passwd` - User accounts
- `/etc/shadow` - Password hashes
- `/etc/ssh/sshd_config` - SSH configuration
- `package.json` - Application dependencies
- `ecosystem.config.cjs` - PM2 configuration

**Action**: Alerts if suspicious content is found

## Security Features Breakdown

### ✅ **Malware Detection & Removal**

**What it detects:**
1. Running malware processes (xmrig, syssls, systemhelper, miners)
2. Malware files in temporary and system directories
3. Bot download attempts (wget/curl to malicious IPs)
4. Bot files (`/var/tmp/bot`, `/tmp/bot`)

**How it removes:**
- Kills processes immediately with `pkill -9`
- Deletes files with `rm -f`
- Logs all actions for audit trail

**Frequency**: Every 5 minutes

### ✅ **Persistence Mechanism Removal**

**What it detects:**
1. Malicious cron jobs (user and system)
2. Malicious systemd services
3. Malicious init scripts
4. Malicious boot scripts

**How it removes:**
- Removes cron entries
- Stops and disables systemd services
- Deletes service files
- Cleans boot scripts

**Frequency**: Every 5 minutes

### ✅ **Application Uptime Protection**

**What it monitors:**
1. PM2 process status
2. HTTP response on port 3000
3. Application health

**How it recovers:**
- Restarts PM2 process if stopped
- Full restart if not responding
- Prevents website downtime

**Frequency**: Every 5 minutes

### ✅ **Network Security**

**What it monitors:**
1. Suspicious network connections
2. High CPU usage (potential mining)
3. Firewall rules

**How it protects:**
- Blocks malicious IPs via iptables
- Alerts on suspicious connections
- Monitors resource usage

**Frequency**: Every 5 minutes

## Logging & Alerts

### Log Locations

- **Monitor Log**: `/var/log/naukrimili-security/monitor.log`
  - All security check activities
  - Status updates
  - Warnings

- **Alert Log**: `/var/log/naukrimili-security/alerts.log`
  - Malware detections
  - Critical security events
  - Actions taken

### Viewing Logs

```bash
# Real-time monitoring
tail -f /var/log/naukrimili-security/monitor.log

# Recent alerts
tail -20 /var/log/naukrimili-security/alerts.log

# Systemd service logs
journalctl -u naukrimili-security-monitor -f
```

## Manual Security Checks

### Quick Status Check

```bash
cd /var/www/naukrimili
bash scripts/check-security-status.sh
```

This shows:
- ✅ Malware processes status
- ✅ Malware files status
- ✅ Cron jobs status
- ✅ Systemd services status
- ✅ Application health
- ✅ Security monitoring status
- ✅ Firewall status
- ✅ File permissions
- ✅ Next.js version security

### Manual Security Scan

```bash
cd /var/www/naukrimili
bash scripts/vps-malware-scan.sh
```

Read-only scan that shows:
- Running processes
- File system scan
- Cron jobs
- Network connections
- Resource usage

### Manual Remediation

```bash
cd /var/www/naukrimili
bash scripts/security-remediation.sh
```

One-time cleanup that:
- Removes malware
- Patches vulnerabilities
- Cleans infected caches
- Upgrades Next.js

## Service Management

### Check Status

```bash
systemctl status naukrimili-security-monitor
```

### Start/Stop Service

```bash
# Start
systemctl start naukrimili-security-monitor

# Stop
systemctl stop naukrimili-security-monitor

# Restart
systemctl restart naukrimili-security-monitor
```

### Enable/Disable Service

```bash
# Enable (start on boot)
systemctl enable naukrimili-security-monitor

# Disable
systemctl disable naukrimili-security-monitor
```

## Security Hardening

### One-Time Setup

```bash
cd /var/www/naukrimili
bash scripts/security-hardening-setup.sh
```

This sets up:
- 🔐 SSH hardening (key-only auth, no root login)
- 🔥 Firewall rules (blocks malicious IPs)
- 📁 File permissions (secures .env, uploads)
- 🛡️ System hardening (kernel parameters)
- 📊 Security monitoring (installs service)
- 💾 Automated backups (daily at 2 AM)

## How Malware Gets Removed

### Automatic Removal Process

1. **Detection** (every 5 minutes):
   - Scans processes, files, cron jobs, services
   - Identifies malware patterns

2. **Removal** (immediate):
   - Kills malware processes
   - Deletes malware files
   - Removes malicious cron jobs
   - Disables malicious services

3. **Logging**:
   - Records all detections in alert log
   - Records all actions in monitor log

4. **Recovery**:
   - Restarts application if affected
   - Ensures website stays online

### Example Removal Flow

```
[15:30:00] 🔍 Starting security check cycle
[15:30:01] 🚨 ALERT: MALWARE PROCESS DETECTED: xmrig
[15:30:01] 🚨 ALERT: MALWARE FILE DETECTED: /tmp/xmrig
[15:30:01] 🚨 ALERT: Removed 2 malware indicators
[15:30:02] ✅ Security check passed - no issues detected
```

## Protection Against Common Attacks

### ✅ Cryptocurrency Mining
- Detects: xmrig, syssls, minerd, cpuminer
- Removes: Processes and files immediately
- Prevents: High CPU usage, server slowdown

### ✅ Bot Downloads
- Detects: wget/curl to malicious IPs (45.131.184.34)
- Removes: Bot files and download processes
- Prevents: Additional malware installation

### ✅ Persistence Mechanisms
- Detects: Malicious cron jobs, systemd services, init scripts
- Removes: All persistence mechanisms
- Prevents: Malware from restarting after reboot

### ✅ Application Downtime
- Detects: Application not running or not responding
- Recovers: Auto-restart application
- Prevents: Website going offline

## Security Best Practices

1. **Keep Monitoring Active**: Service runs automatically, no action needed
2. **Review Logs Weekly**: Check alert log for any detections
3. **Deploy Regularly**: Each deployment includes latest security scripts
4. **Monitor Alerts**: Check `/var/log/naukrimili-security/alerts.log` regularly
5. **Run Manual Checks**: Use `check-security-status.sh` for quick status

## Troubleshooting

### Security Monitoring Not Running

```bash
# Check status
systemctl status naukrimili-security-monitor

# Restart service
systemctl restart naukrimili-security-monitor

# Reinstall
cd /var/www/naukrimili
bash scripts/security-monitor-and-harden.sh install
```

### Malware Detected

The system automatically removes it. Check logs:

```bash
tail -f /var/log/naukrimili-security/alerts.log
```

### Application Goes Down

The system automatically restarts it. Check logs:

```bash
pm2 logs naukrimili
journalctl -u naukrimili-security-monitor
```

## Summary

Your production environment is now protected by:

✅ **Real-time malware detection** (every 5 minutes)  
✅ **Automatic malware removal** (immediate)  
✅ **Application uptime protection** (auto-recovery)  
✅ **Network security** (firewall, connection monitoring)  
✅ **File integrity monitoring** (critical file checks)  
✅ **Comprehensive logging** (all actions logged)  
✅ **Zero-downtime security** (no service interruption)  

**The system is fully automated and requires no manual intervention.**
