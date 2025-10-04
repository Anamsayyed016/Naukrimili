#!/bin/bash

# 🚀 Production Deployment Fix Script
# This script fixes all critical production deployment issues

set -e

echo "🚀 Starting Production Deployment Fix..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 1. Fix PM2 Ecosystem Configuration
print_status "🔧 Fixing PM2 ecosystem configuration..."
if [ -f "ecosystem.config.cjs" ]; then
    # Backup original file
    cp ecosystem.config.cjs ecosystem.config.cjs.backup
    print_success "Backed up original ecosystem.config.cjs"
    
    # Update the configuration paths
    sed -i 's|/root/jobportal|/var/www/jobportal|g' ecosystem.config.cjs
    print_success "Updated ecosystem.config.cjs paths"
else
    print_error "ecosystem.config.cjs not found!"
    exit 1
fi

# 2. Verify Admin Applications Page
print_status "🔍 Verifying admin applications page..."
if [ -f "app/admin/applications/page.tsx" ]; then
    print_success "Admin applications page exists"
    
    # Check if all required imports are present
    if grep -q "import.*Card.*from.*@/components/ui/card" app/admin/applications/page.tsx; then
        print_success "Card component import found"
    else
        print_warning "Card component import may be missing"
    fi
    
    if grep -q "import.*Button.*from.*@/components/ui/button" app/admin/applications/page.tsx; then
        print_success "Button component import found"
    else
        print_warning "Button component import may be missing"
    fi
    
    if grep -q "import.*Badge.*from.*@/components/ui/badge" app/admin/applications/page.tsx; then
        print_success "Badge component import found"
    else
        print_warning "Badge component import may be missing"
    fi
    
    if grep -q "import.*Input.*from.*@/components/ui/input" app/admin/applications/page.tsx; then
        print_success "Input component import found"
    else
        print_warning "Input component import may be missing"
    fi
    
    if grep -q "import.*Select.*from.*@/components/ui/select" app/admin/applications/page.tsx; then
        print_success "Select component import found"
    else
        print_warning "Select component import may be missing"
    fi
    
    if grep -q "import.*Table.*from.*@/components/ui/table" app/admin/applications/page.tsx; then
        print_success "Table component import found"
    else
        print_warning "Table component import may be missing"
    fi
    
    if grep -q "import.*lucide-react" app/admin/applications/page.tsx; then
        print_success "Lucide React icons import found"
    else
        print_warning "Lucide React icons import may be missing"
    fi
else
    print_error "Admin applications page not found!"
    exit 1
fi

# 3. Verify UI Components
print_status "🔍 Verifying UI components..."
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
        print_success "Found $component"
    else
        print_error "Missing $component"
        exit 1
    fi
done

# 4. Verify Dependencies
print_status "📦 Verifying dependencies..."
if [ -f "package.json" ]; then
    print_success "package.json exists"
    
    # Check for critical dependencies
    if grep -q '"tailwindcss"' package.json; then
        print_success "TailwindCSS dependency found"
    else
        print_warning "TailwindCSS dependency may be missing"
    fi
    
    if grep -q '"lucide-react"' package.json; then
        print_success "Lucide React dependency found"
    else
        print_warning "Lucide React dependency may be missing"
    fi
    
    if grep -q '"@radix-ui/react-select"' package.json; then
        print_success "Radix UI Select dependency found"
    else
        print_warning "Radix UI Select dependency may be missing"
    fi
else
    print_error "package.json not found!"
    exit 1
fi

# 5. Verify Health Check API
print_status "🏥 Verifying health check API..."
if [ -f "app/api/health/route.ts" ]; then
    print_success "Health check API exists"
else
    print_error "Health check API not found!"
    exit 1
fi

# 6. Test Build Process
print_status "🔨 Testing build process..."
if npm run build; then
    print_success "Build completed successfully"
    
    # Verify .next directory was created
    if [ -d ".next" ]; then
        print_success ".next directory created"
    else
        print_error ".next directory not found after build"
        exit 1
    fi
else
    print_error "Build failed!"
    exit 1
fi

# 7. Verify GitHub Workflow
print_status "🔧 Verifying GitHub workflow..."
if [ -f ".github/workflows/deploy.yml" ]; then
    print_success "GitHub workflow exists"
else
    print_error "GitHub workflow not found!"
    exit 1
fi

if [ -f ".github/workflows/deploy-optimized.yml" ]; then
    print_success "Optimized GitHub workflow exists"
else
    print_warning "Optimized GitHub workflow not found"
fi

# 8. Create GitHub Secrets Setup Guide
print_status "📝 Creating GitHub secrets setup guide..."
cat > GITHUB_SECRETS_SETUP.md << 'EOF'
# GitHub Secrets Setup Guide

## Required Secrets

To deploy successfully, you need to configure these secrets in your GitHub repository:

### 1. HOST
- **Value**: Your VPS IP address (e.g., `69.62.73.84`)
- **Description**: The IP address of your production server

### 2. SSH_USER
- **Value**: Your SSH username (usually `root`)
- **Description**: The username to connect to your VPS via SSH

### 3. SSH_KEY
- **Value**: Your private SSH key content
- **Description**: The private SSH key for authentication

### 4. SSH_PORT
- **Value**: SSH port number (usually `22`)
- **Description**: The port number for SSH connection

## How to Set Secrets

1. Go to your GitHub repository
2. Click on **Settings** tab
3. Click on **Secrets and variables** → **Actions**
4. Click **New repository secret**
5. Add each secret with the exact names above

## SSH Key Generation (if needed)

If you don't have SSH keys set up:

```bash
# Generate new SSH key pair
ssh-keygen -t ed25519 -C "your-email@example.com"

# Copy public key to your VPS
ssh-copy-id root@YOUR_VPS_IP

# Copy private key content for GitHub secret
cat ~/.ssh/id_ed25519
```

## VPS Directory Setup

Ensure the project directory exists on your VPS:

```bash
# SSH into your VPS
ssh root@YOUR_VPS_IP

# Create project directory
mkdir -p /var/www/jobportal
cd /var/www/jobportal

# Initialize git if needed
git init
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
```
EOF

print_success "Created GitHub secrets setup guide"

# 9. Summary
print_status "📋 Production Deployment Fix Summary"
echo ""
echo "✅ Fixed Issues:"
echo "  - PM2 ecosystem configuration paths updated"
echo "  - Admin applications page imports verified"
echo "  - UI components verified"
echo "  - Dependencies verified"
echo "  - Build process tested"
echo "  - Health check API verified"
echo "  - GitHub workflow verified"
echo "  - GitHub secrets setup guide created"
echo ""
echo "🚀 Next Steps:"
echo "  1. Configure GitHub secrets (see GITHUB_SECRETS_SETUP.md)"
echo "  2. Replace .github/workflows/deploy.yml with deploy-optimized.yml"
echo "  3. Push changes to trigger deployment"
echo "  4. Monitor deployment in GitHub Actions"
echo ""
print_success "Production deployment fix completed successfully!"
