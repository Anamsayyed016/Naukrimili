#!/bin/bash

echo "🏢 Job Portal Database Setup"
echo "================================"
echo

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "⚠️  .env.local file not found!"
    echo
    echo "Please create .env.local with your database credentials first:"
    echo "1. Copy env.template to .env.local"
    echo "2. Update DATABASE_URL with your actual database credentials"
    echo "3. Make sure your database is running"
    echo
    read -p "Press Enter to continue after creating .env.local..."
    exit 1
fi

echo "🔍 Checking database connection..."
echo

# Generate Prisma client
echo "📦 Generating Prisma client..."
npx prisma generate
if [ $? -ne 0 ]; then
    echo "❌ Failed to generate Prisma client"
    exit 1
fi

# Push schema to database
echo
echo "🗄️ Pushing schema to database..."
npx prisma db push
if [ $? -ne 0 ]; then
    echo "❌ Failed to push schema to database"
    echo
    echo "Common issues:"
    echo "- Check if PostgreSQL is running"
    echo "- Verify DATABASE_URL in .env.local"
    echo "- Ensure database user has proper permissions"
    echo
    exit 1
fi

echo
echo "✅ Database setup completed successfully!"
echo

# Run integrity check
echo "🧪 Running integrity check..."
node scripts/check-database-integrity.js

echo
echo "🎉 Setup complete! Your database is ready to use."
