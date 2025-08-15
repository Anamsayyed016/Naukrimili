#!/bin/bash

echo "🔑 QUICK SSH KEY FIX - IMMEDIATE SOLUTION"
echo "=========================================="
echo ""

# Check if we're in the right directory
if [ ! -f "SSH_KEY_FIX.md" ]; then
    echo "❌ Please run this script from your project root directory"
    exit 1
fi

echo "🚨 PROBLEM IDENTIFIED:"
echo "   Your SSH key is corrupted (only 1 byte)"
echo "   GitHub Actions cannot authenticate"
echo ""

echo "🔧 IMMEDIATE SOLUTION:"
echo "   1. Generate NEW SSH key"
echo "   2. Update server"
echo "   3. Update GitHub secrets"
echo ""

echo "📋 STEP 1: Generate NEW SSH Key"
echo "   Run these commands on your LOCAL machine:"
echo ""
echo "   cd ~/.ssh"
echo "   rm -f github_actions*"
echo "   ssh-keygen -t ed25519 -C 'github-actions-deployment' -f github_actions -N ''"
echo ""

echo "📋 STEP 2: Copy NEW Public Key"
echo "   cat github_actions.pub"
echo "   Copy the ENTIRE output"
echo ""

echo "📋 STEP 3: Update Server"
echo "   SSH to your server and run:"
echo "   ssh root@69.62.73.84"
echo "   rm -f ~/.ssh/authorized_keys"
echo "   echo 'YOUR_NEW_PUBLIC_KEY' > ~/.ssh/authorized_keys"
echo "   chmod 600 ~/.ssh/authorized_keys"
echo "   chmod 700 ~/.ssh"
echo ""

echo "📋 STEP 4: Update GitHub Secrets"
echo "   1. Go to GitHub → Settings → Secrets → Actions"
echo "   2. DELETE old SSH_PRIVATE_KEY"
echo "   3. ADD new SSH_PRIVATE_KEY with NEW key content"
echo ""

echo "📋 STEP 5: Test"
echo "   ssh -i ~/.ssh/github_actions root@69.62.73.84"
echo ""

echo "🎯 ALTERNATIVE: Manual Deployment"
echo "   If SSH continues to fail, use:"
echo "   cd /var/www/jobportal"
echo "   sudo ./deploy.sh"
echo ""

echo "📖 For detailed instructions, see: SSH_KEY_FIX.md"
echo ""

echo "🚀 READY TO FIX?"
echo "   Follow the steps above and your deployment will work!"
echo ""

# Check if SSH key exists locally
if [ -f ~/.ssh/github_actions ]; then
    echo "✅ Found local SSH key: ~/.ssh/github_actions"
    echo "   Key size: $(wc -c < ~/.ssh/github_actions) bytes"
    echo "   Key format: $(ssh-keygen -l -f ~/.ssh/github_actions 2>/dev/null | head -1 || echo 'Invalid format')"
else
    echo "❌ No local SSH key found"
    echo "   Please generate one using the steps above"
fi

echo ""
echo "🔧 Need help? Check SSH_KEY_FIX.md for detailed instructions"
