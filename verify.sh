#!/bin/bash
# Quick one-line verification script

echo "🔍 Quick Verification..."
echo ""

# Check Google OAuth
if pm2 logs naukrimili --lines 200 --nostream 2>/dev/null | grep -q "Google OAuth provider configured successfully"; then
    echo "✅ Google OAuth: WORKING"
else
    echo "❌ Google OAuth: NOT FOUND"
fi

# Check Gemini
if pm2 logs naukrimili --lines 200 --nostream 2>/dev/null | grep -q "Gemini client initialized"; then
    echo "✅ Gemini API: WORKING"
else
    echo "❌ Gemini API: NOT FOUND"
fi

# Check API
if curl -s http://localhost:3000/api/auth/providers 2>/dev/null | grep -q "google"; then
    echo "✅ OAuth Endpoint: RESPONDING"
else
    echo "❌ OAuth Endpoint: NOT RESPONDING"
fi

# Check PM2
if pm2 describe naukrimili 2>/dev/null | grep -q "online"; then
    echo "✅ PM2 Status: ONLINE"
else
    echo "❌ PM2 Status: OFFLINE"
fi

echo ""
echo "Run './verify-oauth-gemini.sh' for detailed report"

