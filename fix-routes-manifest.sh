#!/bin/bash
# Fix routes-manifest.json on server

cd /var/www/naukrimili

echo "🔍 Current routes-manifest.json:"
cat .next/routes-manifest.json

echo ""
echo "🔧 Creating correct routes-manifest.json with rewrites field..."

cat > .next/routes-manifest.json << 'EOF'
{
  "version": 3,
  "pages404": true,
  "basePath": "",
  "redirects": [],
  "rewrites": {
    "beforeFiles": [],
    "afterFiles": [],
    "fallback": []
  },
  "headers": [],
  "dynamicRoutes": [],
  "dataRoutes": [],
  "i18n": null
}
EOF

echo "✅ Updated routes-manifest.json:"
cat .next/routes-manifest.json

echo ""
echo "🔄 Restarting PM2..."
pm2 restart naukrimili

echo ""
echo "⏳ Waiting for app to start..."
sleep 5

echo ""
echo "📋 PM2 Status:"
pm2 status

echo ""
echo "📋 Recent logs:"
pm2 logs naukrimili --lines 20 --nostream

echo ""
echo "🔍 Checking if port 3000 is listening..."
netstat -tlnp | grep :3000 || echo "Port 3000 not listening yet"

echo ""
echo "✅ Fix applied! Check the logs above for any errors."

