#!/bin/bash

# OAuth Global Test Commands
# Run these commands on your production server or local machine

echo "🌐 Testing NextAuth OAuth Global Configuration"
echo "================================================"

# Test 1: Check OAuth Providers
echo ""
echo "1️⃣ Testing OAuth Providers Endpoint:"
curl -v https://naukrimili.com/api/auth/providers

# Test 2: Check Google Sign-in (should redirect 302)
echo ""
echo ""
echo "2️⃣ Testing Google Sign-in Endpoint (should redirect):"
curl -I https://naukrimili.com/api/auth/signin/google

# Test 3: Check Session Endpoint
echo ""
echo ""
echo "3️⃣ Testing Session Endpoint:"
curl -v https://naukrimili.com/api/auth/session

# Test 4: Check Callback Endpoint (without code - should return error or redirect)
echo ""
echo ""
echo "4️⃣ Testing Callback Endpoint (without code):"
curl -I https://naukrimili.com/api/auth/callback/google

echo ""
echo ""
echo "✅ Testing Complete!"
echo ""
echo "Expected Results:"
echo "  - Providers: 200 OK with Google OAuth details"
echo "  - Sign-in: 302 Redirect to Google"
echo "  - Session: 200 OK (empty if not logged in)"
echo "  - Callback: 302 or 400 (without auth code)"

