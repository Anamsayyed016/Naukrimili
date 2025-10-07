#!/bin/bash

echo "🚀 Deploying job search fix to production..."

# Set error handling
set -e

# Navigate to project directory
cd /var/www/jobportal

echo "📦 Installing dependencies..."
npm install --legacy-peer-deps --force

echo "🔧 Building application..."
npm run build

echo "🔄 Restarting PM2..."
pm2 restart jobportal --update-env

echo "✅ Job search fix deployed successfully!"
echo "🔍 The main jobs API now calls external APIs before generating sample jobs"
echo "📊 Users should now see real jobs from Adzuna, Indeed, and ZipRecruiter when searching with filters"

# Show PM2 status
pm2 status

echo "🎉 Deployment complete!"
