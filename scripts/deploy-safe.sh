#!/bin/bash

# Safe Deployment Script
# Ensures build completes and all files exist before PM2 deployment

set -e  # Exit on error

echo "🚀 Starting safe deployment process..."
echo "======================================"

# Step 1: Verify dependencies
echo ""
echo "1️⃣ Checking dependencies..."
if ! node scripts/pre-build-check.cjs; then
    echo "❌ Dependency check failed!"
    exit 1
fi

# Step 2: Build the application
echo ""
echo "2️⃣ Building application..."
if ! npm run build; then
    echo "❌ Build failed!"
    exit 1
fi

# Step 3: Verify build artifacts
echo ""
echo "3️⃣ Verifying build artifacts..."
if ! node scripts/post-build-verify.cjs; then
    echo "❌ Build verification failed!"
    exit 1
fi

# Step 4: Verify deployment files
echo ""
echo "4️⃣ Verifying deployment files..."
if ! node scripts/verify-deployment-files.cjs; then
    echo "❌ Deployment file verification failed!"
    exit 1
fi

# Step 5: Deploy with PM2
echo ""
echo "5️⃣ Deploying with PM2..."
if command -v pm2 &> /dev/null; then
    pm2 start ecosystem.config.cjs --env production --update-env
    echo "✅ Deployment completed successfully!"
    echo ""
    echo "📊 Check status with: pm2 status"
    echo "📋 View logs with: pm2 logs naukrimili"
else
    echo "⚠️ PM2 not found. Install with: npm install -g pm2"
    echo "💡 Starting server directly with: node server.cjs"
    node server.cjs
fi

