#!/bin/bash

echo "🔧 Fixing DNS Issue - Website Showing GoDaddy Parking Page"
echo "=========================================================="

# VPS Details
VPS_IP="69.62.73.84"
VPS_USER="root"

echo "📡 Connecting to VPS: $VPS_IP"
echo "👤 User: $VPS_USER"
echo ""

# Check and fix DNS issue
ssh -o StrictHostKeyChecking=no $VPS_USER@$VPS_IP << 'EOF'

echo "🔍 Diagnosing DNS issue..."

# 1. Check current DNS resolution
echo "📊 Current DNS resolution for naukrimili.com:"
dig naukrimili.com +short

echo ""
echo "📊 Expected IP: $VPS_IP"
echo ""

# 2. Check if nginx is running and listening
echo "🌐 Checking Nginx status:"
systemctl status nginx --no-pager

echo ""
echo "🔍 Checking if port 80 is listening:"
netstat -tlnp | grep :80

echo ""
echo "🔍 Checking if port 3000 is listening:"
netstat -tlnp | grep :3000

# 3. Check PM2 status
echo ""
echo "📊 PM2 Status:"
pm2 status

# 4. Test local access
echo ""
echo "🧪 Testing local access:"
curl -I http://localhost:3000
curl -I http://localhost:80

# 5. Check nginx configuration
echo ""
echo "📝 Nginx configuration:"
cat /etc/nginx/nginx.conf

# 6. Check if there are any conflicting services
echo ""
echo "🔍 Checking for conflicting services:"
ps aux | grep -E "(nginx|node|pm2)" | grep -v grep

EOF

echo ""
echo "🔧 Now let's fix the DNS issue..."
echo ""

# Instructions for fixing DNS
echo "📋 DNS Fix Instructions:"
echo "1. Go to GoDaddy DNS Management"
echo "2. Remove ALL existing A records"
echo "3. Add ONLY ONE A record:"
echo "   - Type: A"
echo "   - Name: @ (or leave blank)"
echo "   - Value: 69.62.73.84"
echo "   - TTL: 600 (10 minutes)"
echo "4. Add CNAME record for www:"
echo "   - Type: CNAME"
echo "   - Name: www"
echo "   - Value: naukrimili.com"
echo "   - TTL: 600"
echo ""
echo "5. Wait 10-15 minutes for DNS propagation"
echo "6. Test: http://naukrimili.com"
echo ""
echo "🌐 Your website should then show your job portal instead of GoDaddy parking page"
