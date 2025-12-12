# SSH Secret Setup Guide for GitHub Actions

## Problem Summary
Your deployment is failing because the SSH_KEY secret is not properly configured in GitHub Actions.

## Error Messages You're Seeing
- ❌ SSH_KEY is not in valid OpenSSH format
- ❌ SSH_KEY missing END marker
- ❌ Missing SSH configuration
- ssh: connect to host [hidden] port [hidden]: Network is unreachable

## Step-by-Step Fix

### 1. Locate Your SSH Private Key

On your **local machine** (the one you use to SSH into your server), find your private key:

**Windows (PowerShell):**
```powershell
# Check if you have the Hostinger deploy key
Get-Content ~\.ssh\id_rsa
# OR
Get-Content ~\.ssh\hostinger_deploy
# OR check the key used in your terminal history
```

**Linux/Mac:**
```bash
# Common locations
cat ~/.ssh/id_rsa
# OR
cat ~/.ssh/hostinger_deploy
```

The key should look **exactly** like this:
```
-----BEGIN OPENSSH PRIVATE KEY-----
b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAABlwAAAAdzc2gtcn
NhAAAAAwEAAQAAAYEA1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOP
QRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXY
Z0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ012345678
9abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghi
... (many more lines)
-----END OPENSSH PRIVATE KEY-----
```

**OR for RSA keys:**
```
-----BEGIN RSA PRIVATE KEY-----
MIIEpAIBAAKCAQEA1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQR
STUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ
0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ01234567
... (many more lines)
-----END RSA PRIVATE KEY-----
```

### 2. Copy the COMPLETE Key

**CRITICAL**: You must copy the **ENTIRE** key including:
- The `-----BEGIN` line
- ALL the encoded content lines
- The `-----END` line
- NO extra spaces before or after
- NO missing lines in the middle

### 3. Add to GitHub Secrets

1. **Go to your repository:**
   ```
   https://github.com/Anamsayyed016/Naukrimili/settings/secrets/actions
   ```

2. **Click "New repository secret"**

3. **Name:** `SSH_KEY`

