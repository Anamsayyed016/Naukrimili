#!/bin/bash
set -e

echo "🚀 Starting job search fix deployment..."

# Navigate to the project directory
cd /var/www/jobportal

# Pull latest changes
echo "Updating code from Git..."
git pull origin main

# Install dependencies
echo "Installing dependencies..."
npm install --legacy-peer-deps --force

# Build the Next.js application
echo "Building Next.js application..."
npm run build

# Restart PM2 process to apply changes
echo "Restarting PM2 process..."
pm2 restart jobportal --update-env

echo "✅ Deployment completed successfully!"
