#!/bin/bash

echo "🌐 Testing OAuth Global Configuration"
echo "======================================"
echo ""

# Test 1: Providers endpoint
echo "1️⃣ Testing OAuth Providers Endpoint:"
PROVIDERS_RESPONSE=$(curl -s https://naukrimili.com/api/auth/providers)
if echo "$PROVIDERS_RESPONSE" | grep -q "google"; then
    echo "   ✅ Google OAuth provider found"
    echo "   Response: $PROVIDERS_RESPONSE" | head -c 200
    echo "..."
else
    echo "   ❌ Google OAuth provider not found"
fi
echo ""

# Test 2: Sign-in endpoint status
echo "2️⃣ Testing Google Sign-in Endpoint:"
SIGNIN_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://naukrimili.com/api/auth/signin/google)
echo "   Status Code: $SIGNIN_STATUS"
if [ "$SIGNIN_STATUS" = "200" ] || [ "$SIGNIN_STATUS" = "302" ]; then
    echo "   ✅ Endpoint is accessible (200/302 is expected)"
else
    echo "   ⚠️  Unexpected status code"
fi
echo ""

# Test 3: Session endpoint
echo "3️⃣ Testing Session Endpoint:"
SESSION_RESPONSE=$(curl -s https://naukrimili.com/api/auth/session)
if echo "$SESSION_RESPONSE" | grep -q "user\|null"; then
    echo "   ✅ Session endpoint working"
else
    echo "   ⚠️  Unexpected response"
fi
echo ""

# Test 4: Check CORS headers
echo "4️⃣ Testing CORS Configuration:"
CORS_HEADERS=$(curl -s -I https://naukrimili.com/api/auth/providers | grep -i "access-control")
if [ ! -z "$CORS_HEADERS" ]; then
    echo "   ✅ CORS headers present:"
    echo "   $CORS_HEADERS"
else
    echo "   ⚠️  No CORS headers found"
fi
echo ""

echo "======================================"
echo "✅ OAuth Global Verification Complete"
echo ""
echo "📋 Global Testing Checklist:"
echo "   [ ] Test from production domain (https://naukrimili.com)"
echo "   [ ] Test from different geographic locations"
echo "   [ ] Test on mobile devices"
echo "   [ ] Test on different browsers"
echo "   [ ] Verify Google Cloud Console redirect URIs"
echo ""
echo "🔗 Test OAuth Flow:"
echo "   1. Visit: https://naukrimili.com/auth/signin"
echo "   2. Click 'Sign in with Google'"
echo "   3. Should redirect to Google OAuth consent screen"
echo ""

