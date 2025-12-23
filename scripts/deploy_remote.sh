#!/bin/bash
set -euo pipefail

# Load environment variables
source /tmp/deploy_env.sh 2>/dev/null || {
  echo "❌ ERROR: Failed to load environment variables"
  exit 1
}

# Verify environment variables are set
if [ -z "$DEPLOY_FOLDER" ] || [ -z "$STAGING_FOLDER" ]; then
  echo "❌ ERROR: Environment variables not set properly"
  echo "DEPLOY_FOLDER: $DEPLOY_FOLDER"
  echo "STAGING_FOLDER: $STAGING_FOLDER"
  exit 1
fi

# Export for child processes
export DEPLOY_FOLDER
export STAGING_FOLDER
export BACKUP_FOLDER
export DATABASE_URL
export NODE_ENV=production

# Read bundle name
BUNDLE_NAME=$(cat /tmp/bundle_name.txt 2>/dev/null || echo "")

# If bundle name not found, try to find latest bundle
if [ -z "$BUNDLE_NAME" ]; then
  echo "⚠️  Bundle name not in /tmp/bundle_name.txt, searching for latest bundle..."
  if [ -d "$STAGING_FOLDER" ]; then
    BUNDLE_NAME=$(ls -t "$STAGING_FOLDER"/*.tar.gz 2>/dev/null | head -1 | xargs basename 2>/dev/null || echo "")
  fi
fi

if [ -z "$BUNDLE_NAME" ]; then
  echo "❌ ERROR: Cannot determine bundle name"
  echo "📂 Checking staging folder: $STAGING_FOLDER"
  if [ -d "$STAGING_FOLDER" ]; then
    echo "📋 Contents of staging folder:"
    ls -la "$STAGING_FOLDER" || echo "Cannot list staging folder"
  else
    echo "❌ Staging folder does not exist: $STAGING_FOLDER"
  fi
  exit 1
fi

STAGING_PATH="$STAGING_FOLDER/$BUNDLE_NAME"
TEMP_DEPLOY="/var/www/naukrimili-temp-$$"
PROD_DEPLOY="$DEPLOY_FOLDER"
BACKUP_PATH="$BACKUP_FOLDER/backup-$(date +%s)"

# Export all path variables for use throughout script
export STAGING_PATH
export TEMP_DEPLOY
export PROD_DEPLOY
export BACKUP_PATH

echo "📦 Bundle name: $BUNDLE_NAME"
echo "📂 Staging folder: $STAGING_FOLDER"
echo "📂 Staging path: $STAGING_PATH"
echo "📂 Temp folder: $TEMP_DEPLOY"

# Verify staging folder exists
if [ ! -d "$STAGING_FOLDER" ]; then
  echo "❌ ERROR: Staging folder does not exist: $STAGING_FOLDER"
  echo "📋 Creating staging folder..."
  mkdir -p "$STAGING_FOLDER" || { echo "❌ Failed to create staging folder"; exit 1; }
fi

# Verify bundle exists
if [ ! -f "$STAGING_PATH" ]; then
  echo "❌ ERROR: Bundle not found at $STAGING_PATH"
  echo "📋 Listing staging folder contents:"
  ls -la "$STAGING_FOLDER" || echo "Cannot list staging folder"
  echo ""
  echo "📋 Searching for any .tar.gz files:"
  find "$STAGING_FOLDER" -name "*.tar.gz" -type f 2>/dev/null || echo "No .tar.gz files found"
  exit 1
fi

echo "✅ Bundle found: $STAGING_PATH ($(du -h "$STAGING_PATH" | cut -f1))"

# Extract to temp folder
echo "📂 Creating temp folder: $TEMP_DEPLOY"
mkdir -p "$TEMP_DEPLOY" || { echo "❌ Failed to create temp folder"; exit 1; }
cd "$TEMP_DEPLOY" || { echo "❌ Failed to cd to temp folder"; exit 1; }

echo "📦 Extracting bundle from: $STAGING_PATH"

# Check disk space before extraction
echo "💾 Checking disk space..."
df -h "$TEMP_DEPLOY" || df -h /var/www || df -h / || true
AVAILABLE_SPACE=$(df "$TEMP_DEPLOY" 2>/dev/null | tail -1 | awk '{print $4}' || df /var/www 2>/dev/null | tail -1 | awk '{print $4}' || echo "unknown")
echo "📊 Available space: $AVAILABLE_SPACE blocks"

# Verify tar file integrity and list contents
echo "🔍 Verifying bundle integrity..."
if ! tar -tzf "$STAGING_PATH" > /dev/null 2>&1; then
  echo "❌ ERROR: Bundle file is corrupted or invalid"
  echo "📋 File size: $(du -h "$STAGING_PATH" 2>/dev/null || echo 'unknown')"
  echo "📋 File type: $(file "$STAGING_PATH" 2>/dev/null || echo 'unknown')"
  exit 1
fi

# List bundle contents before extraction
echo "📋 Bundle contents (before extraction):"
tar -tzf "$STAGING_PATH" | head -30
BUNDLE_FILE_COUNT=$(tar -tzf "$STAGING_PATH" | wc -l)
echo "📊 Total files in bundle: $BUNDLE_FILE_COUNT"

# CRITICAL: Verify critical files are in bundle BEFORE extraction
echo "🔍 Verifying critical files in bundle..."
MISSING_IN_BUNDLE=0

if ! tar -tzf "$STAGING_PATH" | grep -qE "^\.next/|\.next/"; then
  echo "❌ CRITICAL: .next directory NOT found in bundle!"
  MISSING_IN_BUNDLE=1
else
  echo "✅ .next directory found in bundle"
fi

if ! tar -tzf "$STAGING_PATH" | grep -qE "^ecosystem\.config\.cjs$|^\./ecosystem\.config\.cjs$|ecosystem\.config\.cjs$"; then
  echo "❌ CRITICAL: ecosystem.config.cjs NOT found in bundle!"
  MISSING_IN_BUNDLE=1
else
  echo "✅ ecosystem.config.cjs found in bundle"
fi

if ! tar -tzf "$STAGING_PATH" | grep -qE "\.next/standalone/server\.js|standalone/server\.js"; then
  echo "❌ CRITICAL: .next/standalone/server.js NOT found in bundle!"
  MISSING_IN_BUNDLE=1
else
  echo "✅ .next/standalone/server.js found in bundle"
fi

if [ $MISSING_IN_BUNDLE -eq 1 ]; then
  echo "❌ CRITICAL: Required files missing from bundle - cannot proceed with deployment"
  echo "📋 Full bundle contents:"
  tar -tzf "$STAGING_PATH" | head -100
  exit 1
fi

# Extract with timeout (5 minutes max)
echo "📦 Starting extraction at $(date '+%H:%M:%S')..."
echo "⏳ This may take 2-5 minutes for large bundles..."

EXTRACT_START=$(date +%s)
if command -v pigz >/dev/null 2>&1; then
  echo "🚀 Using pigz for faster extraction..."
  timeout 300 tar --use-compress-program=pigz -xf "$STAGING_PATH" -C "$TEMP_DEPLOY" > /tmp/tar_extract.log 2>&1 || EXTRACT_EXIT=$?
else
  echo "📦 Using standard gzip extraction..."
  timeout 300 tar -xzf "$STAGING_PATH" -C "$TEMP_DEPLOY" > /tmp/tar_extract.log 2>&1 || EXTRACT_EXIT=$?
fi
EXTRACT_EXIT=${EXTRACT_EXIT:-0}
EXTRACT_END=$(date +%s)
EXTRACT_DURATION=$((EXTRACT_END - EXTRACT_START))

# Handle SIGPIPE (exit code 141) - often just output redirection issue
if [ $EXTRACT_EXIT -eq 141 ]; then
  EXTRACTED_COUNT=$(find "$TEMP_DEPLOY" -type f 2>/dev/null | wc -l || echo "0")
  if [ "$EXTRACTED_COUNT" -gt 10 ]; then
    echo "⚠️  Received SIGPIPE (exit 141) but $EXTRACTED_COUNT files extracted - treating as success"
    EXTRACT_EXIT=0
  fi
fi

# CRITICAL: Verify extraction succeeded
echo "🔍 Verifying extraction completed successfully..."
EXTRACTED_FILES=$(find "$TEMP_DEPLOY" -type f 2>/dev/null | wc -l || echo "0")
echo "📊 Extracted $EXTRACTED_FILES files"

if [ "$EXTRACTED_FILES" -lt 10 ]; then
  echo "❌ ERROR: Too few files extracted ($EXTRACTED_FILES) - extraction may have failed"
  echo "📁 Temp directory contents:"
  ls -lah "$TEMP_DEPLOY" 2>/dev/null | head -20 || echo "   Directory empty or missing"
  exit 1
fi

# Ensure we're in the extraction directory
cd "$TEMP_DEPLOY" || { echo "❌ Failed to cd to $TEMP_DEPLOY after extraction"; exit 1; }

# CRITICAL: Handle case where tar extracts to a subdirectory FIRST
echo "🔍 Checking if files were extracted to a subdirectory..."
EXTRACT_ROOT=$(find "$TEMP_DEPLOY" -maxdepth 3 -name "package.json" -type f 2>/dev/null | head -1 | xargs dirname 2>/dev/null || echo "")

if [ -n "$EXTRACT_ROOT" ] && [ "$EXTRACT_ROOT" != "$TEMP_DEPLOY" ] && [ ! -f "$TEMP_DEPLOY/package.json" ]; then
  echo "⚠️  Files extracted to subdirectory: $EXTRACT_ROOT"
  echo "📋 Moving files from $EXTRACT_ROOT to $TEMP_DEPLOY..."
  
  # Move all files and directories (including hidden files)
  shopt -s dotglob 2>/dev/null || true
  mv "$EXTRACT_ROOT"/* "$TEMP_DEPLOY"/ 2>/dev/null || {
    find "$EXTRACT_ROOT" -mindepth 1 -maxdepth 1 -exec mv {} "$TEMP_DEPLOY"/ \; 2>/dev/null || true
  }
  
  # Move hidden files/directories
  if [ -d "$EXTRACT_ROOT" ]; then
    for item in "$EXTRACT_ROOT"/.[!.]* "$EXTRACT_ROOT"/..?*; do
      if [ -e "$item" ]; then
        mv "$item" "$TEMP_DEPLOY"/ 2>/dev/null || true
      fi
    done
  fi
  
  rmdir "$EXTRACT_ROOT" 2>/dev/null || true
  echo "✅ Files moved to expected location"
fi

# CRITICAL: Verify critical files exist AFTER handling subdirectory case
echo "🔍 Verifying critical files after extraction..."

# Use find to search for files even if in unexpected locations
ECOSYSTEM_FILE=$(find "$TEMP_DEPLOY" -maxdepth 2 -name "ecosystem.config.cjs" -type f 2>/dev/null | head -1)
if [ -z "$ECOSYSTEM_FILE" ]; then
  echo "❌ ERROR: ecosystem.config.cjs not found after extraction"
  echo "📁 Temp directory contents:"
  ls -lah "$TEMP_DEPLOY" 2>/dev/null | head -20
  echo "📁 Searching for ecosystem.config.cjs in all subdirectories:"
  find "$TEMP_DEPLOY" -name "ecosystem.config.cjs" -type f 2>/dev/null || echo "   Not found anywhere"
  exit 1
else
  # If found in a different location, copy to root
  if [ "$ECOSYSTEM_FILE" != "$TEMP_DEPLOY/ecosystem.config.cjs" ]; then
    echo "⚠️  ecosystem.config.cjs found at $ECOSYSTEM_FILE, copying to root..."
    cp "$ECOSYSTEM_FILE" "$TEMP_DEPLOY/ecosystem.config.cjs" || {
      echo "⚠️  Failed to copy, but file exists at $ECOSYSTEM_FILE"
    }
  fi
  echo "✅ ecosystem.config.cjs found"
fi

# Verify .next directory
NEXT_DIR=$(find "$TEMP_DEPLOY" -maxdepth 2 -name ".next" -type d 2>/dev/null | head -1)
if [ -z "$NEXT_DIR" ]; then
  echo "❌ ERROR: .next directory not found after extraction"
  echo "📁 Temp directory contents:"
  ls -lah "$TEMP_DEPLOY" 2>/dev/null | head -20
  echo "📁 Searching for .next in all subdirectories:"
  find "$TEMP_DEPLOY" -name ".next" -type d 2>/dev/null || echo "   Not found anywhere"
  exit 1
else
  # If found in a different location, ensure we reference it correctly
  if [ "$NEXT_DIR" != "$TEMP_DEPLOY/.next" ]; then
    echo "⚠️  .next found at $NEXT_DIR, ensuring it's accessible from root..."
    if [ ! -e "$TEMP_DEPLOY/.next" ]; then
      ln -s "$NEXT_DIR" "$TEMP_DEPLOY/.next" 2>/dev/null || {
        echo "⚠️  Symlink failed, .next is at $NEXT_DIR"
        NEXT_DIR="$NEXT_DIR"
      }
    fi
  fi
fi

# Verify standalone directory
STANDALONE_DIR=$(find "$TEMP_DEPLOY" -type d -path "*/.next/standalone" 2>/dev/null | head -1)
if [ -z "$STANDALONE_DIR" ]; then
  echo "❌ ERROR: .next/standalone directory not found after extraction"
  echo "📁 .next directory contents:"
  find "$TEMP_DEPLOY" -name ".next" -type d -exec ls -lah {} \; 2>/dev/null | head -30 || echo "   Cannot list .next"
  exit 1
fi

# Verify server.js
SERVER_FILE=$(find "$TEMP_DEPLOY" -name "server.js" -path "*/.next/standalone/*" 2>/dev/null | head -1)
if [ -z "$SERVER_FILE" ]; then
  echo "❌ ERROR: .next/standalone/server.js not found after extraction"
  echo "📁 Standalone directory contents:"
  ls -lah "$STANDALONE_DIR" 2>/dev/null | head -30 || echo "   Cannot list standalone directory"
  exit 1
fi

echo "✅ Extraction verified - all critical files present"

# Get absolute path
ABS_TEMP_DEPLOY=$(cd "$TEMP_DEPLOY" && pwd)
cd "$ABS_TEMP_DEPLOY" || { echo "❌ Failed to cd to $ABS_TEMP_DEPLOY"; exit 1; }

# Next.js standalone mode includes node_modules, so skip npm install if standalone is used
if [ -d ".next/standalone" ]; then
  echo "✅ Standalone build detected. Skipping npm install."
  if [ ! -d ".next/standalone/node_modules" ]; then
    echo "⚠️  WARNING: .next/standalone/node_modules not found. This is unusual for standalone builds."
  fi
else
  echo "📦 Running npm install --production..."
  npm install --production --silent || { echo "❌ npm install failed"; exit 1; }
  echo "✅ npm install complete"
fi

# Run migrations if schema changed
if [ -f prisma/schema.prisma ]; then
  echo "🔄 Running Prisma migrations..."
  if [ ! -d "node_modules/.prisma/client" ] && [ ! -d ".next/standalone/node_modules/.prisma/client" ]; then
    echo "⚠️  WARNING: Prisma Client not found. Attempting to generate..."
    npx prisma generate || { echo "❌ Prisma generate failed"; exit 1; }
  fi
  npx prisma migrate deploy || { echo "❌ Prisma migrate deploy failed"; exit 1; }
  echo "✅ Prisma migrations complete"
fi

# CRITICAL: Pre-PM2 verification
echo "🔍 Pre-PM2 verification..."
if [ ! -f "ecosystem.config.cjs" ]; then
  echo "❌ ERROR: ecosystem.config.cjs not found for PM2 startup."
  exit 1
fi

if [ ! -d ".next" ]; then
  echo "❌ ERROR: .next directory not found for PM2 startup."
  exit 1
fi

# Verify at least one valid server option exists
if [ -f ".next/standalone/server.js" ]; then
  echo "✅ .next/standalone/server.js found."
elif [ -f "server.cjs" ]; then
  echo "✅ server.cjs found."
elif [ -d ".next/server" ]; then
  echo "✅ .next/server directory found."
else
  echo "❌ ERROR: No valid server entry point found for PM2."
  exit 1
fi

echo "✅ PM2 pre-verification complete."

# Set environment variables for PM2
export NODE_ENV=production
export DATABASE_URL="$DATABASE_URL"

# Start PM2 in test mode
echo "🚀 Starting PM2 in test mode (jobportal-test) from $ABS_TEMP_DEPLOY..."
PM2_OUTPUT=$(pm2 start ecosystem.config.cjs --name jobportal-test --env production --watch false --no-daemon 2>&1 || true)
PM2_EXIT=$?

if [ $PM2_EXIT -eq 0 ]; then
  echo "✅ PM2 started successfully in test mode."
  
  # Health check with retries
  HEALTH_CHECK_PASSED=0
  for i in $(seq 1 3); do
    echo "🩺 Health check attempt $i..."
    if curl -f -s http://localhost:3000/api/health > /dev/null 2>&1; then
      echo "✅ Health check passed."
      HEALTH_CHECK_PASSED=1
      break
    else
      echo "❌ Health check failed. Retrying in 5 seconds..."
      sleep 5
    fi
  done
  
  if [ $HEALTH_CHECK_PASSED -eq 1 ]; then
    echo "✅ Application is healthy in temp folder."
    
    # Success: backup current and swap
    echo "🔄 Swapping to production..."
    if [ -d "$PROD_DEPLOY" ]; then
      echo "📦 Backing up current production to $BACKUP_PATH..."
      mkdir -p "$BACKUP_PATH"
      mv "$PROD_DEPLOY" "$BACKUP_PATH" || {
        echo "❌ Failed to backup current production"
        exit 1
      }
      echo "✅ Backup complete."
    fi
    
    # Move new deployment to production
    echo "🚚 Moving new deployment from $TEMP_DEPLOY to $PROD_DEPLOY..."
    mv "$TEMP_DEPLOY" "$PROD_DEPLOY" || {
      echo "❌ Failed to move new deployment to production"
      exit 1
    }
    echo "✅ New deployment moved to production."
    
    # CRITICAL: Verify files exist after swap
    echo "🔍 Verifying files after swap..."
    if [ ! -d "$PROD_DEPLOY/.next" ]; then
      echo "❌ ERROR: .next directory missing after swap"
      exit 1
    fi
    
    if [ ! -f "$PROD_DEPLOY/ecosystem.config.cjs" ]; then
      echo "❌ ERROR: ecosystem.config.cjs missing after swap"
      exit 1
    fi
    
    echo "✅ File swap completed successfully"
    
    cd "$PROD_DEPLOY" || { echo "❌ Failed to cd to $PROD_DEPLOY"; exit 1; }
    
    pm2 delete jobportal 2>/dev/null || true
    
    # Set environment for production
    export NODE_ENV=production
    export DATABASE_URL="$DATABASE_URL"
    
    echo "🚀 Starting production PM2 from $PROD_DEPLOY..."
    if pm2 start ecosystem.config.cjs --name jobportal --env production; then
      pm2 save --force
      sleep 3
      # Final health check
      if curl -f -s http://localhost:3000/api/health > /dev/null 2>&1; then
        echo "✅ Production deployment successful"
        # Clean old backups (keep last 3)
        cd "$BACKUP_FOLDER"
        ls -t 2>/dev/null | tail -n +4 | xargs -r rm -rf 2>/dev/null || true
        rm -f "$STAGING_PATH"
      else
        echo "❌ Production health check failed"
        pm2 logs jobportal --lines 30 || true
        exit 1
      fi
    else
      echo "❌ PM2 failed, rolling back..."
      if [ -d "$BACKUP_PATH/.next" ]; then
        cp -r "$BACKUP_PATH/.next" "$PROD_DEPLOY/" || true
        pm2 start ecosystem.config.cjs --env production || true
      fi
      exit 1
    fi
  else
    echo "❌ Health check failed in temp folder after 3 attempts"
    pm2 delete jobportal-test 2>/dev/null || true
    rm -rf "$TEMP_DEPLOY"
    exit 1
  fi
else
  echo "❌ PM2 start failed (exit code: $PM2_EXIT)"
  echo "📋 PM2 output: $PM2_OUTPUT"
  exit 1
fi

