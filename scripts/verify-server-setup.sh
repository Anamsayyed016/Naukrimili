#!/bin/bash

# Server Verification Script
# Run this after deployment to verify everything is configured correctly

set -e

echo "🔍 Verifying Server Setup..."
echo "============================"
echo ""

# Check if .env file exists and has OAuth credentials
echo "📋 Step 1: Checking .env file..."
if [ -f ".env" ]; then
    echo "✅ .env file exists"
    
    if grep -q "GOOGLE_CLIENT_ID=" .env; then
        echo "✅ GOOGLE_CLIENT_ID found in .env"
    else
        echo "❌ GOOGLE_CLIENT_ID NOT found in .env"
        echo "   Add it: echo 'GOOGLE_CLIENT_ID=your_id' >> .env"
    fi
    
    if grep -q "GOOGLE_CLIENT_SECRET=" .env; then
        echo "✅ GOOGLE_CLIENT_SECRET found in .env"
    else
        echo "❌ GOOGLE_CLIENT_SECRET NOT found in .env"
        echo "   Add it: echo 'GOOGLE_CLIENT_SECRET=your_secret' >> .env"
    fi
else
    echo "❌ .env file NOT found"
fi

echo ""
echo "📋 Step 2: Checking PM2 process..."
if pm2 list | grep -q "naukrimili.*online"; then
    echo "✅ PM2 process is online"
else
    echo "❌ PM2 process is NOT online"
    pm2 list
fi

echo ""
echo "📋 Step 3: Checking database connection..."
if [ -n "$DATABASE_URL" ]; then
    echo "✅ DATABASE_URL is set"
    # Extract user from DATABASE_URL for testing
    DB_USER=$(echo "$DATABASE_URL" | sed -n 's|postgresql://\([^:]*\):.*|\1|p')
    if [ -n "$DB_USER" ]; then
        echo "   Database user: $DB_USER"
        # Try to connect
        if command -v psql &> /dev/null; then
            DB_HOST=$(echo "$DATABASE_URL" | sed -n 's/.*@\([^:/]*\).*/\1/p')
            DB_PORT=$(echo "$DATABASE_URL" | sed -n 's/.*:\([0-9]*\)\/.*/\1/p' || echo "5432")
            DB_NAME=$(echo "$DATABASE_URL" | sed -n 's|.*/\([^?]*\).*|\1|p')
            
            if timeout 5 psql -h "$DB_HOST" -p "${DB_PORT:-5432}" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1;" > /dev/null 2>&1; then
                echo "✅ Database connection successful"
            else
                echo "⚠️  Database connection test failed (user might not exist)"
                echo "   Run init-database.sh or create user manually"
            fi
        fi
    fi
else
    echo "⚠️  DATABASE_URL not set in environment"
fi

echo ""
echo "📋 Step 4: Checking application logs for OAuth configuration..."
echo "   (Checking last 20 lines of PM2 logs for Google OAuth messages)"
pm2 logs naukrimili --lines 20 --nostream 2>/dev/null | grep -i "google\|oauth" | tail -5 || echo "   No OAuth messages found in recent logs"

echo ""
echo "✅ Verification complete!"
echo ""
echo "Next steps if issues found:"
echo "1. If OAuth credentials missing: Add them to .env file"
echo "2. If database user missing: Run scripts/init-database.sh"
echo "3. If PM2 not running: pm2 restart naukrimili --update-env"

