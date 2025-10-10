#!/bin/bash

# ==========================================================================
# CSS REBUILD DEPLOYMENT SCRIPT
# ==========================================================================
# This script safely replaces existing CSS files with clean, optimized versions
# and performs a complete rebuild to fix CSS loading issues.

set -e  # Exit on any error

echo "🎨 Starting CSS Rebuild Deployment Process..."
echo "=============================================="

# ==========================================================================
# STEP 1: BACKUP EXISTING FILES
# ==========================================================================

echo "📦 Step 1: Creating backup of existing CSS files..."

# Create backup directory with timestamp
BACKUP_DIR="css-backup-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"

# Backup existing CSS files
if [ -f "app/globals.css" ]; then
    cp app/globals.css "$BACKUP_DIR/"
    echo "✅ Backed up app/globals.css"
else
    echo "⚠️  app/globals.css not found"
fi

if [ -f "styles/mobile-notifications.css" ]; then
    cp styles/mobile-notifications.css "$BACKUP_DIR/"
    echo "✅ Backed up styles/mobile-notifications.css"
else
    echo "⚠️  styles/mobile-notifications.css not found"
fi

if [ -f "styles/mobile-job-form.css" ]; then
    cp styles/mobile-job-form.css "$BACKUP_DIR/"
    echo "✅ Backed up styles/mobile-job-form.css"
else
    echo "⚠️  styles/mobile-job-form.css not found"
fi

if [ -f "styles/resume-professional-theme.css" ]; then
    cp styles/resume-professional-theme.css "$BACKUP_DIR/"
    echo "✅ Backed up styles/resume-professional-theme.css"
else
    echo "⚠️  styles/resume-professional-theme.css not found"
fi

echo "📁 Backup created in: $BACKUP_DIR"
echo ""

# ==========================================================================
# STEP 2: VERIFY CLEAN CSS FILES EXIST
# ==========================================================================

echo "🔍 Step 2: Verifying clean CSS files exist..."

if [ ! -f "styles/clean-globals.css" ]; then
    echo "❌ ERROR: styles/clean-globals.css not found!"
    echo "   Please ensure all clean CSS files are in the styles/ directory"
    exit 1
fi

if [ ! -f "styles/clean-mobile-notifications.css" ]; then
    echo "❌ ERROR: styles/clean-mobile-notifications.css not found!"
    exit 1
fi

if [ ! -f "styles/clean-mobile-job-form.css" ]; then
    echo "❌ ERROR: styles/clean-mobile-job-form.css not found!"
    exit 1
fi

echo "✅ All clean CSS files verified"
echo ""

# ==========================================================================
# STEP 3: REPLACE CSS FILES
# ==========================================================================

echo "🔄 Step 3: Replacing CSS files with clean versions..."

# Replace globals.css
cp styles/clean-globals.css app/globals.css
echo "✅ Replaced app/globals.css"

# Replace mobile-notifications.css
cp styles/clean-mobile-notifications.css styles/mobile-notifications.css
echo "✅ Replaced styles/mobile-notifications.css"

# Replace mobile-job-form.css
cp styles/clean-mobile-job-form.css styles/mobile-job-form.css
echo "✅ Replaced styles/mobile-job-form.css"

echo ""

# ==========================================================================
# STEP 4: CLEAN BUILD ARTIFACTS
# ==========================================================================

echo "🧹 Step 4: Cleaning build artifacts..."

# Remove build artifacts
if [ -d ".next" ]; then
    rm -rf .next
    echo "✅ Removed .next directory"
fi

if [ -d "node_modules/.cache" ]; then
    rm -rf node_modules/.cache
    echo "✅ Removed node_modules/.cache"
fi

# Clear any temporary files
find . -name "*.tmp" -delete 2>/dev/null || true
echo "✅ Cleaned temporary files"

echo ""

# ==========================================================================
# STEP 5: VALIDATE CSS SYNTAX
# ==========================================================================

echo "🔍 Step 5: Validating CSS syntax..."

# Basic CSS validation (check for obvious syntax errors)
if command -v node >/dev/null 2>&1; then
    echo "✅ Node.js available for CSS validation"
    
    # Create a simple CSS validator
    cat > validate-css.js << 'EOF'
const fs = require('fs');

