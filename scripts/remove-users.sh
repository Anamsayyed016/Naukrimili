#!/bin/bash

# Server User Removal Script
# Simple wrapper for the comprehensive user management script

echo "🏢 Job Portal - User Management"
echo "================================"
echo ""

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed or not in PATH"
    echo "   Please install Node.js 18+ and try again"
    exit 1
fi

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Please run this script from the project root directory"
    echo "   Current directory: $(pwd)"
    exit 1
fi

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "⚠️  .env.local file not found!"
    echo "   Please ensure your database connection is configured"
    echo "   Continuing anyway..."
fi

echo "🔧 Available user removal options:"
echo ""
echo "1. List all users"
echo "2. Remove test users only (SAFE)"
echo "3. Remove OAuth users only (SAFE)"
echo "4. Remove users by email"
echo "5. Remove users by role"
echo "6. Remove inactive users"
echo "7. Remove ALL users (DANGEROUS!)"
echo "8. Show help"
echo ""

read -p "Select an option (1-8): " choice

case $choice in
    1)
        echo "📋 Listing all users..."
        node scripts/server-user-management.js --list
        ;;
    2)
        echo "🧹 Removing test users..."
        node scripts/server-user-management.js --remove-test
        ;;
    3)
        echo "🔐 Removing OAuth users..."
        node scripts/server-user-management.js --remove-oauth
        ;;
    4)
        read -p "Enter email address: " email
        if [ -n "$email" ]; then
            echo "🗑️  Removing user: $email"
            node scripts/server-user-management.js --remove-by-email "$email"
        else
            echo "❌ No email provided"
        fi
        ;;
    5)
        echo "Available roles: jobseeker, employer, admin"
        read -p "Enter role: " role
        if [ -n "$role" ]; then
            echo "🗑️  Removing users with role: $role"
            node scripts/server-user-management.js --remove-by-role "$role"
        else
            echo "❌ No role provided"
        fi
        ;;
    6)
        echo "⏰ Removing inactive users..."
        node scripts/server-user-management.js --remove-inactive
        ;;
    7)
        echo "⚠️  WARNING: This will remove ALL users and data!"
        read -p "Type 'DELETE ALL' to confirm: " confirm
        if [ "$confirm" = "DELETE ALL" ]; then
            echo "🗑️  Removing all users..."
            node scripts/server-user-management.js --remove-all
        else
            echo "❌ Operation cancelled"
        fi
        ;;
    8)
        node scripts/server-user-management.js --help
        ;;
    *)
        echo "❌ Invalid option"
        exit 1
        ;;
esac

echo ""
echo "✅ Script completed"
