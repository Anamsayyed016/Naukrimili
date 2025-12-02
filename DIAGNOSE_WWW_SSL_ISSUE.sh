#!/bin/bash

################################################################################
# SSL CERTIFICATE DIAGNOSTIC SCRIPT
# Purpose: Diagnose why www.naukrimili.com shows SSL error
# Run this BEFORE running the fix script
################################################################################

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║        SSL Certificate Diagnostic for naukrimili.com         ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""

################################################################################
# 1. Check SSL Certificate File
################################################################################

echo -e "${GREEN}[1/7] Checking SSL Certificate File...${NC}"
echo ""

if [ -f "/etc/letsencrypt/live/naukrimili.com/fullchain.pem" ]; then
    echo -e "${GREEN}✅ Certificate file found${NC}"
    echo "   Location: /etc/letsencrypt/live/naukrimili.com/fullchain.pem"
else
    echo -e "${RED}❌ Certificate file NOT found${NC}"
    echo "   Expected location: /etc/letsencrypt/live/naukrimili.com/fullchain.pem"
    exit 1
fi

echo ""

################################################################################
# 2. Extract Certificate Details
################################################################################

echo -e "${GREEN}[2/7] Extracting Certificate Details...${NC}"
echo ""

echo "Certificate Subject:"
sudo openssl x509 -in /etc/letsencrypt/live/naukrimili.com/fullchain.pem -noout -subject
echo ""

echo "Certificate Issuer:"
sudo openssl x509 -in /etc/letsencrypt/live/naukrimili.com/fullchain.pem -noout -issuer
echo ""

echo "Certificate Validity:"
sudo openssl x509 -in /etc/letsencrypt/live/naukrimili.com/fullchain.pem -noout -dates
echo ""

################################################################################
# 3. Check Subject Alternative Names (CRITICAL)
################################################################################

echo -e "${GREEN}[3/7] Checking Subject Alternative Names (SAN)...${NC}"
echo ""

echo "Domains covered by this certificate:"
DOMAINS=$(sudo openssl x509 -in /etc/letsencrypt/live/naukrimili.com/fullchain.pem -text -noout | grep -A 1 "Subject Alternative Name" | tail -n 1)
echo "$DOMAINS"
echo ""

# Check if www is included
if echo "$DOMAINS" | grep -q "www.naukrimili.com"; then
    echo -e "${GREEN}✅ Certificate INCLUDES www.naukrimili.com${NC}"
    echo "   → www subdomain SHOULD work"
else
    echo -e "${RED}❌ Certificate DOES NOT include www.naukrimili.com${NC}"
    echo "   → This is why www shows SSL error!"
    echo "   → Certificate needs to be regenerated with --domains naukrimili.com,www.naukrimili.com"
fi

echo ""

################################################################################
# 4. Test SSL Connection - naukrimili.com
################################################################################

echo -e "${GREEN}[4/7] Testing SSL Connection - naukrimili.com...${NC}"
echo ""

if timeout 5 openssl s_client -connect naukrimili.com:443 -servername naukrimili.com < /dev/null 2>&1 | grep -q "Verify return code: 0"; then
    echo -e "${GREEN}✅ naukrimili.com SSL connection: SUCCESS${NC}"
else
    echo -e "${YELLOW}⚠️  naukrimili.com SSL connection: Issues detected${NC}"
fi

################################################################################
# 5. Test SSL Connection - www.naukrimili.com
################################################################################

echo -e "${GREEN}[5/7] Testing SSL Connection - www.naukrimili.com...${NC}"
echo ""

if timeout 5 openssl s_client -connect www.naukrimili.com:443 -servername www.naukrimili.com < /dev/null 2>&1 | grep -q "Verify return code: 0"; then
    echo -e "${GREEN}✅ www.naukrimili.com SSL connection: SUCCESS${NC}"
