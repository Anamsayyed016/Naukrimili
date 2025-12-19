# 🛡️ Security Remediation Guide - Zero Downtime Malware Cleanup

## Overview

This guide provides step-by-step instructions to remove malware (xmrig, syssls, systemhelper) and patch critical vulnerabilities in your Next.js/React application **without downtime**.

**Stack:** Next.js 15.5.2 / React 18 / Node.js / Python  
**Site:** naukrimili.com

---

## ⚠️ Critical Vulnerabilities Addressed

### Next.js CVEs (Current: 15.5.2 → Target: 15.5.7+)

1. **CVE-2025-66478** - Remote Code Execution via React Server Components
   - **Severity:** CRITICAL
   - **Fixed in:** Next.js 15.5.7+
   - **Impact:** Unauthenticated RCE

2. **CVE-2024-56332** - Denial of Service in Server Actions
   - **Severity:** HIGH
   - **Fixed in:** Next.js 15.1.2+
   - **Impact:** DoS via crafted requests

3. **CVE-2025-49826** - Cache Poisoning
   - **Severity:** MEDIUM
   - **Fixed in:** Next.js 15.1.8+
   - **Impact:** DoS via HTTP 204 caching

4. **CVE-2025-29927** - Authorization Bypass in Middleware
   - **Severity:** CRITICAL
   - **Fixed in:** Next.js 15.2.3+
   - **Impact:** Bypass authorization checks

### React CVE Status

- **CVE-2025-55182 (React2Shell)** - React 19 RCE vulnerability
- **Your Status:** ✅ **NOT AFFECTED** - You're on React 18, not React 19
- **Note:** Next.js 15.5.7+ includes patched React Server Components

---

## 📋 Pre-Flight Checklist

Before running remediation:

- [ ] **Backup database** (if not automated)
- [ ] **Verify PM2 is running** (`pm2 status`)
- [ ] **Check disk space** (need ~2GB free)
- [ ] **Note current Next.js version** (`grep '"next":' package.json`)
- [ ] **Ensure SSH access** to VPS
- [ ] **Review running processes** (`ps aux | head -20`)

---

## 🔍 Step 1: Scan VPS (Read-Only Assessment)

**Run this FIRST to assess the situation:**

```bash
# On your VPS
cd /var/www/naukrimili
bash scripts/vps-malware-scan.sh
```

**What it does:**
- Scans running processes for malware
- Checks file system for malware binaries
- Reviews cron jobs for malicious entries
- Checks network connections
- **NO CHANGES MADE** - read-only scan

**Output:**
- Log file: `/tmp/vps-malware-scan-YYYYMMDD-HHMMSS.log`
- Summary of findings

---

## 🛡️ Step 2: Run Security Remediation

**After reviewing scan results, run remediation:**

```bash
# On your VPS
cd /var/www/naukrimili
bash scripts/security-remediation.sh
```

**What it does:**

1. ✅ **Pre-flight checks** - Verifies current versions
2. 🔍 **Malware detection** - Finds xmrig, syssls, systemhelper
3. ⏰ **Cron verification** - Checks for malicious cron jobs
4. 💾 **Backup creation** - Backs up package.json, malware files
5. 🧹 **Malware removal** - Removes binaries (NOT source code)
6. 🧹 **Cache cleanup** - Cleans infected build cache only
7. 🔧 **Security patches** - Upgrades Next.js to 15.5.7+
8. 🔒 **Access hardening** - Secures /tmp, upload directories
9. 🏗️ **Rebuild** - Rebuilds with clean cache
10. ✅ **Verification** - Confirms cleanup success

**Files Modified:**
- `package.json` (Next.js version updated)
- `package-lock.json` (if exists, updated)
- `.next/cache/` (cleaned, will rebuild)
- `node_modules/.cache/` (cleaned)

**Files NOT Modified:**
- ❌ Source code (app/, pages/, components/)
- ❌ Routes or API endpoints
- ❌ Database schema
- ❌ Environment variables
- ❌ UI components

---

## 📊 Expected Output

### Successful Remediation:

```
✅ No malware binaries or processes detected
✅ Next.js upgraded: 15.5.2 → 15.5.7
✅ Build cache cleanup completed
✅ Rebuild completed successfully
✅ No malware processes running
✅ Next.js is at safe version
✅ Application is running
```

### If Malware Found:

```
⚠️  Found 3 malware indicators - will clean in next step
MALWARE DETECTED: /tmp/xmrig (pattern: xmrig)
Removed: /tmp/xmrig
✅ Removed 3 malware files
```

---

## 🔄 Rollback Instructions (If Needed)

If something goes wrong, rollback:

```bash
# 1. Restore package.json
BACKUP_DIR="/var/backups/naukrimili-security"
cp $BACKUP_DIR/backup-*/package.json.backup package.json

# 2. Restore package-lock.json
cp $BACKUP_DIR/backup-*/package-lock.json.backup package-lock.json

# 3. Reinstall dependencies
npm install --legacy-peer-deps

# 4. Rebuild
npm run build

# 5. Restart application
pm2 restart jobportal
```

