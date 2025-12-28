#!/bin/bash
# Remote deployment script for zero-downtime deployment
# This script is uploaded to the server and executed via SSH

set -e

# Verify all required environment variables are set
if [ -z "$STAGING_FOLDER" ]; then
  echo "❌ STAGING_FOLDER is not set in remote script!"
  exit 1
fi

if [ -z "$DEPLOY_FOLDER" ]; then
  echo "❌ DEPLOY_FOLDER is not set in remote script!"
  exit 1
fi

if [ -z "$BACKUP_FOLDER" ]; then
  echo "❌ BACKUP_FOLDER is not set in remote script!"
  exit 1
fi

echo "📋 Remote environment variables:"
echo "   STAGING_FOLDER: $STAGING_FOLDER"
echo "   DEPLOY_FOLDER: $DEPLOY_FOLDER"
echo "   BACKUP_FOLDER: $BACKUP_FOLDER"
echo "   BUNDLE_NAME: $BUNDLE_NAME"

# Use BUNDLE_NAME from environment, or try to find it
if [ -z "$BUNDLE_NAME" ]; then
  echo "⚠️  BUNDLE_NAME not set, trying to read from remote server..."
  # Try to read from remote server first (most reliable)
  BUNDLE_NAME=$(cat /tmp/bundle_name.txt 2>/dev/null | tr -d '\n\r ' || echo "")
fi

