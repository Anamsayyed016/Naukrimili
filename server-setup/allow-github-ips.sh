#!/bin/bash

# Allow GitHub Actions IP ranges
# Source: https://api.github.com/meta

echo "🔓 Adding GitHub Actions IP ranges to firewall..."

# GitHub Actions IP ranges (as of 2024)
GITHUB_IPS=(
    "192.30.252.0/22"
    "185.199.108.0/22"
    "140.82.112.0/20"
    "143.55.64.0/20"
    "20.201.28.151/32"
    "20.205.243.166/32"
    "20.207.73.82/32"
    "20.27.177.113/32"
    "20.200.245.247/32"
    "20.233.83.145/32"
    "102.133.202.242/32"
    "2a0a:a440::/29"
    "2606:50c0::/32"
)

# Allow each IP range
for ip in "${GITHUB_IPS[@]}"; do
    echo "Adding rule for: $ip"
    sudo ufw allow from $ip to any port 22 proto tcp
done

# Reload firewall
sudo ufw reload

echo "✅ GitHub Actions IPs added to firewall"
echo "📊 Current firewall status:"
sudo ufw status numbered

echo ""
echo "⚠️ Note: GitHub's IP ranges may change. Check https://api.github.com/meta regularly"

