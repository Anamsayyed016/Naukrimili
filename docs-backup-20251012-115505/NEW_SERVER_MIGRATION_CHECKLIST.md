# 🔑 Complete Server Migration Checklist for New Hostinger Server

> **Generated:** ${new Date().toISOString()}
> **Purpose:** Migration to new Hostinger server - Complete environment setup guide

---

## 📋 Table of Contents
1. [Environment Variables (.env file)](#environment-variables)
2. [GitHub Secrets](#github-secrets)
3. [API Keys & Third-Party Services](#api-keys)
4. [Database Setup](#database-setup)
5. [Server Configuration](#server-configuration)
6. [PM2 Ecosystem Config](#pm2-config)
7. [Verification Commands](#verification)

---

## 🔐 1. Environment Variables (.env file)

Create a `.env` file on your new server with these variables:

```bash
# ============================================
# CORE APPLICATION SETTINGS
# ============================================
NODE_ENV=production
PORT=3000
HOSTNAME=0.0.0.0
NODE_OPTIONS=--max-old-space-size=4096

# ============================================
# APPLICATION URLs
# ============================================
NEXT_PUBLIC_APP_URL=https://YOUR_NEW_DOMAIN.com
NEXTAUTH_URL=https://YOUR_NEW_DOMAIN.com

# ============================================
# DATABASE CONFIGURATION
# ============================================
DATABASE_URL="postgresql://postgres:YOUR_DB_PASSWORD@localhost:5432/jobportal"
# Example from current server:
# DATABASE_URL="postgresql://postgres:job123@localhost:5432/jobportal"

# ============================================
# AUTHENTICATION & SECURITY
# ============================================
NEXTAUTH_SECRET="jobportal-secret-key-2024-naukrimili-production-deployment"
JWT_SECRET="jobportal-jwt-secret-2024-naukrimili-production"
ENCRYPTION_KEY="your-encryption-key-here"

# ============================================
# GOOGLE OAUTH (Optional but recommended)
# ============================================
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# ============================================
# GOOGLE APIS (Optional)
# ============================================
GOOGLE_JOBS_API_KEY=your_google_jobs_api_key
GOOGLE_GEOLOCATION_API_KEY=your_google_geolocation_api_key
GOOGLE_MAPS_API_KEY=your_google_maps_api_key

# ============================================
# JOB SEARCH APIs (Third-Party)
# ============================================

# Adzuna API (Currently Active)
ADZUNA_APP_ID=bdd02427
ADZUNA_APP_KEY=abf03277d13e4cb39b24bf236ad29299

# RapidAPI / JSearch (Currently Active)
RAPIDAPI_KEY=3c767d3998msha8933e5d0c4a9b1p187000jsnd04d13d1e9bc
RAPIDAPI_HOST=jsearch.p.rapidapi.com
JSEARCH_API_KEY=3c767d3998msha8933e5d0c4a9b1p187000jsnd04d13d1e9bc

# Jooble API (Currently Active)
JOOBLE_API_KEY=d4d0ab09-32f9-4c37-be17-59629043ca4a

# Other Job APIs (Optional)
REED_API_KEY=your_reed_api_key
SERPAPI_KEY=your_serpapi_key
INDEED_API_KEY=your_indeed_api_key
ZIPRECRUITER_API_KEY=your_ziprecruiter_api_key

# ============================================
# AI SERVICES (Optional but recommended)
# ============================================
OPENAI_API_KEY=your_openai_api_key
GEMINI_API_KEY=your_gemini_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key

# ============================================
# EMAIL CONFIGURATION (Gmail SMTP)
# ============================================
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_gmail_app_password
SMTP_FROM_NAME=Aftionix Job Portal
SMTP_FROM_EMAIL=your_email@gmail.com

# ============================================
# FILE STORAGE (AWS S3 - Optional)
# ============================================
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=us-east-1
AWS_S3_BUCKET=your-bucket-name

# ============================================
# REDIS (Optional - for caching)
# ============================================
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password
REDIS_DB=0
REDIS_ENABLED=true

# ============================================
# WHATSAPP API (Optional)
# ============================================
WHATSAPP_API_TOKEN=your_whatsapp_api_token
WHATSAPP_API_URL=https://graph.facebook.com/v18.0

# ============================================
# FEATURE FLAGS
# ============================================
NEXT_TELEMETRY_DISABLED=1
NEXT_PUBLIC_SKIP_GOOGLE_FONTS=true
NEXT_PUBLIC_MOCK_DATA=false
NEXT_PUBLIC_DISABLE_AUTH=false
SKIP_ENV_VALIDATION=1
ENABLE_AI_FEATURES=true
ENABLE_ANALYTICS=true
ENABLE_EMAIL_NOTIFICATIONS=true
AUTH_DISABLED=false
```

---

## 🔒 2. GitHub Secrets (For CI/CD Deployment)

Go to: `https://github.com/YOUR_USERNAME/YOUR_REPO/settings/secrets/actions`

Add these secrets:

### Server Connection Secrets

| Secret Name | Value | Description |
|------------|-------|-------------|
| `HOST` | `YOUR_NEW_SERVER_IP` | New Hostinger VPS IP address |
| `SSH_USER` | `root` or `ubuntu` | SSH username for your server |
| `SSH_KEY` | `YOUR_PRIVATE_SSH_KEY` | Private SSH key for authentication |
| `SSH_PORT` | `22` | SSH port (usually 22) |

### Optional API Secrets (Recommended)

| Secret Name | Value | Description |
|------------|-------|-------------|
| `GOOGLE_CLIENT_ID` | Your Google OAuth Client ID | For Google login |
| `GOOGLE_CLIENT_SECRET` | Your Google OAuth Secret | For Google login |

**Current SSH Key from existing setup:**
```
-----BEGIN OPENSSH PRIVATE KEY-----
b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAAAMwAAAAtzc2gtZW
QyNTUxOQAAACBgIApZRRPUsxIdHKqh9mcFwlBpkxsSoiph/GbYRAZH0wAAAJh/r9dmf6/X
ZgAAAAtzc2gtZWQyNTUxOQAAACBgIApZRRPUsxIdHKqh9mcFwlBpkxsSoiph/GbYRAZH0w
AAAECIL/vT+Iq3FeYo0NEjeFk2y+5aC3+Xr6hchuzWi5TfQGAgCllFE9SzEh0cqqH2ZwXC
UGmTGxKiKmH8ZthEBkfTAAAAFWdpdGh1Yi1hY3Rpb25zLWRlcGxveQ==
-----END OPENSSH PRIVATE KEY-----
```

**⚠️ IMPORTANT:** Generate a NEW SSH key for the new server for better security!

---

## 🔑 3. Active API Keys Summary

### Currently Active & Working Keys:

| Service | Key/ID | Purpose | Status |
|---------|--------|---------|--------|
| **Adzuna** | ID: `bdd02427` | Job search API | ✅ Active |
| **Adzuna** | Key: `abf03277d13e4cb39b24bf236ad29299` | Job search API | ✅ Active |
| **RapidAPI/JSearch** | Key: `3c767d3998msha8933e5d0c4a9b1p187000jsnd04d13d1e9bc` | Job search API | ✅ Active |
| **Jooble** | Key: `d4d0ab09-32f9-4c37-be17-59629043ca4a` | Job search API | ✅ Active |

### Optional/Additional APIs:

These need to be obtained from respective providers:

1. **Google OAuth** - Get from: https://console.cloud.google.com/
2. **OpenAI** - Get from: https://platform.openai.com/api-keys
3. **Google Gemini AI** - Get from: https://makersuite.google.com/app/apikey
4. **Gmail App Password** - Get from: https://myaccount.google.com/apppasswords
5. **Reed API** - Get from: https://www.reed.co.uk/developers
6. **SerpAPI** - Get from: https://serpapi.com/

---

## 🗄️ 4. Database Setup

### PostgreSQL Database Configuration

```bash
# Connect to PostgreSQL
sudo -u postgres psql

# Create database
CREATE DATABASE jobportal;

# Create user (if needed)
CREATE USER postgres WITH PASSWORD 'YOUR_DB_PASSWORD';

# Grant privileges
GRANT ALL PRIVILEGES ON DATABASE jobportal TO postgres;

# Exit PostgreSQL
\q
```

### Database Connection String Format:
```
postgresql://USERNAME:PASSWORD@HOST:PORT/DATABASE
```

**Current Example:**
```
postgresql://postgres:job123@localhost:5432/jobportal
```

**For New Server:**
```
postgresql://postgres:YOUR_NEW_PASSWORD@localhost:5432/jobportal
```

### Run Migrations

```bash
cd /var/www/jobportal
npx prisma generate
npx prisma db push
```

---

## ⚙️ 5. Server Configuration Files

### Create `.npmrc` file:

```bash
cat > .npmrc << 'EOF'
engine-strict=false
legacy-peer-deps=true
fund=false
audit=false
loglevel=error
auto-install-peers=true
EOF
```

### Update Nginx Configuration (if using):

```nginx
server {
    listen 80;
    server_name YOUR_NEW_DOMAIN.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

## 🚀 6. PM2 Ecosystem Configuration

The `ecosystem.config.cjs` file is already in your repo. Update these values:

```javascript
module.exports = {
  apps: [{
    name: "jobportal",
    script: "server.cjs",
    env_production: {
      NODE_ENV: "production",
      PORT: 3000,
      NEXT_PUBLIC_APP_URL: "https://YOUR_NEW_DOMAIN.com",
      NEXTAUTH_URL: "https://YOUR_NEW_DOMAIN.com",
      DATABASE_URL: "postgresql://postgres:YOUR_PASSWORD@localhost:5432/jobportal",
      // ... other env vars from .env file
    }
  }]
}
```

---

## ✅ 7. Verification Commands

### After Setup, Run These Commands:

```bash
# 1. Check environment variables
node -e "console.log('DATABASE_URL:', !!process.env.DATABASE_URL)"
node -e "console.log('NEXTAUTH_SECRET:', !!process.env.NEXTAUTH_SECRET)"
node -e "console.log('ADZUNA_APP_ID:', !!process.env.ADZUNA_APP_ID)"

# 2. Test database connection
npx prisma db pull

# 3. Check if Node.js and PM2 are installed
node --version
npm --version
pm2 --version

# 4. Test API endpoints (after deployment)
curl http://localhost:3000/api/health
curl http://localhost:3000/api/jobs

# 5. Check PM2 logs
pm2 logs jobportal

# 6. Check PM2 status
pm2 status
```

---

## 📝 Migration Checklist

Use this checklist to ensure nothing is missed:

- [ ] **Server Preparation**
  - [ ] New Hostinger VPS provisioned
  - [ ] Node.js 18+ installed
  - [ ] PostgreSQL installed and configured
  - [ ] PM2 installed globally
  - [ ] Nginx installed (optional)
  - [ ] SSL certificate installed (Let's Encrypt)

- [ ] **SSH Setup**
  - [ ] SSH key generated
  - [ ] Public key added to server
  - [ ] GitHub secrets updated with new credentials

- [ ] **Database Setup**
  - [ ] PostgreSQL database created
  - [ ] Database user created with proper permissions
  - [ ] Connection string updated in .env

- [ ] **Environment Configuration**
  - [ ] .env file created on new server
  - [ ] All API keys transferred
  - [ ] Domain/URL updated in all configs
  - [ ] Secrets verified

- [ ] **Application Deployment**
  - [ ] Repository cloned/deployed
  - [ ] Dependencies installed
  - [ ] Prisma migrations run
  - [ ] PM2 ecosystem configured
  - [ ] Application started with PM2
  - [ ] PM2 saved and startup configured

- [ ] **Testing & Verification**
  - [ ] Health endpoint responding
  - [ ] Database connectivity verified
  - [ ] API endpoints tested
  - [ ] Authentication working
  - [ ] Job search functioning
  - [ ] Resume upload working
  - [ ] Email notifications working

- [ ] **DNS & Domain**
  - [ ] DNS A record pointed to new server IP
  - [ ] SSL certificate installed
  - [ ] HTTPS working properly
  - [ ] Old domain redirected (if needed)

---

## 🆘 Quick Commands for New Server Setup

```bash
# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 globally
sudo npm install -g pm2

# Install PostgreSQL
sudo apt update
sudo apt install postgresql postgresql-contrib -y

# Create project directory
sudo mkdir -p /var/www/jobportal
sudo chown -R $USER:$USER /var/www/jobportal

# Clone repository (or let GitHub Actions do it)
cd /var/www/jobportal

# Install dependencies
npm install --legacy-peer-deps

# Generate Prisma client
npx prisma generate

# Push database schema
npx prisma db push

# Start application
pm2 start ecosystem.config.cjs --env production

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup systemd
```

---

## 📞 Support & Resources

### Important URLs:
- **Current Server IP:** 69.62.73.84
- **GitHub Repo:** https://github.com/Anamsayyed016/Naukrimili
- **Current Domain:** https://naukrimili.com

### API Documentation Links:
- Adzuna: https://developer.adzuna.com/
- RapidAPI: https://rapidapi.com/
- Jooble: https://jooble.org/api/about
- Google OAuth: https://console.cloud.google.com/

---

## 🔒 Firewall Configuration (From Your Current Server)

Your current server has these network access rules configured. Apply the same rules to your new server:

### Required Firewall Rules:

| Action | Protocol | Port | Source | Purpose |
|--------|----------|------|--------|---------|
| Accept | TCP | 22 | Any | SSH access |
| Accept | TCP | 80 | Any | HTTP traffic |
| Accept | TCP | 443 | Any | HTTPS traffic |
| Accept | TCP | 3000 | Any | Next.js application |
| Accept | TCP | 5432 | Any | PostgreSQL database |
| Accept | TCP | 2087 | Any | Control panel (if using) |
| Accept | TCP | 3001 | Any | Additional services |
| Drop | Any | Any | Any | Default deny rule |

### Commands to Setup Firewall on New Server:

```bash
# Install UFW (Uncomplicated Firewall)
sudo apt install ufw -y

# Set default policies
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Allow essential ports
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw allow 3000/tcp  # Next.js app
sudo ufw allow 5432/tcp  # PostgreSQL

# Optional ports (if needed)
sudo ufw allow 2087/tcp  # Control panel
sudo ufw allow 3001/tcp  # Additional services

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status verbose
```

### Alternative: Using iptables (if preferred)

```bash
# Allow SSH
sudo iptables -A INPUT -p tcp --dport 22 -j ACCEPT

# Allow HTTP/HTTPS
sudo iptables -A INPUT -p tcp --dport 80 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 443 -j ACCEPT

# Allow application ports
sudo iptables -A INPUT -p tcp --dport 3000 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 5432 -j ACCEPT

# Allow optional ports
sudo iptables -A INPUT -p tcp --dport 2087 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 3001 -j ACCEPT

# Set default policy to DROP
sudo iptables -P INPUT DROP
sudo iptables -P FORWARD DROP
sudo iptables -P OUTPUT ACCEPT

# Save rules
sudo iptables-save > /etc/iptables/rules.v4
```

## ⚠️ Security Notes

1. **Never commit .env files to Git** - They contain sensitive information
2. **Regenerate all secrets** for the new server for better security
3. **Use strong database passwords** (minimum 16 characters)
4. **Configure firewall** with rules above
5. **Keep all API keys secure** and rotate them periodically
6. **Use environment-specific secrets** for production vs development
7. **Regular security updates**: `sudo apt update && sudo apt upgrade`

---

## 🎯 Next Steps After Migration

1. Test all functionality on new server
2. Update DNS records to point to new server
3. Monitor logs for any errors
4. Set up automated backups for database
5. Configure monitoring/alerting (optional)
6. Decommission old server after verification

---

**Generated for:** Job Portal Migration
**Date:** ${new Date().toLocaleDateString()}
**Version:** 1.0

Good luck with your migration! 🚀

