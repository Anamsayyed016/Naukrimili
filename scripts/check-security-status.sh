#!/bin/bash

###############################################################################
# 🔍 SECURITY STATUS CHECK
# 
# Purpose: Quick security status check for naukrimili.com
# Usage: ./scripts/check-security-status.sh
###############################################################################

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

PROJECT_DIR="${PROJECT_DIR:-/var/www/naukrimili}"

echo -e "${BLUE}🔍 Security Status Check for naukrimili.com${NC}"
echo "=========================================="
echo ""

# Check 1: Malware Processes
echo -e "${BLUE}1. Checking for malware processes...${NC}"
MALWARE_FOUND=0
for pattern in "xmrig" "syssls" "systemhelper" "minerd" "cpuminer"; do
    if pgrep -f "$pattern" >/dev/null 2>&1; then
        echo -e "${RED}❌ MALWARE PROCESS DETECTED: $pattern${NC}"
        ps aux | grep -i "$pattern" | grep -v grep
        MALWARE_FOUND=1
    fi
done
if [ $MALWARE_FOUND -eq 0 ]; then
    echo -e "${GREEN}✅ No malware processes detected${NC}"
fi
echo ""

# Check 2: Malware Files
echo -e "${BLUE}2. Checking for malware files...${NC}"
MALWARE_FILES=0
for location in "/tmp" "/var/tmp" "/dev/shm" "/root"; do
    for pattern in "xmrig" "syssls" "systemhelper" "bot"; do
        if find "$location" -type f -iname "*$pattern*" 2>/dev/null | grep -q .; then
            echo -e "${RED}❌ MALWARE FILE FOUND in $location${NC}"
            find "$location" -type f -iname "*$pattern*" 2>/dev/null
            MALWARE_FILES=1
        fi
    done
done
if [ -f "/var/tmp/bot" ] || [ -f "/tmp/bot" ]; then
    echo -e "${RED}❌ BOT FILE DETECTED${NC}"
    MALWARE_FILES=1
fi
if [ $MALWARE_FILES -eq 0 ]; then
    echo -e "${GREEN}✅ No malware files detected${NC}"
fi
echo ""

# Check 3: Malicious Cron Jobs
echo -e "${BLUE}3. Checking for malicious cron jobs...${NC}"
CRON_ISSUES=0
if crontab -l 2>/dev/null | grep -E "xmrig|syssls|systemhelper|45.131.184.34" >/dev/null; then
    echo -e "${RED}❌ MALICIOUS CRON JOB FOUND${NC}"
    crontab -l 2>/dev/null | grep -E "xmrig|syssls|systemhelper|45.131.184.34"
    CRON_ISSUES=1
fi
if [ $CRON_ISSUES -eq 0 ]; then
    echo -e "${GREEN}✅ No malicious cron jobs detected${NC}"
fi
echo ""

# Check 4: Systemd Services
echo -e "${BLUE}4. Checking for malicious systemd services...${NC}"
SERVICE_ISSUES=0
for service in "syssls" "systemhelper"; do
    if systemctl list-unit-files 2>/dev/null | grep -q "$service.service"; then
        echo -e "${RED}❌ MALICIOUS SERVICE FOUND: $service${NC}"
        systemctl status "$service" 2>/dev/null | head -5
        SERVICE_ISSUES=1
    fi
done
if [ $SERVICE_ISSUES -eq 0 ]; then
    echo -e "${GREEN}✅ No malicious services detected${NC}"
fi
echo ""

# Check 5: Application Health
echo -e "${BLUE}5. Checking application health...${NC}"
if pm2 describe naukrimili >/dev/null 2>&1; then
    STATUS=$(pm2 jlist | grep -o "\"name\":\"naukrimili\".*\"status\":\"[^\"]*\"" | grep -o "\"status\":\"[^\"]*\"" | cut -d'"' -f4)
    if [ "$STATUS" = "online" ]; then
        echo -e "${GREEN}✅ Application is online${NC}"
    else
        echo -e "${YELLOW}⚠️  Application status: $STATUS${NC}"
    fi
    
    # Check HTTP response
    if timeout 3 curl -f -s http://127.0.0.1:3000 >/dev/null 2>&1; then
        echo -e "${GREEN}✅ Application is responding${NC}"
    else
        echo -e "${RED}❌ Application is not responding${NC}"
    fi
else
    echo -e "${RED}❌ Application not found in PM2${NC}"
fi
echo ""

# Check 6: Security Monitoring
echo -e "${BLUE}6. Checking security monitoring...${NC}"
if systemctl is-active --quiet naukrimili-security-monitor 2>/dev/null; then
    echo -e "${GREEN}✅ Security monitoring is active${NC}"
else
    echo -e "${YELLOW}⚠️  Security monitoring is not active${NC}"
    echo "   Install with: ./scripts/security-monitor-and-harden.sh install"
fi
echo ""

# Check 7: Firewall
echo -e "${BLUE}7. Checking firewall rules...${NC}"
if command -v iptables >/dev/null 2>&1; then
    if iptables -L INPUT -n 2>/dev/null | grep -q "45.131.184.34"; then
        echo -e "${GREEN}✅ Malicious IPs are blocked${NC}"
    else
        echo -e "${YELLOW}⚠️  Firewall rules may need configuration${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  iptables not found - firewall status unknown${NC}"
fi
echo ""

# Check 8: File Permissions
echo -e "${BLUE}8. Checking file permissions...${NC}"
if [ -f "$PROJECT_DIR/.env" ]; then
    PERMS=$(stat -c %a "$PROJECT_DIR/.env" 2>/dev/null || echo "unknown")
    if [ "$PERMS" = "600" ]; then
        echo -e "${GREEN}✅ .env file permissions secure (600)${NC}"
    else
        echo -e "${YELLOW}⚠️  .env file permissions: $PERMS (should be 600)${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  .env file not found${NC}"
fi
echo ""

# Check 9: Next.js Version
echo -e "${BLUE}9. Checking Next.js version...${NC}"
if [ -f "$PROJECT_DIR/package.json" ]; then
    NEXT_VERSION=$(grep -E '"next":' "$PROJECT_DIR/package.json" | sed -E 's/.*"next":\s*"([^"]+)".*/\1/' || echo "unknown")
    echo "   Current version: $NEXT_VERSION"
    if [[ "$NEXT_VERSION" == "15.5.7" ]] || [[ "$NEXT_VERSION" > "15.5.7" ]]; then
        echo -e "${GREEN}✅ Next.js version is secure${NC}"
    else
        echo -e "${YELLOW}⚠️  Next.js version may be vulnerable (recommend 15.5.7+)${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  package.json not found${NC}"
fi
echo ""

# Summary
echo "=========================================="
TOTAL_ISSUES=$((MALWARE_FOUND + MALWARE_FILES + CRON_ISSUES + SERVICE_ISSUES))
if [ $TOTAL_ISSUES -eq 0 ]; then
    echo -e "${GREEN}✅ Security Status: SECURE${NC}"
    echo ""
    echo "All security checks passed!"
else
    echo -e "${RED}❌ Security Status: ISSUES DETECTED${NC}"
    echo ""
    echo "Found $TOTAL_ISSUES security issue(s)."
    echo "Run remediation: ./scripts/security-remediation.sh"
    echo "Or setup monitoring: ./scripts/security-monitor-and-harden.sh install"
fi
echo ""
