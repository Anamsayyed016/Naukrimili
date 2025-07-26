# Vercel Deployment Guide for Job Portal

## Pre-deployment Checklist ✅

### 1. API Routes Fixed
- ✅ Fixed `/app/api/jobs/route.ts` - Added proper imports and fallback data
- ✅ Fixed `/app/api/resumes/upload/route.ts` - Updated for Edge runtime compatibility
- ✅ Fixed `/app/api/auth/[...nextauth]/route.ts` - Added proper error handling
- ✅ Fixed `/app/api/employer/analytics/route.ts` - Added mock data fallback
- ✅ Fixed `/app/api/employer/fraud-flag/route.ts` - Simplified without Prisma dependencies
- ✅ Fixed debug endpoints with proper error handling

### 2. Environment Variables Required

#### Essential (Required for deployment)
```env
NEXTAUTH_URL=https://your-app.vercel.app
NEXTAUTH_SECRET=your-nextauth-secret-min-32-chars
```

#### Optional (for enhanced functionality)
```env
# Database (if using Prisma/PostgreSQL)
DATABASE_URL=postgresql://username:password@host:5432/database

# Backend API (if separate Python backend is deployed)
BACKEND_API_URL=https://your-backend-api.herokuapp.com
NEXT_PUBLIC_API_URL=https://your-backend-api.herokuapp.com

# Google OAuth (optional)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Job APIs (optional - fallback to mock data if not provided)
SERPAPI_KEY=your_serpapi_key
ADZUNA_APP_ID=your_adzuna_app_id
ADZUNA_API_KEY=your_adzuna_api_key
REED_API_KEY=your_reed_api_key

# AI Features (optional)
OPENAI_API_KEY=your_openai_api_key

# Cloud Storage (optional)
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=us-east-1
S3_BUCKET_NAME=your-s3-bucket-name
```

### 3. Vercel Configuration
- ✅ Updated `vercel.json` with proper function configurations
- ✅ Set appropriate timeouts for API routes
- ✅ Added security headers

### 4. Build Configuration
- ✅ Package.json scripts are correct
- ✅ TypeScript configuration is valid
- ✅ Next.js configuration supports the project structure

## Deployment Steps

### Step 1: Environment Setup in Vercel
1. Go to your Vercel dashboard
2. Import your GitHub repository
3. Add environment variables in Project Settings:
   - `NEXTAUTH_SECRET`: Generate with `openssl rand -base64 32`
   - `NEXTAUTH_URL`: Your Vercel app URL (e.g., `https://your-app.vercel.app`)
   - Add other optional variables as needed

### Step 2: Deploy
1. Push your code to GitHub
2. Vercel will automatically deploy
3. Check deployment logs for any issues

### Step 3: Test Core Features
After deployment, test these endpoints:
- ✅ `/api/jobs` - Should return mock job data
- ✅ `/api/companies` - Should return company listings
- ✅ `/api/locations` - Should return Indian cities
- ✅ `/api/auth/[...nextauth]` - Should handle authentication
- ✅ `/api/resumes/upload` - Should handle file uploads

### Step 4: Optional Backend Integration
If you have a separate Python backend:
1. Deploy your Flask/FastAPI backend to Heroku/Railway/etc.
2. Set `BACKEND_API_URL` environment variable
3. API routes will automatically fallback to backend when available

## Features Working Without Backend

The application will work with these features using mock data:
- ✅ Job search and listings
- ✅ Company profiles
- ✅ Location-based search
- ✅ User authentication (demo mode)
- ✅ Resume upload (file validation only)
- ✅ Employer analytics (mock data)

## Troubleshooting Common Issues

### Build Errors
1. **TypeScript errors**: Check imports and type definitions
2. **Missing dependencies**: Run `npm install` locally to verify
3. **API route errors**: Check for proper Next.js 13+ App Router syntax

### Runtime Errors
1. **Authentication issues**: Verify `NEXTAUTH_SECRET` and `NEXTAUTH_URL`
2. **API failures**: Check environment variables are set correctly
3. **File upload issues**: Edge runtime has limitations, files are validated but not persisted

### Performance Issues
1. **Cold starts**: First requests may be slower on Vercel free tier
2. **API timeouts**: Adjusted to 30s for most routes, 60s for uploads
3. **Large dependencies**: Optimized imports to reduce bundle size

## Monitoring & Maintenance

### Health Checks
- `/api/jobs/debug` - Comprehensive system status
- `/api/clear-cache` - Cache management
- Vercel Analytics for performance monitoring

### Updates
1. Update dependencies regularly
2. Monitor API usage for external services
3. Check Vercel function invocation limits

## Security Considerations
- ✅ Added security headers in vercel.json
- ✅ Input validation on all API routes
- ✅ Authentication required for sensitive operations
- ✅ File upload restrictions and validation
- ✅ No sensitive data in client-side code

## Next Steps After Deployment
1. Set up domain name (optional)
2. Configure analytics and monitoring
3. Set up backend API if needed
4. Add real payment processing if required
5. Set up email notifications
6. Configure database for persistent data

Your job portal should now be successfully deployed on Vercel! 🚀
