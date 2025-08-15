#!/bin/bash

# Domain Configuration Script for Hostinger + GoDaddy
# Run this on your Hostinger Linux server

echo "🌐 Domain Configuration Script for Hostinger + GoDaddy"
echo "=================================================="

# Get server information
echo "📋 Server Information:"
echo "Server IP: $(curl -s ifconfig.me)"
echo "Server Hostname: $(hostname)"
echo "Current Directory: $(pwd)"
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

# Offer to create .env.local file
echo ""
read -p "Create .env.local file now? (y/n): " CREATE_ENV

if [ "$CREATE_ENV" = "y" ] || [ "$CREATE_ENV" = "Y" ]; then
    echo "Creating .env.local file..."
    
    cat > .env.local << EOF
# Domain Configuration
NEXT_PUBLIC_BASE_URL=https://$DOMAIN_NAME
NEXT_PUBLIC_DOMAIN=$DOMAIN_NAME

# Database Configuration
DATABASE_URL="postgresql://username:password@localhost:5432/jobportal"

# NextAuth Configuration
NEXTAUTH_URL="https://$DOMAIN_NAME"
NEXTAUTH_SECRET="your-secret-key-here"

# File Upload Configuration
MAX_FILE_SIZE=10485760
UPLOAD_DIR="./uploads"

# Security
JWT_SECRET="your-jwt-secret-here"
ENCRYPTION_KEY="your-encryption-key-here"
EOF

    echo "✅ .env.local file created!"
    echo "⚠️  Remember to update DATABASE_URL and secrets with real values!"
fi
