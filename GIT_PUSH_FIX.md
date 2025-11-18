# Git Push Issue - Troubleshooting Guide

## Current Issue
Getting `500 Internal Server Error` or `503 Service Unavailable` or `Empty reply from server` when pushing to GitHub.

## Quick Fixes to Try

### 1. **Wait and Retry** (Most Common Solution)
GitHub sometimes has temporary server issues. Wait 5-10 minutes and try again:
```powershell
git push origin main
```

### 2. **Check GitHub Status**
Visit https://www.githubstatus.com/ to see if GitHub is experiencing issues.

### 3. **Refresh Credentials**
Your authentication token might have expired. Try:
```powershell
# Windows Credential Manager
cmdkey /list | findstr git
# Remove GitHub credentials if found, then retry push
git push origin main
```

### 4. **Use Personal Access Token (PAT)**
If using HTTPS, ensure you're using a Personal Access Token with `repo` scope:
1. Go to GitHub → Settings → Developer settings → Personal access tokens
2. Generate new token with `repo` scope
3. Use token as password when pushing

### 5. **Switch to SSH** (Recommended for Long-term)
```powershell
# Change remote URL to SSH
git remote set-url origin git@github.com:Anamsayyed016/Naukrimili.git

# Test SSH connection
ssh -T git@github.com

# Push using SSH
git push origin main
```

### 6. **Increase Git Timeout and Buffer**
Already configured:
- `http.postBuffer = 524288000` (500MB)
- `http.timeout = 300` (5 minutes)

### 7. **Check for Large Files**
Large files (>100MB) can cause push failures. Check with:
```powershell
git ls-files | ForEach-Object { if (Test-Path $_) { $f = Get-Item $_; if ($f.Length -gt 100MB) { Write-Host "$($f.Name): $([math]::Round($f.Length/1MB, 2)) MB" } } }
```

### 8. **Push in Smaller Chunks**
If you have many commits, try pushing one at a time:
```powershell
# See commits ahead
git log origin/main..HEAD --oneline

# Push specific commit
git push origin <commit-hash>:main
```

### 9. **Check Network/Firewall**
- Ensure port 443 (HTTPS) is not blocked
- Check if corporate firewall is blocking GitHub
- Try from different network (mobile hotspot)

### 10. **Verify Repository Access**
Ensure you have write access to the repository:
- Check repository settings on GitHub
- Verify you're a collaborator or owner

## Current Configuration
- Remote URL: `https://github.com/Anamsayyed016/Naukrimili.git`
- Branch: `main`
- Commits ahead: 1 commit
- Files changed: 3 files (env.template, lib/env.ts, types/env.d.ts)

## Next Steps
1. **Immediate**: Wait 5-10 minutes and retry
2. **Short-term**: Refresh credentials or use PAT
3. **Long-term**: Switch to SSH authentication

## If Nothing Works
1. Create a new branch and push there first
2. Use GitHub Desktop or another Git client
3. Contact GitHub Support if issue persists

