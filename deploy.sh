#!/bin/bash
# Simple deployment script

echo "🚀 Deploying to Vercel..."

# Install Vercel CLI if not installed
if ! command -v vercel &> /dev/null; then
    echo "Installing Vercel CLI..."
    npm install -g vercel
fi

# Deploy to production
vercel --prod

echo "✅ Deployment complete!"
echo "Check your deployment at: https://vercel.com/dashboard"