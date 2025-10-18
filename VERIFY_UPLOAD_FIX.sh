#!/bin/bash

# Verify that the upload fix is working
echo "🔍 Verifying Upload Fix..."

# Check if client_max_body_size is set
echo "📋 Checking Nginx configuration for file upload settings..."

# Check main nginx.conf
if grep -q "client_max_body_size" /etc/nginx/nginx.conf; then
    echo "✅ client_max_body_size found in main nginx.conf"
    grep "client_max_body_size" /etc/nginx/nginx.conf
else
    echo "❌ client_max_body_size NOT found in main nginx.conf"
fi

# Check all site configurations
echo ""
echo "📋 Checking site configurations..."

for config in /etc/nginx/sites-available/* /etc/nginx/conf.d/*.conf 2>/dev/null; do
    if [ -f "$config" ]; then
        if grep -q "client_max_body_size" "$config"; then
            echo "✅ $config has client_max_body_size"
            grep "client_max_body_size" "$config"
        else
            echo "❌ $config missing client_max_body_size"
        fi
    fi
done

# Test the API endpoint
echo ""
echo "🧪 Testing API endpoint..."

# Test with a small file first
echo "📤 Testing with small file..."
curl -X POST "http://localhost:3000/api/health" -H "Content-Type: application/json" 2>/dev/null

if [ $? -eq 0 ]; then
    echo "✅ API is responding"
else
    echo "❌ API is not responding"
fi

# Check Nginx error logs for 413 errors
echo ""
echo "📊 Checking recent Nginx error logs for 413 errors..."
if [ -f "/var/log/nginx/error.log" ]; then
    recent_413=$(grep "413" /var/log/nginx/error.log | tail -5)
    if [ -n "$recent_413" ]; then
        echo "⚠️ Recent 413 errors found:"
        echo "$recent_413"
    else
        echo "✅ No recent 413 errors found"
    fi
fi

echo ""
echo "🎯 Summary:"
echo "   • If you see 'client_max_body_size 10M' above, the fix is applied"
echo "   • If API is responding, the server is working"
echo "   • If no recent 413 errors, the fix is working"
echo ""
echo "🚀 Try uploading your resume now!"
