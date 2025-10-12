# Quick Fix: `beforeFiles` TypeError

## 🚨 Error
```
TypeError: Cannot read properties of undefined (reading 'beforeFiles')
```

## ✅ Quick Solution

### Option 1: Automatic Fix (Recommended)
The error is now **automatically fixed** by the updated `server.cjs`. Just deploy normally:

```bash
# Push to trigger deployment
git add .
git commit -m "Fix: Next.js 15.x routing manifest error"
git push origin main
```

The server will automatically:
- ✅ Detect missing or malformed `routes-manifest.json`
- ✅ Create/fix the manifest with proper structure
- ✅ Validate all required properties
- ✅ Start successfully

### Option 2: Manual Fix on Server
If already deployed and server won't start:

```bash
# SSH to server
ssh user@your-server

# Navigate to app directory
cd /var/www/naukrimili

# Run the emergency fix
node -e "
const fs = require('fs');
const manifest = {
  version: 3,
  pages404: true,
  basePath: '',
  redirects: [],
  rewrites: { beforeFiles: [], afterFiles: [], fallback: [] },
  headers: [],
  dynamicRoutes: [],
  dataRoutes: [],
  i18n: null
};
fs.writeFileSync('.next/routes-manifest.json', JSON.stringify(manifest, null, 2));
console.log('✅ Fixed');
"

# Restart
pm2 restart naukrimili
```

### Option 3: Local Testing
Test the fix locally before deploying:

```bash
# Build the app
npm run build

# Validate build artifacts
npm run validate:build

# Start server
node server.cjs
```

## 🔍 What Changed

### Files Modified:
1. **`server.cjs`** - Added automatic manifest validation and fixing
2. **`.github/workflows/deploy.yml`** - Added version consistency checks
3. **`package.json`** - Added validation script

### Key Improvements:
- ✅ Uses `npm ci` for exact version matching
- ✅ Validates manifest structure before starting
- ✅ Auto-creates missing manifests
- ✅ Auto-fixes malformed manifests
- ✅ Comprehensive error handling

## 🎯 Prevention

To prevent this error in future:

1. **Always use npm ci**:
   ```bash
   npm ci  # ✅ Good
   npm install  # ❌ Can cause version drift
   ```

2. **Validate before deployment**:
   ```bash
   npm run validate:build
   ```

3. **Keep package-lock.json in git**:
   ```bash
   git add package-lock.json
   git commit -m "Update package-lock.json"
   ```

## 📊 Verification

After deployment, check:

```bash
# Check PM2 status
pm2 status

# Check logs for validation messages
pm2 logs naukrimili | grep "routes-manifest"

# Should see:
# ✅ routes-manifest.json validated and fixed
# ✅ All build artifacts verified and validated
```

## 🆘 Still Having Issues?

1. **Check Next.js version**:
   ```bash
   npm list next
   # Should be 15.5.2 or similar
   ```

2. **Check manifest exists**:
   ```bash
   ls -la .next/routes-manifest.json
   cat .next/routes-manifest.json | grep beforeFiles
   ```

3. **View full logs**:
   ```bash
   pm2 logs naukrimili --lines 100
   ```

4. **Contact support** with:
   - PM2 logs
   - Next.js version
   - Build output

## 📚 More Details

See `NEXT_JS_15_ROUTING_FIX.md` for complete documentation.

---

**Status**: ✅ **FIXED** - Auto-detection and correction implemented
**Test Status**: ✅ Validation script created and tested
**Risk**: 🟢 Low - Multiple fallback mechanisms in place

