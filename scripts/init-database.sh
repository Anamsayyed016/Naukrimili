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
    echo "   Skipping automatic user/database creation (requires superuser access)"
    echo ""
    echo "   CRITICAL: Ensure user and database exist before running migrations!"
    echo ""
    echo "   To verify/create manually, connect as superuser and run:"
    echo "   -- Check if user exists:"
    echo "   SELECT 1 FROM pg_roles WHERE rolname='$DB_USER';"
    echo ""
    echo "   -- If user doesn't exist, create it:"
    echo "   CREATE ROLE $DB_USER WITH LOGIN PASSWORD '<password>';"
    echo ""
    echo "   -- Check if database exists:"
    echo "   SELECT 1 FROM pg_database WHERE datname='$DB_NAME';"
    echo ""
    echo "   -- If database doesn't exist, create it:"
    echo "   CREATE DATABASE $DB_NAME OWNER $DB_USER;"
    echo ""
    echo "   -- Grant privileges:"
    echo "   GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"
    echo "   \\c $DB_NAME"
    echo "   GRANT ALL ON SCHEMA public TO $DB_USER;"
    echo ""
    echo "   Attempting to verify connection with provided credentials..."
    
    # Try to connect with provided credentials to verify they work
    echo ""
    echo "🔍 Testing database connection with provided credentials..."
    
    if command -v psql &> /dev/null; then
        # Extract connection parts for psql (handle URL-encoded passwords)
        if echo "$DATABASE_URL" | grep -qE "^postgresql://|^postgres://"; then
            # Try to connect with explicit connection parameters (more reliable than URL string)
            # Use PGPASSWORD environment variable for password (avoids URL encoding issues)
            export PGPASSWORD="$DB_PASSWORD"
            
            # Build psql connection string
            PSQL_CONN="host=$DB_HOST port=$DB_PORT user=$DB_USER dbname=$DB_NAME"
            
            # Test connection with timeout (fail fast if user doesn't exist)
            CONNECTION_TEST=$(timeout 10 psql "$PSQL_CONN" -c "SELECT version();" 2>&1)
            CONNECTION_EXIT_CODE=$?
            unset PGPASSWORD
            
            if [ $CONNECTION_EXIT_CODE -eq 0 ]; then
                echo "   ✅ Connection test successful - user and database are accessible"
            else
                echo "   ❌ Connection test FAILED (exit code: $CONNECTION_EXIT_CODE)"
                echo "   Connection error output:"
                echo "$CONNECTION_TEST" | head -10
                echo ""
                echo "   This means either:"
                echo "     1. The database user '$DB_USER' does not exist"
                echo "     2. The password is incorrect"
                echo "     3. The database '$DB_NAME' does not exist"
                echo "     4. The database server is not accessible"
                echo "     5. Network/firewall restrictions"
                echo ""
                echo "   ACTION REQUIRED: Fix the database configuration before proceeding"
                echo ""
                echo "   To create the user manually (requires superuser access):"
                echo "   psql -h $DB_HOST -p $DB_PORT -U postgres -c \"CREATE ROLE $DB_USER WITH LOGIN PASSWORD '***';\""
                echo "   psql -h $DB_HOST -p $DB_PORT -U postgres -c \"CREATE DATABASE $DB_NAME OWNER $DB_USER;\""
                echo "   psql -h $DB_HOST -p $DB_PORT -U postgres -d $DB_NAME -c \"GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;\""
                exit 1
            fi
        else
            echo "   ⚠️  DATABASE_URL format not recognized, skipping connection test"
            echo "   Expected format: postgresql://user:password@host:port/database"
        fi
    else
        echo "   ⚠️  psql command not found, skipping connection test"
        echo "   WARNING: Cannot verify database connection without psql"
        echo "   Make sure user '$DB_USER' and database '$DB_NAME' exist before proceeding"
    fi
fi

echo ""
echo "✅ Database initialization script completed"
echo "   You can now run migrations with: npx prisma migrate deploy"
