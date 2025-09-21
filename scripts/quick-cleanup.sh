#!/bin/bash

# Quick User Cleanup Script for Testing Notifications
# This script provides safe commands to clean up test users

echo "🧹 Quick User Cleanup for Notification Testing"
echo "=============================================="
echo ""

# Function to run Prisma commands
run_prisma() {
    echo "📋 Running: $1"
    npx prisma db execute --stdin <<< "$1"
    echo ""
}

# Check current users
echo "1. 📋 Checking current users..."
run_prisma "SELECT id, email, name, role, \"createdAt\" FROM \"User\" ORDER BY \"createdAt\" DESC LIMIT 10;"

# Check notifications
echo "2. 📬 Checking current notifications..."
run_prisma "SELECT COUNT(*) as notification_count FROM \"Notification\";"

# Check sessions
echo "3. 🔐 Checking current sessions..."
run_prisma "SELECT COUNT(*) as session_count FROM \"Session\";"

echo "4. 🗑️  Ready to clean up test users..."
echo ""
echo "To proceed with cleanup, run one of these commands:"
echo ""
echo "Option A - Use the Node.js script (RECOMMENDED):"
echo "   node scripts/safe-user-cleanup.js"
echo ""
echo "Option B - Manual SQL cleanup (ADVANCED):"
echo "   npx prisma db execute --stdin < scripts/cleanup-test-users.sql"
echo ""
echo "Option C - Quick manual cleanup (CAREFUL):"
echo "   npx prisma db execute --stdin <<< \"DELETE FROM \\\"Notification\\\"; DELETE FROM \\\"Session\\\"; DELETE FROM \\\"Account\\\"; DELETE FROM \\\"User\\\" WHERE email LIKE '%test%' OR email LIKE '%gmail%' OR email LIKE '%yahoo%' OR email LIKE '%outlook%' OR email LIKE '%hotmail%';\""
echo ""
echo "⚠️  IMPORTANT: Make sure you have a backup if you have important data!"
echo ""
echo "After cleanup, you can test notifications by:"
echo "1. Signing up with a new Google account"
echo "2. Checking the notification bell in the UI"
echo "3. Using the test notification API: /api/test-notification"
echo "4. Visiting /mobile-test page for comprehensive testing"
