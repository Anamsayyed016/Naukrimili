#!/bin/bash
# Script to set Razorpay LIVE keys as environment variables
# Run this on your production server

echo "🔴 Setting Razorpay LIVE Keys for Production"
echo ""
echo "⚠️  IMPORTANT: This will process REAL MONEY transactions!"
echo ""

# Prompt for LIVE Key ID
read -p "Enter your Razorpay LIVE Key ID (starts with rzp_live_): " LIVE_KEY_ID

# Validate key format
if [[ ! $LIVE_KEY_ID == rzp_live_* ]]; then
    echo "❌ Error: Key ID must start with 'rzp_live_'"
    exit 1
fi

# Prompt for LIVE Key Secret
read -s -p "Enter your Razorpay LIVE Key Secret: " LIVE_KEY_SECRET
echo ""

if [ -z "$LIVE_KEY_SECRET" ]; then
    echo "❌ Error: Key Secret cannot be empty"
    exit 1
fi

# Set environment variables (for current session)
export RAZORPAY_KEY_ID="$LIVE_KEY_ID"
export RAZORPAY_KEY_SECRET="$LIVE_KEY_SECRET"

echo ""
echo "✅ Environment variables set for current session"
echo ""
echo "📝 To make these permanent, add to your .env file or PM2 ecosystem config:"
echo ""
echo "RAZORPAY_KEY_ID=$LIVE_KEY_ID"
echo "RAZORPAY_KEY_SECRET=$LIVE_KEY_SECRET"
echo ""
echo "🔄 After setting, restart your application:"
echo "   pm2 restart naukrimili --update-env"
echo ""

