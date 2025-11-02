#!/bin/bash
# Script to save all changes on Linux server

echo "🔧 Saving all changes to git..."

# Step 1: Add all modified files
echo "📝 Step 1: Adding modified files..."
git add -A

# Step 2: Check status
echo "📊 Step 2: Current status..."
git status

# Step 3: Commit changes
echo "💾 Step 3: Committing changes..."
git commit -m "Fix sourceId type conversion and improve job listing pagination"

# Step 4: Show final status
echo "✅ Step 4: Final status..."
git status

echo ""
echo "🎉 All changes saved locally!"
echo ""
echo "⚠️ Note: Changes are saved locally but NOT pushed to GitHub (due to secrets in old commits)"
echo "To push: You need to allow the secrets on GitHub first, then run: git push origin main"

