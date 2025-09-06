#!/bin/bash

# SSH Deployment Fix Script
# This script generates a new SSH key pair and provides setup instructions

echo "🔧 SSH Deployment Fix Script"
echo "=============================="

# Generate new SSH key pair
echo "📝 Generating new SSH key pair..."
ssh-keygen -t rsa -b 4096 -f ~/.ssh/jobportal_deploy -N "" -C "jobportal-deploy@github"

echo ""
echo "✅ SSH key pair generated successfully!"
echo ""

# Display public key
echo "📋 PUBLIC KEY (copy this to your VPS ~/.ssh/authorized_keys):"
echo "================================================================"
cat ~/.ssh/jobportal_deploy.pub
echo ""

# Display private key
echo "🔐 PRIVATE KEY (copy this to GitHub SSH_KEY secret):"
echo "====================================================="
cat ~/.ssh/jobportal_deploy
echo ""

echo "📋 SETUP INSTRUCTIONS:"
echo "======================"
echo ""
echo "1. Add the PUBLIC KEY to your VPS:"
echo "   ssh root@69.62.73.84"
echo "   echo '$(cat ~/.ssh/jobportal_deploy.pub)' >> ~/.ssh/authorized_keys"
echo "   chmod 600 ~/.ssh/authorized_keys"
echo ""
echo "2. Update GitHub Secrets:"
echo "   Go to: https://github.com/Anamsayyed016/Naukrimili/settings/secrets/actions"
echo "   Update these secrets:"
echo "   - HOST: 69.62.73.84"
echo "   - SSH_USER: root"
echo "   - SSH_KEY: [Copy the entire private key above]"
echo "   - SSH_PORT: 22"
echo ""
echo "3. Test SSH connection:"
echo "   ssh -i ~/.ssh/jobportal_deploy root@69.62.73.84"
echo ""
echo "4. Push changes to trigger deployment:"
echo "   git add ."
echo "   git commit -m 'Fix SSH deployment authentication'"
echo "   git push origin main"
echo ""
echo "🎉 Setup complete! The deployment should work now."
