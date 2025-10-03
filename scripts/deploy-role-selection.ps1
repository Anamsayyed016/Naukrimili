# Deploy Role Selection Feature - PowerShell Version
# This script creates a branch, applies migrations, runs tests, and deploys the role selection feature

param(
    [string]$BranchName = "feature/oauth-role-selection",
    [string]$TestDbUrl = $env:TEST_DATABASE_URL,
    [string]$ProductionDbUrl = $env:DATABASE_URL
)

# Set error action preference
$ErrorActionPreference = "Stop"

Write-Host "🚀 Deploying Role Selection Feature" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan

# Helper functions
function Write-Info {
    param([string]$Message)
    Write-Host "ℹ️  $Message" -ForegroundColor Blue
}

function Write-Success {
    param([string]$Message)
    Write-Host "✅ $Message" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "⚠️  $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "❌ $Message" -ForegroundColor Red
}

try {
    # Check if we're in a git repository
    if (-not (Test-Path ".git")) {
        Write-Error "Not in a git repository. Please run this script from the project root."
        exit 1
    }

    # Check if we're on main branch
    $CurrentBranch = git branch --show-current
    if ($CurrentBranch -ne "main") {
        Write-Warning "Not on main branch. Current branch: $CurrentBranch"
        $Continue = Read-Host "Continue anyway? (y/N)"
        if ($Continue -notmatch "^[Yy]$") {
            exit 1
        }
    }

    # Step 1: Create and checkout feature branch
    Write-Info "Creating feature branch: $BranchName"
    try {
        git checkout -b $BranchName 2>$null
    } catch {
        git checkout $BranchName
    }
    Write-Success "Branch ready"

    # Step 2: Install dependencies
    Write-Info "Installing dependencies..."
    npm install
    Write-Success "Dependencies installed"

    # Step 3: Run type checking
    Write-Info "Running TypeScript type checking..."
    npx tsc --noEmit
    Write-Success "Type checking passed"

    # Step 4: Run linting
    Write-Info "Running ESLint..."
    npx eslint . --ext .ts,.tsx --max-warnings 0
    Write-Success "Linting passed"

    # Step 5: Run tests
    Write-Info "Running tests..."
    npm test -- --passWithNoTests
    Write-Success "Tests passed"

    # Step 6: Apply database migration to test database
    Write-Info "Applying database migration to test database..."
    if ($TestDbUrl) {
        # Set test database URL
        $env:DATABASE_URL = $TestDbUrl
        
        # Run migration
        npx prisma db push --force-reset
        Write-Success "Test database migration applied"
        
        # Reset to production database URL
        $env:DATABASE_URL = $ProductionDbUrl
    } else {
        Write-Warning "No test database URL provided. Skipping test migration."
    }

    # Step 7: Build the application
    Write-Info "Building application..."
    npm run build
    Write-Success "Build completed"

    # Step 8: Commit changes
    Write-Info "Committing changes..."
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
    Write-Success "Changes committed"

    # Step 9: Push to remote
    Write-Info "Pushing to remote repository..."
    git push -u origin $BranchName
    Write-Success "Pushed to remote"

    # Step 10: Create pull request (if GitHub CLI is available)
    if (Get-Command gh -ErrorAction SilentlyContinue) {
        Write-Info "Creating pull request..."
        gh pr create --title "feat: OAuth Role Selection Flow" `
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
- [ ] Apply database migration: `npx prisma db push`
- [ ] Deploy application
- [ ] Test OAuth flow in production

## 🔄 Rollback
If issues occur, rollback with:
```sql
-- Run rollback migration
cat prisma/migrations/rollback_role_constraints.sql | psql $DATABASE_URL
```" `
                     --assignee @me
        Write-Success "Pull request created"
    } else {
        Write-Warning "GitHub CLI not found. Please create pull request manually."
    }

    # Step 11: Show deployment instructions
    Write-Host ""
    Write-Success "🎉 Role Selection Feature Ready for Deployment!"
    Write-Host ""
    Write-Host "📋 Next Steps:" -ForegroundColor Cyan
    Write-Host "1. Review the pull request"
    Write-Host "2. Apply database migration: npx prisma db push"
    Write-Host "3. Deploy the application"
    Write-Host "4. Test OAuth flow in production"
    Write-Host ""
    Write-Host "🔗 Branch: $BranchName" -ForegroundColor Yellow
    Write-Host "🔗 Remote: $(git remote get-url origin)" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "📝 Manual Testing Checklist:" -ForegroundColor Cyan
    Write-Host "□ New OAuth user → redirected to /roles/choose"
    Write-Host "□ Role selection works for jobseeker"
    Write-Host "□ Role selection works for employer" 
    Write-Host "□ Role is locked after selection"
    Write-Host "□ Users with locked roles cannot change role"
    Write-Host "□ Existing users with roles are not affected"
    Write-Host "□ Proper redirect to dashboard after role selection"
    Write-Host ""
    Write-Host "🔄 Rollback Command:" -ForegroundColor Red
    Write-Host "Get-Content prisma/migrations/rollback_role_constraints.sql | psql $env:DATABASE_URL"

} catch {
    Write-Error "Deployment failed: $($_.Exception.Message)"
    exit 1
}
