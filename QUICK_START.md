# 🚀 QUICK START - Deploy Your Job Portal in 5 Minutes!

## Your VPS Details
- **IP Address**: `69.62.73.84`
- **Domain**: `aftionix.in`
- **OS**: AlmaLinux 9 with cPanel
- **Location**: India - Mumbai

## ⚡ FAST DEPLOYMENT (Choose One)

### Option 1: PowerShell (Windows) - RECOMMENDED
```powershell
# Run this in PowerShell
.\deploy-vps.ps1
```

### Option 2: Manual VPS Setup
```bash
# Connect to your VPS
ssh root@69.62.73.84

# Run these commands on VPS
curl -fsSL https://rpm.nodesource.com/setup_18.x | bash -
yum install -y nodejs nginx
npm install -g pm2

mkdir -p /var/www/aftionix.in
cd /var/www/aftionix.in

# Clone your project (replace with your repo)
git clone https://github.com/yourusername/jobportal.git .
npm install --production
npm run build

# Start with PM2
pm2 start npm --name "aftionix" -- start
pm2 save
pm2 startup

# Configure Nginx
# (Use the config from deploy-vps.ps1)
```

## 🌐 DNS Setup (Do This First!)

Update your DNS records in your domain control panel:

### A Record
- **Type**: A
- **Name**: @
- **Content**: `69.62.73.84`
- **TTL**: 300

### CNAME Record
- **Type**: CNAME
- **Name**: www
- **Content**: `aftionix.in`
- **TTL**: 300

## 🔧 What Gets Deployed

✅ **Job Search & Apply System**
✅ **User Authentication (Google OAuth)**
✅ **Resume Upload & Management**
✅ **Company Dashboard**
✅ **Admin Panel**
✅ **Responsive Design**
✅ **SSL Certificate (HTTPS)**
✅ **Performance Monitoring**

## 📱 Features Included

- **Job Search**: Advanced filters, location-based search
- **User Profiles**: Job seekers and employers
- **Resume Builder**: AI-powered resume creation
- **Application Tracking**: Real-time status updates
- **Company Portal**: Job posting and candidate management
- **Admin Dashboard**: User management and analytics
- **Mobile Responsive**: Works on all devices
- **SEO Optimized**: Search engine friendly

## 🚨 Emergency Commands

If something goes wrong:

```bash
# Check VPS status
ssh root@69.62.73.84
pm2 status
pm2 logs aftionix

# Restart services
pm2 restart aftionix
systemctl restart nginx

# Check logs
tail -f /var/log/nginx/error.log
pm2 logs aftionix --lines 100
```

## 🎯 Expected Result

After deployment, your job portal will be available at:
- **Main Site**: https://aftionix.in
- **Admin Panel**: https://aftionix.in/admin
- **Job Search**: https://aftionix.in/jobs
- **User Dashboard**: https://aftionix.in/dashboard

## 📞 Quick Support

If you need help:
1. Check the logs: `pm2 logs aftionix`
2. Verify DNS propagation: `nslookup aftionix.in`
3. Test VPS connection: `curl -I http://69.62.73.84`

## ⚡ Speed Tips

- DNS changes can take up to 48 hours (usually 15 minutes)
- Use Cloudflare for faster DNS propagation
- Enable CDN for better performance
- Monitor with PM2: `pm2 monit`

---

**🎉 Your professional job portal will be live in minutes!**

**Next**: Run `.\deploy-vps.ps1` and watch the magic happen! 🚀
