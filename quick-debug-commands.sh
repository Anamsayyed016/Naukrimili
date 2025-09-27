#!/bin/bash

# Quick debug commands for jobseeker role issues

# 1. Check server status
pm2 status jobportal

# 2. Check recent logs
pm2 logs jobportal --lines 20 | grep -i "role\|jobseeker\|session"

# 3. Test role lock API
curl -s -X POST http://localhost:3000/api/auth/lock-role \
  -H "Content-Type: application/json" \
  -d '{"role": "jobseeker", "reason": "Debug test"}' \
  | jq .

# 4. Check database for jobseeker users
cd /var/www/jobportal
npx prisma db execute --stdin << 'EOF'
SELECT id, email, role, "roleLocked", "lockedRole", "isActive" 
FROM "User" 
WHERE role = 'jobseeker' 
ORDER BY "createdAt" DESC 
LIMIT 5;
EOF

# 5. Check session logs
pm2 logs jobportal --lines 50 | grep -i "session callback\|final session role"