if [ -z "$BUNDLE_NAME" ]; then
  echo "⚠️  Not found in /tmp/bundle_name.txt, trying to find latest bundle..."
  BUNDLE_NAME=$(ls -t $STAGING_FOLDER/*.tar.gz 2>/dev/null | head -1 | xargs basename || echo "")
fi

if [ -z "$BUNDLE_NAME" ]; then
  echo "❌ Could not determine BUNDLE_NAME"
  echo "   Tried: environment variable, /tmp/bundle_name.txt, latest file in staging folder"
  echo "   Staging folder: $STAGING_FOLDER"
  echo "   Available files:"
  ls -la "$STAGING_FOLDER" 2>/dev/null || echo "   (staging folder does not exist or is empty)"
  echo "   /tmp/bundle_name.txt contents:"
  cat /tmp/bundle_name.txt 2>/dev/null || echo "   (file does not exist)"
  exit 1
fi

STAGING_PATH="$STAGING_FOLDER/$BUNDLE_NAME"
TEMP_DEPLOY="/var/www/naukrimili-temp-$$"
PROD_DEPLOY="$DEPLOY_FOLDER"
BACKUP_PATH="$BACKUP_FOLDER/backup-$(date +%s)"

echo "📦 Bundle: $BUNDLE_NAME"
echo "📂 Staging path: $STAGING_PATH"
echo "📂 Temp folder: $TEMP_DEPLOY"

# Comprehensive bundle file verification
echo "🔍 Verifying bundle file before extraction..."

# Verify STAGING_FOLDER is set and not empty
if [ -z "$STAGING_FOLDER" ]; then
  echo "❌ STAGING_FOLDER is empty or not set!"
  echo "   This should not happen - variable should be passed from GitHub Actions"
  exit 1
fi

echo "📂 Using staging folder: $STAGING_FOLDER"

# Check if staging folder exists
if [ ! -d "$STAGING_FOLDER" ]; then
  echo "⚠️  Staging folder does not exist: $STAGING_FOLDER"
  echo "   Attempting to create it..."
  mkdir -p "$STAGING_FOLDER" || {
    echo "❌ Failed to create staging folder: $STAGING_FOLDER"
    echo "   Parent directory: $(dirname "$STAGING_FOLDER")"
    echo "   Parent exists: $([ -d "$(dirname "$STAGING_FOLDER")" ] && echo 'yes' || echo 'no')"
    exit 1
  }
  echo "✅ Staging folder created: $STAGING_FOLDER"
else
  echo "✅ Staging folder exists: $STAGING_FOLDER"
fi

# Verify bundle file exists
if [ ! -f "$STAGING_PATH" ]; then
  echo "❌ Bundle file not found at $STAGING_PATH"
  echo "   Staging folder: $STAGING_FOLDER"
  echo "   Staging folder exists: $([ -d "$STAGING_FOLDER" ] && echo 'yes' || echo 'no')"
  echo "   Staging folder permissions:"
  ls -ld "$STAGING_FOLDER" 2>/dev/null || echo "   (cannot check permissions)"
  echo "   Available files in staging folder:"
  ls -la "$STAGING_FOLDER" 2>/dev/null || echo "   (staging folder is empty or not accessible)"
  echo "   Looking for any .tar.gz files:"
  find "$STAGING_FOLDER" -name "*.tar.gz" -type f 2>/dev/null | head -5 || echo "   (no .tar.gz files found)"
  exit 1
fi

# Verify file is not empty
FILE_SIZE=$(stat -f%z "$STAGING_PATH" 2>/dev/null || stat -c%s "$STAGING_PATH" 2>/dev/null || echo "0")
if [ "$FILE_SIZE" -eq 0 ]; then
  echo "❌ Bundle file is empty: $STAGING_PATH"
  exit 1
fi

# Verify file is readable
if [ ! -r "$STAGING_PATH" ]; then
  echo "❌ Bundle file is not readable: $STAGING_PATH"
  exit 1
fi

FILE_SIZE_HUMAN=$(du -h "$STAGING_PATH" | cut -f1)
echo "✅ Bundle file verified: $STAGING_PATH ($FILE_SIZE_HUMAN, $FILE_SIZE bytes)"

# Extract to temp folder
mkdir -p "$TEMP_DEPLOY"
cd "$TEMP_DEPLOY"
echo "📦 Extracting bundle..."
tar -xzf "$STAGING_PATH" || { 
  echo "❌ Extract failed"
  echo "   Archive path: $STAGING_PATH"
  echo "   Archive exists: $([ -f "$STAGING_PATH" ] && echo 'yes' || echo 'no')"
  echo "   Archive size: $(du -h "$STAGING_PATH" | cut -f1)"
  exit 1
}
echo "✅ Bundle extracted"

# CRITICAL: Verify critical files and directories after extraction
echo "🔍 Verifying extracted bundle contents..."

# Verify .next directory exists
if [ ! -d ".next" ]; then
  echo "❌ CRITICAL: .next directory not found after extraction!"
  echo "   Current directory: $(pwd)"
  echo "   Contents of extraction directory:"
  ls -la . | head -20 || true
  exit 1
fi
echo "✅ .next directory found"

# Verify standalone server exists (preferred for PM2)
if [ -d ".next/standalone" ]; then
  echo "✅ Standalone server found"
  if [ -f ".next/standalone/server.js" ]; then
    echo "✅ Standalone server.js found - PM2 will use this"
  else
    echo "⚠️  WARNING: standalone/server.js not found"
  fi
else
  echo "⚠️  WARNING: Standalone server not found"
  echo "   PM2 will use fallback mode (next start or server.cjs)"
  echo "   This may cause slower startup or compatibility issues"
fi

# Verify .next/static directory exists
if [ ! -d ".next/static" ]; then
  echo "❌ CRITICAL: .next/static directory not found after extraction!"
  echo "   This will cause all CSS/JS files to return 404 errors!"
  echo "   .next directory contents:"
  ls -la .next 2>/dev/null || echo "   (cannot list .next directory)"
  exit 1
fi
echo "✅ .next/static directory found"

# Verify static files count
STATIC_COUNT=$(find .next/static -type f 2>/dev/null | wc -l)
echo "   Static files found: $STATIC_COUNT"
if [ "$STATIC_COUNT" -lt 10 ]; then
  echo "❌ CRITICAL: Very few static files found ($STATIC_COUNT)"
  echo "   This will cause CSS/JS 404 errors!"
  echo "   Static directory contents:"
  ls -la .next/static 2>/dev/null || echo "   (cannot list static directory)"
  exit 1
else
  echo "✅ Static files verified: $STATIC_COUNT files"
  # Show sample CSS and JS files
  CSS_COUNT=$(find .next/static -name "*.css" 2>/dev/null | wc -l)
  JS_COUNT=$(find .next/static -name "*.js" 2>/dev/null | wc -l)
  echo "   CSS files: $CSS_COUNT"
  echo "   JS files: $JS_COUNT"
fi

# Verify ecosystem.config.cjs exists
if [ ! -f "ecosystem.config.cjs" ]; then
  echo "❌ CRITICAL: ecosystem.config.cjs not found after extraction!"
  echo "   This file is required for PM2 to start the application"
  echo "   Current directory: $(pwd)"
  echo "   Contents of extraction directory:"
  ls -la . | head -20 || true
  exit 1
fi
echo "✅ ecosystem.config.cjs found"

# Verify package.json exists (needed for npm install)
if [ ! -f "package.json" ]; then
  echo "❌ CRITICAL: package.json not found after extraction!"
  echo "   This file is required for installing dependencies"
  exit 1
fi
echo "✅ package.json found"

# Install dependencies (skip postinstall to avoid prisma generate during install)
if [ -f package-lock.json ]; then
  echo "📚 Installing dependencies..."
  export SKIP_POSTINSTALL=true
  npm ci --omit=dev --prefer-offline --legacy-peer-deps --ignore-scripts 2>&1 | tail -10 || {
    echo "⚠️  npm ci had issues, trying npm install..."
    npm install --omit=dev --legacy-peer-deps --prefer-offline --ignore-scripts 2>&1 | tail -10 || {
      echo "❌ npm install failed"
      exit 1
    }
  }
  
  # Verify critical dependencies are installed
  if [ ! -d "node_modules" ]; then
    echo "❌ node_modules directory not created"
    exit 1
  fi
  
  # Verify key packages
  if [ ! -d "node_modules/next" ]; then
    echo "❌ Next.js not installed"
    exit 1
  fi
  
  echo "✅ Dependencies installed and verified"
  
  # CRITICAL: Force install Prisma 6.18.0 before generating client or running migrations
  # This ensures we don't accidentally use Prisma 7.x which has different schema syntax
  echo "📦 Ensuring Prisma 6.18.0 is installed..."
  npm uninstall prisma @prisma/client @prisma/client-runtime-utils --legacy-peer-deps 2>/dev/null || true
  rm -rf node_modules/.prisma node_modules/@prisma node_modules/.bin/prisma 2>/dev/null || true
  
  echo "   Installing Prisma 6.18.0 explicitly..."
  npm install prisma@6.18.0 @prisma/client@6.18.0 --save-dev --save --legacy-peer-deps --no-save --force 2>&1 | tail -10 || {
    echo "❌ Failed to install Prisma 6.18.0"
    exit 1
  }
  
  # Verify Prisma version
  PRISMA_VERSION=$(./node_modules/.bin/prisma --version 2>/dev/null | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' | head -1 || echo "")
  CLIENT_VERSION=$(npm list @prisma/client --depth=0 2>/dev/null | grep "@prisma/client" | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' | head -1 || echo "")
  
  echo "   Prisma CLI version: ${PRISMA_VERSION:-'unknown'}"
  echo "   @prisma/client version: ${CLIENT_VERSION:-'unknown'}"
  
  if [ -z "$PRISMA_VERSION" ] || [ -z "$CLIENT_VERSION" ]; then
    echo "❌ Could not determine Prisma versions"
    exit 1
  fi
  
  if echo "$PRISMA_VERSION" | grep -qE "^7\." || echo "$CLIENT_VERSION" | grep -qE "^7\."; then
    echo "❌ CRITICAL: Prisma 7.x detected! This version doesn't support url in schema.prisma"
    echo "   CLI: $PRISMA_VERSION"
    echo "   Client: $CLIENT_VERSION"
    echo "   Please ensure Prisma 6.18.0 is installed"
    exit 1
  fi
  
  if ! echo "$PRISMA_VERSION" | grep -qE "^6\." || ! echo "$CLIENT_VERSION" | grep -qE "^6\."; then
    echo "❌ CRITICAL: Unexpected Prisma version! Expected 6.x"
    echo "   CLI: $PRISMA_VERSION"
    echo "   Client: $CLIENT_VERSION"
    exit 1
  fi
  
  echo "✅ Prisma 6.18.0 verified"
  
  # Generate Prisma client separately (after dependencies are installed)
  if [ -f prisma/schema.prisma ] && [ -d "node_modules/prisma" ]; then
    echo "🔧 Generating Prisma Client..."
    # DATABASE_URL should be available from environment, use a safe default if not
    export DATABASE_URL="${DATABASE_URL:-postgresql://localhost:5432/naukrimili}"
    ./node_modules/.bin/prisma generate --schema=prisma/schema.prisma 2>&1 | tail -10 || {
      echo "⚠️  Prisma generate had issues, trying with npx..."
      npx prisma@6.18.0 generate --schema=prisma/schema.prisma 2>&1 | tail -10 || {
        echo "❌ Prisma generate failed"
        exit 1
      }
    }
  fi
else
  echo "⚠️  package-lock.json not found, skipping dependency installation"
fi

# Run migrations if schema changed
if [ -f prisma/schema.prisma ]; then
  export NODE_ENV=production
  # DATABASE_URL should already be set from environment
  if [ -z "$DATABASE_URL" ]; then
    echo "❌ CRITICAL: DATABASE_URL is not set!"
    echo "   Cannot run migrations without database connection"
    echo "   Available environment variables:"
    env | grep -E "DATABASE|DB" || echo "   (no DATABASE variables found)"
    exit 1
  fi
  
  echo "🗄️  Running migrations..."
  echo "   DATABASE_URL: ${DATABASE_URL:0:30}... (hidden for security)"
  echo "   Prisma schema: prisma/schema.prisma"
  
  # CRITICAL: Verify Prisma version before running migrations
  PRISMA_VERSION=$(./node_modules/.bin/prisma --version 2>/dev/null | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' | head -1 || echo "")
  echo "   Prisma CLI version: ${PRISMA_VERSION:-'unknown'}"
  echo "   Prisma binary: ./node_modules/.bin/prisma"
  echo "   Node version: $(node --version 2>/dev/null || echo 'unknown')"
  echo "   NPM version: $(npm --version 2>/dev/null || echo 'unknown')"
  
  # Verify Prisma is 6.x, not 7.x
  if [ -n "$PRISMA_VERSION" ]; then
    if echo "$PRISMA_VERSION" | grep -qE "^7\."; then
      echo "❌ CRITICAL: Prisma 7.x detected! Cannot run migrations with Prisma 7.x"
      echo "   Prisma 7.x doesn't support 'url' in schema.prisma"
      echo "   Detected version: $PRISMA_VERSION"
      echo "   Please ensure Prisma 6.18.0 is installed"
      exit 1
    fi
    if ! echo "$PRISMA_VERSION" | grep -qE "^6\."; then
      echo "❌ CRITICAL: Unexpected Prisma version: $PRISMA_VERSION"
      echo "   Expected Prisma 6.x"
      exit 1
    fi
    echo "✅ Prisma version verified: $PRISMA_VERSION (6.x)"
  else
    echo "⚠️  Could not determine Prisma version, but continuing..."
  fi
  
  # Test database connection first (skip if Prisma 7.x command doesn't exist)
  echo "🔍 Testing database connection..."
  if ./node_modules/.bin/prisma db execute --stdin <<< "SELECT 1;" 2>&1 | grep -q "1" 2>/dev/null; then
    echo "✅ Database connection test passed"
  else
    echo "⚠️  Database connection test inconclusive (this is OK, continuing with migration)"
  fi
  
  # Run migrations with full output visible and proper error handling
  # CRITICAL: Use local Prisma binary, not npx (which might pick up global/cached 7.x)
  echo "📋 Executing: ./node_modules/.bin/prisma migrate deploy"
  echo "   (Full output will be shown below)"
  echo "--- Migration Output Start ---"
  
  # Temporarily disable set -e to capture full error output
  set +e
  MIGRATION_OUTPUT=$(timeout 120 ./node_modules/.bin/prisma migrate deploy 2>&1)
  MIGRATION_EXIT=$?
  set -e
  
  echo "--- Migration Output End ---"
  echo ""
  echo "📊 Migration exit code: $MIGRATION_EXIT"
  
  # Show full migration output (not just tail)
  echo "📋 Full migration output:"
  echo "$MIGRATION_OUTPUT"
  echo ""
  
  if [ $MIGRATION_EXIT -eq 0 ]; then
    echo "✅ Migrations completed successfully"
  elif [ $MIGRATION_EXIT -eq 124 ]; then
    echo "❌ Migration timed out after 120 seconds"
    echo "   This usually indicates a database connectivity issue or a very large migration"
    echo "   Last 50 lines of output:"
    echo "$MIGRATION_OUTPUT" | tail -50
    exit 1
  else
    echo "❌ Migration failed with exit code: $MIGRATION_EXIT"
    echo ""
    echo "🔍 Analyzing migration failure..."
    
    # Check for common error patterns
    if echo "$MIGRATION_OUTPUT" | grep -qi "P1001.*Can't reach database"; then
      echo "   Error: Cannot reach database server"
      echo "   Check: DATABASE_URL, network connectivity, firewall rules"
    elif echo "$MIGRATION_OUTPUT" | grep -qi "P1000.*Authentication failed"; then
      echo "   Error: Database authentication failed"
      echo "   Check: DATABASE_URL credentials"
    elif echo "$MIGRATION_OUTPUT" | grep -qi "P1003.*Database.*does not exist"; then
      echo "   Error: Database does not exist"
      echo "   Check: DATABASE_URL database name"
    elif echo "$MIGRATION_OUTPUT" | grep -qi "no pending migrations\|already applied\|No pending migrations"; then
      echo "✅ No pending migrations (this is OK - all migrations are already applied)"
      echo "   Migration output indicates database is up to date"
    elif echo "$MIGRATION_OUTPUT" | grep -qi "Migration.*failed"; then
      echo "   Error: A specific migration failed"
      echo "   Check the migration files and database state"
    else
      echo "   Unknown migration error"
      echo "   Please review the full output above"
    fi
    
    # If it's not a "no pending migrations" case, fail the deployment
    if ! echo "$MIGRATION_OUTPUT" | grep -qi "no pending migrations\|already applied\|No pending migrations"; then
      echo ""
      echo "❌ Migration error detected - deployment cannot continue"
      echo "   Please fix the migration issue before deploying"
      exit 1
    fi
  fi
else
  echo "⚠️  prisma/schema.prisma not found, skipping migrations"
fi

# Start PM2 in temp folder to test
echo "🧪 Testing application in temp folder..."

# Clean up PM2 state - delete all processes and reset PM2
echo "🧹 Cleaning up PM2 state..."
pm2 kill 2>/dev/null || true
pm2 flush 2>/dev/null || true

# Delete any existing test process (try multiple names)
pm2 delete naukrimili-test 2>/dev/null || true
pm2 delete jobportal-test 2>/dev/null || true
pm2 delete naukrimili 2>/dev/null || true
pm2 delete jobportal 2>/dev/null || true
pm2 delete all 2>/dev/null || true

# Wait a moment for PM2 to clean up
sleep 2

# Verify ecosystem.config.cjs exists
if [ ! -f ecosystem.config.cjs ]; then
  echo "❌ ecosystem.config.cjs not found in $TEMP_DEPLOY"
  ls -la "$TEMP_DEPLOY" | head -20 || true
  exit 1
fi

# Verify .next directory exists
if [ ! -d ".next" ]; then
  echo "❌ .next directory not found in $TEMP_DEPLOY"
  ls -la "$TEMP_DEPLOY" | head -20 || true
  exit 1
fi

# Start with test name override
echo "🚀 Starting PM2 with test name..."
if pm2 start ecosystem.config.cjs --name naukrimili-test --env production --update-env; then
  echo "⏳ Waiting for PM2 process to be ready..."
  sleep 2
  
  # Verify PM2 process is running (reduced retries for faster failure)
  # Use pm2 jlist for more reliable JSON-based checking
  PM2_READY=false
  for i in {1..10}; do
    # Check using pm2 jlist (JSON output) - more reliable than grep
    PM2_STATUS=$(pm2 jlist 2>/dev/null || echo "[]")
    if echo "$PM2_STATUS" | grep -q '"name":"naukrimili-test".*"pm2_env":{"status":"online"'; then
      PM2_READY=true
      echo "✅ PM2 process is online (attempt $i/10)"
      break
    fi
    # Fallback: check using pm2 status table format
    if pm2 status 2>/dev/null | grep -qE "naukrimili-test.*online|naukrimili-test.*errored"; then
      # Check if it's actually online (not errored)
      if pm2 status 2>/dev/null | grep -q "naukrimili-test.*online"; then
        PM2_READY=true
        echo "✅ PM2 process is online (attempt $i/10)"
        break
      fi
    fi
    echo "   Waiting for PM2 process... (attempt $i/10)"
    # Show current PM2 status for debugging
    if [ $i -eq 5 ]; then
      echo "   Current PM2 status:"
      pm2 status 2>/dev/null | head -5 || true
    fi
    sleep 1
  done
  
  if [ "$PM2_READY" != "true" ]; then
    echo "❌ PM2 process did not start properly after 10 attempts"
    echo "📋 Full PM2 status:"
    pm2 status || true
    echo "📋 PM2 JSON list:"
    pm2 jlist 2>/dev/null | head -20 || true
    echo "📋 PM2 logs:"
    pm2 logs naukrimili-test --lines 50 --nostream || true
    echo "📋 PM2 describe:"
    pm2 describe naukrimili-test 2>/dev/null || true
    exit 1
  fi
  
  # Health check with timeout and retries (reduced for faster failure)
  echo "🏥 Running health check..."
  HEALTH_CHECK_PASSED=false
  for i in {1..10}; do
    if timeout 3 curl -f -s http://localhost:3000/api/health > /dev/null 2>&1; then
      HEALTH_CHECK_PASSED=true
      echo "✅ Health check passed (attempt $i/10)"
      break
    fi
    echo "   Health check failed, retrying... (attempt $i/10)"
    sleep 2
  done
  
  if [ "$HEALTH_CHECK_PASSED" != "true" ]; then
    echo "❌ Health check failed after 10 attempts"
    echo "📋 PM2 Status:"
    pm2 status || true
    echo "📋 PM2 Logs:"
    pm2 logs naukrimili-test --lines 50 || true
    echo "📋 Checking if port 3000 is listening:"
    netstat -tlnp 2>/dev/null | grep 3000 || ss -tlnp 2>/dev/null | grep 3000 || echo "   Port 3000 not listening"
    exit 1
  fi
  
  if [ "$HEALTH_CHECK_PASSED" = "true" ]; then
    echo "✅ Health check passed"
    
    # Success: backup current and swap
    echo "🔄 Swapping to production..."
    pm2 delete naukrimili-test 2>/dev/null || true
    pm2 delete jobportal-test 2>/dev/null || true
    
    if [ -d "$PROD_DEPLOY/.next" ]; then
      echo "💾 Backing up current version..."
      mkdir -p "$BACKUP_PATH"
      cp -r "$PROD_DEPLOY/.next" "$BACKUP_PATH/" || true
      cp -r "$PROD_DEPLOY/node_modules" "$BACKUP_PATH/" 2>/dev/null || true
    fi
    
    # Atomic swap
    rm -rf "$PROD_DEPLOY.old"
    [ -d "$PROD_DEPLOY" ] && mv "$PROD_DEPLOY" "$PROD_DEPLOY.old" || true
    mv "$TEMP_DEPLOY" "$PROD_DEPLOY"
    rm -rf "$PROD_DEPLOY.old" "$TEMP_DEPLOY"
    
    # Start production PM2
    cd "$PROD_DEPLOY"
    
    # Verify ecosystem.config.cjs exists
    if [ ! -f ecosystem.config.cjs ]; then
      echo "❌ ecosystem.config.cjs not found in $PROD_DEPLOY"
      exit 1
    fi
    
    # Clean up PM2 state before starting production
    echo "🧹 Cleaning up PM2 before production start..."
    pm2 delete naukrimili 2>/dev/null || true
    pm2 delete jobportal 2>/dev/null || true
    pm2 delete all 2>/dev/null || true
    sleep 1
    
    # Start PM2 with ecosystem config (uses name from config: "naukrimili")
    echo "🚀 Starting PM2 with ecosystem.config.cjs..."
    pm2 start ecosystem.config.cjs --env production --update-env || {
      echo "❌ PM2 start failed"
      echo "   Current directory: $(pwd)"
      echo "   Files in directory:"
      ls -la . | head -10 || true
      echo "   PM2 status:"
      pm2 status || true
      echo "   Attempting rollback..."
      [ -d "$BACKUP_PATH/.next" ] && {
        echo "   Restoring backup..."
        cp -r "$BACKUP_PATH/.next" "$PROD_DEPLOY/"
        pm2 start ecosystem.config.cjs --env production || {
          echo "❌ Rollback PM2 start also failed"
          exit 1
        }
      } || {
        echo "❌ No backup available for rollback"
        exit 1
      }
    }
    
    # Verify PM2 process started with retries (reduced for faster failure)
    echo "⏳ Waiting for production PM2 process to be ready..."
    sleep 2
    
    PM2_READY=false
    for i in {1..10}; do
      # Check using pm2 jlist (JSON output) - more reliable than grep
      PM2_STATUS=$(pm2 jlist 2>/dev/null || echo "[]")
      if echo "$PM2_STATUS" | grep -q '"name":"naukrimili".*"pm2_env":{"status":"online"'; then
        PM2_READY=true
        echo "✅ Production PM2 process is online (attempt $i/10)"
        break
      fi
      # Fallback: check using pm2 status table format
      if pm2 status 2>/dev/null | grep -qE "naukrimili.*online|naukrimili.*errored"; then
        # Check if it's actually online (not errored)
        if pm2 status 2>/dev/null | grep -q "naukrimili.*online"; then
          PM2_READY=true
          echo "✅ Production PM2 process is online (attempt $i/10)"
          break
        fi
      fi
      echo "   Waiting for production PM2 process... (attempt $i/10)"
      # Show current PM2 status for debugging
      if [ $i -eq 5 ]; then
        echo "   Current PM2 status:"
        pm2 status 2>/dev/null | head -5 || true
      fi
      sleep 1
    done
    
    if [ "$PM2_READY" != "true" ]; then
      echo "❌ Production PM2 process did not start properly after 10 attempts"
      echo "📋 Full PM2 status:"
      pm2 status || true
      echo "📋 PM2 JSON list:"
      pm2 jlist 2>/dev/null | head -20 || true
      echo "📋 PM2 logs:"
      pm2 logs naukrimili --lines 50 --nostream || true
      echo "📋 PM2 describe:"
      pm2 describe naukrimili 2>/dev/null || true
      exit 1
    fi
    
    pm2 save --force
    sleep 1
    
    # Production health check with timeout and retries (reduced for faster failure)
    echo "🏥 Running production health check..."
    HEALTH_CHECK_PASSED=false
    for i in {1..10}; do
      if timeout 3 curl -f -s http://localhost:3000/api/health > /dev/null 2>&1; then
        HEALTH_CHECK_PASSED=true
        echo "✅ Production health check passed (attempt $i/10)"
        break
      fi
      echo "   Production health check failed, retrying... (attempt $i/10)"
      sleep 2
    done
    
    if [ "$HEALTH_CHECK_PASSED" != "true" ]; then
      echo "❌ Production health check failed after 10 attempts"
      echo "📋 PM2 Status:"
      pm2 status || true
      echo "📋 PM2 Logs:"
      pm2 logs naukrimili --lines 50 || true
      echo "📋 Checking if port 3000 is listening:"
      netstat -tlnp 2>/dev/null | grep 3000 || ss -tlnp 2>/dev/null | grep 3000 || echo "   Port 3000 not listening"
      exit 1
    fi
    
    if [ "$HEALTH_CHECK_PASSED" = "true" ]; then
      echo "✅ Production deployment successful"
      # Clean old backups (keep last 3)
      cd "$BACKUP_FOLDER"
      ls -t | tail -n +4 | xargs -r rm -rf
      rm -f "$STAGING_PATH"
    fi
  else
    echo "❌ Health check failed in temp folder"
    echo "   PM2 status:"
    pm2 status || true
    echo "   PM2 logs:"
    pm2 logs naukrimili-test --lines 20 || true
    pm2 logs jobportal-test --lines 20 || true
    rm -rf "$TEMP_DEPLOY"
    exit 1
  fi
else
  echo "❌ Failed to start PM2 in temp folder"
  echo "   PM2 status:"
  pm2 status || true
  echo "   PM2 logs:"
  pm2 logs naukrimili-test --lines 50 || true
  pm2 logs jobportal-test --lines 50 || true
  echo "   Application files in $TEMP_DEPLOY:"
  ls -la "$TEMP_DEPLOY" | head -20 || true
  rm -rf "$TEMP_DEPLOY"
  exit 1
fi


