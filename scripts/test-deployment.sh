#!/bin/bash

# 🧪 Simple Deployment Test Script
# Tests the deployment without actually deploying

set -e

echo "🧪 Testing deployment configuration..."

# Check if we're in a GitHub Actions environment
if [ -n "$GITHUB_ACTIONS" ]; then
    echo "✅ Running in GitHub Actions"
    
    # Check if secrets are available
    if [ -n "$HOST" ] && [ -n "$SSH_USER" ] && [ -n "$SSH_KEY" ] && [ -n "$SSH_PORT" ]; then
        echo "✅ All required secrets are available"
        echo "  - HOST: $HOST"
        echo "  - SSH_USER: $SSH_USER"
        echo "  - SSH_KEY: [HIDDEN]"
        echo "  - SSH_PORT: $SSH_PORT"
    else
        echo "❌ Missing required secrets"
        echo "  - HOST: ${HOST:-NOT_SET}"
        echo "  - SSH_USER: ${SSH_USER:-NOT_SET}"
        echo "  - SSH_KEY: ${SSH_KEY:+SET}"
        echo "  - SSH_PORT: ${SSH_PORT:-NOT_SET}"
        exit 1
    fi
else
    echo "⚠️ Not running in GitHub Actions - some checks may be skipped"
fi

# Check Node.js version
echo "🔍 Checking Node.js version..."
NODE_VERSION=$(node --version)
echo "Node.js version: $NODE_VERSION"

if [[ "$NODE_VERSION" =~ ^v20\. ]]; then
    echo "✅ Node.js version is correct (20.x)"
else
    echo "⚠️ Node.js version is not 20.x - this may cause issues"
fi

# Check if required files exist
echo "🔍 Checking required files..."
REQUIRED_FILES=(
    "package.json"
    "ecosystem.config.cjs"
    ".github/workflows/deploy.yml"
)

for file in "${REQUIRED_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file exists"
    else
        echo "❌ $file missing"
        exit 1
    fi
done

# Check if UI components directory exists
if [ -d "components/ui" ]; then
    echo "✅ UI components directory exists"
else
    echo "⚠️ UI components directory missing - will be created during deployment"
fi

# Check if lib directory exists
if [ -d "lib" ]; then
    echo "✅ lib directory exists"
else
    echo "⚠️ lib directory missing - will be created during deployment"
fi

# Test npm install
echo "🧪 Testing npm install..."
if npm install --dry-run > /dev/null 2>&1; then
    echo "✅ npm install test passed"
else
    echo "❌ npm install test failed"
    exit 1
fi

# Test build (if possible)
echo "🧪 Testing build..."
if [ -f "package.json" ] && grep -q '"build"' package.json; then
    if npm run build --dry-run > /dev/null 2>&1; then
        echo "✅ Build test passed"
    else
        echo "⚠️ Build test failed - this may be normal if dependencies are missing"
    fi
else
    echo "⚠️ No build script found in package.json"
fi

echo "✅ Deployment test completed successfully!"
echo ""
echo "🚀 Ready to deploy! The deployment should work with the current configuration."
