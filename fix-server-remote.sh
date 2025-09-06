#!/bin/bash

# Remote server fix script - run this from your local machine
echo "🚨 Fixing server remotely..."

# Server details
SERVER="root@69.62.73.84"
PROJECT_PATH="/var/www/jobportal"

echo "Step 1: Uploading fix scripts to server..."
scp fix-504-error.sh debug-server.sh nginx-fix.conf ecosystem.optimized.cjs $SERVER:$PROJECT_PATH/

echo "Step 2: Making scripts executable..."
ssh $SERVER "cd $PROJECT_PATH && chmod +x fix-504-error.sh debug-server.sh"

echo "Step 3: Running debug script..."
ssh $SERVER "cd $PROJECT_PATH && ./debug-server.sh"

echo "Step 4: Running fix script..."
ssh $SERVER "cd $PROJECT_PATH && ./fix-504-error.sh"

echo "Step 5: Updating nginx configuration..."
ssh $SERVER "cp $PROJECT_PATH/nginx-fix.conf /etc/nginx/sites-available/jobportal && nginx -t && systemctl reload nginx"

echo "Step 6: Final verification..."
ssh $SERVER "cd $PROJECT_PATH && pm2 status && curl -f http://localhost:3000/api/health"

echo "✅ Remote fix completed!"
echo "🌐 Check your website: http://mum.hostingerps.com"