4. **Value:** Paste the COMPLETE private key

   **CORRECT FORMAT** (in the text box):
   ```
   -----BEGIN OPENSSH PRIVATE KEY-----
   b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAABlwAAAAdzc2gtcn
   NhAAAAAwEAAQAAAYEA1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOP
   (... all lines ...)
   -----END OPENSSH PRIVATE KEY-----
   ```

   **WRONG FORMAT** (don't do this):
   ```
   -----BEGIN OPENSSH PRIVATE KEY-----\nb3BlbnNzaC1rZXktdjEAAAAABG5vbmU...
   ```
   (Don't use `\n` escape sequences - use actual line breaks)

5. **Click "Add secret"**

### 4. Verify Other SSH Secrets

Make sure you also have these secrets set:

| Secret Name | Example Value | Where to Find |
|-------------|---------------|---------------|
| `HOST` | `srv1054971.hstgr.cloud` | Your hosting control panel or SSH command you use |
| `SSH_USER` | `root` or `u123456789` | Username you use to SSH |
| `SSH_PORT` | `22` (usually) | Port number in your SSH command |

**To find your values**, check your local SSH command:
```bash
# If you normally SSH like this:
ssh -i ~/.ssh/id_rsa -p 22 root@srv1054971.hstgr.cloud

# Then your secrets should be:
# HOST = srv1054971.hstgr.cloud
# SSH_USER = root
# SSH_PORT = 22
```

### 5. Test Your SSH Key Format Locally

Before adding to GitHub, verify your key works:

**Windows (PowerShell):**
```powershell
# Test the key
ssh -i ~\.ssh\id_rsa -p 22 root@srv1054971.hstgr.cloud "echo 'Connection OK'"

# If it works, copy it:
Get-Content ~\.ssh\id_rsa | Set-Clipboard
# Now paste into GitHub Secrets
```

**Linux/Mac:**
```bash
# Test the key
ssh -i ~/.ssh/id_rsa -p 22 root@srv1054971.hstgr.cloud "echo 'Connection OK'"

# If it works, copy it:
cat ~/.ssh/id_rsa | pbcopy  # Mac
# OR
cat ~/.ssh/id_rsa | xclip -selection clipboard  # Linux
# Now paste into GitHub Secrets
```

### 6. Common Mistakes to Avoid

❌ **WRONG**: Copying only part of the key
❌ **WRONG**: Adding extra spaces or blank lines
❌ **WRONG**: Using the PUBLIC key (.pub file) instead of PRIVATE key
❌ **WRONG**: Converting newlines to `\n` escape sequences
❌ **WRONG**: Copying from a formatted document (Word, etc.) that changes characters

✅ **CORRECT**: Copy the entire raw private key file content
✅ **CORRECT**: Use the file you successfully SSH with locally
✅ **CORRECT**: Preserve all line breaks exactly as they are

### 7. Firewall Issues

If the SSH key is correct but you still get "Network is unreachable":

**Option A: Allow GitHub Actions IPs (if using Hostinger/cPanel)**
1. Log into your hosting control panel
2. Go to Security → IP Blocker or Firewall
3. Whitelist GitHub Actions IP ranges: https://api.github.com/meta
   - You'll see `"actions": ["192.30.252.0/22", "185.199.108.0/22", ...]`
   - Add these to your allowlist

**Option B: Disable SSH IP restrictions temporarily**
1. SSH into your server manually
2. Edit `/etc/hosts.allow` or your firewall rules
3. Allow SSH from any IP (for testing):
   ```bash
   # Temporarily allow all
   sudo ufw allow 22/tcp  # Ubuntu/Debian
   # OR
   firewall-cmd --add-port=22/tcp --permanent  # CentOS/RHEL
   ```

### 8. Verify Secrets Are Set

After adding all secrets, check they're there:
1. Go to: https://github.com/Anamsayyed016/Naukrimili/settings/secrets/actions
2. You should see:
   - ✅ SSH_KEY
   - ✅ HOST
   - ✅ SSH_USER
   - ✅ SSH_PORT
   - ✅ NEXTAUTH_SECRET
   - ✅ DATABASE_URL
   - ✅ GOOGLE_CLIENT_ID
   - ✅ GOOGLE_CLIENT_SECRET

### 9. Re-run the Workflow

1. Go to: https://github.com/Anamsayyed016/Naukrimili/actions
2. Click on the failed workflow run
3. Click "Re-run all jobs"

### 10. Still Failing? Debug Output

If it still fails, check the workflow logs:

1. Look for the "🔐 VALIDATE ALL SECRETS" step
   - Should show: `✅ SSH_KEY: SET (XXXX chars)`
   - If it shows `❌ SSH_KEY: MISSING`, the secret wasn't saved

2. Look for the "🔑 Setup SSH Key" step
   - Should show: `✅ SSH key written (XXXX bytes)`
   - If it shows `❌ SSH_KEY is not in valid OpenSSH format`, the key format is wrong

3. Look for the "🧪 Test SSH Connection" step
   - Should show: `✅ SSH Connection OK`
   - If it shows `❌ SSH CONNECTION FAILED`, check HOST/USER/PORT or firewall

## Quick Checklist

- [ ] Found my private SSH key file (the one I use to SSH locally)
- [ ] Verified it starts with `-----BEGIN` and ends with `-----END`
- [ ] Copied the COMPLETE key (all lines, no modifications)
- [ ] Added as GitHub Secret named `SSH_KEY`
- [ ] Verified HOST, SSH_USER, SSH_PORT secrets are correct
- [ ] Checked server firewall allows SSH from GitHub IPs
- [ ] Re-ran the workflow

## Need More Help?

If you're still stuck, provide these details:
1. What the "🔐 VALIDATE ALL SECRETS" step shows
2. What the "🔑 Setup SSH Key" step shows
3. What the "🧪 Test SSH Connection" step shows
4. Your SSH command that works locally (hide sensitive info)

Example:
```
I can SSH locally with:
ssh -i ~/.ssh/id_rsa -p 22 root@srv1054971.hstgr.cloud

But GitHub Actions fails at step: "🧪 Test SSH Connection"
Error message: "ssh: connect to host [hidden] port [hidden]: Network is unreachable"
```
