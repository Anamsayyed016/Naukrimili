#!/bin/bash

echo "🔍 DEBUGGING JOBSEEKER ROLE LOCK ISSUES"
echo "======================================="

# 1. Check if server is running
echo "1. Checking server status..."
pm2 status jobportal

# 2. Check recent logs for role-related errors
echo -e "\n2. Checking recent logs for role-related errors..."
pm2 logs jobportal --lines 50 | grep -i "role\|jobseeker\|session\|auth"

# 3. Check database connection and role data
echo -e "\n3. Checking database role data..."
cd /var/www/jobportal
npx prisma db execute --stdin << 'EOF'
SELECT id, email, role, "roleLocked", "lockedRole", "roleLockReason", "isActive" 
FROM "User" 
WHERE role = 'jobseeker' OR "lockedRole" = 'jobseeker'
ORDER BY "createdAt" DESC 
LIMIT 10;
EOF

# 4. Test role lock API endpoint
echo -e "\n4. Testing role lock API endpoint..."
curl -s -X POST http://localhost:3000/api/auth/lock-role \
  -H "Content-Type: application/json" \
  -d '{"role": "jobseeker", "reason": "Test role lock"}' \
  | jq .

# 5. Check session callback logs
echo -e "\n5. Checking session callback logs..."
pm2 logs jobportal --lines 100 | grep -i "session callback\|role lock\|final session role"

# 6. Check NextAuth configuration
echo -e "\n6. Checking NextAuth configuration..."
grep -n "roleLocked\|lockedRole" /var/www/jobportal/lib/nextauth-config.ts

# 7. Check database schema
echo -e "\n7. Checking database schema for role fields..."
cd /var/www/jobportal
npx prisma db execute --stdin << 'EOF'
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'User' 
AND column_name LIKE '%role%';
EOF

# 8. Test update-role API endpoint
echo -e "\n8. Testing update-role API endpoint..."
curl -s -X POST http://localhost:3000/api/auth/update-role \
  -H "Content-Type: application/json" \
  -d '{"role": "jobseeker"}' \
  | jq .

# 9. Check for any database migration issues
echo -e "\n9. Checking database migration status..."
cd /var/www/jobportal
npx prisma migrate status

# 10. Check recent error logs
echo -e "\n10. Checking recent error logs..."
pm2 logs jobportal --err --lines 30

echo -e "\n✅ Debug commands completed!"
echo "Check the output above for any issues with role locking."
