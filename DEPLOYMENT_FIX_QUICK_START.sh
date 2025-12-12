#!/usr/bin/env bash
# 🚀 DEPLOYMENT FIX - QUICK START COMMANDS
# Copy and paste these commands to set up the new workflow immediately

echo "════════════════════════════════════════════════════════════════"
echo "  🔧 NAUKRIMILI PRODUCTION DEPLOYMENT FIX - QUICK START"
echo "════════════════════════════════════════════════════════════════"

# ============================================================================
# STEP 1: Generate NEXTAUTH_SECRET (run on your local machine)
# ============================================================================

echo ""
echo "📋 STEP 1: Generate NEXTAUTH_SECRET (32+ characters)"
echo "─────────────────────────────────────────────────────"
echo ""
echo "Run this command and copy the output:"
echo ""
echo "  node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\""
echo ""
echo "Then add to GitHub Secrets: https://github.com/Anamsayyed016/Naukrimili/settings/secrets/actions"
echo ""
read -p "Press Enter after updating GitHub Secrets..."

# ============================================================================
# STEP 2: Verify SSH_KEY is in correct format
# ============================================================================

echo ""
echo "🔑 STEP 2: Verify SSH_KEY Format"
echo "────────────────────────────────"
echo ""
echo "Test your SSH key locally:"
echo ""
echo "  ssh -i ~/.ssh/id_rsa -p 22 -vv root@srv1054971.hstgr.cloud"
echo ""
echo "Should see: 'Authentication succeeded (publickey)'"
echo ""
echo "If it fails, regenerate:"
echo "  ssh-keygen -t rsa -b 4096 -f ~/.ssh/id_rsa -N \"\""
echo ""
echo "Then copy to GitHub Secrets:"
echo "  cat ~/.ssh/id_rsa"
echo ""
read -p "Press Enter after verifying SSH_KEY..."

# ============================================================================
# STEP 3: Verify DATABASE_URL
# ============================================================================

echo ""
echo "🗄️  STEP 3: Verify DATABASE_URL"
echo "──────────────────────────────"
echo ""
echo "Test database connection:"
echo ""
echo "  psql postgresql://user:password@host:5432/naukrimili -c \"SELECT 1\""
echo ""
echo "Should see: '1' in output"
echo ""
read -p "Press Enter after verifying DATABASE_URL..."

# ============================================================================
# STEP 4: Local Git Operations
# ============================================================================

echo ""
echo "📦 STEP 4: Update Local Repository"
echo "──────────────────────────────────"
echo ""
cd /path/to/jobportal  # Change to your workspace path
echo "Current directory: $(pwd)"

# Show current status
echo ""
echo "Current git status:"
git status

# Make a test commit if needed
echo ""
echo "Ready to commit? (y/n)"
read -p "Continue? " -n 1 -r
if [[ $REPLY =~ ^[Yy]$ ]]; then
  echo ""
  echo "Making test commit..."
  git add .
  git commit -m "deploy: activate new zero-downtime workflow"
  git push origin main
  echo "✅ Pushed to main!"
fi

# ============================================================================
# STEP 5: Monitor Deployment
# ============================================================================

echo ""
echo "👀 STEP 5: Monitor Deployment"
echo "─────────────────────────────"
echo ""
echo "Go to: https://github.com/Anamsayyed016/Naukrimili/actions"
echo ""
echo "Watch for these steps:"
echo "  ✓ validate_secrets (should pass immediately)"
echo "  ✓ build (takes 5-7 minutes)"
echo "  ✓ deploy (2-3 minutes)"
echo "  ✓ finalize (1-2 minutes)"
echo ""
echo "All steps should show green ✅"
echo ""

# ============================================================================
# STEP 6: SSH to Server and Check
# ============================================================================

echo ""
echo "🖥️  STEP 6: Verify on Server"
echo "───────────────────────────"
echo ""
echo "SSH to your server:"
echo "  ssh -p 22 root@srv1054971.hstgr.cloud"
echo ""
echo "Then run:"
echo "  pm2 logs jobportal --lines 50"
echo ""
echo "Look for: 'App started successfully on port 3000'"
echo ""

# ============================================================================
# STEP 7: Test Application
# ============================================================================

echo ""
echo "✅ STEP 7: Test Application"
echo "──────────────────────────"
echo ""
echo "Check health endpoint:"
echo "  curl -v https://naukrimili.com/api/health"
echo ""
echo "Should return: 200 OK"
echo ""
echo "Visit website: https://naukrimili.com"
echo ""
echo "Should see: Job portal homepage, no errors"
echo ""

# ============================================================================
# Emergency Commands
# ============================================================================

echo ""
echo "🚨 EMERGENCY COMMANDS (if something goes wrong)"
echo "──────────────────────────────────────────────"
echo ""
echo "SSH to server:"
echo "  ssh root@srv1054971.hstgr.cloud"
echo ""
echo "Check process:"
echo "  pm2 status"
echo ""
echo "View logs:"
echo "  pm2 logs jobportal -f"
echo ""
echo "Restart:"
echo "  pm2 restart jobportal"
echo ""
echo "Restore from backup:"
echo "  LATEST=\$(ls -t /var/www/naukrimili-backup/backup-* | head -1)"
echo "  cp -r \$LATEST /var/www/naukrimili-new"
echo "  mv /var/www/naukrimili /var/www/naukrimili-failed"
echo "  mv /var/www/naukrimili-new /var/www/naukrimili"
echo "  pm2 restart jobportal"
echo ""

# ============================================================================
# Summary
# ============================================================================

echo ""
echo "════════════════════════════════════════════════════════════════"
echo "  ✅ DEPLOYMENT FIX SETUP COMPLETE"
echo "════════════════════════════════════════════════════════════════"
echo ""
echo "Files created:"
echo "  📄 .github/workflows/deploy-production.yml"
echo "  📄 DEPLOYMENT_RECOVERY_GUIDE.md"
echo "  📄 DEPLOYMENT_COMPLETION_PLAN.md"
echo "  📄 DEPLOYMENT_FIX_QUICK_START.sh (this file)"
echo ""
echo "Next steps:"
echo "  1. Replace old deploy.yml with deploy-production.yml"
echo "  2. Update GitHub Secrets (NEXTAUTH_SECRET, SSH_KEY, DATABASE_URL)"
echo "  3. Push a test commit to main"
echo "  4. Watch GitHub Actions deployment complete"
echo "  5. Verify website is running"
echo ""
echo "Expected result:"
echo "  ✅ Website stays online during deployment (zero downtime)"
echo "  ✅ Deployment completes in 5-10 minutes"
echo "  ✅ Automatic rollback if anything fails"
echo "  ✅ Previous version available as backup"
echo ""
echo "Questions? See: DEPLOYMENT_RECOVERY_GUIDE.md"
echo ""
