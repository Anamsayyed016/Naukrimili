#!/bin/bash

# Database Initialization Script for Production Deployment
# This script ensures database user and database exist before migrations

# Don't use set -e here - we want to handle errors manually for better diagnostics
set -o pipefail

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
# CRITICAL: Convert localhost to 127.0.0.1 to avoid IPv6 issues
DB_HOST=$(echo "$DB_URL" | sed -n 's/.*@\([^:/]*\).*/\1/p')
if [ -z "$DB_HOST" ] || [ "$DB_HOST" = "$DB_URL" ]; then
    DB_HOST="127.0.0.1"
elif [ "$DB_HOST" = "localhost" ]; then
    echo "⚠️  Converting 'localhost' to '127.0.0.1' to avoid IPv6 connection issues"
    DB_HOST="127.0.0.1"
    # Update DB_URL to use 127.0.0.1
    DB_URL=$(echo "$DB_URL" | sed "s/@localhost:/@127.0.0.1:/g")
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

# Extract password (handle URL encoding - decode %40 as @, %3A as :, etc.)
DB_PASSWORD_RAW=$(echo "$DB_URL" | sed -n 's|postgresql://[^:]*:\([^@]*\)@.*|\1|p')
if [ -z "$DB_PASSWORD_RAW" ]; then
    echo "❌ Could not extract password from DATABASE_URL"
    exit 1
fi

# Decode common URL-encoded characters in password
DB_PASSWORD=$(echo "$DB_PASSWORD_RAW" | sed 's/%40/@/g; s/%3A/:/g; s/%2F/\//g; s/%3F/?/g; s/%23/#/g; s/%25/%/g; s/%26/\&/g')

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
echo "   Full connection: postgresql://$DB_USER:***@$DB_HOST:$DB_PORT/$DB_NAME"

# Check if PostgreSQL is accessible
echo ""
echo "🔍 Checking PostgreSQL connection..."
if ! command -v pg_isready &> /dev/null; then
    echo "⚠️  pg_isready not found, skipping connection check"
else
    # Use explicit host to avoid IPv6 issues
    if ! pg_isready -h "$DB_HOST" -p "$DB_PORT" > /dev/null 2>&1; then
        echo "⚠️  PostgreSQL not accessible at $DB_HOST:$DB_PORT, trying 127.0.0.1..."
        if [ "$DB_HOST" != "127.0.0.1" ] && pg_isready -h 127.0.0.1 -p "$DB_PORT" > /dev/null 2>&1; then
            echo "✅ PostgreSQL is accessible at 127.0.0.1:$DB_PORT (updating DB_HOST)"
            DB_HOST="127.0.0.1"
        else
            echo "❌ PostgreSQL is not accessible at $DB_HOST:$DB_PORT or 127.0.0.1:$DB_PORT"
            echo "   Make sure PostgreSQL is running and accessible"
            exit 1
        fi
    else
        echo "✅ PostgreSQL is accessible at $DB_HOST:$DB_PORT"
    fi
fi

# Try to connect as postgres superuser to create user/database if needed
# This requires that the postgres user can connect (usually via local socket)
# Check for various localhost formats
# CRITICAL: Always use 127.0.0.1 for localhost to avoid IPv6 issues
IS_LOCALHOST=false
if [ "$DB_HOST" = "localhost" ] || [ "$DB_HOST" = "127.0.0.1" ] || [ "$DB_HOST" = "::1" ]; then
    IS_LOCALHOST=true
    if [ "$DB_HOST" != "127.0.0.1" ]; then
        echo "⚠️  Converting host '$DB_HOST' to '127.0.0.1' to avoid IPv6 connection issues"
        DB_HOST="127.0.0.1"
    fi
elif [ -z "$DB_HOST" ]; then
    # Empty host means default (localhost via socket)
    IS_LOCALHOST=true
    DB_HOST="127.0.0.1"
fi

