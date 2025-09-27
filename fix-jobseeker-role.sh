#!/bin/bash

echo "🔧 FIXING JOBSEEKER ROLE LOCK ISSUES"
echo "===================================="

# 1. Restart server to apply changes
echo "1. Restarting server..."
pm2 restart jobportal --update-env

# 2. Wait for server to start
echo "2. Waiting for server to start..."
sleep 5

# 3. Check if server is running
echo "3. Checking server status..."
pm2 status jobportal

# 4. Clear any cached sessions
echo "4. Clearing session cache..."
curl -s -X POST http://localhost:3000/api/auth/force-clear \
  -H "Content-Type: application/json" \
  | jq .

# 5. Test role lock API
echo "5. Testing role lock API..."
curl -s -X POST http://localhost:3000/api/auth/lock-role \
  -H "Content-Type: application/json" \
  -d '{"role": "jobseeker", "reason": "Fixed role lock"}' \
  | jq .

# 6. Check database for any locked jobseeker roles
echo "6. Checking database for locked jobseeker roles..."
cd /var/www/jobportal
npx prisma db execute --stdin << 'EOF'
SELECT id, email, role, "roleLocked", "lockedRole", "roleLockReason" 
FROM "User" 
WHERE "roleLocked" = true AND ("lockedRole" = 'jobseeker' OR role = 'jobseeker')
ORDER BY "updatedAt" DESC 
LIMIT 10;
EOF

# 7. Check recent logs
echo "7. Checking recent logs..."
pm2 logs jobportal --lines 30 | grep -i "role\|jobseeker\|session"

echo -e "\n✅ Fix commands completed!"
