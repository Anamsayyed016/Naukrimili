#!/bin/bash

echo "🔧 COMPREHENSIVE CHUNK CLEANUP SCRIPT"
echo "====================================="

# Define problematic chunk IDs
CHUNK1="4bd1b696-100b9d70ed4e49c1"
CHUNK2="1255-97815b72abc5c1f0"

echo "🎯 Target chunks: $CHUNK1 and $CHUNK2"
echo ""

# Stop the application
echo "🛑 Stopping application..."
pm2 stop jobportal 2>/dev/null || true
sleep 2

# Remove physical chunk files
echo "🗑️ Removing physical chunk files..."
rm -f .next/static/chunks/$CHUNK1.js
rm -f .next/static/chunks/$CHUNK2.js
echo "✅ Physical files removed"

# Find all files containing chunk references
echo "🔍 Finding all files with chunk references..."
FILES_WITH_CHUNKS=$(find .next -type f \( -name "*.json" -o -name "*.js" -o -name "*.html" \) -exec grep -l "$CHUNK1\|$CHUNK2" {} \; 2>/dev/null)

if [ -z "$FILES_WITH_CHUNKS" ]; then
    echo "✅ No files found with chunk references"
else
    echo "📁 Files containing chunk references:"
    echo "$FILES_WITH_CHUNKS"
    echo ""
    
    # Remove chunk references from each file
    echo "🧹 Removing chunk references from files..."
    for file in $FILES_WITH_CHUNKS; do
        echo "  Processing: $file"
        
        # Create backup
        cp "$file" "$file.backup"
        
        # Remove chunk references using sed
        sed -i "s/static\/chunks\/$CHUNK1\.js,//g" "$file"
        sed -i "s/static\/chunks\/$CHUNK2\.js,//g" "$file"
        sed -i "s/$CHUNK1\.js,//g" "$file"
        sed -i "s/$CHUNK2\.js,//g" "$file"
        sed -i "s/$CHUNK1,//g" "$file"
        sed -i "s/$CHUNK2,//g" "$file"
        sed -i "s/$CHUNK1//g" "$file"
        sed -i "s/$CHUNK2//g" "$file"
        
        echo "    ✅ Cleaned: $file"
    done
    echo ""
fi

# Clean up any remaining references in specific known files
echo "🎯 Targeting specific known files..."
KNOWN_FILES=(
    ".next/build-manifest.json"
    ".next/app-build-manifest.json" 
    ".next/server/middleware-build-manifest.js"
    ".next/server/app/layout.html"
    ".next/server/app/page.html"
    ".next/server/app/auth/signin.html"
    ".next/server/app/auth/signup.html"
)

for file in "${KNOWN_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "  Processing: $file"
        sed -i "s/static\/chunks\/$CHUNK1\.js,//g" "$file" 2>/dev/null || true
        sed -i "s/static\/chunks\/$CHUNK2\.js,//g" "$file" 2>/dev/null || true
        sed -i "s/$CHUNK1\.js,//g" "$file" 2>/dev/null || true
        sed -i "s/$CHUNK2\.js,//g" "$file" 2>/dev/null || true
        sed -i "s/$CHUNK1,//g" "$file" 2>/dev/null || true
        sed -i "s/$CHUNK2,//g" "$file" 2>/dev/null || true
        sed -i "s/$CHUNK1//g" "$file" 2>/dev/null || true
        sed -i "s/$CHUNK2//g" "$file" 2>/dev/null || true
        echo "    ✅ Cleaned: $file"
    fi
done

# Remove any empty script tags or malformed references
echo "🧽 Cleaning up malformed references..."
find .next -type f \( -name "*.html" \) -exec sed -i 's/<script src="\/_next\/static\/chunks\/[^"]*\.js" async=""><\/script>//g' {} \; 2>/dev/null || true
find .next -type f \( -name "*.html" \) -exec sed -i 's/<script src="\/_next\/static\/chunks\/[^"]*\.js" async=""><\/script>//g' {} \; 2>/dev/null || true

# Verify cleanup
echo "🔍 Verifying cleanup..."
REMAINING_CHUNKS=$(find .next -type f -exec grep -l "$CHUNK1\|$CHUNK2" {} \; 2>/dev/null)

if [ -z "$REMAINING_CHUNKS" ]; then
    echo "✅ SUCCESS: No chunk references found!"
else
    echo "⚠️  WARNING: Some references still remain:"
    echo "$REMAINING_CHUNKS"
    echo ""
    echo "🔧 Attempting additional cleanup..."
    
    # More aggressive cleanup
    for file in $REMAINING_CHUNKS; do
        echo "  Aggressive cleanup: $file"
        # Remove entire lines containing the chunks
        sed -i "/$CHUNK1/d" "$file" 2>/dev/null || true
        sed -i "/$CHUNK2/d" "$file" 2>/dev/null || true
    done
fi

# Clean build cache and rebuild
echo "🏗️ Rebuilding application with fresh chunks..."
rm -rf .next/static/chunks/*
rm -rf node_modules/.cache
export NODE_ENV=production
export NEXT_PUBLIC_BUILD_TIME=$(date +%s)000
export NEXT_PUBLIC_DEPLOYMENT_ID=$(date +%s)

npm run build

# Restart application
echo "🔄 Restarting application..."
pm2 start "npm run start" --name jobportal
pm2 save

sleep 5

# Final verification
echo "🔍 Final verification..."
if pm2 list | grep -q "jobportal.*online"; then
    echo "✅ Application is running"
    
    # Test for chunk references in the served HTML
    echo "🧪 Testing served content..."
    sleep 3
    
    CHUNKS_IN_RESPONSE=$(curl -s http://localhost:3000 | grep -o "$CHUNK1\|$CHUNK2" || echo "NONE")
    
    if [ "$CHUNKS_IN_RESPONSE" = "NONE" ]; then
        echo "🎉 SUCCESS: No problematic chunks found in served content!"
        echo "✅ Your website should now work without chunk errors!"
    else
        echo "⚠️  WARNING: Chunks still found in served content: $CHUNKS_IN_RESPONSE"
        echo "🔄 Try accessing the website and check if it works despite the warnings"
    fi
else
    echo "❌ Application failed to start. Check PM2 logs:"
    pm2 logs jobportal --lines 20
fi

echo ""
echo "🏁 Cleanup complete! Check your website now."
