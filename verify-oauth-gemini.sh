#!/bin/bash

# 🔍 Google OAuth & Gemini API Verification Script
# This script checks if the keys are properly loaded and working

echo "═══════════════════════════════════════════════════════════"
echo "🔍 Google OAuth & Gemini API Verification"
echo "═══════════════════════════════════════════════════════════"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check 1: PM2 Status
echo "📊 Step 1: Checking PM2 Status..."
echo "───────────────────────────────────────────────────────────"
pm2 describe naukrimili | grep -E "status|uptime|restarts"
echo ""

# Check 2: Check Environment Variables in .env
echo "🔑 Step 2: Verifying Keys in .env File..."
echo "───────────────────────────────────────────────────────────"
if grep -q "GOOGLE_CLIENT_ID=" /root/.pm2/logs/.env 2>/dev/null || \
   grep -q "GOOGLE_CLIENT_ID=" .env 2>/dev/null; then
    echo -e "${GREEN}✅ GOOGLE_CLIENT_ID found in .env${NC}"
else
    echo -e "${RED}❌ GOOGLE_CLIENT_ID not found in .env${NC}"
fi

if grep -q "GOOGLE_CLIENT_SECRET=" /root/.pm2/logs/.env 2>/dev/null || \
   grep -q "GOOGLE_CLIENT_SECRET=" .env 2>/dev/null; then
    echo -e "${GREEN}✅ GOOGLE_CLIENT_SECRET found in .env${NC}"
else
    echo -e "${RED}❌ GOOGLE_CLIENT_SECRET not found in .env${NC}"
fi

if grep -q "GEMINI_API_KEY=" /root/.pm2/logs/.env 2>/dev/null || \
   grep -q "GEMINI_API_KEY=" .env 2>/dev/null; then
    echo -e "${GREEN}✅ GEMINI_API_KEY found in .env${NC}"
else
    echo -e "${RED}❌ GEMINI_API_KEY not found in .env${NC}"
fi
echo ""

# Check 3: Check PM2 Logs for Initialization Messages
echo "📝 Step 3: Checking PM2 Logs for Initialization..."
echo "───────────────────────────────────────────────────────────"
echo ""
echo "🔍 Checking for Google OAuth initialization..."
if pm2 logs naukrimili --lines 200 --nostream 2>/dev/null | grep -q "Google OAuth provider configured successfully"; then
    echo -e "${GREEN}✅ Google OAuth provider configured successfully${NC}"
    pm2 logs naukrimili --lines 200 --nostream 2>/dev/null | grep "Google OAuth" | tail -3
else
    echo -e "${RED}❌ Google OAuth initialization message not found${NC}"
    echo "   Looking for warnings..."
    pm2 logs naukrimili --lines 200 --nostream 2>/dev/null | grep -i "google" | tail -5
fi
echo ""

echo "🔍 Checking for Gemini API initialization..."
if pm2 logs naukrimili --lines 200 --nostream 2>/dev/null | grep -q "Gemini client initialized"; then
    echo -e "${GREEN}✅ Gemini client initialized${NC}"
    pm2 logs naukrimili --lines 200 --nostream 2>/dev/null | grep "Gemini" | tail -3
else
    echo -e "${RED}❌ Gemini initialization message not found${NC}"
    echo "   Looking for warnings..."
    pm2 logs naukrimili --lines 200 --nostream 2>/dev/null | grep -i "gemini" | tail -5
fi
echo ""

# Check 4: Test API Endpoints
echo "🌐 Step 4: Testing API Endpoints..."
echo "───────────────────────────────────────────────────────────"

echo "Testing /api/auth/providers..."
PROVIDERS_RESPONSE=$(curl -s http://localhost:3000/api/auth/providers)
if echo "$PROVIDERS_RESPONSE" | grep -q "google"; then
    echo -e "${GREEN}✅ Google OAuth provider available via API${NC}"
    echo "   Response: $(echo $PROVIDERS_RESPONSE | jq -r '.google.name' 2>/dev/null || echo 'Google found')"
else
    echo -e "${RED}❌ Google OAuth provider NOT available via API${NC}"
    echo "   Response: $PROVIDERS_RESPONSE"
fi
echo ""

# Check 5: Recent Logs (Last 30 lines)
echo "📋 Step 5: Recent Server Logs (Last 30 lines)..."
echo "───────────────────────────────────────────────────────────"
pm2 logs naukrimili --lines 30 --nostream 2>/dev/null | grep -E "NextAuth|Google|Gemini|OAuth|Error|Warning" || echo "No relevant logs found"
echo ""

# Summary
echo "═══════════════════════════════════════════════════════════"
echo "📊 VERIFICATION SUMMARY"
echo "═══════════════════════════════════════════════════════════"
echo ""

# Count checks
CHECKS_PASSED=0
TOTAL_CHECKS=4

# Check Google OAuth
if pm2 logs naukrimili --lines 200 --nostream 2>/dev/null | grep -q "Google OAuth provider configured successfully"; then
    CHECKS_PASSED=$((CHECKS_PASSED + 1))
    echo -e "${GREEN}✅ Google OAuth Configuration: WORKING${NC}"
else
    echo -e "${RED}❌ Google OAuth Configuration: NOT DETECTED${NC}"
fi

# Check Gemini
if pm2 logs naukrimili --lines 200 --nostream 2>/dev/null | grep -q "Gemini client initialized"; then
    CHECKS_PASSED=$((CHECKS_PASSED + 1))
    echo -e "${GREEN}✅ Gemini API Configuration: WORKING${NC}"
else
    echo -e "${RED}❌ Gemini API Configuration: NOT DETECTED${NC}"
fi

# Check API endpoint
if curl -s http://localhost:3000/api/auth/providers | grep -q "google"; then
    CHECKS_PASSED=$((CHECKS_PASSED + 1))
    echo -e "${GREEN}✅ OAuth API Endpoint: RESPONDING${NC}"
else
    echo -e "${RED}❌ OAuth API Endpoint: NOT RESPONDING${NC}"
fi

# Check PM2 status
if pm2 describe naukrimili 2>/dev/null | grep -q "online"; then
    CHECKS_PASSED=$((CHECKS_PASSED + 1))
    echo -e "${GREEN}✅ PM2 Server Status: ONLINE${NC}"
else
    echo -e "${RED}❌ PM2 Server Status: OFFLINE${NC}"
fi

echo ""
echo "═══════════════════════════════════════════════════════════"
echo -e "📊 Result: ${GREEN}${CHECKS_PASSED}/${TOTAL_CHECKS}${NC} checks passed"
echo "═══════════════════════════════════════════════════════════"
echo ""

if [ $CHECKS_PASSED -eq $TOTAL_CHECKS ]; then
    echo -e "${GREEN}🎉 SUCCESS! All systems are working correctly!${NC}"
    echo ""
    echo "Next steps:"
    echo "  1. Visit https://naukrimili.com/auth/signin"
    echo "  2. Click 'Sign in with Google'"
    echo "  3. Test resume upload with AI parsing"
else
    echo -e "${YELLOW}⚠️  Some checks failed. Troubleshooting steps:${NC}"
    echo ""
    echo "  1. Check if .env file is in the correct location"
    echo "  2. Restart PM2: pm2 restart naukrimili"
    echo "  3. View full logs: pm2 logs naukrimili"
    echo "  4. Check for errors: pm2 logs naukrimili --err"
fi

echo ""

