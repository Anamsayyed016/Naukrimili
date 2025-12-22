# Security Incident Response Guide

## 🚨 CRITICAL: High CPU Usage (~76%) - Malware Detection

### Immediate Actions (SAFE MODE - READ-ONLY FIRST)

**⚠️ DO NOT RUN REMEDIATION WITHOUT SCANNING FIRST**

#### Step 1: Emergency Scan (READ-ONLY)
```bash
# On production server
cd /var/www/naukrimili
chmod +x scripts/security-emergency-scan.sh
bash scripts/security-emergency-scan.sh
```

**Review the scan report before proceeding!**

#### Step 2: Review Scan Results
- Check `/tmp/security_scan_*.txt` for findings
- Identify malicious processes, files, and cron jobs
- Document all findings

#### Step 3: Remediation (ONLY AFTER REVIEW)
```bash
# Backup first!
cp -r /var/www/naukrimili /var/backups/naukrimili-before-cleanup-$(date +%s)

# Run remediation
chmod +x scripts/security-remediation-safe.sh
bash scripts/security-remediation-safe.sh
```

#### Step 4: Security Hardening
```bash
chmod +x scripts/security-harden-server.sh
sudo bash scripts/security-harden-server.sh
```

#### Step 5: Verification
```bash
# Check CPU usage
top -bn1 | head -20

# Check for remaining malware
ps aux | grep -iE "miner|crypto|xmrig"

# Verify application is running
pm2 status
curl http://localhost:3000/api/health
```

### Common Malware Types to Look For

1. **Crypto Miners**
   - xmrig
   - ccminer
   - cpuminer
   - monero miners

2. **Backdoors**
   - PHP shells (`.php` files with `eval`, `base64_decode`)
   - Shell scripts with `wget|curl` downloading more malware
   - Hidden files in `/tmp`, `/var/tmp`, `/dev/shm`

3. **Persistence Mechanisms**
   - Cron jobs running suspicious scripts
   - Systemd services/timers
   - Startup scripts in `/etc/rc.local`, `/etc/init.d`

### Root Causes to Investigate

1. **Framework Vulnerabilities**
   - Next.js < 15.5.7 (CVE-2025-66478 - RCE)
   - Check `package.json` for vulnerable versions

2. **Dependency Compromise**
   - Malicious npm packages
   - Compromised node_modules
   - Infected build cache

3. **CI/CD Pipeline**
   - Compromised GitHub Actions secrets
   - Malicious build scripts
   - Infected deployment artifacts

4. **Server Access**
   - Weak SSH passwords
   - Exposed credentials
   - Unpatched system packages

### Files to Check

**System Directories:**
- `/tmp/*.sh`, `/tmp/*.php`
- `/var/tmp/*`
- `/dev/shm/*`
- `/root/.ssh/authorized_keys`
- `/home/*/.ssh/authorized_keys`

**Project Directories:**
- `/var/www/naukrimili/.next/cache/*`
- `/var/www/naukrimili/node_modules/.cache/*`
- `/var/www/naukrimili/*.php` (shouldn't exist in Next.js project)
- `/var/www/naukrimili/public/uploads/*`

**Cron Locations:**
- `/var/spool/cron/crontabs/*`
- `/etc/cron.d/*`
- `/etc/cron.hourly/*`
- `/etc/cron.daily/*`

### Prevention Checklist

- [ ] Next.js upgraded to 15.5.7+
- [ ] All dependencies updated
- [ ] SSH hardened (key-based auth, no root login)
- [ ] Firewall configured
- [ ] Fail2Ban installed
- [ ] File permissions secured
- [ ] Cron jobs monitored
- [ ] Regular security scans scheduled
- [ ] GitHub Actions secrets rotated
- [ ] Server packages updated

### Rollback Procedure

If remediation breaks production:

1. **Restore from backup:**
   ```bash
   cp -r /var/backups/naukrimili-before-cleanup-* /var/www/naukrimili
   ```

2. **Restore package.json:**
   ```bash
   cp /var/backups/naukrimili-security/backup-*/package.json.backup package.json
   npm install --legacy-peer-deps
   npm run build
   pm2 restart jobportal
   ```

3. **Verify application:**
   ```bash
   pm2 status
   curl http://localhost:3000/api/health
   ```

### Emergency Contacts

- Server: Hostinger VPS
- Application: PM2 process "jobportal"
- Database: PostgreSQL (check connection)

### Notes

- **ZERO DOWNTIME**: All operations designed to not interrupt service
- **SAFE MODE**: Scan first, review, then remediate
- **BACKUP FIRST**: Always backup before removal
- **VERIFY AFTER**: Check CPU usage and application health