else
    echo -e "${RED}❌ www.naukrimili.com SSL connection: FAILED${NC}"
    echo "   This confirms the SSL error on www subdomain"
fi

echo ""

################################################################################
# 6. Check Nginx Configuration
################################################################################

echo -e "${GREEN}[6/7] Checking Nginx Configuration...${NC}"
echo ""

echo "Checking if both domains are configured in Nginx..."
if sudo grep -r "server_name.*www\.naukrimili\.com.*naukrimili\.com" /etc/nginx/ || sudo grep -r "server_name.*naukrimili\.com.*www\.naukrimili\.com" /etc/nginx/; then
    echo -e "${GREEN}✅ Both domains configured in Nginx${NC}"
else
    echo -e "${YELLOW}⚠️  Nginx configuration might need updating${NC}"
fi

echo ""

echo "Testing Nginx configuration syntax..."
if sudo nginx -t 2>&1 | grep -q "syntax is ok"; then
    echo -e "${GREEN}✅ Nginx configuration is valid${NC}"
else
    echo -e "${RED}❌ Nginx configuration has errors${NC}"
fi

echo ""

################################################################################
# 7. DNS Resolution Check
################################################################################

echo -e "${GREEN}[7/7] Checking DNS Resolution...${NC}"
echo ""

echo "Resolving naukrimili.com:"
dig +short naukrimili.com A || nslookup naukrimili.com | grep "Address:" | tail -n 1
echo ""

echo "Resolving www.naukrimili.com:"
dig +short www.naukrimili.com A CNAME || nslookup www.naukrimili.com | grep "Address:\|canonical" | tail -n 2
echo ""

################################################################################
# Summary and Recommendations
################################################################################

echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                    DIAGNOSTIC SUMMARY                          ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if www is in certificate
if sudo openssl x509 -in /etc/letsencrypt/live/naukrimili.com/fullchain.pem -text -noout | grep -q "www.naukrimili.com"; then
    echo -e "${GREEN}✅ DIAGNOSIS: Certificate is correctly configured${NC}"
    echo ""
    echo "Your SSL certificate includes both:"
    echo "   • naukrimili.com"
    echo "   • www.naukrimili.com"
    echo ""
    echo "If www still shows SSL error, possible causes:"
    echo "   1. Browser cache (Clear cache: Ctrl+Shift+Delete)"
    echo "   2. DNS propagation delay (Wait 5-10 minutes)"
    echo "   3. Nginx not reloaded (Run: sudo systemctl reload nginx)"
else
    echo -e "${RED}❌ DIAGNOSIS: Certificate does NOT include www subdomain${NC}"
    echo ""
    echo -e "${YELLOW}ROOT CAUSE:${NC}"
    echo "   Your SSL certificate was generated only for 'naukrimili.com'"
    echo "   It does NOT include 'www.naukrimili.com' subdomain"
    echo ""
    echo -e "${YELLOW}WHY THIS CAUSES SSL ERROR:${NC}"
    echo "   1. Browser connects to www.naukrimili.com"
    echo "   2. Server presents certificate for 'naukrimili.com'"
    echo "   3. Certificate doesn't cover 'www' subdomain"
    echo "   4. Browser rejects connection → ERR_SSL_PROTOCOL_ERROR"
    echo ""
    echo -e "${GREEN}✅ SOLUTION:${NC}"
    echo "   Run the fix script: ./FIX_WWW_SSL_CERTIFICATE.sh"
    echo ""
    echo "   Or manually run:"
    echo "   sudo certbot certonly --standalone \\"
    echo "     --domains naukrimili.com,www.naukrimili.com \\"
    echo "     --expand --force-renewal"
    echo ""
fi

echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo ""

# Show certificate info
echo -e "${YELLOW}📋 Full Certificate Information:${NC}"
sudo certbot certificates 2>/dev/null || echo "Certbot not installed or no certificates found"

echo ""
echo -e "${GREEN}Diagnostic completed!${NC}"

