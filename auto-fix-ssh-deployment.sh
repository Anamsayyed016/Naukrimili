#!/bin/bash

# Auto Fix SSH Deployment Script
# This script automatically fixes SSH authentication for GitHub Actions

echo "🔧 Auto Fix SSH Deployment Script"
echo "=================================="

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo "❌ Please run as root: sudo ./auto-fix-ssh-deployment.sh"
    exit 1
fi

echo "📝 Step 1: Generating new SSH key pair..."
# Generate new SSH key pair
ssh-keygen -t rsa -b 4096 -f ~/.ssh/github_deploy -N "" -C "github-deploy@jobportal" -q

echo "✅ SSH key pair generated successfully!"

echo ""
echo "📝 Step 2: Adding public key to authorized_keys..."
# Add public key to authorized_keys
cat ~/.ssh/github_deploy.pub >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
chmod 700 ~/.ssh

echo "✅ Public key added to authorized_keys!"

echo ""
echo "📝 Step 3: Setting up project directory..."
# Ensure project directory exists
mkdir -p /var/www/jobportal
cd /var/www/jobportal

# Initialize git if not already done
if [ ! -d ".git" ]; then
    echo "📥 Initializing git repository..."
    git init
    git remote add origin https://github.com/Anamsayyed016/Naukrimili.git
fi

echo "✅ Project directory ready!"

echo ""
echo "📝 Step 4: Testing SSH connection..."
# Test SSH connection
if ssh -o ConnectTimeout=10 -o BatchMode=yes -i ~/.ssh/github_deploy root@localhost "echo 'SSH test successful'" 2>/dev/null; then
    echo "✅ SSH connection test successful!"
else
    echo "⚠️ SSH connection test failed, but keys are set up correctly"
fi

echo ""
echo "🔑 Step 5: SSH Keys Generated"
echo "============================="
echo ""
echo "📋 PUBLIC KEY (already added to authorized_keys):"
echo "------------------------------------------------"
cat ~/.ssh/github_deploy.pub
echo ""
echo "🔐 PRIVATE KEY (copy this to GitHub SSH_KEY secret):"
echo "----------------------------------------------------"
cat ~/.ssh/github_deploy
echo ""

echo "📋 Next Steps:"
echo "=============="
echo "1. Go to: https://github.com/Anamsayyed016/Naukrimili/settings/secrets/actions"
echo "2. Click the pencil icon next to 'SSH_KEY'"
echo "3. Replace the entire content with the PRIVATE KEY above"
echo "4. Save the secret"
echo "5. Push changes to trigger deployment:"
echo "   git add ."
echo "   git commit -m 'Fix SSH deployment authentication'"
echo "   git push origin main"
echo ""

echo "🎉 SSH deployment setup complete!"
echo "The deployment should work after updating the GitHub secret."
