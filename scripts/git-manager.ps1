# 🚀 Git Management Script
# This script helps manage git operations for your job portal project

param(
    [string]$Action = "help",
    [string]$Message = "",
    [string]$Branch = "main"
)

# Colors for output
$Red = "Red"
$Green = "Green"
$Yellow = "Yellow"
$Blue = "Blue"

function Write-ColorOutput {
    param(
        [string]$Text,
        [string]$Color = "White"
    )
    Write-Host $Text -ForegroundColor $Color
}

function Show-Help {
    Write-ColorOutput "🚀 Git Management Script" $Blue
    Write-ColorOutput "========================" $Blue
    Write-ColorOutput ""
    Write-ColorOutput "Usage: .\scripts\git-manager.ps1 -Action <action> [-Message <message>] [-Branch <branch>]" $Yellow
    Write-ColorOutput ""
    Write-ColorOutput "Actions:" $Green
    Write-ColorOutput "  status     - Show git status" $White
    Write-ColorOutput "  add        - Add all changes" $White
    Write-ColorOutput "  commit     - Commit changes (requires -Message)" $White
    Write-ColorOutput "  push       - Push to remote repository" $White
    Write-ColorOutput "  pull       - Pull from remote repository" $White
    Write-ColorOutput "  deploy     - Full deployment (add + commit + push)" $White
    Write-ColorOutput "  quick      - Quick commit and push" $White
    Write-ColorOutput "  backup     - Create backup branch" $White
    Write-ColorOutput "  restore    - Restore from backup" $White
    Write-ColorOutput "  clean      - Clean untracked files" $White
    Write-ColorOutput "  log        - Show recent commits" $White
    Write-ColorOutput "  branches   - Show all branches" $White
    Write-ColorOutput "  switch     - Switch branch (requires -Branch)" $White
    Write-ColorOutput ""
    Write-ColorOutput "Examples:" $Green
    Write-ColorOutput "  .\scripts\git-manager.ps1 -Action status" $White
    Write-ColorOutput "  .\scripts\git-manager.ps1 -Action commit -Message 'Fix deployment issues'" $White
    Write-ColorOutput "  .\scripts\git-manager.ps1 -Action deploy -Message 'Update workflow'" $White
    Write-ColorOutput "  .\scripts\git-manager.ps1 -Action quick -Message 'Quick fix'" $White
}

function Show-Status {
    Write-ColorOutput "📊 Git Status" $Blue
    Write-ColorOutput "=============" $Blue
    git status
}

function Add-All {
    Write-ColorOutput "📦 Adding all changes..." $Yellow
    git add .
    Write-ColorOutput "✅ All changes added" $Green
}

function Commit-Changes {
    if ([string]::IsNullOrEmpty($Message)) {
        Write-ColorOutput "❌ Commit message is required. Use -Message parameter" $Red
        return
    }
    
    Write-ColorOutput "💾 Committing changes..." $Yellow
    git commit -m $Message
    Write-ColorOutput "✅ Changes committed with message: '$Message'" $Green
}

function Push-Changes {
    Write-ColorOutput "🚀 Pushing to remote repository..." $Yellow
    git push origin $Branch
    Write-ColorOutput "✅ Changes pushed to origin/$Branch" $Green
}

function Pull-Changes {
    Write-ColorOutput "📥 Pulling from remote repository..." $Yellow
    git pull origin $Branch
    Write-ColorOutput "✅ Changes pulled from origin/$Branch" $Green
}

function Deploy-All {
    if ([string]::IsNullOrEmpty($Message)) {
        Write-ColorOutput "❌ Commit message is required for deployment. Use -Message parameter" $Red
        return
    }
    
    Write-ColorOutput "🚀 Starting full deployment..." $Blue
    Write-ColorOutput "=============================" $Blue
    
    Add-All
    Commit-Changes
    Push-Changes
    
    Write-ColorOutput "🎉 Deployment completed!" $Green
    Write-ColorOutput "GitHub Actions will now trigger the deployment workflow." $Blue
}

function Quick-Deploy {
    if ([string]::IsNullOrEmpty($Message)) {
        Write-ColorOutput "❌ Commit message is required. Use -Message parameter" $Red
        return
    }
    
    Write-ColorOutput "⚡ Quick deployment..." $Blue
    Write-ColorOutput "====================" $Blue
    
    Add-All
    git commit -m $Message
    Push-Changes
    
    Write-ColorOutput "✅ Quick deployment completed!" $Green
}

function Create-Backup {
    $timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
    $backupBranch = "backup-$timestamp"
    
    Write-ColorOutput "💾 Creating backup branch: $backupBranch" $Yellow
    git checkout -b $backupBranch
    git push origin $backupBranch
    git checkout $Branch
    
    Write-ColorOutput "✅ Backup created: $backupBranch" $Green
}

function Restore-Backup {
    Write-ColorOutput "📋 Available backup branches:" $Blue
    git branch -r | Where-Object { $_ -like "*backup*" }
    Write-ColorOutput ""
    Write-ColorOutput "To restore a backup, use:" $Yellow
    Write-ColorOutput "  git checkout <backup-branch-name>" $White
    Write-ColorOutput "  git checkout -b restore-<backup-branch-name>" $White
}

function Clean-Repository {
    Write-ColorOutput "🧹 Cleaning untracked files..." $Yellow
    git clean -fd
    Write-ColorOutput "✅ Repository cleaned" $Green
}

function Show-Log {
    Write-ColorOutput "📜 Recent commits" $Blue
    Write-ColorOutput "================" $Blue
    git log --oneline -10
}

function Show-Branches {
    Write-ColorOutput "🌿 Available branches" $Blue
    Write-ColorOutput "====================" $Blue
    Write-ColorOutput "Local branches:" $Green
    git branch
    Write-ColorOutput ""
    Write-ColorOutput "Remote branches:" $Green
    git branch -r
}

function Switch-Branch {
    Write-ColorOutput "🔄 Switching to branch: $Branch" $Yellow
    git checkout $Branch
    Write-ColorOutput "✅ Switched to branch: $Branch" $Green
}

# Main execution
switch ($Action.ToLower()) {
    "help" { Show-Help }
    "status" { Show-Status }
    "add" { Add-All }
    "commit" { Commit-Changes }
    "push" { Push-Changes }
    "pull" { Pull-Changes }
    "deploy" { Deploy-All }
    "quick" { Quick-Deploy }
    "backup" { Create-Backup }
    "restore" { Restore-Backup }
    "clean" { Clean-Repository }
    "log" { Show-Log }
    "branches" { Show-Branches }
    "switch" { Switch-Branch }
    default { 
        Write-ColorOutput "❌ Unknown action: $Action" $Red
        Write-ColorOutput "Use -Action help to see available actions" $Yellow
    }
}
