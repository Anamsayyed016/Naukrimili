# Fix Server Without Git - Manual File Upload Method

Since git is not working on your server, we'll use manual file upload instead.

## Method 1: Upload Files via Hostinger File Manager

### Step 1: Prepare Files Locally
1. **Build the project locally** (already done ✅)
2. **Zip the entire project** for upload

### Step 2: Upload via Hostinger File Manager
1. Log into Hostinger Control Panel
2. Go to **File Manager**
3. Navigate to `/var/www/jobportal/`
4. **Backup current files** (rename current folder to `jobportal_backup`)
5. **Upload the new zip file**
6. **Extract the zip** in `/var/www/`

### Step 3: Run Server Commands
```bash
# Navigate to project
cd /var/www/jobportal

# Stop all processes
pm2 stop all
pm2 delete all
pkill -f node

# Install dependencies
npm ci --only=production --legacy-peer-deps

# Generate Prisma client
npx prisma generate

# Build application (if needed)
NODE_OPTIONS="--max-old-space-size=4096" NEXT_TELEMETRY_DISABLED=1 npx next build --no-lint

# Start PM2
pm2 start ecosystem.config.cjs --env production

# Restart nginx
systemctl restart nginx

# Check status
pm2 status
```

## Method 2: Fix Git on Server First

### Step 1: Check Git Status
```bash
# Check if git is installed
git --version

# Check git configuration
git config --list

# Check if repository exists
ls -la /var/www/jobportal/.git
```

### Step 2: Fix Git Configuration
```bash
# Set git user (replace with your details)
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"

# Check remote URL
cd /var/www/jobportal
git remote -v

# If remote is wrong, fix it
git remote set-url origin https://github.com/Anamsayyed016/Naukrimili.git

# Test git pull
git pull origin main
```

### Step 3: If Git Still Doesn't Work
```bash
# Remove and re-clone repository
cd /var/www
rm -rf jobportal
git clone https://github.com/Anamsayyed016/Naukrimili.git jobportal
cd jobportal
npm ci --only=production --legacy-peer-deps
npx prisma generate
NODE_OPTIONS="--max-old-space-size=4096" npx next build --no-lint
pm2 start ecosystem.config.cjs --env production
```

## Method 3: Direct File Replacement

### Step 1: Identify Key Files to Replace
Focus on these critical files:
- `package.json` (updated with new scripts)
- `ecosystem.config.cjs` (optimized PM2 config)
- `next.config.mjs` (optimized build config)
- All files in `app/` directory
- All files in `lib/` directory

### Step 2: Manual File Updates
```bash
# Update package.json with new scripts
# Update ecosystem.config.cjs with optimized settings
# Update any other critical files
```

### Step 3: Rebuild and Restart
```bash
cd /var/www/jobportal
pm2 stop all
npm ci --only=production --legacy-peer-deps
npx prisma generate
NODE_OPTIONS="--max-old-space-size=4096" npx next build --no-lint
pm2 start ecosystem.config.cjs --env production
systemctl restart nginx
```

## Method 4: Emergency Quick Fix (No Git Required)

### Just Fix the Current Server
```bash
cd /var/www/jobportal

# Stop everything
pm2 stop all
pm2 delete all
pkill -f node

# Clear any stuck processes
lsof -ti:3000 | xargs kill -9 2>/dev/null || true

# Restart nginx
systemctl restart nginx

# Reinstall dependencies
npm ci --only=production --legacy-peer-deps

# Generate Prisma
npx prisma generate

# Build with current code
NODE_OPTIONS="--max-old-space-size=4096" npx next build --no-lint

# Start PM2
pm2 start ecosystem.config.cjs --env production

# Check status
pm2 status
curl http://localhost:3000/api/health
```

## Troubleshooting Git Issues

### Common Git Problems:
1. **Authentication issues** - Use HTTPS instead of SSH
2. **Network issues** - Check firewall settings
3. **Permission issues** - Check file ownership
4. **Repository corruption** - Re-clone the repository

### Fix Git Authentication:
```bash
# Use HTTPS instead of SSH
git remote set-url origin https://github.com/Anamsayyed016/Naukrimili.git

# Or use token authentication
git remote set-url origin https://YOUR_TOKEN@github.com/Anamsayyed016/Naukrimili.git
```

## Recommended Approach:
**Use Method 4 (Emergency Quick Fix)** first to get your site working, then work on fixing git later.
