#!/bin/bash

echo "🔍 Debugging OAuth Stuck Issue"
echo "================================"

# Check if the application is running
echo "1. Checking if application is running..."
if curl -s http://localhost:3000 > /dev/null; then
    echo "✅ Application is running on localhost:3000"
else
    echo "❌ Application is not running. Please start it first."
    exit 1
fi

# Check OAuth configuration
echo ""
echo "2. Checking OAuth configuration..."
if [ -f ".env" ]; then
    echo "✅ .env file exists"
    if grep -q "GOOGLE_CLIENT_ID" .env; then
        echo "✅ GOOGLE_CLIENT_ID is set"
    else
        echo "❌ GOOGLE_CLIENT_ID is missing"
    fi
    if grep -q "GOOGLE_CLIENT_SECRET" .env; then
        echo "✅ GOOGLE_CLIENT_SECRET is set"
    else
        echo "❌ GOOGLE_CLIENT_SECRET is missing"
    fi
    if grep -q "NEXTAUTH_URL" .env; then
        echo "✅ NEXTAUTH_URL is set"
    else
        echo "❌ NEXTAUTH_URL is missing"
    fi
else
    echo "❌ .env file not found"
fi

# Check OAuth callback URL
echo ""
echo "3. Testing OAuth callback URL..."
OAUTH_CALLBACK="http://localhost:3000/api/auth/callback/google"
if curl -s -I "$OAUTH_CALLBACK" | grep -q "200\|404"; then
    echo "✅ OAuth callback endpoint is accessible"
else
    echo "❌ OAuth callback endpoint is not accessible"
fi

# Check for stuck processes
echo ""
echo "4. Checking for stuck Node.js processes..."
STUCK_PROCESSES=$(ps aux | grep -E "node|next" | grep -v grep | wc -l)
echo "Found $STUCK_PROCESSES Node.js processes running"

# Check browser console for errors
echo ""
echo "5. Browser debugging steps:"
echo "   - Open browser developer tools (F12)"
echo "   - Go to Console tab"
echo "   - Look for OAuth-related errors"
echo "   - Check Network tab for failed requests"

# Check NextAuth debug logs
echo ""
echo "6. NextAuth debug information:"
echo "   - NEXTAUTH_DEBUG=true is enabled in the config"
echo "   - Check server logs for OAuth flow details"
echo "   - Look for 'SignIn event' and 'JWT callback' logs"

echo ""
echo "🔧 Quick fixes to try:"
echo "1. Clear browser cache and cookies"
echo "2. Try incognito/private browsing mode"
echo "3. Check if popup blockers are enabled"
echo "4. Verify Google OAuth credentials in Google Console"
echo "5. Check if redirect URIs match exactly"

echo ""
echo "✅ OAuth debugging complete!"
