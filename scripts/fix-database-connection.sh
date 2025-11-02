#!/bin/bash

# Database Connection Fix Script
# Run this on your server to optimize database connection

echo "🔧 Database Connection Optimizer"
echo "================================"
echo ""

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL not set!"
    echo ""
    echo "Please set it in your .env file or export it:"
    echo "export DATABASE_URL='postgresql://user:pass@host:5432/dbname?connection_limit=10&pool_timeout=20'"
    exit 1
fi

echo "✅ DATABASE_URL is set"
echo ""

# Check if it has connection pooling parameters
if [[ $DATABASE_URL == *"connection_limit"* ]]; then
    echo "✅ Connection pooling is configured"
else
    echo "⚠️  Connection pooling NOT configured"
    echo ""
    echo "Add these parameters to your DATABASE_URL:"
    echo "?connection_limit=10&pool_timeout=20&connect_timeout=10&socket_timeout=30"
    echo ""
fi

# Test database connection
echo "🔍 Testing database connection..."
node scripts/check-database.js

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Database connection is healthy!"
    echo ""
    echo "Next steps:"
    echo "1. Restart your application: pm2 restart naukrimili --update-env"
    echo "2. Monitor health: curl http://localhost:3000/api/health/database"
else
    echo ""
    echo "❌ Database connection failed!"
    echo ""
    echo "Fix checklist:"
    echo "□ Check PostgreSQL service: systemctl status postgresql (or service postgresql status)"
    echo "□ Verify credentials in DATABASE_URL"
    echo "□ Check if database exists"
    echo "□ Test connection manually: psql -U username -d database -h host"
    echo "□ Check firewall rules"
fi

