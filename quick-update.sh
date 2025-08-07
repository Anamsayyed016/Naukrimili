#!/bin/bash
echo " Quick server update..."
ssh root@69.62.73.84 << 'EOF'
cd /root/Naukrimili
git pull origin main
pnpm build
pm2 restart job-portal
echo " Update complete!"
EOF
