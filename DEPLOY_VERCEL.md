# Deploy to Vercel - Quick Guide

## 1. Prerequisites
- GitHub account
- Vercel account (free)
- MongoDB Atlas account (free)

## 2. Setup Database
```bash
# Create MongoDB Atlas cluster (free tier)
# Get connection string: mongodb+srv://username:password@cluster.mongodb.net/jobportal
```

## 3. Deploy Steps

### Option A: GitHub Integration (Recommended)
1. Push code to GitHub repository
2. Go to [vercel.com](https://vercel.com)
3. Click "New Project"
4. Import your GitHub repository
5. Vercel auto-detects Next.js settings

### Option B: Vercel CLI
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel --prod
```

## 4. Environment Variables
Set these in Vercel Dashboard → Settings → Environment Variables:

```
DATABASE_URL=mongodb+srv://username:password@cluster.mongodb.net/jobportal
NEXTAUTH_SECRET=generate-32-char-secret
NEXTAUTH_URL=https://your-app.vercel.app
GOOGLE_CLIENT_ID=your-google-id (optional)
GOOGLE_CLIENT_SECRET=your-google-secret (optional)
NODE_ENV=production
```

## 5. Custom Domain (Optional)
1. Go to Vercel Dashboard → Domains
2. Add your custom domain
3. Update DNS records as instructed

## 6. Test Deployment
- Visit: `https://your-app.vercel.app/api/health`
- Should return: `{"success": true, "message": "API is running"}`

## 7. Automatic Deployments
- Every push to main branch triggers deployment
- Preview deployments for pull requests
- Rollback available in Vercel dashboard

## Troubleshooting
- Check Vercel build logs for errors
- Verify environment variables are set
- Test API routes: `/api/health`
- Check MongoDB Atlas network access (allow all IPs: 0.0.0.0/0)

Your job portal is now live! 🚀