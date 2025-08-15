#!/bin/bash
set -euo pipefail
cd /var/www/jobportal

# Pull latest code
git fetch --all
git reset --hard origin/main

# Clean install (avoid peer dependency conflicts)
rm -rf node_modules .next
npm install --omit=dev --legacy-peer-deps

# Ensure resume processing dependencies are present
npm install --legacy-peer-deps react-dropzone pdf-parse mammoth

# Build the application
npm run build

# Restart the service
systemctl restart jobportal

echo "Deployment completed successfully!"
