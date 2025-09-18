# 🚀 Admin Panel Setup Commands

## ✅ **Admin Panel Implementation Complete**

Your job portal now has a comprehensive admin panel with dynamic CRUD operations, improved UI/UX, and proper security.

## 🔧 **Server Commands for Production**

### **1. Build and Deploy to Server**
```bash
# Build the application
npm run build

# Copy to server (replace with your server details)
scp -r .next/ user@your-server:/path/to/jobportal/
scp -r app/ user@your-server:/path/to/jobportal/
scp -r lib/ user@your-server:/path/to/jobportal/
scp -r middleware.ts user@your-server:/path/to/jobportal/
scp -r package.json user@your-server:/path/to/jobportal/
```

### **2. Server Environment Setup**
```bash
# SSH into your server
ssh user@your-server

# Navigate to project directory
cd /path/to/jobportal

# Install dependencies
npm install

# Set up environment variables
nano .env
```

### **3. Environment Variables (.env)**
```env
# Database (Update with your server credentials)
DATABASE_URL="postgresql://username:password@localhost:5432/jobportal"

# NextAuth Configuration
NEXTAUTH_URL=https://aftionix.in
NEXTAUTH_SECRET=your-super-secret-key-here-min-32-characters

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Production Settings
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://aftionix.in
```

### **4. Database Setup**
```bash
# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma db push

# Seed initial data (optional)
npm run seed
```

### **5. Start Production Server**
```bash
# Using PM2 (recommended)
pm2 start ecosystem.config.js --name jobportal

# Or using npm
npm start

# Check PM2 status
pm2 status
pm2 logs jobportal
```

### **6. Nginx Configuration Update**
```bash
# Update Nginx config
sudo nano /etc/nginx/conf.d/aftionix.conf

# Test Nginx configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

### **7. SSL Certificate (if not already done)**
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d aftionix.in -d www.aftionix.in

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

## 🎯 **Admin Panel Features Implemented**

### **✅ Dynamic CRUD Operations**
- **Users Management**: Create, Read, Update, Delete users
- **Companies Management**: Full company profile management
- **Jobs Management**: Approve, reject, feature, delete jobs
- **Real-time Updates**: Live data refresh and updates

### **✅ Improved UI/UX**
- **Better Visibility**: Fixed white background contrast issues
- **Modern Design**: Clean, professional admin interface
- **Responsive Layout**: Works on all device sizes
- **Loading States**: Proper loading indicators
- **Error Handling**: User-friendly error messages

### **✅ Security Features**
- **Route Protection**: Admin-only access to admin pages
- **Authentication**: Proper admin role verification
- **API Security**: Protected admin API endpoints
- **Input Validation**: Form validation and sanitization

### **✅ Analytics Dashboard**
- **Real-time Stats**: Live platform statistics
- **Growth Metrics**: User and job growth tracking
- **Visual Charts**: Data visualization components
- **Export Options**: Data export capabilities

## 🔗 **Admin Panel URLs**

- **Main Dashboard**: `https://aftionix.in/dashboard/admin`
- **User Management**: `https://aftionix.in/dashboard/admin/users`
- **Company Management**: `https://aftionix.in/dashboard/admin/companies`
- **Job Management**: `https://aftionix.in/dashboard/admin/jobs`
- **Analytics**: `https://aftionix.in/dashboard/admin/analytics`

## 🚨 **Important Notes**

1. **Database Connection**: Make sure your server database credentials are correct
2. **Admin User**: Create an admin user with role 'admin' in the database
3. **Permissions**: Ensure proper file permissions on the server
4. **Monitoring**: Set up PM2 monitoring and log rotation
5. **Backups**: Regular database and file backups

## 🛠️ **Troubleshooting**

### **If Admin Panel Not Loading:**
```bash
# Check PM2 status
pm2 status

# Check logs
pm2 logs jobportal

# Restart application
pm2 restart jobportal
```

### **If Database Connection Fails:**
```bash
# Test database connection
curl https://aftionix.in/api/admin/test-db

# Check database status
sudo systemctl status postgresql
```

### **If UI Issues Persist:**
```bash
# Clear Next.js cache
rm -rf .next
npm run build
pm2 restart jobportal
```

## 🎉 **Success!**

Your admin panel is now fully functional with:
- ✅ Dynamic CRUD operations
- ✅ Improved UI/UX with better visibility
- ✅ Proper security and authentication
- ✅ Real-time analytics and monitoring
- ✅ Professional admin interface

The admin panel connects seamlessly with your existing job portal, allowing you to manage users, companies, and jobs effectively!
