#!/bin/bash

echo "🔍 Debugging Companies Server Issue - Linux Commands"
echo "=================================================="

# Set environment variables
export DATABASE_URL="postgresql://postgres:anam123@localhost:5432/jobportal?schema=public"
export NEXTAUTH_URL="http://localhost:3000"
export NEXTAUTH_SECRET="your-super-secret-key-here-min-32-characters-change-this-in-production"

echo "1️⃣ Checking if server is running..."
ps aux | grep -E "(node|next)" | grep -v grep

echo -e "\n2️⃣ Killing any existing processes..."
pkill -f "next dev" || true
pkill -f "node.*dev" || true

echo -e "\n3️⃣ Checking database connection..."
npx prisma db push --accept-data-loss

echo -e "\n4️⃣ Generating Prisma client..."
npx prisma generate

echo -e "\n5️⃣ Testing database directly..."
node -e "
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
prisma.company.findMany({
  where: { isVerified: true, isActive: true },
  include: { _count: { select: { jobs: true } } }
}).then(companies => {
  console.log('Database companies:', companies.length);
  companies.forEach(c => console.log(c.name, '- Jobs:', c._count.jobs));
}).catch(console.error).finally(() => prisma.\$disconnect());
"

echo -e "\n6️⃣ Starting development server..."
npm run dev &
SERVER_PID=$!

echo -e "\n7️⃣ Waiting for server to start..."
sleep 15

echo -e "\n8️⃣ Testing API endpoints..."
echo "Testing localhost:3000..."
curl -s http://localhost:3000/api/companies/public | head -c 200
echo -e "\n"

echo "Testing localhost:3001..."
curl -s http://localhost:3001/api/companies/public | head -c 200
echo -e "\n"

echo -e "\n9️⃣ Checking server logs..."
echo "Server PID: $SERVER_PID"
ps aux | grep $SERVER_PID

echo -e "\n🔟 If server is running, test the companies page:"
echo "   http://localhost:3000/companies"
echo "   http://localhost:3001/companies"

echo -e "\nTo stop the server:"
echo "   kill $SERVER_PID"
