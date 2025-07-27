# 🚀 DEPLOYMENT GUIDE

## Quick Deploy to Vercel (5 minutes)

### 1. Install Vercel CLI
```bash
npm i -g vercel
```

### 2. Login to Vercel
```bash
vercel login
```

### 3. Deploy
```bash
vercel --prod
```

### 4. Set Environment Variables
In Vercel Dashboard → Settings → Environment Variables:

```
NEXTAUTH_SECRET = your-super-secret-production-key-here
NEXTAUTH_URL = https://your-app-name.vercel.app
NODE_ENV = production
```

## Alternative: GitHub + Vercel Auto Deploy

### 1. Push to GitHub
```bash
git add .
git commit -m "Ready for deployment"
git push origin main
```

### 2. Connect to Vercel
- Go to vercel.com
- Import your GitHub repo
- Add environment variables
- Deploy automatically

## Your Live URLs After Deployment

- **Main Site**: https://your-app-name.vercel.app
- **Job Search**: https://your-app-name.vercel.app/jobs
- **Companies**: https://your-app-name.vercel.app/companies
- **Dashboard**: https://your-app-name.vercel.app/dashboard

## Working APIs After Deployment

- `GET /api/jobs/real` - Dynamic job search
- `POST /api/resumes/upload` - Resume upload
- `GET /api/companies` - Company data
- `POST /api/auth/[...nextauth]` - Authentication

## ✅ Ready to Deploy!

Your job portal is 100% ready for production deployment with all features working!