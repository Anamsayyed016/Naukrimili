#!/bin/bash

# Production Deployment Script for NaukriMili Job Portal
echo "🚀 Starting production deployment..."

# Set production environment
export NODE_ENV=production
export NEXT_TELEMETRY_DISABLED=1

# Clean previous builds
echo "🧹 Cleaning previous builds..."
rm -rf .next
rm -rf out

# Install dependencies (production only)
echo "📦 Installing production dependencies..."
npm ci --only=production --legacy-peer-deps

# Build the application
echo "🔨 Building application..."
npm run build

# Create production directory
echo "📁 Creating production directory..."
mkdir -p production

# Copy necessary files
echo "📋 Copying production files..."
cp -r .next production/
cp -r public production/
cp -r app production/
cp -r components production/
cp -r lib production/
cp -r types production/
cp -r prisma production/
cp package.json production/
cp next.config.js production/
cp ecosystem.config.js production/

# Create production start script
cat > production/start.sh << 'EOF'
#!/bin/bash
export NODE_ENV=production
export PORT=3000
export HOSTNAME=0.0.0.0

# Start the application
echo "🚀 Starting NaukriMili Job Portal..."
npm start
EOF

chmod +x production/start.sh

echo "✅ Production build complete!"
echo "📁 Production files are in: ./production/"
echo "🚀 Run: cd production && ./start.sh"
