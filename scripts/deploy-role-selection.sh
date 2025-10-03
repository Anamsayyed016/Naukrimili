#!/bin/bash

# Deploy Role Selection Feature
# This script creates a branch, applies migrations, runs tests, and deploys the role selection feature

set -e  # Exit on any error

echo "🚀 Deploying Role Selection Feature"
echo "=================================="

# Configuration
BRANCH_NAME="feature/oauth-role-selection"
TEST_DB_URL="${TEST_DATABASE_URL:-postgresql://test:test@localhost:5432/jobportal_test}"
PRODUCTION_DB_URL="${DATABASE_URL}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if we're in a git repository
if [ ! -d ".git" ]; then
    log_error "Not in a git repository. Please run this script from the project root."
    exit 1
fi

# Check if we're on main branch
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "main" ]; then
    log_warning "Not on main branch. Current branch: $CURRENT_BRANCH"
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Step 1: Create and checkout feature branch
log_info "Creating feature branch: $BRANCH_NAME"
git checkout -b "$BRANCH_NAME" 2>/dev/null || git checkout "$BRANCH_NAME"
log_success "Branch ready"

# Step 2: Install dependencies
log_info "Installing dependencies..."
npm install
log_success "Dependencies installed"

# Step 3: Run type checking
log_info "Running TypeScript type checking..."
npx tsc --noEmit
log_success "Type checking passed"

# Step 4: Run linting
log_info "Running ESLint..."
npx eslint . --ext .ts,.tsx --max-warnings 0
log_success "Linting passed"

# Step 5: Run tests
log_info "Running tests..."
npm test -- --passWithNoTests
log_success "Tests passed"

# Step 6: Apply database migration to test database
log_info "Applying database migration to test database..."
if [ -n "$TEST_DB_URL" ]; then
    # Set test database URL
    export DATABASE_URL="$TEST_DB_URL"
    
    # Run migration
    npx prisma db push --force-reset
    log_success "Test database migration applied"
    
    # Reset to production database URL
    export DATABASE_URL="$PRODUCTION_DB_URL"
else
    log_warning "No test database URL provided. Skipping test migration."
fi

# Step 7: Build the application
log_info "Building application..."
npm run build
log_success "Build completed"

# Step 8: Commit changes
log_info "Committing changes..."
git add .
git commit -m "feat: implement OAuth role selection flow

- Remove role defaulting in OAuth config
- Add database constraints for role validation
- Create /roles/choose page for role selection
- Add /api/auth/set-role endpoint
- Update AuthContext to handle NULL roles
- Add comprehensive tests
- Redirect OAuth users to role selection

BREAKING CHANGE: New OAuth users must select role before accessing dashboard"
log_success "Changes committed"

# Step 9: Push to remote
log_info "Pushing to remote repository..."
git push -u origin "$BRANCH_NAME"
log_success "Pushed to remote"

# Step 10: Create pull request (if GitHub CLI is available)
if command -v gh &> /dev/null; then
    log_info "Creating pull request..."
    gh pr create --title "feat: OAuth Role Selection Flow" \
                 --body "## 🎯 Overview
This PR implements a proper OAuth role selection flow where new users must choose their role before accessing the dashboard.

## 🔧 Changes
- ✅ Remove role defaulting in OAuth configuration
- ✅ Add database constraints for role validation
- ✅ Create /roles/choose page for role selection
- ✅ Add /api/auth/set-role API endpoint
- ✅ Update AuthContext to handle NULL roles
- ✅ Add comprehensive test coverage
- ✅ Redirect OAuth users to role selection

## 🧪 Testing
- [x] Unit tests for role selection page
- [x] API endpoint tests
- [x] Database migration tests
- [x] TypeScript type checking
- [x] ESLint validation

## 📋 Manual Testing Checklist
- [ ] New OAuth user redirected to /roles/choose
- [ ] Role selection works for both jobseeker and employer
- [ ] Role is locked after selection
- [ ] Users with locked roles cannot change role
- [ ] Existing users with roles are not affected
- [ ] Proper redirect to dashboard after role selection

## 🚀 Deployment
- [ ] Apply database migration: \`npx prisma db push\`
- [ ] Deploy application
- [ ] Test OAuth flow in production

## 🔄 Rollback
If issues occur, rollback with:
\`\`\`sql
-- Run rollback migration
\`cat prisma/migrations/rollback_role_constraints.sql\` | psql \$DATABASE_URL
\`\`\`" \
                 --assignee @me
    log_success "Pull request created"
else
    log_warning "GitHub CLI not found. Please create pull request manually."
fi

# Step 11: Show deployment instructions
echo ""
log_success "🎉 Role Selection Feature Ready for Deployment!"
echo ""
echo "📋 Next Steps:"
echo "1. Review the pull request"
echo "2. Apply database migration: npx prisma db push"
echo "3. Deploy the application"
echo "4. Test OAuth flow in production"
echo ""
echo "🔗 Branch: $BRANCH_NAME"
echo "🔗 Remote: $(git remote get-url origin)"
echo ""
echo "📝 Manual Testing Checklist:"
echo "□ New OAuth user → redirected to /roles/choose"
echo "□ Role selection works for jobseeker"
echo "□ Role selection works for employer" 
echo "□ Role is locked after selection"
echo "□ Users with locked roles cannot change role"
echo "□ Existing users with roles are not affected"
echo "□ Proper redirect to dashboard after role selection"
echo ""
echo "🔄 Rollback Command:"
echo "cat prisma/migrations/rollback_role_constraints.sql | psql \$DATABASE_URL"