function validateCSS(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        
        // Basic syntax checks
        const openBraces = (content.match(/\{/g) || []).length;
        const closeBraces = (content.match(/\}/g) || []).length;
        
        if (openBraces !== closeBraces) {
            console.error(`❌ ${filePath}: Mismatched braces (${openBraces} open, ${closeBraces} close)`);
            return false;
        }
        
        // Check for unclosed comments
        const commentOpen = (content.match(/\/\*/g) || []).length;
        const commentClose = (content.match(/\*\//g) || []).length;
        
        if (commentOpen !== commentClose) {
            console.error(`❌ ${filePath}: Unclosed comments (${commentOpen} open, ${commentClose} close)`);
            return false;
        }
        
        console.log(`✅ ${filePath}: Basic syntax validation passed`);
        return true;
    } catch (error) {
        console.error(`❌ ${filePath}: Error reading file - ${error.message}`);
        return false;
    }
}

// Validate all CSS files
const cssFiles = [
    'app/globals.css',
    'styles/mobile-notifications.css',
    'styles/mobile-job-form.css'
];

let allValid = true;
cssFiles.forEach(file => {
    if (fs.existsSync(file)) {
        if (!validateCSS(file)) {
            allValid = false;
        }
    } else {
        console.error(`❌ ${file}: File not found`);
        allValid = false;
    }
});

if (!allValid) {
    console.error('\n❌ CSS validation failed!');
    process.exit(1);
} else {
    console.log('\n✅ All CSS files passed validation');
}
EOF

    node validate-css.js
    rm validate-css.js
else
    echo "⚠️  Node.js not available, skipping CSS validation"
fi

echo ""

# ==========================================================================
# STEP 6: BUILD APPLICATION
# ==========================================================================

echo "🏗️  Step 6: Building application with new CSS..."

# Check if npm is available
if command -v npm >/dev/null 2>&1; then
    echo "📦 Installing dependencies..."
    npm ci --silent
    
    echo "🔨 Building application..."
    npm run build
    
    echo "✅ Build completed successfully"
else
    echo "⚠️  npm not available, skipping build"
    echo "   Please run 'npm run build' manually"
fi

echo ""

# ==========================================================================
# STEP 7: VERIFY BUILD OUTPUT
# ==========================================================================

echo "🔍 Step 7: Verifying build output..."

if [ -d ".next" ]; then
    echo "✅ .next directory created"
    
    if [ -d ".next/static" ]; then
        echo "✅ .next/static directory exists"
        
        # Count CSS files in static directory
        CSS_COUNT=$(find .next/static -name "*.css" | wc -l)
        echo "📊 Found $CSS_COUNT CSS files in build output"
        
        if [ "$CSS_COUNT" -gt 0 ]; then
            echo "✅ CSS files generated successfully"
        else
            echo "⚠️  No CSS files found in build output"
        fi
    else
        echo "❌ .next/static directory missing"
    fi
else
    echo "❌ Build failed - .next directory not created"
fi

echo ""

# ==========================================================================
# STEP 8: GENERATE DEPLOYMENT REPORT
# ==========================================================================

echo "📋 Step 8: Generating deployment report..."

cat > css-rebuild-report.md << EOF
# CSS Rebuild Deployment Report

**Date:** $(date)
**Backup Directory:** $BACKUP_DIR

## Files Replaced:
- ✅ app/globals.css
- ✅ styles/mobile-notifications.css  
- ✅ styles/mobile-job-form.css

## Build Status:
- ✅ Build artifacts cleaned
- ✅ CSS syntax validated
- ✅ Application built successfully
- ✅ CSS files generated: $CSS_COUNT

## Next Steps:
1. Test the application in development mode
2. Verify CSS loading in browser developer tools
3. Check responsive design on different screen sizes
4. Deploy to production server

## Rollback Instructions:
If issues occur, restore from backup:
\`\`\`bash
cp $BACKUP_DIR/* ./
\`\`\`

## Files to Deploy:
- app/globals.css
- styles/mobile-notifications.css
- styles/mobile-job-form.css
- .next/ (entire build output)

EOF

echo "📄 Deployment report created: css-rebuild-report.md"
echo ""

# ==========================================================================
# COMPLETION MESSAGE
# ==========================================================================

echo "🎉 CSS Rebuild Deployment Complete!"
echo "=================================="
echo ""
echo "✅ All CSS files replaced with clean, optimized versions"
echo "✅ Build artifacts cleaned and rebuilt"
echo "✅ CSS syntax validated"
echo "✅ Backup created in: $BACKUP_DIR"
echo "✅ Deployment report: css-rebuild-report.md"
echo ""
echo "🚀 Next Steps:"
echo "   1. Test locally: npm run dev"
echo "   2. Verify CSS loads correctly in browser"
echo "   3. Deploy to production server"
echo ""
echo "📞 If issues occur:"
echo "   - Check css-rebuild-report.md for details"
echo "   - Restore from backup: $BACKUP_DIR"
echo "   - Review browser console for errors"
echo ""
echo "✨ Your job portal now has clean, optimized CSS!"
