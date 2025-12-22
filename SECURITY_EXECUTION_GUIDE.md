# 🚨 SECURITY INCIDENT - EXECUTION GUIDE

## ⚠️ CRITICAL: Read This First

**DO NOT RUN REMEDIATION WITHOUT SCANNING FIRST!**

This guide provides a **SAFE, ZERO-DOWNTIME** approach to malware removal.

---

## 📋 PRE-FLIGHT CHECKLIST

Before starting, ensure:
- [ ] You have SSH access to production server
- [ ] You have backup of current state
- [ ] You understand the rollback procedure
- [ ] You have reviewed all scripts
- [ ] You have time to monitor after remediation

---

## 🔍 PHASE 1: SCANNING (READ-ONLY - SAFE)

### Step 1.1: Upload Scan Script
```bash
# On your local machine, ensure scripts are in repo
git add scripts/security-emergency-scan.sh
git commit -m "Add security scan script"
git push
```

### Step 1.2: Run Emergency Scan on Server
```bash
# SSH to production server
ssh user@your-server

# Navigate to project
cd /var/www/naukrimili

# Pull latest changes (if using git)
git pull origin main

# Make script executable
chmod +x scripts/security-emergency-scan.sh

# Run scan (READ-ONLY - SAFE)
bash scripts/security-emergency-scan.sh
```

### Step 1.3: Review Scan Results
```bash
# View scan report
cat /tmp/security_scan_*.txt

# Check for:
# - High CPU processes
# - Malicious files
# - Suspicious cron jobs
# - Network connections
```

**⏸️ STOP HERE - Review findings before proceeding!**

---

## 🧹 PHASE 2: REMEDIATION (REQUIRES REVIEW)

### Step 2.1: Backup Current State
```bash
# Create full backup
sudo mkdir -p /var/backups/naukrimili-before-cleanup-$(date +%s)
sudo cp -r /var/www/naukrimili /var/backups/naukrimili-before-cleanup-$(date +%s)/

# Backup PM2 config
pm2 save
cp ~/.pm2/dump.pm2 /var/backups/naukrimili-before-cleanup-*/pm2-dump.pm2
```

### Step 2.2: Run Remediation Script
```bash
# Make script executable
chmod +x scripts/security-remediation-safe.sh

# Run remediation (will prompt for confirmation)
bash scripts/security-remediation-safe.sh
```

**What it does:**
- Kills malicious processes
- Removes malware files
- Cleans cron jobs
- Removes persistence mechanisms
- **DOES NOT** modify application code

### Step 2.3: Patch Next.js Vulnerability
```bash
# Make script executable
chmod +x scripts/security-patch-nextjs-safe.sh

# Run patch (upgrades Next.js 15.5.2 → 15.5.7+)
bash scripts/security-patch-nextjs-safe.sh
```

**What it does:**
- Upgrades Next.js to patch CVE-2025-66478
- Rebuilds application
- Reloads PM2 (zero-downtime)

---

## 🔒 PHASE 3: HARDENING

### Step 3.1: Server Hardening
```bash
# Make script executable
chmod +x scripts/security-harden-server.sh

# Run hardening (requires sudo)
sudo bash scripts/security-harden-server.sh
```

**What it does:**
- Hardens filesystem (/tmp, /var/tmp)
- Secures file permissions
- Configures firewall
- Sets up SSH hardening recommendations
- Enables monitoring

---

## ✅ PHASE 4: VERIFICATION

### Step 4.1: Run Verification Script
```bash
# Make script executable
chmod +x scripts/security-verify-clean.sh

# Run verification
bash scripts/security-verify-clean.sh
```

### Step 4.2: Manual Verification
```bash
# Check CPU usage
top -bn1 | head -20

# Check for malware processes
ps aux | grep -iE "miner|crypto|xmrig"

# Check application status
pm2 status
pm2 logs jobportal --lines 50

# Test application
curl http://localhost:3000/api/health
curl https://naukrimili.com/api/health
```

### Step 4.3: Monitor for 10-15 Minutes
```bash
# Watch CPU usage
watch -n 5 'top -bn1 | head -20'

# Watch PM2 status
watch -n 5 'pm2 status'

# Check logs
tail -f ~/.pm2/logs/jobportal-out.log
tail -f ~/.pm2/logs/jobportal-error.log
```

---

## 📊 EXPECTED RESULTS

### CPU Usage
- **Before**: ~76% (HIGH)
- **After**: <20% (NORMAL)
- **Target**: 5-15% (ideal)

### Processes
- **Before**: Malicious processes running
- **After**: Only legitimate processes

### Application
- **Before**: Running (but compromised)
- **After**: Running (clean, patched)

---

## 🔄 ROLLBACK PROCEDURE

If anything goes wrong:

### Quick Rollback
```bash
# 1. Restore from backup
sudo cp -r /var/backups/naukrimili-before-cleanup-*/* /var/www/naukrimili/

# 2. Restore package.json
cd /var/www/naukrimili
cp /var/backups/naukrimili-security/backup-*/package.json.backup package.json

# 3. Reinstall dependencies
npm install --legacy-peer-deps

# 4. Rebuild
npm run build

# 5. Restart PM2
pm2 restart jobportal
```

### Verify Rollback
```bash
pm2 status
curl http://localhost:3000/api/health
```

---

## 📝 FILL OUT SECURITY REPORT

After completion, fill out `SECURITY_REPORT_TEMPLATE.md` with:
- Malware types found
- Files removed
- Processes killed
- Root cause
- CPU before/after
- Verification checklist

---

## 🆘 TROUBLESHOOTING

### Issue: CPU Still High After Remediation
```bash
# Check what's using CPU
top -bn1 | head -20

# Check for new processes
ps aux --sort=-%cpu | head -20

# Check system load
uptime

# May need to investigate further
```

### Issue: Application Not Starting
```bash
# Check PM2 logs
pm2 logs jobportal --lines 100

# Check build errors
npm run build

# Check Node.js version
node --version

# Restart PM2
pm2 restart jobportal
```

### Issue: Build Fails After Patch
```bash
# Rollback package.json
cp /var/backups/naukrimili-security/backup-*/package.json.backup package.json

# Clear cache and retry
rm -rf node_modules/.cache
npm cache clean --force
npm install --legacy-peer-deps
npm run build
```

---

## 📞 SUPPORT

If you encounter issues:
1. Check logs: `/tmp/security_*.log`
2. Review scan report: `/tmp/security_scan_*.txt`
3. Check PM2 logs: `pm2 logs`
4. Verify backups exist before proceeding

---

## ✅ FINAL CHECKLIST

Before considering incident resolved:
- [ ] CPU usage normalized (<20%)
- [ ] No malware processes running
- [ ] No malware files present
- [ ] No malicious cron jobs
- [ ] Next.js upgraded to 15.5.7+
- [ ] Application running normally
- [ ] Health endpoints responding
- [ ] Security hardening applied
- [ ] Monitoring enabled
- [ ] Security report completed

---

## 🎯 SUCCESS CRITERIA

**Incident is RESOLVED when:**
1. ✅ CPU usage < 20%
2. ✅ No malware detected
3. ✅ Application running normally
4. ✅ Vulnerabilities patched
5. ✅ Security hardened
6. ✅ Zero downtime maintained

---

**Last Updated**: [DATE]
**Version**: 1.0