---

## 🔒 Post-Remediation Hardening

### SSH Hardening (Manual Steps)

Edit `/etc/ssh/sshd_config`:

```bash
# Disable root login
PermitRootLogin no

# Use key-based auth only
PasswordAuthentication no

# Limit users (replace 'your_user' with actual username)
AllowUsers your_user

# Change default port (optional)
Port 2222

# Restart SSH (CAREFUL - test connection first!)
systemctl restart sshd
```

### Filesystem Hardening

Add to `/etc/fstab`:

```
tmpfs /tmp tmpfs defaults,noexec,nosuid,nodev 0 0
tmpfs /var/tmp tmpfs defaults,noexec,nosuid,nodev 0 0
```

Then:
```bash
mount -o remount /tmp
mount -o remount /var/tmp
```

### Upload Directory Security

```bash
# Secure upload directory
chmod 755 /var/www/naukrimili/public/uploads
find /var/www/naukrimili/public/uploads -type f -exec chmod 644 {} \;
find /var/www/naukrimili/public/uploads -type d -exec chmod 755 {} \;
```

---

## ✅ Verification Steps

### 1. Verify No Malware Processes

```bash
# Check for suspicious processes
ps aux | grep -E "xmrig|syssls|systemhelper|minerd"
# Should return nothing (except grep itself)
```

### 2. Verify Next.js Version

```bash
grep '"next":' package.json
# Should show: "next": "^15.5.7" or higher
```

### 3. Verify Application Health

```bash
# Check PM2 status
pm2 status

# Check application logs
pm2 logs jobportal --lines 50

# Health check endpoint (if available)
curl http://localhost:3000/api/health
```

### 4. Verify No Malicious Cron Jobs

```bash
# Check user crontabs
crontab -l

# Check system cron
ls -la /etc/cron.d/
cat /etc/cron.d/* | grep -v "^#"
```

---

## 📝 Files Created/Modified

### Created:
- `scripts/security-remediation.sh` - Main remediation script
- `scripts/vps-malware-scan.sh` - Pre-scan script
- `SECURITY_REMEDIATION_GUIDE.md` - This guide

### Modified (by script):
- `package.json` - Next.js version updated
- `package-lock.json` - Dependency lock updated
- `.next/cache/` - Cleaned (will rebuild)

### Backed Up:
- `package.json.backup` - In `/var/backups/naukrimili-security/backup-*/`
- `package-lock.json.backup` - In backup directory
- Malware files (before removal) - In backup directory

---

## 🚨 Troubleshooting

### Build Fails After Upgrade

```bash
# Clear all caches
rm -rf .next node_modules/.cache
npm cache clean --force

# Reinstall
npm install --legacy-peer-deps

# Rebuild
npm run build
```

### Application Won't Start

```bash
# Check PM2 logs
pm2 logs jobportal --lines 100

# Check for port conflicts
netstat -tulpn | grep 3000

# Restart PM2
pm2 restart jobportal
```

### Malware Keeps Coming Back

1. **Check cron jobs** - Malware may be reinstalling via cron
2. **Check systemd services** - May have persistent service
3. **Check startup scripts** - `/etc/rc.local`, `/etc/init.d/`
4. **Review SSH keys** - Compromised key may allow reinfection
5. **Check file permissions** - Ensure upload directories are secure

---

## 📞 Support

If remediation fails or you encounter issues:

1. **Check logs:**
   - Remediation: `/var/log/security-remediation.log`
   - Scan: `/tmp/vps-malware-scan-*.log`

2. **Review backups:**
   - Location: `/var/backups/naukrimili-security/backup-*/`

3. **Rollback if needed** (see Rollback Instructions above)

---

## ✅ Success Criteria

Remediation is successful when:

- ✅ No malware processes running
- ✅ No malware files in filesystem
- ✅ No malicious cron jobs
- ✅ Next.js upgraded to 15.5.7+
- ✅ Application builds successfully
- ✅ Application runs without errors
- ✅ No suspicious network connections

---

## 🔐 Ongoing Security

### Daily Checks

```bash
# Quick malware scan
bash scripts/vps-malware-scan.sh

# Check for suspicious processes
ps aux | grep -E "xmrig|mining"
```

### Weekly Checks

- Review cron jobs: `crontab -l` and `/etc/cron.d/*`
- Check system logs: `journalctl -u sshd | tail -50`
- Review PM2 logs: `pm2 logs jobportal --lines 200`
- Check disk usage: `df -h`

### Monthly Checks

- Update dependencies: `npm audit`
- Review security advisories: Next.js, React, Node.js
- Review access logs: `/var/log/nginx/access.log`
- Check for unauthorized SSH access: `last`

---

**Last Updated:** 2025-12-19  
**Scripts Version:** 1.0  
**Tested On:** Next.js 15.5.2 → 15.5.7
