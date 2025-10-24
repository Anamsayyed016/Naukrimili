#!/bin/bash

echo "🔧 CRITICAL FIX: NEXTAUTH_URL Environment Variable Issue"
echo "========================================================"

# Step 1: Check current NEXTAUTH_URL configuration
echo "📋 Current NEXTAUTH_URL configuration:"
grep -n "NEXTAUTH_URL" ecosystem.config.cjs

# Step 2: Fix the ecosystem config to ensure NEXTAUTH_URL is properly set
echo ""
echo "🔧 Fixing NEXTAUTH_URL in ecosystem.config.cjs..."

# Create a backup
cp ecosystem.config.cjs ecosystem.config.cjs.backup-$(date +%Y%m%d-%H%M%S)

# Fix the NEXTAUTH_URL configuration
cat > ecosystem.config.cjs << 'CONFIG_EOF'
module.exports = {
  apps: [
    {
      name: "naukrimili",
      script: "server.cjs",
      cwd: process.cwd(),
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "2G",
      env_file: ".env",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
        HOSTNAME: "0.0.0.0",
        NODE_OPTIONS: "--max-old-space-size=4096",
        NEXT_TELEMETRY_DISABLED: "1",
        RAPIDAPI_KEY: "6817e0f996msh7e837aee4175f0cp1ab059jsn315ea7f0f041",
        ADZUNA_APP_ID: "5e478efa",
        ADZUNA_APP_KEY: "f216fb45f9e324783b04fd877fc0f4f7",
        JOOBLE_API_KEY: "10fd38f3-17ed-4718-8471-504f472b410a",
        GMAIL_API_CLIENT_ID: process.env.GMAIL_API_CLIENT_ID,
        GMAIL_API_CLIENT_SECRET: process.env.GMAIL_API_CLIENT_SECRET,
        GMAIL_API_REFRESH_TOKEN: process.env.GMAIL_API_REFRESH_TOKEN,
        GMAIL_SENDER: process.env.GMAIL_SENDER,
        GMAIL_FROM_NAME: process.env.GMAIL_FROM_NAME,
        // NextAuth Configuration - CRITICAL FIX
        NEXTAUTH_URL: "https://naukrimili.com",
        NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET || "naukrimili-secret-key-2024-production-deployment",
        GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
        GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET
      },
      env_production: {
        NODE_ENV: "production",
        PORT: 3000,
        HOSTNAME: "0.0.0.0",
        NODE_OPTIONS: "--max-old-space-size=4096",
        NEXT_TELEMETRY_DISABLED: "1",
        RAPIDAPI_KEY: "6817e0f996msh7e837aee4175f0cp1ab059jsn315ea7f0f041",
        ADZUNA_APP_ID: "5e478efa",
        ADZUNA_APP_KEY: "f216fb45f9e324783b04fd877fc0f4f7",
        JOOBLE_API_KEY: "10fd38f3-17ed-4718-8471-504f472b410a",
        GMAIL_API_CLIENT_ID: process.env.GMAIL_API_CLIENT_ID,
        GMAIL_API_CLIENT_SECRET: process.env.GMAIL_API_CLIENT_SECRET,
        GMAIL_API_REFRESH_TOKEN: process.env.GMAIL_API_REFRESH_TOKEN,
        GMAIL_SENDER: process.env.GMAIL_SENDER,
        GMAIL_FROM_NAME: process.env.GMAIL_FROM_NAME,
        // NextAuth Configuration - CRITICAL FIX
        NEXTAUTH_URL: "https://naukrimili.com",
        NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET || "naukrimili-secret-key-2024-production-deployment",
        GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
        GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET
      },
      log_file: "./logs/combined.log",
      out_file: "./logs/out.log",
      error_file: "./logs/error.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      merge_logs: true,
      log_type: "json",
      min_uptime: "10s",
      max_restarts: 5,
      restart_delay: 4000,
      exec_mode: "fork",
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000,
      ignore_watch: [
        "node_modules",
        ".next",
        "logs",
        "*.log",
        ".git"
      ]
    }
  ]
};
CONFIG_EOF

echo "✅ Ecosystem config fixed with hardcoded NEXTAUTH_URL"

# Step 3: Update .env file to ensure NEXTAUTH_URL is set
echo ""
echo "🔧 Updating .env file..."
echo "NEXTAUTH_URL=https://naukrimili.com" >> .env

# Step 4: Restart PM2 with the fixed configuration
echo ""
echo "🔄 Restarting PM2 with fixed NEXTAUTH_URL..."
pm2 restart naukrimili --update-env

# Step 5: Verify the fix
echo ""
echo "🔍 Verifying NEXTAUTH_URL is loaded..."
pm2 env 0 | grep NEXTAUTH_URL

echo ""
echo "🔍 Verifying Google OAuth credentials..."
pm2 env 0 | grep GOOGLE

echo ""
echo "✅ NEXTAUTH_URL critical fix complete!"
echo ""
echo "🧪 Test the fix:"
echo "  1. Open https://naukrimili.com/auth/signin"
echo "  2. Check browser console - should NOT show NEXTAUTH_URL error"
echo "  3. Try Google OAuth login"
echo "  4. Should work on both mobile and desktop"