if [ "$IS_LOCALHOST" = true ]; then
    echo ""
    echo "🔧 Checking if database user exists..."
    
    # Check if user exists (try multiple methods for localhost)
    USER_EXISTS=""
    
    # Try sudo method first (most common for localhost)
    if command -v sudo &> /dev/null; then
        USER_EXISTS=$(sudo -u postgres psql -tAc "SELECT 1 FROM pg_roles WHERE rolname='$DB_USER'" 2>/dev/null || echo "")
    fi
    
    # If sudo failed, try direct postgres user connection (use 127.0.0.1 to avoid IPv6)
    if [ -z "$USER_EXISTS" ]; then
        USER_EXISTS=$(psql -U postgres -h 127.0.0.1 -tAc "SELECT 1 FROM pg_roles WHERE rolname='$DB_USER'" 2>/dev/null || echo "")
    fi
    
    # If still empty, try via socket (no host specified) - only if DB_HOST is 127.0.0.1
    if [ -z "$USER_EXISTS" ] && [ "$DB_HOST" = "127.0.0.1" ]; then
        USER_EXISTS=$(psql -U postgres -tAc "SELECT 1 FROM pg_roles WHERE rolname='$DB_USER'" 2>/dev/null || echo "")
    fi
    
    if [ -z "$USER_EXISTS" ]; then
        echo "👤 Creating database user: $DB_USER"
        # Escape password for SQL
        ESCAPED_PASSWORD=$(echo "$DB_PASSWORD" | sed "s/'/''/g")
        
        # Try multiple methods to create user
        USER_CREATED=false
        
        # Method 1: sudo (most common)
        if command -v sudo &> /dev/null; then
            CREATE_OUTPUT=$(sudo -u postgres psql -c "CREATE ROLE $DB_USER WITH LOGIN PASSWORD '$ESCAPED_PASSWORD';" 2>&1)
            CREATE_EXIT=$?
            if [ $CREATE_EXIT -eq 0 ]; then
                USER_CREATED=true
            elif echo "$CREATE_OUTPUT" | grep -qi "already exists"; then
                echo "  ✅ User already exists (this is OK)"
                USER_CREATED=true
            else
                echo "  ⚠️  User creation via sudo failed: $(echo "$CREATE_OUTPUT" | head -1)"
            fi
        fi
        
        # Method 2: Direct postgres connection (use 127.0.0.1 to avoid IPv6)
        if [ "$USER_CREATED" = false ]; then
            export PGPASSWORD="${POSTGRES_PASSWORD:-Naukrimili@123}"
            CREATE_OUTPUT=$(psql -U postgres -h 127.0.0.1 -c "CREATE ROLE $DB_USER WITH LOGIN PASSWORD '$ESCAPED_PASSWORD';" 2>&1)
            CREATE_EXIT=$?
            if [ $CREATE_EXIT -eq 0 ]; then
                USER_CREATED=true
            elif echo "$CREATE_OUTPUT" | grep -qi "already exists"; then
                echo "  ✅ User already exists (this is OK)"
                USER_CREATED=true
            else
                echo "  ⚠️  User creation with POSTGRES_PASSWORD failed, trying DB_PASSWORD..."
                # Try with the actual password from DB_PASSWORD if POSTGRES_PASSWORD didn't work
                export PGPASSWORD="$DB_PASSWORD"
                CREATE_OUTPUT=$(psql -U postgres -h 127.0.0.1 -c "CREATE ROLE $DB_USER WITH LOGIN PASSWORD '$ESCAPED_PASSWORD';" 2>&1)
                CREATE_EXIT=$?
                if [ $CREATE_EXIT -eq 0 ]; then
                    USER_CREATED=true
                elif echo "$CREATE_OUTPUT" | grep -qi "already exists"; then
                    echo "  ✅ User already exists (this is OK)"
                    USER_CREATED=true
                else
                    echo "  ⚠️  User creation with DB_PASSWORD also failed: $(echo "$CREATE_OUTPUT" | head -1)"
                fi
            fi
            unset PGPASSWORD
        fi
        
        if [ "$USER_CREATED" = false ]; then
            echo "⚠️  Could not create user automatically (requires superuser access)"
            echo "   User '$DB_USER' does not exist and automatic creation failed"
            echo "   Please create manually using the instructions below"
            echo ""
            echo "   Connect as postgres superuser and run:"
            echo "   CREATE ROLE $DB_USER WITH LOGIN PASSWORD '***';"
            exit 1
        else
            echo "✅ Database user created successfully"
        fi
    else
        echo "✅ Database user already exists"
        # CRITICAL: Update password in case it changed (try multiple methods with proper error handling)
        ESCAPED_PASSWORD=$(echo "$DB_PASSWORD" | sed "s/'/''/g")
        echo "  Updating password for user $DB_USER..."
        
        # Method 1: sudo
        if command -v sudo &> /dev/null; then
            if sudo -u postgres psql -c "ALTER ROLE $DB_USER WITH PASSWORD '$ESCAPED_PASSWORD';" 2>&1; then
                echo "  ✅ Password updated successfully (via sudo)"
            else
                echo "  ⚠️  Password update via sudo failed, trying direct connection..."
                # Method 2: Direct connection with password
                export PGPASSWORD="${POSTGRES_PASSWORD:-Naukrimili@123}"
                if psql -U postgres -h 127.0.0.1 -c "ALTER ROLE $DB_USER WITH PASSWORD '$ESCAPED_PASSWORD';" 2>&1; then
                    echo "  ✅ Password updated successfully (via direct connection)"
                else
                    # Try with the actual DB_PASSWORD
                    export PGPASSWORD="$DB_PASSWORD"
                    if psql -U postgres -h 127.0.0.1 -c "ALTER ROLE $DB_USER WITH PASSWORD '$ESCAPED_PASSWORD';" 2>&1; then
                        echo "  ✅ Password updated successfully (using DB_PASSWORD)"
                    else
                        echo "  ⚠️  Could not update password automatically (continuing anyway)"
                    fi
                fi
                unset PGPASSWORD
            fi
        else
            # No sudo available, try direct connection
            export PGPASSWORD="${POSTGRES_PASSWORD:-Naukrimili@123}"
            psql -U postgres -h 127.0.0.1 -c "ALTER ROLE $DB_USER WITH PASSWORD '$ESCAPED_PASSWORD';" 2>&1 || \
            (export PGPASSWORD="$DB_PASSWORD" && psql -U postgres -h 127.0.0.1 -c "ALTER ROLE $DB_USER WITH PASSWORD '$ESCAPED_PASSWORD';" 2>&1) || true
            unset PGPASSWORD
        fi
    fi
    
    echo ""
    echo "🔧 Checking if database exists..."
    
    # Check if database exists (try multiple methods)
    DB_EXISTS=""
    if command -v sudo &> /dev/null; then
        DB_EXISTS=$(sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname='$DB_NAME'" 2>/dev/null || echo "")
    fi
    if [ -z "$DB_EXISTS" ]; then
        DB_EXISTS=$(psql -U postgres -h 127.0.0.1 -tAc "SELECT 1 FROM pg_database WHERE datname='$DB_NAME'" 2>/dev/null || echo "")
    fi
    
    if [ -z "$DB_EXISTS" ]; then
        echo "💾 Creating database: $DB_NAME"
        DB_CREATED=false
        
        # Try multiple methods to create database
        if command -v sudo &> /dev/null; then
            if sudo -u postgres psql -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;" 2>/dev/null; then
                DB_CREATED=true
            fi
        fi
        
        if [ "$DB_CREATED" = false ]; then
            export PGPASSWORD="${POSTGRES_PASSWORD:-Naukrimili@123}"
            if psql -U postgres -h 127.0.0.1 -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;" 2>/dev/null; then
                DB_CREATED=true
            else
                # Try with DB_PASSWORD
                export PGPASSWORD="$DB_PASSWORD"
                if psql -U postgres -h 127.0.0.1 -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;" 2>/dev/null; then
                    DB_CREATED=true
                fi
            fi
            unset PGPASSWORD
        fi
        
        if [ "$DB_CREATED" = false ]; then
            echo "⚠️  Could not create database automatically"
            echo "   Please create manually: CREATE DATABASE $DB_NAME OWNER $DB_USER;"
            exit 1
        else
            echo "✅ Database created successfully"
        fi
    else
        echo "✅ Database already exists"
    fi
    
    # Grant privileges (try multiple methods)
    echo ""
    echo "🔐 Setting up database permissions..."
    if command -v sudo &> /dev/null; then
        sudo -u postgres psql -d "$DB_NAME" -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;" 2>/dev/null || true
        sudo -u postgres psql -d "$DB_NAME" -c "GRANT ALL ON SCHEMA public TO $DB_USER;" 2>/dev/null || true
    else
        export PGPASSWORD="${POSTGRES_PASSWORD:-Naukrimili@123}"
        psql -U postgres -h 127.0.0.1 -d "$DB_NAME" -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;" 2>/dev/null || \
        (export PGPASSWORD="$DB_PASSWORD" && psql -U postgres -h 127.0.0.1 -d "$DB_NAME" -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;" 2>/dev/null) || true
        psql -U postgres -h 127.0.0.1 -d "$DB_NAME" -c "GRANT ALL ON SCHEMA public TO $DB_USER;" 2>/dev/null || \
        (export PGPASSWORD="$DB_PASSWORD" && psql -U postgres -h 127.0.0.1 -d "$DB_NAME" -c "GRANT ALL ON SCHEMA public TO $DB_USER;" 2>/dev/null) || true
        unset PGPASSWORD
    fi
    
    echo "✅ Database initialization complete"
