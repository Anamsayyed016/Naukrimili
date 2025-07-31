# Job Portal Deployment Guide - Render

## 🚀 Deployment Overview

This guide will help you deploy your job portal application on Render with:
- **Frontend**: Next.js application
- **Backend**: Python Flask/FastAPI API
- **Database**: MongoDB Atlas
- **File Storage**: AWS S3

## 📋 Prerequisites

1. **Render Account**: Sign up at [render.com](https://render.com)
2. **GitHub Repository**: Your code should be in a GitHub repository
3. **MongoDB Atlas**: Set up a MongoDB Atlas cluster
4. **AWS S3**: Configure S3 bucket for file storage
5. **API Keys**: Get your OpenAI API key

## 🔧 Step-by-Step Deployment

### Step 1: Prepare Your Repository

Ensure your repository has the following structure:
```
jobportal/
├── package.json              # Frontend dependencies
├── render.yaml              # Render configuration
├── backend/
│   ├── requirements.txt     # Python dependencies
│   ├── Procfile           # Backend startup command
│   └── app.py             # Main Flask app
└── README.md
```

### Step 2: Connect to Render

1. **Login to Render Dashboard**
2. **Click "New +" → "Blueprint"**
3. **Connect your GitHub repository**
4. **Select the repository containing your job portal**

### Step 3: Configure Environment Variables

#### Frontend Service Variables:
```
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://your-backend-service.onrender.com
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database
DATABASE_URL=mongodb+srv://username:password@cluster.mongodb.net/database
NEXTAUTH_URL=https://your-frontend-service.onrender.com
NEXTAUTH_SECRET=your-secret-key
OPENAI_API_KEY=your-openai-api-key
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=us-east-1
S3_BUCKET_NAME=your-s3-bucket-name
```

#### Backend Service Variables:
```
PYTHON_VERSION=3.11.0
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database
OPENAI_API_KEY=your-openai-api-key
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=us-east-1
S3_BUCKET_NAME=your-s3-bucket-name
JWT_SECRET_KEY=your-jwt-secret
FLASK_ENV=production
```

### Step 4: Deploy

1. **Review the blueprint configuration**
2. **Click "Apply" to deploy both services**
3. **Wait for deployment to complete (5-10 minutes)**

## 🔍 Service URLs

After deployment, you'll get:
- **Frontend**: `https://jobportal-frontend.onrender.com`
- **Backend**: `https://jobportal-backend.onrender.com`

## 🛠️ Troubleshooting

### Common Issues:

1. **Build Failures**:
   - Check that all dependencies are in `package.json` and `requirements.txt`
   - Ensure Python version is compatible (3.11.0)

2. **Environment Variables**:
   - Verify all required variables are set
   - Check that API keys are valid

3. **Database Connection**:
   - Ensure MongoDB Atlas is accessible from Render
   - Check connection string format

4. **File Upload Issues**:
   - Verify S3 credentials are correct
   - Check bucket permissions

### Health Checks:

- **Frontend**: `https://jobportal-frontend.onrender.com/api/health`
- **Backend**: `https://jobportal-backend.onrender.com/`

## 📊 Monitoring

1. **Render Dashboard**: Monitor service health and logs
2. **Custom Domains**: Add your domain in Render settings
3. **SSL**: Automatically provided by Render

## 🔄 Continuous Deployment

- **Auto-deploy**: Enabled by default
- **Manual deploy**: Available in Render dashboard
- **Rollback**: Previous versions can be restored

## 💰 Cost Optimization

- **Free Tier**: 750 hours/month per service
- **Upgrade**: When you need more resources
- **Scaling**: Automatic scaling available on paid plans

## 🚀 Next Steps

1. **Test all features** after deployment
2. **Set up custom domain** if needed
3. **Configure monitoring** and alerts
4. **Set up CI/CD** for automated deployments

## 📞 Support

- **Render Documentation**: [docs.render.com](https://docs.render.com)
- **Render Support**: Available in dashboard
- **Community**: Render Discord and forums
