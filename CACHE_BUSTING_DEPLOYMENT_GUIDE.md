# Cache Busting Deployment Guide

## Problem Solved
This guide addresses the issue where browsers load old cached JavaScript bundles (like `4bd1b696-100b9d70ed4e49c1.js`) even after deployment, causing "Cannot read properties of undefined (reading 'length')" errors.

## Root Causes Identified
1. **Aggressive browser caching** - JS/CSS files cached for 1 year
2. **Hostinger CDN cache** - Static files cached at CDN level
3. **No cache-busting headers** - Missing proper cache control
4. **Build artifacts not cleaned** - Old .next directory persisted

## Solutions Implemented

### 1. Updated .htaccess (Apache/Shared Hosting)
```apache
# Cache control for static assets - Aggressive cache busting for JS/CSS
<FilesMatch "\.(js|css)$">
    Header set Cache-Control "no-cache, no-store, must-revalidate"
    Header set Pragma "no-cache"
    Header set Expires "0"
    Header set ETag ""
    Header unset Last-Modified
</FilesMatch>
```

### 2. Updated Next.js Configuration
- Added custom headers for `/_next/static/*` paths
- Implemented cache-busting headers at build level

### 3. Created Deployment Script
- `scripts/deploy-with-cache-bust.sh` - Automated deployment with cache clearing
- Ensures `.next` directory is completely cleaned before rebuild

### 4. Client-Side Cache Busting
- `lib/cache-busting.ts` - Utility functions for cache management
- `components/CacheBustingInitializer.tsx` - Component that runs on app load
- Version checking and automatic cache clearing

### 5. Build Timestamp Integration
- Added `NEXT_PUBLIC_BUILD_TIME` to package.json build script
- Enables version checking and cache invalidation

## Deployment Steps for Hostinger

### Option 1: Automated Deployment (Recommended)
```bash
# On Hostinger server
cd /var/www/jobportal
chmod +x scripts/build-production.sh
./scripts/build-production.sh
pm2 restart jobportal
```

### Option 2: Manual Deployment
```bash
# 1. Clean build artifacts
rm -rf .next
rm -rf node_modules/.cache

# 2. Clear npm cache
npm cache clean --force

# 3. Set environment variables and build
export NODE_ENV=production
export NODE_OPTIONS="--max-old-space-size=4096"
export NEXT_TELEMETRY_DISABLED=1
export NEXT_PUBLIC_BUILD_TIME=$(date +%s)000

# 4. Install dependencies (ignore engine warnings)
npm ci --legacy-peer-deps --ignore-engines

# 5. Build the application
npm run build

# 6. Restart application
pm2 restart jobportal
```

### Option 3: Fresh Dependencies (If package.json changed)
```bash
./scripts/deploy-with-cache-bust.sh --fresh-deps
```

## Verification Steps

### 1. Check Build Files
```bash
# Verify old problematic file is gone (it should be replaced with new hash)
ls -la .next/static/chunks/ | grep "4bd1b696-100b9d70ed4e49c1.js"
```

### 2. Browser Testing
1. Open incognito/private browser window
2. Navigate to your site
3. Open DevTools → Network tab
4. Perform hard refresh (Ctrl+F5)
5. Verify JS files have new hashes and load fresh

### 3. Cache Headers Verification
```bash
# Check cache headers (replace with your domain)
curl -I https://aftionix.in/_next/static/chunks/4bd1b696-100b9d70ed4e49c1.js
```

Expected headers:
```
Cache-Control: no-cache, no-store, must-revalidate
Pragma: no-cache
Expires: 0
```

## Troubleshooting

### If Old Files Still Load
1. **Clear Hostinger CDN Cache**
   - Log into Hostinger control panel
   - Go to Website → CDN
   - Purge cache for your domain

2. **Force Browser Cache Clear**
   - Add `?clear_cache=true` to your URL
   - Or use the automated cache clearing

3. **Check Nginx Configuration** (If using Nginx)
   ```nginx
   location ~* \.(js|css)$ {
       add_header Cache-Control "no-cache, no-store, must-revalidate";
       add_header Pragma "no-cache";
       add_header Expires "0";
   }
   ```

### If Build Fails
1. Check Node.js memory limits
2. Use the deployment script with `--fresh-deps`
3. Verify all dependencies are installed

## Prevention

### 1. Always Use Deployment Script
Never deploy without running the cache-busting deployment script.

### 2. Monitor Build Timestamps
Check browser console for build timestamps to ensure fresh builds.

### 3. Regular Cache Audits
- Test in incognito mode after each deployment
- Verify no old JS bundles are served
- Check cache headers in DevTools

## Files Modified
- `.htaccess` - Cache control headers
- `next.config.mjs` - Next.js cache headers
- `package.json` - Build timestamp integration
- `app/layout.tsx` - Cache busting initializer
- `lib/cache-busting.ts` - Cache management utilities
- `components/CacheBustingInitializer.tsx` - Client-side cache handling
- `scripts/deploy-with-cache-bust.sh` - Automated deployment

## Success Indicators
✅ No more "Cannot read properties of undefined (reading 'length')" errors
✅ Fresh JS bundles load on each deployment
✅ Browser DevTools shows new file hashes
✅ Cache headers prevent aggressive caching
✅ Application loads with latest code changes

This solution ensures that every deployment forces browsers to load the latest JavaScript bundles, eliminating cache-related errors while maintaining good performance for static assets like images and fonts.
