#!/bin/bash

# Nuclear CI Fix - Most aggressive fix possible
# This script ensures ALL modules are available

set -e

echo "🚀 NUCLEAR CI FIX - Starting..."

# Step 1: Complete cleanup
echo "🧹 Nuclear cleanup..."
rm -rf node_modules
rm -rf package-lock.json
rm -rf .next
rm -rf .npm
npm cache clean --force

# Step 2: Create .npmrc
echo "⚙️ Creating .npmrc..."
cat > .npmrc << 'EOF'
engine-strict=false
legacy-peer-deps=true
fund=false
audit=false
EOF

# Step 3: Install ALL dependencies
echo "📦 Installing ALL dependencies..."
npm install --legacy-peer-deps --engine-strict=false --force

# Step 4: Install missing packages as both regular and dev dependencies
echo "📦 Installing missing packages as regular dependencies..."
npm install tailwindcss postcss autoprefixer @radix-ui/react-slot @radix-ui/react-dialog @radix-ui/react-dropdown-menu @radix-ui/react-toast class-variance-authority clsx tailwind-merge lucide-react --legacy-peer-deps --engine-strict=false

echo "📦 Installing missing packages as dev dependencies..."
npm install --save-dev tailwindcss postcss autoprefixer @radix-ui/react-slot @radix-ui/react-dialog @radix-ui/react-dropdown-menu @radix-ui/react-toast class-variance-authority clsx tailwind-merge lucide-react --legacy-peer-deps --engine-strict=false

# Step 5: Verify tailwindcss is installed
echo "🔍 Verifying tailwindcss installation..."
if [ -d "node_modules/tailwindcss" ]; then
    echo "✅ tailwindcss found in node_modules"
    ls -la node_modules/tailwindcss/
else
    echo "❌ tailwindcss NOT found, installing manually..."
    npm install tailwindcss@latest --legacy-peer-deps --engine-strict=false --force
fi

# Step 6: Verify custom components exist
echo "🔍 Verifying custom components..."
if [ -f "lib/safe-array-utils.ts" ]; then
    echo "✅ safe-array-utils.ts found"
else
    echo "❌ safe-array-utils.ts missing"
fi

if [ -f "components/auth/OAuthButtons.tsx" ]; then
    echo "✅ OAuthButtons.tsx found"
else
    echo "❌ OAuthButtons.tsx missing"
fi

if [ -f "components/SEOJobLink.tsx" ]; then
    echo "✅ SEOJobLink.tsx found"
else
    echo "❌ SEOJobLink.tsx missing"
fi

if [ -f "components/UnifiedJobSearch.tsx" ]; then
    echo "✅ UnifiedJobSearch.tsx found"
else
    echo "❌ UnifiedJobSearch.tsx missing"
fi

# Step 7: Generate Prisma
echo "🔧 Generating Prisma client..."
npx prisma generate

# Step 8: Build
echo "🏗️ Building application..."
export NODE_ENV=production
export NODE_OPTIONS="--max-old-space-size=4096"
export NEXT_PUBLIC_BUILD_TIME=$(date +%s)000
npx next build

echo "✅ Nuclear CI Fix Complete!"
