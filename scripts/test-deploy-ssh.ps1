# Test GitHub Actions deploy SSH key against your VPS
# Usage: .\scripts\test-deploy-ssh.ps1
#        .\scripts\test-deploy-ssh.ps1 -Host 76.13.155.103 -User root -Port 22

param(
  [string]$Host = "76.13.155.103",
  [string]$User = "root",
  [int]$Port = 22,
  [string]$KeyPath = "$env:USERPROFILE\.ssh\github_naukrimili_deploy"
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path $KeyPath)) {
  Write-Host "Key not found: $KeyPath" -ForegroundColor Red
  Write-Host ""
  Write-Host "Generate one with:"
  Write-Host '  ssh-keygen -t ed25519 -f $env:USERPROFILE\.ssh\github_naukrimili_deploy -N "" -C "github-actions-naukrimili"'
  exit 1
}

Write-Host "Testing SSH to ${User}@${Host}:${Port} ..." -ForegroundColor Cyan
ssh -i $KeyPath -p $Port -o StrictHostKeyChecking=accept-new -o ConnectTimeout=15 "${User}@${Host}" "echo 'SSH OK' && uname -a"

if ($LASTEXITCODE -eq 0) {
  Write-Host "`nSuccess. Add the PRIVATE key to GitHub secret SSH_KEY:" -ForegroundColor Green
  Write-Host "  Get-Content `"$KeyPath`" -Raw | Set-Clipboard"
  Write-Host "  (copied to clipboard if Set-Clipboard works)"
} else {
  Write-Host "`nFailed. Install public key on server:" -ForegroundColor Yellow
  Write-Host "  Get-Content `"${KeyPath}.pub`" | ssh -p $Port ${User}@${Host} `"mkdir -p ~/.ssh && chmod 700 ~/.ssh && cat >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys`""
}
