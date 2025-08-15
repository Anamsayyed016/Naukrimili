#!/bin/bash

# Domain Configuration Script for Hostinger + GoDaddy
# Run this on your Hostinger server

echo "🌐 Domain Configuration Script for Hostinger + GoDaddy"
echo "=================================================="

# Get server information
echo "📋 Server Information:"
echo "Server IP: $(curl -s ifconfig.me)"
echo "Server Hostname: $(hostname)"
echo ""

# Check if domain is configured
read -p "Enter your domain name (e.g., yourdomain.com): " DOMAIN_NAME

if [ -z "$DOMAIN_NAME" ]; then
    echo "❌ Domain name is required!"
    exit 1
fi

echo ""
echo "🔧 Configuration Steps:"
echo ""

echo "1️⃣ GO TO GODADDY:"
echo "   - Login to godaddy.com"
echo "   - Go to My Products → Your Domain → DNS"
echo "   - Change Nameservers to Hostinger:"
echo "     ns1.hostinger.com"
echo "     ns2.hostinger.com"
echo "     ns3.hostinger.com"
echo "     ns4.hostinger.com"
echo ""

echo "2️⃣ GO TO HOSTINGER:"
echo "   - Login to hostinger.com"
echo "   - Go to Websites → Manage → Add Website"
echo "   - Enter domain: $DOMAIN_NAME"
echo "   - Select 'Use existing hosting'"
echo "   - Point to: /var/www/jobportal"
echo ""

echo "3️⃣ UPDATE ENVIRONMENT:"
echo "   - Create .env.local file with:"
echo "     NEXT_PUBLIC_BASE_URL=https://$DOMAIN_NAME"
echo "     NEXT_PUBLIC_DOMAIN=$DOMAIN_NAME"
echo ""

echo "4️⃣ BUILD AND DEPLOY:"
echo "   - Run: npm run build"
echo "   - Restart service: systemctl restart jobportal"
echo ""

echo "5️⃣ TEST CONNECTION:"
echo "   - Wait 24-48 hours for DNS propagation"
echo "   - Test: https://$DOMAIN_NAME"
echo ""

echo "✅ Configuration complete!"
echo "📧 Need help? Check Hostinger support or GoDaddy support"
