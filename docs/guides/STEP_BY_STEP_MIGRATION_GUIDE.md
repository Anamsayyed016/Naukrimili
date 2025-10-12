# 🚀 Step-by-Step Server Migration Guide

**Time Required:** 30-45 minutes  
**Difficulty:** Medium  
**Prerequisites:** New Hostinger VPS access, GitHub account access

---

## 📋 Before You Start

**What You Need:**
- ✅ New Hostinger server IP address
- ✅ Root/SSH access to new server
- ✅ GitHub repository access
- ✅ Current API keys (listed in this repo)

**What Will Happen:**
- New server will be configured
- Database will be created
- Application will be deployed
- Domain will be pointed to new server

---

## 🎯 Part 1: Prepare Your New Server (15 minutes)

### Step 1: Connect to New Server

```bash
# Replace with your new server IP
ssh root@YOUR_NEW_SERVER_IP
```

### Step 2: Update System

```bash
sudo apt update && sudo apt upgrade -y
```

### Step 3: Install Node.js 20

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version  # Should show v20.x.x
npm --version   # Should show 10.x.x
```

### Step 4: Install PM2

```bash
sudo npm install -g pm2

# Verify
pm2 --version
```

### Step 5: Install PostgreSQL

```bash
sudo apt install postgresql postgresql-contrib -y

# Check if running
sudo systemctl status postgresql
```

### Step 6: Create Database

```bash
# Switch to postgres user
sudo -u postgres psql

# Run these SQL commands (press Enter after each):
```

```sql
CREATE DATABASE jobportal;
CREATE USER postgres WITH PASSWORD 'job123';
GRANT ALL PRIVILEGES ON DATABASE jobportal TO postgres;
ALTER DATABASE jobportal OWNER TO postgres;
\q
```

**✅ Checkpoint:** Database created successfully

---

## 🔑 Part 2: Setup SSH Keys for GitHub Actions (10 minutes)

### Step 1: Generate New SSH Key on Your Local Machine

```bash
# Run on your LOCAL computer (Windows PowerShell or Git Bash)
ssh-keygen -t ed25519 -C "github-deploy-new-server" -f jobportal_new_key

# This creates two files:
# - jobportal_new_key (private key)
# - jobportal_new_key.pub (public key)
```

### Step 2: Copy Public Key to New Server

```bash
# On your LOCAL machine, display the public key:
cat jobportal_new_key.pub

# Copy the entire output (starts with "ssh-ed25519 ...")
```

**On the NEW SERVER:**

```bash
# Create .ssh directory
mkdir -p ~/.ssh
chmod 700 ~/.ssh

# Add your public key
nano ~/.ssh/authorized_keys
# Paste the public key from above
# Save: Ctrl+X, then Y, then Enter

# Set permissions
chmod 600 ~/.ssh/authorized_keys
```

### Step 3: Test SSH Connection

```bash
# From your LOCAL machine
ssh -i jobportal_new_key root@YOUR_NEW_SERVER_IP

# If it works without password, you're good! ✅
```

**✅ Checkpoint:** SSH key authentication working

---

## 🔐 Part 3: Update GitHub Secrets (5 minutes)

### Go to GitHub Secrets Page

1. Open: `https://github.com/YOUR_USERNAME/YOUR_REPO/settings/secrets/actions`
2. Click "New repository secret" for each secret below

### Add/Update These 4 Secrets:

**Secret 1: HOST**
- Name: `HOST`
- Value: `YOUR_NEW_SERVER_IP`

**Secret 2: SSH_USER**
- Name: `SSH_USER`
- Value: `root`

**Secret 3: SSH_KEY**
- Name: `SSH_KEY`
- Value: (Copy PRIVATE key)

```bash
# Display private key on your LOCAL machine:
cat jobportal_new_key

# Copy EVERYTHING including:
# -----BEGIN OPENSSH PRIVATE KEY-----
# ... all the lines ...
# -----END OPENSSH PRIVATE KEY-----
```

**Secret 4: SSH_PORT**
- Name: `SSH_PORT`
- Value: `22`

**✅ Checkpoint:** All GitHub secrets updated

---

## 📁 Part 4: Setup Project Directory on New Server (5 minutes)

