#!/bin/bash

# Database Initialization Script for Production Deployment
# This script ensures database user and database exist before migrations

set -e

echo "🗄️ Initializing production database..."

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL environment variable is not set"
    exit 1
fi

# Parse DATABASE_URL to extract components
# Format: postgresql://username:password@host:port/database?params
DB_URL="$DATABASE_URL"

# Extract database host (default to localhost if not specified)
DB_HOST=$(echo "$DB_URL" | sed -n 's/.*@\([^:/]*\).*/\1/p')
if [ -z "$DB_HOST" ] || [ "$DB_HOST" = "$DB_URL" ]; then
    DB_HOST="localhost"
fi

# Extract database port (default to 5432)
DB_PORT=$(echo "$DB_URL" | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
if [ -z "$DB_PORT" ] || [ "$DB_PORT" = "$DB_URL" ]; then
    DB_PORT="5432"
fi

# Extract username
DB_USER=$(echo "$DB_URL" | sed -n 's|postgresql://\([^:]*\):.*|\1|p')
if [ -z "$DB_USER" ]; then
    echo "❌ Could not extract username from DATABASE_URL"
    exit 1
fi

# Extract password
DB_PASSWORD=$(echo "$DB_URL" | sed -n 's|postgresql://[^:]*:\([^@]*\)@.*|\1|p')
if [ -z "$DB_PASSWORD" ]; then
    echo "❌ Could not extract password from DATABASE_URL"
    exit 1
fi

# Extract database name
DB_NAME=$(echo "$DB_URL" | sed -n 's|.*/\([^?]*\).*|\1|p')
if [ -z "$DB_NAME" ]; then
    echo "❌ Could not extract database name from DATABASE_URL"
    exit 1
fi

echo "📋 Database configuration:"
echo "   Host: $DB_HOST"
echo "   Port: $DB_PORT"
echo "   User: $DB_USER"
echo "   Database: $DB_NAME"

# Check if PostgreSQL is accessible
echo ""
echo "🔍 Checking PostgreSQL connection..."
if ! command -v pg_isready &> /dev/null; then
    echo "⚠️  pg_isready not found, skipping connection check"
else
    if ! pg_isready -h "$DB_HOST" -p "$DB_PORT" > /dev/null 2>&1; then
        echo "❌ PostgreSQL is not accessible at $DB_HOST:$DB_PORT"
        echo "   Make sure PostgreSQL is running and accessible"
        exit 1
    fi
    echo "✅ PostgreSQL is accessible"
fi

# Try to connect as postgres superuser to create user/database if needed
# This requires that the postgres user can connect (usually via local socket)
if [ "$DB_HOST" = "localhost" ] || [ "$DB_HOST" = "127.0.0.1" ]; then
    echo ""
    echo "🔧 Checking if database user exists..."
    
    # Check if user exists (using postgres superuser)
    USER_EXISTS=$(sudo -u postgres psql -tAc "SELECT 1 FROM pg_roles WHERE rolname='$DB_USER'" 2>/dev/null || echo "")
    
    if [ -z "$USER_EXISTS" ]; then
        echo "👤 Creating database user: $DB_USER"
        # Escape password for SQL
        ESCAPED_PASSWORD=$(echo "$DB_PASSWORD" | sed "s/'/''/g")
        sudo -u postgres psql -c "CREATE ROLE $DB_USER WITH LOGIN PASSWORD '$ESCAPED_PASSWORD';" 2>/dev/null || {
            echo "⚠️  Failed to create user (may already exist or insufficient permissions)"
        }
    else
        echo "✅ Database user already exists"
        # Update password in case it changed
        ESCAPED_PASSWORD=$(echo "$DB_PASSWORD" | sed "s/'/''/g")
        sudo -u postgres psql -c "ALTER ROLE $DB_USER WITH PASSWORD '$ESCAPED_PASSWORD';" 2>/dev/null || true
    fi
    
    echo ""
    echo "🔧 Checking if database exists..."
    
    # Check if database exists
    DB_EXISTS=$(sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname='$DB_NAME'" 2>/dev/null || echo "")
    
    if [ -z "$DB_EXISTS" ]; then
        echo "💾 Creating database: $DB_NAME"
        sudo -u postgres psql -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;" 2>/dev/null || {
            echo "⚠️  Failed to create database (may already exist or insufficient permissions)"
        }
    else
        echo "✅ Database already exists"
    fi
    
    # Grant privileges
    echo ""
    echo "🔐 Setting up database permissions..."
    sudo -u postgres psql -d "$DB_NAME" -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;" 2>/dev/null || true
    sudo -u postgres psql -d "$DB_NAME" -c "GRANT ALL ON SCHEMA public TO $DB_USER;" 2>/dev/null || true
    
    echo "✅ Database initialization complete"
else
    echo ""
    echo "⚠️  Remote database host detected ($DB_HOST)"
    echo "   Skipping automatic user/database creation"
    echo "   Please ensure user and database exist manually"
    echo ""
    echo "   To create manually, connect as superuser and run:"
    echo "   CREATE ROLE $DB_USER WITH LOGIN PASSWORD '<password>';"
    echo "   CREATE DATABASE $DB_NAME OWNER $DB_USER;"
    echo "   GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"
fi

echo ""
echo "✅ Database initialization script completed"
echo "   You can now run migrations with: npx prisma migrate deploy"
