#!/usr/bin/env bash
# exit on error
set -o errexit

# Install dependencies
echo "Installing dependencies..."
pnpm install

# Build the application
echo "Building the application..."
pnpm run build

# Ensure environment variables are set
echo "Checking environment variables..."
if [ -f .env.production ]; then
  set -o allexport
  source .env.production
  set +o allexport
fi

# Post-build optimizations
echo "Running post-build optimizations..."
pnpm prune --production
