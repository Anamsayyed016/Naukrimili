#!/bin/bash

# Script to fix Gmail email sending and test the complete flow
# This will delete the test user, rebuild, restart, and prepare for fresh testing

echo "🔧 Gmail Email Flow Fix Script"
echo "================================"
echo ""

echo "📋 Step 1: Checking current user in database..."
sudo -u postgres psql -d naukrimili -c "SELECT id, email, role, \"roleLocked\", \"firstName\", \"lastName\" FROM \"User\" WHERE email = 'anamsayyed58@gmail.com';"

echo ""
echo "🗑️ Step 2: Deleting existing user and related data..."
sudo -u postgres psql -d naukrimili -c "DELETE FROM \"Account\" WHERE \"userId\" IN (SELECT id FROM \"User\" WHERE email = 'anamsayyed58@gmail.com');"
sudo -u postgres psql -d naukrimili -c "DELETE FROM \"Session\" WHERE \"userId\" IN (SELECT id FROM \"User\" WHERE email = 'anamsayyed58@gmail.com');"
sudo -u postgres psql -d naukrimili -c "DELETE FROM \"Notification\" WHERE \"userId\" IN (SELECT id FROM \"User\" WHERE email = 'anamsayyed58@gmail.com');"
sudo -u postgres psql -d naukrimili -c "DELETE FROM \"User\" WHERE email = 'anamsayyed58@gmail.com';"

echo ""
echo "✅ User and related data deleted. Verifying..."
sudo -u postgres psql -d naukrimili -c "SELECT COUNT(*) as user_count FROM \"User\" WHERE email = 'anamsayyed58@gmail.com';"

echo ""
echo "📦 Step 3: Rebuilding application..."
npm run build

echo ""
echo "🔄 Step 4: Restarting PM2..."
pm2 restart naukrimili

echo ""
echo "💾 Step 5: Saving PM2 configuration..."
pm2 save

echo ""
echo "📊 Step 6: Checking PM2 status..."
pm2 status

echo ""
echo "✅ Fix complete!"
echo ""
echo "📝 Next Steps:"
echo "1. Wait 5 seconds for the app to fully start"
echo "2. Clear your browser cache and cookies"
echo "3. Visit https://naukrimili.com"
echo "4. Sign in with Google using anamsayyed58@gmail.com"
echo "5. Watch the logs: pm2 logs naukrimili --lines 100"
echo ""
echo "Expected logs on new user creation:"
echo "  - 🎉 Custom adapter createUser called for: anamsayyed58@gmail.com"
echo "  - ✅ User created in database: [id] anamsayyed58@gmail.com"
echo "  - 🔔 Creating welcome notification for new user"
echo "  - 📧 Triggering welcome email for: anamsayyed58@gmail.com"
echo "  - ✅ Gmail OAuth2 service initialized successfully"
echo "  - ✅ Email sent successfully via Gmail API"
echo ""

