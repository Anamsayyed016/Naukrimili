#!/bin/bash
# Pre-deployment verification script
# Run this AFTER git pull to verify all required files are present

echo "🔍 Verifying Deployment Files..."
echo "========================================"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ERRORS=0

# Check critical server files
echo -e "\n${YELLOW}Checking critical server files...${NC}"

if [ -f "server.cjs" ]; then
    echo -e "${GREEN}✅ server.cjs exists${NC}"
else
    echo -e "${RED}❌ server.cjs MISSING - PM2 will fail!${NC}"
    ERRORS=$((ERRORS + 1))
fi

if [ -f "ecosystem.config.cjs" ]; then
    echo -e "${GREEN}✅ ecosystem.config.cjs exists${NC}"
else
    echo -e "${RED}❌ ecosystem.config.cjs MISSING - PM2 will fail!${NC}"
    ERRORS=$((ERRORS + 1))
fi

# Check package.json
echo -e "\n${YELLOW}Checking package configuration...${NC}"
if [ -f "package.json" ]; then
    echo -e "${GREEN}✅ package.json exists${NC}"
    
    # Check for required scripts
    if grep -q '"build"' package.json; then
        echo -e "${GREEN}✅ Build script found${NC}"
    else
        echo -e "${RED}❌ Build script missing in package.json${NC}"
        ERRORS=$((ERRORS + 1))
    fi
    
    if grep -q '"start"' package.json; then
        echo -e "${GREEN}✅ Start script found${NC}"
    else
        echo -e "${RED}❌ Start script missing in package.json${NC}"
        ERRORS=$((ERRORS + 1))
    fi
else
    echo -e "${RED}❌ package.json MISSING${NC}"
    ERRORS=$((ERRORS + 1))
fi

# Check Prisma
echo -e "\n${YELLOW}Checking Prisma setup...${NC}"
if [ -d "prisma" ]; then
    echo -e "${GREEN}✅ prisma/ directory exists${NC}"
    
    if [ -f "prisma/schema.prisma" ]; then
        echo -e "${GREEN}✅ schema.prisma exists${NC}"
    else
        echo -e "${RED}❌ schema.prisma MISSING${NC}"
        ERRORS=$((ERRORS + 1))
    fi
else
    echo -e "${RED}❌ prisma/ directory MISSING${NC}"
    ERRORS=$((ERRORS + 1))
fi

# Check node_modules
echo -e "\n${YELLOW}Checking dependencies...${NC}"
if [ -d "node_modules" ]; then
    echo -e "${GREEN}✅ node_modules exists${NC}"
    
    if [ -d "node_modules/@prisma/client" ]; then
        echo -e "${GREEN}✅ @prisma/client installed${NC}"
    else
        echo -e "${YELLOW}⚠️  @prisma/client not found - run 'npx prisma generate'${NC}"
    fi
    
    if [ -d "node_modules/next" ]; then
        echo -e "${GREEN}✅ Next.js installed${NC}"
    else
        echo -e "${RED}❌ Next.js not installed${NC}"
        ERRORS=$((ERRORS + 1))
    fi
else
    echo -e "${RED}❌ node_modules MISSING - run 'npm install'${NC}"
    ERRORS=$((ERRORS + 1))
fi

# Check environment
echo -e "\n${YELLOW}Checking environment...${NC}"
if [ -f ".env" ]; then
    echo -e "${GREEN}✅ .env file exists${NC}"
    
    # Check critical env vars
    if grep -q "DATABASE_URL" .env; then
        echo -e "${GREEN}✅ DATABASE_URL configured${NC}"
    else
        echo -e "${YELLOW}⚠️  DATABASE_URL not found in .env${NC}"
    fi
    
    if grep -q "NEXTAUTH_SECRET" .env; then
        echo -e "${GREEN}✅ NEXTAUTH_SECRET configured${NC}"
    else
        echo -e "${YELLOW}⚠️  NEXTAUTH_SECRET not found in .env${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  .env file not found (using environment variables)${NC}"
fi

# Check build artifacts (if already built)
echo -e "\n${YELLOW}Checking build artifacts...${NC}"
if [ -d ".next" ]; then
    echo -e "${GREEN}✅ .next directory exists${NC}"
    
    if [ -f ".next/BUILD_ID" ]; then
        BUILD_ID=$(cat .next/BUILD_ID)
        echo -e "${GREEN}✅ BUILD_ID exists: ${BUILD_ID}${NC}"
    else
        echo -e "${YELLOW}⚠️  BUILD_ID missing - build may be incomplete${NC}"
    fi
    
    if [ -d ".next/server" ]; then
        echo -e "${GREEN}✅ .next/server exists${NC}"
    else
        echo -e "${RED}❌ .next/server MISSING - build incomplete!${NC}"
        ERRORS=$((ERRORS + 1))
    fi
else
    echo -e "${YELLOW}⚠️  .next not found - needs build (run 'npm run build')${NC}"
fi

# Summary
echo -e "\n========================================"
if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}✅ All checks passed! Ready for deployment.${NC}"
    exit 0
else
    echo -e "${RED}❌ Found $ERRORS critical error(s). Fix before deploying!${NC}"
    echo -e "\n${YELLOW}Quick fixes:${NC}"
    echo "  • Missing files: git pull origin main"
    echo "  • Missing dependencies: npm install --production"
    echo "  • Missing Prisma: npx prisma generate"
    echo "  • Missing build: npm run build"
    exit 1
fi

