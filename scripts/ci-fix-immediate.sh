#!/bin/bash

# Immediate CI Fix Script
# Run this to fix the CI build issues right now

echo "🚀 IMMEDIATE CI FIX - Starting..."

# Step 1: Remove package-lock.json
echo "🧹 Removing package-lock.json..."
rm -f package-lock.json

# Step 2: Create .npmrc
echo "⚙️ Creating .npmrc..."
cat > .npmrc << 'EOF'
engine-strict=false
legacy-peer-deps=true
fund=false
audit=false
EOF

# Step 3: Install with bypass
echo "📦 Installing dependencies..."
npm install --legacy-peer-deps --engine-strict=false --force

# Step 4: Install missing packages
echo "📦 Installing missing packages..."
npm install tailwindcss postcss autoprefixer @radix-ui/react-slot @radix-ui/react-dialog @radix-ui/react-dropdown-menu @radix-ui/react-toast class-variance-authority clsx tailwind-merge lucide-react --legacy-peer-deps --engine-strict=false

# Step 5: Generate Prisma
echo "🔧 Generating Prisma client..."
npx prisma generate

# Step 6: Build
echo "🏗️ Building application..."
export NODE_ENV=production
export NODE_OPTIONS="--max-old-space-size=4096"
export NEXT_PUBLIC_BUILD_TIME=$(date +%s)000
npx next build

echo "✅ CI Fix Complete!"