### On Your NEW SERVER:

```bash
# Create project directory
sudo mkdir -p /var/www/jobportal
sudo chown -R $USER:$USER /var/www/jobportal

# Navigate to it
cd /var/www/jobportal

# Create .env file
nano .env
```

### Paste This Into .env File:

```bash
# Application URLs - UPDATE YOUR DOMAIN!
NEXT_PUBLIC_APP_URL=https://YOUR_DOMAIN.com
NEXTAUTH_URL=https://YOUR_DOMAIN.com

# Database
DATABASE_URL="postgresql://postgres:job123@localhost:5432/jobportal"

# Authentication
NEXTAUTH_SECRET="jobportal-secret-key-2024-naukrimili-production-deployment"
JWT_SECRET="jobportal-jwt-secret-2024-naukrimili-production"

# Job Search APIs (Working)
ADZUNA_APP_ID=bdd02427
ADZUNA_APP_KEY=abf03277d13e4cb39b24bf236ad29299
RAPIDAPI_KEY=3c767d3998msha8933e5d0c4a9b1p187000jsnd04d13d1e9bc
RAPIDAPI_HOST=jsearch.p.rapidapi.com
JSEARCH_API_KEY=3c767d3998msha8933e5d0c4a9b1p187000jsnd04d13d1e9bc
JOOBLE_API_KEY=d4d0ab09-32f9-4c37-be17-59629043ca4a

# Node Configuration
NODE_ENV=production
PORT=3000
HOSTNAME=0.0.0.0
NODE_OPTIONS=--max-old-space-size=4096
NEXT_TELEMETRY_DISABLED=1
NEXT_PUBLIC_SKIP_GOOGLE_FONTS=true
SKIP_ENV_VALIDATION=1
```

**Save:** Ctrl+X, then Y, then Enter

**✅ Checkpoint:** Environment file created

---

## 🚀 Part 5: Deploy via GitHub Actions (5 minutes)

### Trigger Deployment

1. Go to: `https://github.com/YOUR_USERNAME/YOUR_REPO/actions`
2. Click "🚀 Production Deployment" workflow
3. Click "Run workflow" button (right side)
4. Select "main" branch
5. Click green "Run workflow" button

### Monitor Progress

- Watch the deployment logs in real-time
- Should take about 10-15 minutes
- Look for green checkmarks ✅

### What GitHub Actions Will Do:

1. ✅ Install dependencies
2. ✅ Build the Next.js application
3. ✅ Copy files to your new server
4. ✅ Install dependencies on server
5. ✅ Generate Prisma client
6. ✅ Start application with PM2

**✅ Checkpoint:** Deployment completed successfully

---

## 🔍 Part 6: Verify Everything Works (5 minutes)

### On Your NEW SERVER:

```bash
# Check PM2 status
pm2 status
# Should show "jobportal" with status "online" ✅

# View logs
pm2 logs jobportal --lines 50

# Test health endpoint
curl http://localhost:3000/api/health
# Should return JSON with status ✅

# Test jobs endpoint
curl http://localhost:3000/api/jobs
# Should return job listings ✅

# Check if port 3000 is listening
netstat -tulpn | grep 3000
# Should show Node.js listening on port 3000 ✅
```

### Check Database Connection

```bash
cd /var/www/jobportal
npx prisma db pull
# Should connect successfully ✅
```

**✅ Checkpoint:** Application running successfully

---

## 🌐 Part 7: Update Domain DNS (Varies by DNS provider)

### Point Your Domain to New Server

**If using Cloudflare:**
1. Log into Cloudflare
2. Select your domain
3. Go to DNS settings
4. Edit A record for `@` (or your subdomain)
5. Update IP to: `YOUR_NEW_SERVER_IP`
6. Set Proxy status as needed
7. Save

**If using other DNS providers:**
- Similar process - update A record to new server IP
- TTL: Set to 300 (5 minutes) during migration
- Wait 5-60 minutes for DNS to propagate

### Verify DNS Propagation

```bash
# From your local machine
nslookup YOUR_DOMAIN.com

# Or check online: https://dnschecker.org
```

**✅ Checkpoint:** DNS pointing to new server

---

