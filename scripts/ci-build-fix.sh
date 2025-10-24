#!/bin/bash

# CI Build Fix Script
# This script fixes the CI/CD build issues

set -e

echo "🔧 Fixing CI Build Issues..."

# Step 1: Remove package-lock.json to force fresh install
echo "🧹 Removing package-lock.json..."
rm -f package-lock.json

# Step 2: Create .npmrc with engine bypass
echo "⚙️ Creating .npmrc..."
cat > .npmrc << 'EOF'
engine-strict=false
legacy-peer-deps=true
fund=false
audit=false
EOF

# Step 3: Use npm install instead of npm ci
echo "📦 Installing dependencies with npm install..."
npm install --legacy-peer-deps --engine-strict=false --force

# Step 4: Install missing packages explicitly
echo "📦 Installing missing packages..."
npm install tailwindcss postcss autoprefixer @radix-ui/react-slot @radix-ui/react-dialog @radix-ui/react-dropdown-menu @radix-ui/react-toast class-variance-authority clsx tailwind-merge lucide-react --legacy-peer-deps --engine-strict=false

# Step 5: Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate

# Step 6: Build the application
echo "🏗️ Building application..."
export NODE_ENV=production
export NODE_OPTIONS="--max-old-space-size=4096"
npm run build

echo "✅ CI Build Fix Complete!"
