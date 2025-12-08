#!/bin/bash
# Helper script to extract database connection details from DATABASE_URL
# Usage: Run on server to get connection details for manual user creation

echo "🔍 Database Connection Details Extractor"
echo "=========================================="
echo ""

# Check if DATABASE_URL is in environment or .env file
if [ -n "$DATABASE_URL" ]; then
    DB_URL="$DATABASE_URL"
elif [ -f ".env" ]; then
    DB_URL=$(grep "^DATABASE_URL=" .env | cut -d'=' -f2- | tr -d '"' | tr -d "'" | head -1)
fi

if [ -z "$DB_URL" ]; then
    echo "❌ DATABASE_URL not found in environment or .env file"
    echo ""
    echo "Please provide your DATABASE_URL in one of these formats:"
    echo "  export DATABASE_URL='postgresql://user:password@host:port/database'"
    echo "  OR check your .env file"
    exit 1
fi

echo "📋 Found DATABASE_URL (password masked):"
echo "${DB_URL//:*@/:***@}"
echo ""

# Extract components
DB_USER=$(echo "$DB_URL" | sed -n 's|postgresql://\([^:]*\):.*|\1|p')
DB_PASSWORD_RAW=$(echo "$DB_URL" | sed -n 's|postgresql://[^:]*:\([^@]*\)@.*|\1|p')
DB_PASSWORD=$(echo "$DB_PASSWORD_RAW" | sed 's/%40/@/g; s/%3A/:/g; s/%2F/\//g; s/%3F/?/g; s/%23/#/g; s/%25/%/g; s/%26/\&/g')
DB_HOST=$(echo "$DB_URL" | sed -n 's/.*@\([^:/]*\).*/\1/p')
DB_PORT=$(echo "$DB_URL" | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
DB_NAME=$(echo "$DB_URL" | sed -n 's|.*/\([^?]*\).*|\1|p')

# Defaults
[ -z "$DB_HOST" ] && DB_HOST="localhost"
[ -z "$DB_PORT" ] && DB_PORT="5432"

echo "📊 Extracted Details:"
echo "   Username: $DB_USER"
echo "   Password: [HIDDEN - from DATABASE_URL]"
echo "   Host: $DB_HOST"
echo "   Port: $DB_PORT"
echo "   Database: $DB_NAME"
echo ""
echo "=========================================="
echo "🔧 STEP-BY-STEP COMMANDS TO CREATE USER:"
echo "=========================================="
echo ""
echo "Step 1: Connect to PostgreSQL as superuser"
if [ "$DB_HOST" = "localhost" ] || [ "$DB_HOST" = "127.0.0.1" ]; then
    echo "   Run: sudo -u postgres psql"
    echo "   OR: psql -U postgres -d postgres"
else
    echo "   Run: psql -h $DB_HOST -p $DB_PORT -U postgres -d postgres"
    echo "   (You may need to enter postgres superuser password)"
fi
echo ""
echo "Step 2: Once connected, run these SQL commands:"
echo ""
echo "CREATE ROLE $DB_USER WITH LOGIN PASSWORD '$DB_PASSWORD';"
echo "CREATE DATABASE $DB_NAME OWNER $DB_USER;"
echo "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"
echo "\\c $DB_NAME"
echo "GRANT ALL ON SCHEMA public TO $DB_USER;"
echo "\\q"
echo ""
