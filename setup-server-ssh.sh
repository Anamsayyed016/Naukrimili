#!/bin/bash

echo "🔑 Setting up SSH authentication on server..."

# Add the public key to authorized_keys
echo "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIEOG48xp5CwgF0G3K7JKXszU17lL92z1EPih8LPQ2kH9 anamsayyed58@gmail.com" >> ~/.ssh/authorized_keys

# Set correct permissions
chmod 600 ~/.ssh/authorized_keys
chmod 700 ~/.ssh

# Restart SSH service
sudo systemctl restart sshd

echo "✅ SSH setup complete!"
echo "📋 Testing SSH connection..."

# Test the connection
ssh -o ConnectTimeout=10 -o StrictHostKeyChecking=no localhost "echo 'SSH test successful'"

echo "🎉 SSH authentication is now configured!"
