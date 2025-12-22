# 🚨 Security Incident - Quick Reference

## ⚡ FAST ACTION COMMANDS

### 1. SCAN (Safe - Read Only)
```bash
cd /var/www/naukrimili
chmod +x scripts/security-emergency-scan.sh
bash scripts/security-emergency-scan.sh
cat /tmp/security_scan_*.txt
```

### 2. REMEDIATE (After Review)
```bash
# Backup first!
sudo cp -r /var/www/naukrimili /var/backups/naukrimili-before-$(date +%s)

# Run remediation
chmod +x scripts/security-remediation-safe.sh
bash scripts/security-remediation-safe.sh

# Patch Next.js
chmod +x scripts/security-patch-nextjs-safe.sh
bash scripts/security-patch-nextjs-safe.sh
```

### 3. HARDEN
```bash
sudo bash scripts/security-harden-server.sh
```

### 4. VERIFY
```bash
bash scripts/security-verify-clean.sh
top -bn1 | head -20
pm2 status
```

---

## 🔍 QUICK CHECKS

### Check CPU
```bash
top -bn1 | head -20
```

### Check Malware Processes
```bash
ps aux | grep -iE "miner|crypto|xmrig|syssls"
```

### Check Cron Jobs
```bash
crontab -l
sudo cat /etc/cron.d/*
```

### Check Application
```bash
pm2 status
curl http://localhost:3000/api/health
```

---

## 📋 ROOT CAUSE

**Identified**: Next.js 15.5.2 vulnerable to **CVE-2025-66478** (RCE)

**Fix**: Upgrade to Next.js 15.5.7+

---

## 📁 FILES CREATED

1. `scripts/security-emergency-scan.sh` - Scan for malware
2. `scripts/security-remediation-safe.sh` - Remove malware
3. `scripts/security-patch-nextjs-safe.sh` - Patch Next.js
4. `scripts/security-harden-server.sh` - Harden server
5. `scripts/security-verify-clean.sh` - Verify cleanup
6. `SECURITY_EXECUTION_GUIDE.md` - Full guide
7. `SECURITY_INCIDENT_RESPONSE.md` - Response procedures
8. `SECURITY_REPORT_TEMPLATE.md` - Report template

---

## ⚠️ IMPORTANT

- **ALWAYS scan first** before remediation
- **ALWAYS backup** before changes
- **Review findings** before removal
- **Monitor** after remediation
- **Zero downtime** approach maintained

---

## 🆘 ROLLBACK

```bash
sudo cp -r /var/backups/naukrimili-before-*/* /var/www/naukrimili/
cd /var/www/naukrimili
npm install --legacy-peer-deps
npm run build
pm2 restart jobportal
```

