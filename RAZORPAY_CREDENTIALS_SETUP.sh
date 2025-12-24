#!/bin/bash

# Razorpay Credentials Setup Script
# This script adds Razorpay credentials to your .env.local file

echo "🔐 Razorpay Credentials Setup"
echo "=================================="

KEY_ID="rzp_test_RmJIe9drDBjHeC"
KEY_SECRET="m4cVgW16U4Plei3gFa1YP2hR"

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "📝 Creating .env.local file..."
    touch .env.local
else
    echo "📝 .env.local already exists, will append credentials..."
fi

# Remove old Razorpay credentials if they exist
sed -i '/^RAZORPAY_KEY_ID=/d' .env.local
sed -i '/^RAZORPAY_KEY_SECRET=/d' .env.local

# Add new Razorpay credentials
echo "" >> .env.local
echo "# Razorpay Payment Gateway" >> .env.local
echo "RAZORPAY_KEY_ID=$KEY_ID" >> .env.local
echo "RAZORPAY_KEY_SECRET=$KEY_SECRET" >> .env.local

echo "✅ Razorpay credentials added to .env.local"
echo ""
echo "Key ID: $KEY_ID"
echo "Key Secret: ****${KEY_SECRET: -8}"
echo ""
echo "⚠️  Please restart your dev server: npm run dev"

