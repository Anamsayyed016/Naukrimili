#!/bin/bash

# Server Database Cleanup Script
# This script clears all users and related data from the production database

echo "🗑️  Starting server database cleanup..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Check if Prisma is available
if ! command -v npx &> /dev/null; then
    echo "❌ Error: npx is not available. Please install Node.js"
    exit 1
fi

echo "📝 Clearing all users and related data..."

# Run the database cleanup using Prisma
npx prisma db execute --file ./scripts/clear-database.sql

if [ $? -eq 0 ]; then
    echo "✅ Server database cleanup completed successfully!"
    echo "🎉 Database is now clean and ready for fresh users!"
else
    echo "❌ Database cleanup failed!"
    exit 1
fi

echo "✨ Server cleanup completed!"
