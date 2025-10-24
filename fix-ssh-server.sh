#!/bin/bash

# SSH Server Configuration Fix Script
# Run this on your server (88.222.242.74) to fix SSH authentication

echo "🔧 SSH Server Configuration Fix"
echo "================================"

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo "❌ Please run as root: sudo bash fix-ssh-server.sh"
    exit 1
fi

echo "📋 Current SSH configuration:"
echo "============================="

# Check SSH service status
echo "🔍 SSH Service Status:"
systemctl status sshd --no-pager -l

# Check SSH configuration
echo ""
echo "🔍 SSH Configuration:"
grep -E "^(PubkeyAuthentication|AuthorizedKeysFile|PasswordAuthentication|PermitRootLogin)" /etc/ssh/sshd_config

# Check authorized_keys
echo ""
echo "🔍 Authorized Keys:"
if [ -f ~/.ssh/authorized_keys ]; then
    echo "✅ ~/.ssh/authorized_keys exists"
    echo "📄 Content:"
    cat ~/.ssh/authorized_keys
    echo ""
    echo "📊 Key count: $(wc -l < ~/.ssh/authorized_keys)"
else
    echo "❌ ~/.ssh/authorized_keys does not exist"
    echo "📁 Creating ~/.ssh directory..."
    mkdir -p ~/.ssh
    chmod 700 ~/.ssh
    touch ~/.ssh/authorized_keys
    chmod 600 ~/.ssh/authorized_keys
fi

# Check SSH directory permissions
echo ""
echo "🔍 SSH Directory Permissions:"
ls -la ~/.ssh/

# Fix permissions if needed
echo ""
echo "🔧 Fixing SSH permissions..."
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys 2>/dev/null || true
chmod 644 ~/.ssh/known_hosts 2>/dev/null || true

# Test SSH configuration
echo ""
echo "🔍 Testing SSH configuration..."
sshd -t

if [ $? -eq 0 ]; then
    echo "✅ SSH configuration is valid"
else
    echo "❌ SSH configuration has errors"
fi

# Restart SSH service
echo ""
echo "🔄 Restarting SSH service..."
systemctl restart sshd
systemctl status sshd --no-pager -l

echo ""
echo "✅ SSH Server Configuration Fix Complete!"
echo ""
echo "📋 Next Steps:"
echo "1. Test SSH connection from your local machine:"
echo "   ssh -i ~/.ssh/id_rsa root@88.222.242.74"
echo ""
echo "2. If connection works, verify the SSH key is properly added to GitHub secrets"
echo ""
echo "3. Check GitHub secrets contain the PRIVATE KEY (not public key)"
echo ""
echo "🔍 To add a new SSH key:"
echo "ssh-copy-id -i ~/.ssh/id_rsa.pub root@88.222.242.74"
