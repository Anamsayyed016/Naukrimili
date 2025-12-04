#!/bin/bash
# Server Deployment Script for Naukrimili.com
# Run this script on your production server after git pull

set -e  # Exit on any error

echo "🚀 Starting deployment for Naukrimili..."
echo "========================================"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Step 1: Pull latest code
echo -e "${YELLOW}📥 Step 1: Pulling latest code...${NC}"
git pull origin main
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Code pulled successfully${NC}"
else
    echo -e "${RED}❌ Git pull failed${NC}"
    exit 1
fi

# Step 2: Install dependencies
echo -e "${YELLOW}📦 Step 2: Installing dependencies...${NC}"
npm install --production --legacy-peer-deps
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Dependencies installed${NC}"
else
    echo -e "${RED}❌ npm install failed${NC}"
    exit 1
fi

# Step 3: Generate Prisma Client
echo -e "${YELLOW}🔧 Step 3: Generating Prisma Client...${NC}"
npx prisma generate
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Prisma Client generated${NC}"
else
    echo -e "${RED}❌ Prisma generate failed${NC}"
    exit 1
fi

# Step 4: Build application
echo -e "${YELLOW}🏗️  Step 4: Building application...${NC}"
export NODE_ENV=production
export NODE_OPTIONS="--max-old-space-size=4096"
export NEXT_TELEMETRY_DISABLED=1
npm run build
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Build completed successfully${NC}"
else
    echo -e "${RED}❌ Build failed${NC}"
    exit 1
fi

# Step 5: Verify build artifacts
echo -e "${YELLOW}🔍 Step 5: Verifying build artifacts...${NC}"
if [ -f ".next/BUILD_ID" ] && [ -d ".next/server" ]; then
    echo -e "${GREEN}✅ Build artifacts verified${NC}"
    echo "   BUILD_ID: $(cat .next/BUILD_ID)"
else
    echo -e "${RED}❌ Build artifacts missing${NC}"
    exit 1
fi

# Step 6: Restart PM2
echo -e "${YELLOW}🔄 Step 6: Restarting PM2 process...${NC}"
pm2 restart naukrimili
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ PM2 restarted successfully${NC}"
else
    echo -e "${RED}❌ PM2 restart failed${NC}"
    exit 1
fi

# Step 7: Check health
echo -e "${YELLOW}🏥 Step 7: Checking application health...${NC}"
sleep 5
pm2 status naukrimili
pm2 logs naukrimili --lines 10 --nostream

echo ""
echo -e "${GREEN}========================================"
echo -e "🎉 Deployment completed successfully!"
echo -e "========================================${NC}"
echo ""
echo "📊 Deployment Summary:"
echo "   • Code: Updated from Git"
echo "   • Dependencies: Installed"
echo "   • Prisma: Generated"
echo "   • Build: Completed"
echo "   • Server: Restarted"
echo ""
echo "🔗 Your site: https://naukrimili.com"
echo "📋 Monitor logs: pm2 logs naukrimili"
echo "📊 Check status: pm2 status"
echo ""

