#!/bin/bash

# Load environment variables from .env file and start PM2
# This ensures all env vars are available before PM2 starts

echo "🔧 Loading environment variables from .env..."

# Export all variables from .env file
if [ -f .env ]; then
  export $(cat .env | grep -v '^#' | grep -v '^$' | xargs)
  echo "✅ Environment variables loaded from .env"
else
  echo "⚠️  Warning: .env file not found!"
fi

# Display Gmail credentials status (masked)
if [ -n "$GMAIL_API_CLIENT_ID" ]; then
  echo "✅ GMAIL_API_CLIENT_ID is set"
else
  echo "❌ GMAIL_API_CLIENT_ID is NOT set"
fi

if [ -n "$GMAIL_API_REFRESH_TOKEN" ]; then
  echo "✅ GMAIL_API_REFRESH_TOKEN is set"
else
  echo "❌ GMAIL_API_REFRESH_TOKEN is NOT set"
fi

# Delete existing PM2 process
echo "🛑 Stopping existing PM2 process..."
pm2 delete naukrimili 2>/dev/null || true

# Start PM2 with ecosystem config
echo "🚀 Starting PM2 with ecosystem config..."
pm2 start ecosystem.config.cjs

# Save PM2 config
echo "💾 Saving PM2 config..."
pm2 save

echo "✅ PM2 started successfully!"
echo ""
echo "📊 PM2 Status:"
pm2 status

echo ""
echo "🔍 Verifying Gmail credentials in PM2:"
pm2 env 0 | grep -E "GMAIL_API_CLIENT_ID|GMAIL_API_REFRESH_TOKEN" | head -2

