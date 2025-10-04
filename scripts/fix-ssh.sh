#!/bin/bash

echo "🔧 Fixing SSH authentication for GitHub Actions..."

# Create .ssh directory if it doesn't exist
mkdir -p ~/.ssh
chmod 700 ~/.ssh

# Generate new SSH key for GitHub Actions
echo "🔑 Generating new SSH key..."
ssh-keygen -t rsa -b 4096 -f ~/.ssh/github_actions -N "" -C "github-actions-deploy-$(date +%s)"

# Add public key to authorized_keys
echo "📝 Adding public key to authorized_keys..."
cat ~/.ssh/github_actions.pub >> ~/.ssh/authorized_keys

# Set proper permissions
chmod 600 ~/.ssh/authorized_keys
chmod 600 ~/.ssh/github_actions
chmod 644 ~/.ssh/github_actions.pub

# Restart SSH service
echo "🔄 Restarting SSH service..."
systemctl restart sshd

echo "✅ SSH key generated and configured"
echo "📋 Public key for GitHub secrets:"
echo "---"
cat ~/.ssh/github_actions.pub
echo "---"
echo ""
echo "📋 Private key for GitHub secrets:"
echo "---"
cat ~/.ssh/github_actions
echo "---"
