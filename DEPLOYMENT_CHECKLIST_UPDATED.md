# Updated Deployment Checklist (After beforeFiles Fix)

## ✅ Pre-Deployment Checks

### 1. Code Quality
- [ ] All changes committed to git
- [ ] No console.log statements in production code
- [ ] TypeScript/ESLint checks pass (or ignored intentionally)

### 2. Dependencies
```bash
# Verify package-lock.json exists and is committed
git ls-files | grep package-lock.json

# Verify Next.js version
npm list next
# Expected: 15.5.2 or similar
```

### 3. Build Artifacts
```bash
# Clean build
rm -rf .next
npm ci
npm run build

# Validate build artifacts (NEW!)
npm run validate:build
# Should show: ✅ All validation checks passed!
```

### 4. Environment Variables
- [ ] `.env` file has all required variables
- [ ] Database connection string is correct
- [ ] API keys are set (if needed)
- [ ] `NEXTAUTH_SECRET` is set
- [ ] `JWT_SECRET` is set

## 🚀 Deployment Steps

### 1. Push to GitHub
```bash
git add .
git commit -m "Your commit message"
git push origin main
```

### 2. Monitor GitHub Actions
- Watch the workflow at: https://github.com/your-repo/actions
- Key steps to watch:
  - ✅ `npm ci` success (not `npm install`)
  - ✅ Next.js version verification
  - ✅ Build completion
  - ✅ Manifest validation
  - ✅ File copy to server
  - ✅ PM2 startup

### 3. Expected Log Messages

#### During Build:
```
✅ Next.js version: 15.5.2
🔨 Building application...
✅ Build completed
✅ All critical build artifacts verified
```

#### During Deployment:
```
🔒 Using npm ci for exact version matching...
✅ Next.js version on server: 15.5.2
🔍 Validating routes-manifest.json structure...
✅ routes-manifest.json structure validated
```

#### During Server Start:
```
🚀 Starting Naukrimili server...
✅ .next/static directory found
✅ routes-manifest.json found
✅ routes-manifest.json validated and fixed
✅ All build artifacts verified and validated
✅ Next.js app prepared successfully
🎉 Server ready on http://0.0.0.0:3000
```

## 🔍 Post-Deployment Verification

### 1. Check Server Status
```bash
# SSH to server
ssh user@your-server

# Check PM2 status
pm2 status
# Should show: online | 0 restarts | 0% cpu | 0mb mem

# Check logs
pm2 logs naukrimili --lines 50
# Should NOT show any errors
```

### 2. Test Application
```bash
# Test from server
curl http://localhost:3000

# Test from browser
# Visit: https://naukrimili.com
```

### 3. Verify Routing
- [ ] Homepage loads correctly
- [ ] Job listings load
- [ ] Job details page works
- [ ] Apply button works
- [ ] Search functionality works

### 4. Check for Errors
```bash
# Check PM2 error logs
pm2 logs naukrimili --err --lines 20

# Check system logs
tail -f /var/log/naukrimili/error.log
```

## 🆘 Troubleshooting

### Issue: Server won't start

**Symptoms**:
```
TypeError: Cannot read properties of undefined (reading 'beforeFiles')
```

**Solution**:
```bash
# Run emergency fix
cd /var/www/naukrimili
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
"
pm2 restart naukrimili
```

### Issue: Port already in use
```bash
# Find process using port 3000
lsof -i :3000

# Kill the process
kill -9 <PID>

# Or stop PM2
pm2 stop all
pm2 start ecosystem.config.cjs
```

### Issue: Static files not loading
```bash
# Check static directory
ls -la .next/static/

# Rebuild if necessary
npm run build
pm2 restart naukrimili
```

### Issue: Version mismatch
```bash
# Check versions
npm list next

# Reinstall with exact versions
rm -rf node_modules package-lock.json
npm install
npm ci
npm run build
```

## 📊 Success Indicators

✅ PM2 shows status: **online**
✅ PM2 restarts: **0** (or very low)
✅ CPU usage: **< 10%**
✅ Memory usage: **< 500MB**
✅ Response time: **< 1 second**
✅ No errors in logs
✅ Application accessible via browser

## 🎯 Key Changes in This Update

### What's New:
1. ✅ **Automatic manifest validation** in `server.cjs`
2. ✅ **Version consistency checks** using `npm ci`
3. ✅ **Pre-deployment validation** script
4. ✅ **Emergency manifest fix** capability
5. ✅ **Comprehensive error handling**

### What's Better:
- **Reliability**: Multiple fallback mechanisms
- **Debugging**: Better log messages
- **Prevention**: Catches issues before deployment
- **Recovery**: Auto-fixes common problems

## 📚 Additional Resources

- **Full Fix Documentation**: `NEXT_JS_15_ROUTING_FIX.md`
- **Quick Reference**: `QUICK_FIX_BEFOREFILES_ERROR.md`
- **Validation Script**: `scripts/validate-build-artifacts.cjs`

## 🔄 Regular Maintenance

### Daily:
- [ ] Check PM2 status
- [ ] Review error logs
- [ ] Monitor memory usage

### Weekly:
- [ ] Update dependencies (if needed)
- [ ] Review and archive old logs
- [ ] Check disk space

### Monthly:
- [ ] Review and update secrets
- [ ] Test backup and recovery
- [ ] Security audit

---

**Last Updated**: After implementing beforeFiles error fix
**Version**: 2.0 (with automatic manifest validation)
**Status**: ✅ Ready for production

