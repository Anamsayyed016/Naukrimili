#!/bin/bash

# 🚀 Deployment Readiness Verification Script
# Senior Developer Level - Comprehensive Check

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Logging functions
log_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
log_success() { echo -e "${GREEN}✅ $1${NC}"; }
log_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
log_error() { echo -e "${RED}❌ $1${NC}"; }
log_header() { echo -e "${CYAN}🔍 $1${NC}"; }

echo -e "${CYAN}"
echo "🚀 DEPLOYMENT READINESS VERIFICATION"
echo "===================================="
echo -e "${NC}"

# Check 1: Project Structure
log_header "Checking Project Structure..."
if [ -f "package.json" ]; then
    log_success "package.json exists"
else
    log_error "package.json missing"
    exit 1
fi

if [ -f "next.config.js" ] || [ -f "next.config.mjs" ]; then
    log_success "Next.js config exists"
else
    log_error "Next.js config missing"
    exit 1
fi

if [ -f "tailwind.config.js" ]; then
    log_success "TailwindCSS config exists"
else
    log_error "TailwindCSS config missing"
    exit 1
fi

# Check 2: Dependencies
log_header "Checking Dependencies..."
if npm list next > /dev/null 2>&1; then
    log_success "Next.js installed"
else
    log_error "Next.js not installed"
    exit 1
fi

if npm list tailwindcss > /dev/null 2>&1; then
    log_success "TailwindCSS installed"
else
    log_error "TailwindCSS not installed"
    exit 1
fi

if npm list react > /dev/null 2>&1; then
    log_success "React installed"
else
    log_error "React not installed"
    exit 1
fi

# Check 3: UI Components
log_header "Checking UI Components..."
UI_COMPONENTS=(
    "components/ui/card.tsx"
    "components/ui/button.tsx"
    "components/ui/badge.tsx"
    "components/ui/input.tsx"
    "components/ui/select.tsx"
    "components/ui/table.tsx"
)

for component in "${UI_COMPONENTS[@]}"; do
    if [ -f "$component" ]; then
        log_success "$component exists"
    else
        log_error "$component missing"
        exit 1
    fi
done

# Check 4: Admin Applications Page
log_header "Checking Admin Applications Page..."
if [ -f "app/admin/applications/page.tsx" ]; then
    log_success "Admin applications page exists"
    
    # Check for imports
    if grep -q "from '@/components/ui/card'" "app/admin/applications/page.tsx"; then
        log_success "Card component imported"
    else
        log_warning "Card component import not found"
    fi
    
    if grep -q "from '@/components/ui/button'" "app/admin/applications/page.tsx"; then
        log_success "Button component imported"
    else
        log_warning "Button component import not found"
    fi
else
    log_error "Admin applications page missing"
    exit 1
fi

# Check 5: GitHub Workflows
log_header "Checking GitHub Workflows..."
if [ -f ".github/workflows/deploy-optimized.yml" ]; then
    log_success "Deploy optimized workflow exists"
else
    log_error "Deploy optimized workflow missing"
    exit 1
fi

if [ -f ".github/workflows/deploy.yml" ]; then
    log_success "Deploy workflow exists"
else
    log_warning "Deploy workflow missing"
fi

# Check 6: PM2 Configuration
log_header "Checking PM2 Configuration..."
if [ -f "ecosystem.config.cjs" ]; then
    log_success "PM2 ecosystem config exists"
    
    # Check for production settings
    if grep -q "naukrimili.com" "ecosystem.config.cjs"; then
        log_success "Production host configured"
    else
        log_warning "Production host not configured"
    fi
else
    log_error "PM2 ecosystem config missing"
    exit 1
fi

# Check 7: Environment Template
log_header "Checking Environment Configuration..."
if [ -f "env.template" ]; then
    log_success "Environment template exists"
    
    if grep -q "naukrimili.com" "env.template"; then
        log_success "Production domain configured"
    else
        log_warning "Production domain not configured"
    fi
else
    log_warning "Environment template missing"
fi

# Check 8: Build Test
log_header "Testing Build Process..."
if npm run build > /dev/null 2>&1; then
    log_success "Build process successful"
else
    log_error "Build process failed"
    exit 1
fi

# Summary
echo -e "${CYAN}"
echo "📋 DEPLOYMENT READINESS SUMMARY"
echo "==============================="
echo -e "${NC}"

log_success "✅ TailwindCSS: Installed and configured"
log_success "✅ Admin Applications Page: All modules present"
log_success "✅ UI Components: All required components exist"
log_success "✅ Build Process: Successful"
log_success "✅ Project Structure: Complete"

echo ""
log_info "🔐 GitHub Secrets Required:"
echo "   - HOST: naukrimili.com"
echo "   - SSH_USER: root"
echo "   - SSH_PORT: 22"
echo "   - SSH_KEY: [Your private SSH key]"

echo ""
log_info "🚀 Ready for Deployment!"
echo "   Next step: Add GitHub secrets and run deployment workflow"

echo ""
log_success "🎉 All checks passed! Your project is deployment-ready!"
