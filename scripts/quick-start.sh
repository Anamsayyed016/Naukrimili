#!/bin/bash

echo "🚀 Quick Start: Setting up automated deployment for your job portal"
echo "=================================================================="

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "📁 Initializing git repository..."
    git init
    git add .
    git commit -m "Initial commit with automated deployment"
    git branch -M main
    echo "✅ Git repository initialized"
else
    echo "✅ Git repository already exists"
fi

# Check if remote origin exists
if ! git remote get-url origin > /dev/null 2>&1; then
    echo "🌐 Please add your GitHub repository URL:"
    echo "   Example: https://github.com/yourusername/jobportal.git"
    read -p "   Enter GitHub URL: " github_url
    
    if [ ! -z "$github_url" ]; then
        git remote add origin "$github_url"
        echo "✅ GitHub remote added"
    else
        echo "❌ No URL provided. Please add manually:"
        echo "   git remote add origin https://github.com/yourusername/jobportal.git"
    fi
else
    echo "✅ GitHub remote already exists"
fi

echo ""
echo "📋 Next steps to complete setup:"
echo "1. Push your code to GitHub:"
echo "   git push -u origin main"
echo ""
echo "2. Add GitHub secrets (Settings → Secrets → Actions):"
echo "   - HOST: 69.62.73.84"
echo "   - USERNAME: your-vps-username"
echo "   - SSH_KEY: your-private-ssh-key"
echo "   - PORT: 22"
echo ""
echo "3. Set up VPS (SSH into your VPS and run):"
echo "   chmod +x scripts/setup-vps.sh"
echo "   ./scripts/setup-vps.sh"
echo ""
echo "4. Test deployment by pushing changes to main branch"
echo ""
echo "📖 See DEPLOYMENT_SETUP.md for detailed instructions"
echo ""
echo "🎉 Your automated deployment system is ready to configure!"