## 🔒 Part 8: Setup SSL Certificate (Optional but Recommended)

### Setup Firewall First

```bash
# Install UFW (Uncomplicated Firewall)
sudo apt install ufw -y

# Set default policies
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Allow essential ports (from your current server config)
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw allow 3000/tcp  # Next.js app
sudo ufw allow 5432/tcp  # PostgreSQL
sudo ufw allow 2087/tcp  # Control panel
sudo ufw allow 3001/tcp  # Additional services

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status verbose
```

### Install Certbot

```bash
# On your NEW SERVER
sudo apt install certbot python3-certbot-nginx -y
```

### Install Nginx (if not already installed)

```bash
sudo apt install nginx -y
```

### Configure Nginx

```bash
sudo nano /etc/nginx/sites-available/jobportal
```

**Paste this configuration:**

```nginx
server {
    listen 80;
    server_name YOUR_DOMAIN.com www.YOUR_DOMAIN.com;

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

**Enable the site:**

```bash
sudo ln -s /etc/nginx/sites-available/jobportal /etc/nginx/sites-enabled/
sudo nginx -t  # Test configuration
sudo systemctl restart nginx
```

### Get SSL Certificate

```bash
sudo certbot --nginx -d YOUR_DOMAIN.com -d www.YOUR_DOMAIN.com
# Follow the prompts
# Choose option 2: Redirect HTTP to HTTPS
```

**✅ Checkpoint:** HTTPS working

---

## ✅ Part 9: Final Verification

### Test From Your Browser

1. Open: `https://YOUR_DOMAIN.com`
2. Should load the job portal ✅
3. Try logging in ✅
4. Search for jobs ✅
5. Check if resume upload works ✅

### Monitor Logs

```bash
# PM2 logs
pm2 logs jobportal

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### Save PM2 Configuration

```bash
pm2 save
pm2 startup systemd
# Copy and run the command it gives you
```

**✅ Checkpoint:** Everything working!

---

## 📊 Troubleshooting

### Issue: PM2 shows "errored" or "stopped"

```bash
# Check logs
pm2 logs jobportal --err

# Restart
pm2 restart jobportal

# If still failing, check environment
cd /var/www/jobportal
cat .env  # Verify all variables are set
```

### Issue: Database connection error

```bash
# Test PostgreSQL
sudo -u postgres psql -c "SELECT version();"

# Test connection string
node -e "console.log(process.env.DATABASE_URL)"

# Verify database exists
sudo -u postgres psql -l | grep jobportal
```

### Issue: Port 3000 not accessible

```bash
# Check if app is running
pm2 status

# Check firewall
sudo ufw status
sudo ufw allow 3000

# Check Nginx
sudo nginx -t
sudo systemctl status nginx
```

### Issue: "502 Bad Gateway"

```bash
# App is not running
pm2 restart jobportal

# Check app logs
pm2 logs jobportal --lines 100
```

---

## 🎉 Migration Complete!

### What You've Accomplished:

✅ New server fully configured  
✅ Database created and running  
✅ Application deployed and running  
✅ SSL certificate installed  
✅ Domain pointing to new server  
✅ PM2 managing the application  
✅ Auto-restart on server reboot enabled  

### Next Steps:

1. **Monitor for 24 hours** - Watch logs for any errors
2. **Test all features** - Make sure everything works
3. **Update Google OAuth** (if using) - Add new domain to authorized URLs
4. **Setup backups** - Configure database backups
5. **Decommission old server** - After confirming everything works

---

## 📞 Quick Reference Commands

```bash
# Check application status
pm2 status

# View logs
pm2 logs jobportal

# Restart application
pm2 restart jobportal

# Check database
sudo -u postgres psql jobportal -c "SELECT COUNT(*) FROM \"Job\";"

# View environment variables
cat /var/www/jobportal/.env

# Update application (after code changes)
cd /var/www/jobportal
git pull origin main
npm install --legacy-peer-deps
npx prisma generate
pm2 restart jobportal
```

---

**Migration Guide Version:** 1.0  
**Last Updated:** ${new Date().toLocaleDateString()}  
**For:** Job Portal - Hostinger Server Migration

Good luck! 🚀 If you follow these steps, your migration should be smooth and successful.

