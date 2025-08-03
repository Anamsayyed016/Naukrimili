# NaukriMili Job Portal - Hostinger Deployment Guide

## 🚀 Quick Deployment Steps

### 1. Prepare Your Project
```bash
# Clone or prepare your project
git clone <your-repo>
cd jobportal

# Install dependencies
npm install

# Build the project
npm run hostinger-build
```

### 2. Upload to Hostinger
1. **Access Hostinger Control Panel**
   - Log in to your Hostinger account
   - Go to "Websites" → "Manage"
   - Select your domain

2. **Upload Files**
   - Use File Manager or FTP
   - Upload the entire project folder to `public_html/`
   - Ensure `.next/` folder is included

3. **Set Environment Variables**
   - Create `.env.local` file in root directory
   - Add your environment variables (see below)

### 3. Configure Hostinger
1. **Node.js Setup**
   - Go to "Advanced" → "Node.js"
   - Enable Node.js
   - Set Node.js version to 18.x or higher
   - Set startup file to: `server.js`

2. **Domain Configuration**
   - Point your domain to the project directory
   - Enable HTTPS (SSL certificate)

## 📋 Environment Variables

Create `.env.local` file with the following variables:

```env
# App Configuration
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://yourdomain.com
NEXTAUTH_URL=https://yourdomain.com
NEXTAUTH_SECRET=your-secret-key-here

# Database (MongoDB Atlas recommended)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/naukrimili

# Authentication
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# AI Services (Optional)
OPENAI_API_KEY=your-openai-api-key

# Job APIs (Optional)
ADZUNA_APP_ID=your-adzuna-app-id
ADZUNA_API_KEY=your-adzuna-api-key
REED_API_KEY=your-reed-api-key

# AWS S3 (Optional for file uploads)
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=us-east-1
S3_BUCKET_NAME=your-s3-bucket-name
```

## 🔧 Hostinger-Specific Configuration

### 1. Custom Server Setup
Create `server.js` in the root directory:

```javascript
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = process.env.PORT || 3000;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  })
    .once('error', (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
    });
});
```

### 2. .htaccess Configuration
Create `.htaccess` file in `public_html/`:

```apache
RewriteEngine On

# Handle Next.js routing
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ /index.html [QSA,L]

# Security headers
Header always set X-Frame-Options DENY
Header always set X-Content-Type-Options nosniff
Header always set X-XSS-Protection "1; mode=block"
Header always set Referrer-Policy "strict-origin-when-cross-origin"

# Cache control for static assets
<FilesMatch "\.(css|js|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$">
    Header set Cache-Control "max-age=31536000, public"
</FilesMatch>

# Cache control for API routes
<FilesMatch "^api/">
    Header set Cache-Control "no-cache, no-store, must-revalidate"
</FilesMatch>
```

## 🚀 Deployment Commands

### Build Commands
```bash
# Production build
npm run hostinger-build

# Start production server
npm run hostinger-start

# Test APIs
npm run api-test
```

### File Structure for Hostinger
```
public_html/
├── .next/           # Build output
├── public/          # Static files
├── server.js        # Custom server
├── package.json     # Dependencies
├── .env.local       # Environment variables
├── .htaccess        # Apache configuration
└── node_modules/    # Dependencies (if not using npm install on server)
```

## 🔍 Post-Deployment Checklist

### 1. Test Core Functionality
- [ ] Homepage loads correctly
- [ ] Job search works
- [ ] User registration/login
- [ ] API endpoints respond
- [ ] File uploads work (if configured)

### 2. Performance Optimization
- [ ] Images are optimized
- [ ] CSS/JS are minified
- [ ] Caching is working
- [ ] Page load times are acceptable

### 3. Security Verification
- [ ] HTTPS is enabled
- [ ] Security headers are set
- [ ] Environment variables are secure
- [ ] No sensitive data in client-side code

### 4. SEO & Analytics
- [ ] Meta tags are correct
- [ ] Sitemap is generated
- [ ] Google Analytics is configured
- [ ] Search console is set up

## 🛠️ Troubleshooting

### Common Issues

1. **500 Internal Server Error**
   - Check Node.js version (should be 18+)
   - Verify environment variables
   - Check server logs in Hostinger control panel

2. **API Routes Not Working**
   - Ensure `.htaccess` is configured correctly
   - Check if `server.js` is set as startup file
   - Verify API routes are built correctly

3. **Static Assets Not Loading**
   - Check file permissions
   - Verify `.next/static/` folder exists
   - Clear browser cache

4. **Database Connection Issues**
   - Verify MongoDB connection string
   - Check if MongoDB Atlas IP whitelist includes Hostinger IPs
   - Ensure database user has correct permissions

### Performance Tips

1. **Enable Compression**
   - Gzip compression is handled by Next.js
   - Ensure Hostinger supports compression

2. **Optimize Images**
   - Use Next.js Image component
   - Implement lazy loading
   - Use WebP format when possible

3. **Caching Strategy**
   - Static assets: 1 year
   - API responses: No cache
   - HTML pages: Short cache

## 📞 Support

If you encounter issues:

1. Check Hostinger's Node.js documentation
2. Review Next.js deployment guides
3. Check server logs in Hostinger control panel
4. Verify all environment variables are set correctly

## 🔄 Updates & Maintenance

### Regular Maintenance
- Keep Node.js version updated
- Update dependencies regularly
- Monitor server logs
- Backup database regularly

### Deployment Updates
```bash
# Pull latest changes
git pull origin main

# Install new dependencies
npm install

# Build and deploy
npm run hostinger-build

# Restart server
npm run hostinger-start
```

---

**Note**: This guide assumes you have a Hostinger hosting plan that supports Node.js applications. Make sure your plan includes Node.js support before attempting deployment. 