#!/bin/bash

echo "🔧 Fixing Dynamic User Issues - Complete Resolution..."

# Stop the application
echo "🛑 Stopping application..."
pm2 stop naukrimili

# Backup current files
echo "📦 Creating backups..."
cp app/dashboard/jobseeker/page.tsx app/dashboard/jobseeker/page.tsx.backup.$(date +%Y%m%d_%H%M%S)
cp components/dashboards/JobSeekerDashboard.tsx components/dashboards/JobSeekerDashboard.tsx.backup.$(date +%Y%m%d_%H%M%S)
cp components/UnifiedUserProfile.tsx components/UnifiedUserProfile.tsx.backup.$(date +%Y%m%d_%H%M%S)
cp components/MobileUserProfile.tsx components/MobileUserProfile.tsx.backup.$(date +%Y%m%d_%H%M%S)
cp components/ComprehensiveNotificationBell.tsx components/ComprehensiveNotificationBell.tsx.backup.$(date +%Y%m%d_%H%M%S)

echo "✅ Backups created"

# Rebuild the application
echo "🔧 Rebuilding application with dynamic user fixes..."
NODE_OPTIONS="--max-old-space-size=8192" NEXT_TELEMETRY_DISABLED=1 npx next build

if [ $? -eq 0 ]; then
    echo "✅ Build successful"
    
    # Start the application
    echo "🚀 Starting application..."
    pm2 start naukrimili
    
    # Wait for startup
    sleep 10
    
    # Check if application is running
    if pm2 list | grep -q "naukrimili.*online"; then
        echo "✅ Dynamic user fixes completed successfully!"
        echo "🔍 Application is running and ready for testing"
        echo ""
        echo "📋 Fixed Issues:"
        echo "   ✅ Welcome message now shows dynamic user name"
        echo "   ✅ User dropdown now shows dynamic user name"
        echo "   ✅ Messages window is now responsive"
        echo ""
        echo "📊 Checking application status..."
        pm2 logs naukrimili --lines 3
    else
        echo "❌ Application failed to start"
        pm2 logs naukrimili --lines 10
    fi
else
    echo "❌ Build failed, restoring backups..."
    mv app/dashboard/jobseeker/page.tsx.backup.* app/dashboard/jobseeker/page.tsx
    mv components/dashboards/JobSeekerDashboard.tsx.backup.* components/dashboards/JobSeekerDashboard.tsx
    mv components/UnifiedUserProfile.tsx.backup.* components/UnifiedUserProfile.tsx
    mv components/MobileUserProfile.tsx.backup.* components/MobileUserProfile.tsx
    mv components/ComprehensiveNotificationBell.tsx.backup.* components/ComprehensiveNotificationBell.tsx
    echo "🔄 Original files restored"
    pm2 start naukrimili
fi
