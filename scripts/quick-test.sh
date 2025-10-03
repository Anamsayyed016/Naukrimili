#!/bin/bash

# 🧪 Quick Deployment Test
# Tests if everything is ready for deployment

echo "🧪 Quick Deployment Test"
echo "========================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Not in project directory"
    exit 1
fi

echo "✅ In project directory"

# Check if workflow file exists
if [ -f ".github/workflows/deploy.yml" ]; then
    echo "✅ GitHub workflow exists"
else
    echo "❌ GitHub workflow missing"
    exit 1
fi

# Check if ecosystem config exists
if [ -f "ecosystem.config.cjs" ]; then
    echo "✅ PM2 config exists"
else
    echo "❌ PM2 config missing"
    exit 1
fi

# Check if we're in GitHub Actions
if [ -n "$GITHUB_ACTIONS" ]; then
    echo "✅ Running in GitHub Actions"
    
    # Check secrets
    if [ -n "$HOST" ] && [ -n "$SSH_USER" ] && [ -n "$SSH_KEY" ] && [ -n "$SSH_PORT" ]; then
        echo "✅ All GitHub secrets are available"
    else
        echo "❌ Missing GitHub secrets"
        echo "  HOST: ${HOST:-NOT_SET}"
        echo "  SSH_USER: ${SSH_USER:-NOT_SET}"
        echo "  SSH_KEY: ${SSH_KEY:+SET}"
        echo "  SSH_PORT: ${SSH_PORT:-NOT_SET}"
        exit 1
    fi
else
    echo "⚠️ Not in GitHub Actions - secrets not available for testing"
fi

# Check Node.js version
NODE_VERSION=$(node --version 2>/dev/null || echo "not-installed")
echo "🔍 Node.js version: $NODE_VERSION"

if [[ "$NODE_VERSION" =~ ^v20\. ]]; then
    echo "✅ Node.js version is correct (20.x)"
else
    echo "⚠️ Node.js version is not 20.x - will be installed during deployment"
fi

# Check if UI components exist
if [ -d "components/ui" ] && [ -f "components/ui/card.tsx" ]; then
    echo "✅ UI components exist"
else
    echo "⚠️ UI components missing - will be created during deployment"
fi

# Check if lib directory exists
if [ -d "lib" ] && [ -f "lib/utils.ts" ]; then
    echo "✅ lib directory exists"
else
    echo "⚠️ lib directory missing - will be created during deployment"
fi

echo ""
echo "🎉 All checks passed! Ready for deployment."
echo ""
echo "To deploy:"
echo "1. Commit and push your changes"
echo "2. The GitHub Actions workflow will automatically run"
echo "3. Check the Actions tab for deployment progress"
echo ""
echo "If deployment fails, check the logs in the Actions tab."
