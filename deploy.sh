#!/bin/bash

# Job Portal Deployment Script for Render
echo "🚀 Job Portal Deployment Script"
echo "================================"

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "❌ Git repository not found. Please initialize git first:"
    echo "   git init"
    echo "   git add ."
    echo "   git commit -m 'Initial commit'"
    echo "   git remote add origin <your-github-repo-url>"
    echo "   git push -u origin main"
    exit 1
fi

# Check if all required files exist
echo "📋 Checking required files..."

required_files=(
    "package.json"
    "render.yaml"
    "backend/requirements.txt"
    "backend/Procfile"
    "backend/app.py"
)

for file in "${required_files[@]}"; do
    if [ ! -f "$file" ]; then
        echo "❌ Missing required file: $file"
        exit 1
    else
        echo "✅ Found: $file"
    fi
done

echo ""
echo "✅ All required files found!"
echo ""

# Check environment variables
echo "🔧 Environment Variables Checklist:"
echo "=================================="
echo ""
echo "Frontend Variables (set in Render dashboard):"
echo "  - NODE_ENV=production"
echo "  - NEXT_PUBLIC_API_URL=https://your-backend-service.onrender.com"
echo "  - MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database"
echo "  - DATABASE_URL=mongodb+srv://username:password@cluster.mongodb.net/database"
echo "  - NEXTAUTH_URL=https://your-frontend-service.onrender.com"
echo "  - NEXTAUTH_SECRET=your-secret-key"
echo "  - OPENAI_API_KEY=your-openai-api-key"
echo "  - AWS_ACCESS_KEY_ID=your-aws-access-key"
echo "  - AWS_SECRET_ACCESS_KEY=your-aws-secret-key"
echo "  - AWS_REGION=us-east-1"
echo "  - S3_BUCKET_NAME=your-s3-bucket-name"
echo ""
echo "Backend Variables (set in Render dashboard):"
echo "  - PYTHON_VERSION=3.11.0"
echo "  - MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database"
echo "  - OPENAI_API_KEY=your-openai-api-key"
echo "  - AWS_ACCESS_KEY_ID=your-aws-access-key"
echo "  - AWS_SECRET_ACCESS_KEY=your-aws-secret-key"
echo "  - AWS_REGION=us-east-1"
echo "  - S3_BUCKET_NAME=your-s3-bucket-name"
echo "  - JWT_SECRET_KEY=your-jwt-secret"
echo "  - FLASK_ENV=production"
echo ""

# Deployment instructions
echo "🚀 Deployment Steps:"
echo "==================="
echo ""
echo "1. Push your code to GitHub:"
echo "   git add ."
echo "   git commit -m 'Prepare for Render deployment'"
echo "   git push origin main"
echo ""
echo "2. Go to Render Dashboard:"
echo "   https://dashboard.render.com"
echo ""
echo "3. Click 'New +' → 'Blueprint'"
echo ""
echo "4. Connect your GitHub repository"
echo ""
echo "5. Configure environment variables in Render dashboard"
echo ""
echo "6. Click 'Apply' to deploy both services"
echo ""
echo "7. Wait for deployment (5-10 minutes)"
echo ""
echo "8. Test your services:"
echo "   Frontend: https://jobportal-frontend.onrender.com"
echo "   Backend: https://jobportal-backend.onrender.com"
echo ""
echo "📚 For detailed instructions, see: DEPLOYMENT_GUIDE.md"
echo ""
echo "🎉 Good luck with your deployment!"