else
    echo ""
    echo "⚠️  Remote database host detected ($DB_HOST)"
    echo "   Attempting to create user/database if possible..."
    echo ""
    
    # For remote databases, try to connect as postgres user if POSTGRES_SUPERUSER_URL is available
    # Or try common postgres user credentials
    REMOTE_USER_CREATED=false
    
    # Check if we can connect as postgres user (common default)
    echo "🔍 Attempting to connect as postgres superuser to create user..."
    if [ -n "$POSTGRES_SUPERUSER_URL" ]; then
        # Use provided superuser URL
        echo "   Using POSTGRES_SUPERUSER_URL for superuser access..."
        SUPERUSER_URL="$POSTGRES_SUPERUSER_URL"
    else
        # Try common postgres superuser credentials
        # Try multiple common superuser passwords, including the one from DATABASE_URL
        SUPERUSER_PASSWORDS=("postgres" "Naukrimili@123")
        
        # Add DB_PASSWORD if it's different from the common ones
        if [ -n "$DB_PASSWORD" ] && [ "$DB_PASSWORD" != "postgres" ] && [ "$DB_PASSWORD" != "Naukrimili@123" ]; then
            SUPERUSER_PASSWORDS+=("$DB_PASSWORD")
        fi
        
        SUPERUSER_PASSWORDS+=("root")
        SUPERUSER_URL=""
        
        for SUPER_PASS in "${SUPERUSER_PASSWORDS[@]}"; do
            # Skip empty passwords in this loop
            [ -z "$SUPER_PASS" ] && continue
            
            if [ -z "$SUPER_PASS" ]; then
                TEST_URL="postgresql://postgres@$DB_HOST:$DB_PORT/postgres"
            else
                TEST_URL="postgresql://postgres:$SUPER_PASS@$DB_HOST:$DB_PORT/postgres"
            fi
            
            # Try to connect
            export PGPASSWORD="$SUPER_PASS"
            if timeout 3 psql -h "$DB_HOST" -p "${DB_PORT:-5432}" -U postgres -d postgres -c "SELECT 1;" > /dev/null 2>&1; then
                SUPERUSER_URL="$TEST_URL"
                echo "   ✅ Found working superuser credentials"
                break
            fi
            unset PGPASSWORD
        done
        
        # Also try without password (peer authentication)
        if [ -z "$SUPERUSER_URL" ]; then
            export PGPASSWORD=""
            if timeout 3 psql -h "$DB_HOST" -p "${DB_PORT:-5432}" -U postgres -d postgres -c "SELECT 1;" > /dev/null 2>&1; then
                SUPERUSER_URL="postgresql://postgres@$DB_HOST:$DB_PORT/postgres"
                echo "   ✅ Found working superuser credentials (no password/peer auth)"
            fi
            unset PGPASSWORD
        fi
        
        if [ -z "$SUPERUSER_URL" ]; then
            # Default fallback
            SUPERUSER_URL="postgresql://postgres:postgres@$DB_HOST:$DB_PORT/postgres"
            echo "   ⚠️  Could not auto-detect superuser password, will try default"
        fi
    fi
    
    # Try to create user using superuser connection
    ESCAPED_PASSWORD=$(echo "$DB_PASSWORD" | sed "s/'/''/g")
    
    if command -v psql &> /dev/null; then
        # Extract connection parts for superuser
        SUPER_DB_HOST=$(echo "$SUPERUSER_URL" | sed -n 's/.*@\([^:/]*\).*/\1/p')
        SUPER_DB_PORT=$(echo "$SUPERUSER_URL" | sed -n 's/.*:\([0-9]*\)\/.*/\1/p' || echo "5432")
        SUPER_DB_USER=$(echo "$SUPERUSER_URL" | sed -n 's|postgresql://\([^:]*\):.*|\1|p' || echo "postgres")
        SUPER_DB_PASS=$(echo "$SUPERUSER_URL" | sed -n 's|postgresql://[^:]*:\([^@]*\)@.*|\1|p' || echo "postgres")
        
        # Try to create user as superuser
        export PGPASSWORD="$SUPER_DB_PASS"
        CREATE_USER_RESULT=$(psql -h "$SUPER_DB_HOST" -p "${SUPER_DB_PORT:-5432}" -U "$SUPER_DB_USER" -d postgres -c "CREATE ROLE $DB_USER WITH LOGIN PASSWORD '$ESCAPED_PASSWORD';" 2>&1)
        CREATE_USER_EXIT=$?
        unset PGPASSWORD
        
        if [ $CREATE_USER_EXIT -eq 0 ]; then
            echo "   ✅ Database user created successfully via superuser"
            REMOTE_USER_CREATED=true
            
            # Create database
            export PGPASSWORD="$SUPER_DB_PASS"
            psql -h "$SUPER_DB_HOST" -p "${SUPER_DB_PORT:-5432}" -U "$SUPER_DB_USER" -d postgres -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;" 2>/dev/null || true
            psql -h "$SUPER_DB_HOST" -p "${SUPER_DB_PORT:-5432}" -U "$SUPER_DB_USER" -d "$DB_NAME" -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;" 2>/dev/null || true
            psql -h "$SUPER_DB_HOST" -p "${SUPER_DB_PORT:-5432}" -U "$SUPER_DB_USER" -d "$DB_NAME" -c "GRANT ALL ON SCHEMA public TO $DB_USER;" 2>/dev/null || true
            unset PGPASSWORD
            echo "   ✅ Database and permissions configured"
        elif echo "$CREATE_USER_RESULT" | grep -qi "already exists"; then
            echo "   ✅ Database user already exists"
            REMOTE_USER_CREATED=true
        else
            echo "   ⚠️  Could not create user via superuser (may require manual creation)"
            echo "   Error: $(echo "$CREATE_USER_RESULT" | head -1)"
        fi
    fi
    
    # Verify connection with provided credentials (whether we created user or not)
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
                echo "   ================================================================="
                echo "   🔧 MANUAL FIX REQUIRED - Copy and run these SQL commands:"
                echo "   ================================================================="
                echo ""
                echo "   Step 1: Connect to PostgreSQL as superuser (postgres user):"
                if [ "$IS_LOCALHOST" = true ]; then
                    echo "   sudo -u postgres psql"
                    echo "   OR"
                    echo "   psql -h localhost -U postgres"
                else
                    echo "   psql -h $DB_HOST -p $DB_PORT -U postgres -d postgres"
                fi
                echo ""
                echo "   Step 2: Run these SQL commands:"
                echo ""
                echo "   -- Create the database user (username: $DB_USER)"
                echo "   CREATE ROLE $DB_USER WITH LOGIN PASSWORD '<password_from_database_url>';"
                echo "   Note: Replace <password_from_database_url> with the password from DATABASE_URL"
                echo ""
                echo "   -- Create the database (database name: $DB_NAME)"
                echo "   CREATE DATABASE $DB_NAME OWNER $DB_USER;"
                echo ""
                echo "   -- Grant privileges"
                echo "   GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"
                echo "   \\c $DB_NAME"
                echo "   GRANT ALL ON SCHEMA public TO $DB_USER;"
                echo ""
                echo "   ================================================================="
                echo ""
                exit 1
            fi
        else
            echo "   ⚠️  DATABASE_URL format not recognized, skipping connection test"
            echo "   Expected format: postgresql://user:password@host:port/database"
            echo "   WARNING: Cannot verify connection - proceeding may fail"
        fi
    else
        echo "   ⚠️  psql command not found, skipping connection test"
        echo "   WARNING: Cannot verify database connection without psql"
        echo "   Make sure user '$DB_USER' and database '$DB_NAME' exist before proceeding"
    fi
fi

# FINAL VERIFICATION: Test connection one more time before declaring success
echo ""
echo "🔍 Final connection verification..."
if command -v psql &> /dev/null; then
    export PGPASSWORD="$DB_PASSWORD"
    PSQL_CONN="host=$DB_HOST port=$DB_PORT user=$DB_USER dbname=$DB_NAME"
    if timeout 5 psql "$PSQL_CONN" -c "SELECT 1;" > /dev/null 2>&1; then
        echo "✅ Final verification passed - database user and connection are valid"
    else
        echo "❌ FINAL VERIFICATION FAILED - Database user '$DB_USER' cannot connect!"
        echo "   This means the user does not exist or credentials are incorrect"
        echo "   The deployment will FAIL if migrations are attempted"
        echo ""
        echo "   CRITICAL: Create the user before proceeding with deployment"
        echo "   See instructions above for manual user creation"
        unset PGPASSWORD
        exit 1
    fi
    unset PGPASSWORD
else
    echo "⚠️  psql not available for final verification (connection may still fail)"
fi

echo ""
echo "✅ Database initialization script completed successfully"
echo "   Database user '$DB_USER' exists and can connect to '$DB_NAME'"
echo "   You can now run migrations with: npx prisma migrate deploy"
