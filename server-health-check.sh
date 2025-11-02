#!/bin/bash
# Comprehensive Server Health Check for NaukriMili
# Run this on your Linux server: bash server-health-check.sh

echo "════════════════════════════════════════════════════════"
echo "🔍 NAUKRIMILI SERVER HEALTH CHECK"
echo "════════════════════════════════════════════════════════"
echo ""

# 1. Check Git Status
echo "📁 1. GIT STATUS:"
echo "────────────────────────────────────────────────────────"
git status
echo ""

# 2. Check Recent Commits
echo "📝 2. RECENT COMMITS (Last 5):"
echo "────────────────────────────────────────────────────────"
git log --oneline -5
echo ""

# 3. Check if synced with GitHub
echo "🔄 3. SYNC STATUS WITH GITHUB:"
echo "────────────────────────────────────────────────────────"
git fetch origin
BEHIND=$(git rev-list HEAD..origin/main --count)
AHEAD=$(git rev-list origin/main..HEAD --count)
echo "Commits behind remote: $BEHIND"
echo "Commits ahead of remote: $AHEAD"
if [ $BEHIND -eq 0 ] && [ $AHEAD -eq 0 ]; then
    echo "✅ Fully synced with GitHub"
else
    echo "⚠️ Not fully synced"
fi
echo ""

# 4. Check PM2 Status
echo "🚀 4. PM2 APPLICATION STATUS:"
echo "────────────────────────────────────────────────────────"
pm2 status
echo ""

# 5. Check Application Health
echo "💚 5. APPLICATION HEALTH:"
echo "────────────────────────────────────────────────────────"
HEALTH=$(curl -s http://localhost:3000/api/health 2>/dev/null)
if [ $? -eq 0 ]; then
    echo "✅ Application is responding"
    echo "$HEALTH" | head -3
else
    echo "❌ Application not responding"
fi
echo ""

# 6. Check Database Health
echo "🗄️  6. DATABASE HEALTH:"
echo "────────────────────────────────────────────────────────"
DB_HEALTH=$(curl -s http://localhost:3000/api/health/database 2>/dev/null)
if [ $? -eq 0 ]; then
    echo "✅ Database is responding"
    echo "$DB_HEALTH" | head -3
else
    echo "❌ Database not responding"
fi
echo ""

# 7. Check Last Build
echo "🏗️  7. LAST BUILD STATUS:"
echo "────────────────────────────────────────────────────────"
if [ -f .next/BUILD_ID ]; then
    echo "✅ Build directory exists"
    echo "Build ID: $(cat .next/BUILD_ID)"
else
    echo "❌ No build directory found"
fi
echo ""

# 8. Check Environment File
echo "⚙️  8. ENVIRONMENT CONFIGURATION:"
echo "────────────────────────────────────────────────────────"
if [ -f .env ]; then
    echo "✅ .env file exists"
    echo "Environment variables configured: $(grep -c "=" .env)"
else
    echo "❌ .env file missing!"
fi
echo ""

# 9. Check Disk Space
echo "💾 9. DISK SPACE:"
echo "────────────────────────────────────────────────────────"
df -h . | tail -1
echo ""

# 10. Check Recent Logs
echo "📋 10. RECENT ERRORS (Last 5):"
echo "────────────────────────────────────────────────────────"
pm2 logs naukrimili --lines 5 --nostream 2>/dev/null || echo "No recent logs"
echo ""

echo "════════════════════════════════════════════════════════"
echo "✅ HEALTH CHECK COMPLETE"
echo "════════════════════════════════════════════════════════"

