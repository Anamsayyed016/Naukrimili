# Deployment Guide for Job Portal

## Prerequisites
- Node.js 18+ installed
- MongoDB database (local or MongoDB Atlas)
- Render account for deployment

## Environment Variables Setup

### Required Environment Variables for Frontend:
```
NODE_ENV=production
NEXTAUTH_SECRET=your-secret-key-here
NEXTAUTH_URL=https://your-app.onrender.com
MONGODB_URI=your-mongodb-connection-string
```

### Optional Environment Variables:
```
OPENAI_API_KEY=your-openai-api-key
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=us-east-1
S3_BUCKET_NAME=your-bucket-name
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

## Deployment on Render

### Frontend Deployment:
1. Push your code to GitHub
2. Connect your GitHub repo to Render
3. Create a new Web Service
4. Use these settings:
   - **Environment**: Node
   - **Build Command**: `npm install -g pnpm && pnpm install && pnpm build`
   - **Start Command**: `pnpm start`
   - **Node Version**: 18

### Backend Deployment (if using Python backend):
1. Create another Web Service for the backend
2. Use these settings:
   - **Environment**: Python
   - **Build Command**: `pip install -r backend/requirements.txt`
   - **Start Command**: `cd backend && python -m gunicorn --bind 0.0.0.0:$PORT app:app`
   - **Python Version**: 3.11

### Database Setup:
1. Use MongoDB Atlas (recommended for production)
2. Create a cluster and get connection string
3. Add the connection string to your environment variables

## Build Issues Fixed:
- ✅ Fixed peer dependencies (zod version conflict)
- ✅ Removed deprecated packages
- ✅ Fixed husky installation issues
- ✅ Simplified error handling to prevent JSON stringify errors
- ✅ Updated build configuration for deployment

## Local Development:
```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start
```

## Testing the Build:
```bash
# Run build locally to test
pnpm build

# Start the production build
pnpm start
```

The application should now be ready for deployment on Render!
