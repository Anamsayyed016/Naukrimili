#!/bin/bash

echo "🔍 Debugging OAuth Flow"
echo "========================"
echo ""

echo "1️⃣ Checking environment variables in PM2:"
echo "NEXTAUTH vars:"
pm2 env 0 | grep -E "NEXTAUTH"
echo ""
echo "GOOGLE OAuth vars:"
pm2 env 0 | grep -E "GOOGLE_CLIENT"
echo ""

echo "2️⃣ Checking OAuth providers endpoint:"
curl -s "https://naukrimili.com/api/auth/providers" | jq .
echo ""

echo "3️⃣ Expected Google OAuth redirect URIs (add these to Google Console):"
echo "   ✓ https://naukrimili.com/api/auth/callback/google"
echo "   ✓ https://www.naukrimili.com/api/auth/callback/google"
echo "   ✓ http://localhost:3000/api/auth/callback/google (for development)"
echo ""

echo "4️⃣ Checking recent auth errors:"
pm2 logs naukrimili --lines 50 --err | grep -A 5 "invalid_grant"
echo ""

echo "5️⃣ Testing if the callback endpoint is accessible:"
curl -I "https://naukrimili.com/api/auth/callback/google" 2>&1 | head -5
echo ""

echo "📋 REQUIRED ACTIONS:"
echo "===================="
echo ""
echo "Go to Google Cloud Console:"
echo "https://console.cloud.google.com/apis/credentials"
echo ""
echo "For your OAuth 2.0 Client ID (248670675129...):"
echo ""
echo "1. Click on the client ID"
echo "2. Under 'Authorized redirect URIs', ensure these are added:"
echo "   • https://naukrimili.com/api/auth/callback/google"
echo "   • https://www.naukrimili.com/api/auth/callback/google"
echo ""
echo "3. Under OAuth consent screen:"
echo "   • Publishing status should be 'In production' OR"
echo "   • If 'Testing', add your test user emails"
echo ""
echo "4. Save changes and wait 5 minutes for Google to propagate"
echo ""

