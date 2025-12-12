# QUICK FIX: SSH Deployment Failure

## What Went Wrong
Your workflow failed because **SSH_KEY secret is not properly formatted** in GitHub Actions.

## Fix It NOW (5 Minutes)

### Step 1: Find Your SSH Private Key

**On Windows (PowerShell):**
```powershell
# Find your private key
dir ~\.ssh\

# Common names: id_rsa, id_ed25519, hostinger_deploy
# Copy the COMPLETE content:
Get-Content ~\.ssh\id_rsa
```

**On Linux/Mac:**
```bash
# Find your private key
ls ~/.ssh/

# Common names: id_rsa, id_ed25519, hostinger_deploy
# Copy the COMPLETE content:
cat ~/.ssh/id_rsa
```

### Step 2: Verify It's the RIGHT Key

Test that this key actually works to SSH into your server:

```bash
# Replace with your actual values
ssh -i ~/.ssh/id_rsa -p 22 root@srv1054971.hstgr.cloud "echo OK"
```

If this command prints "OK", you have the right key!

### Step 3: Copy the COMPLETE Key

The key must include:
- `-----BEGIN OPENSSH PRIVATE KEY-----` (or `BEGIN RSA PRIVATE KEY`)
- ALL the lines of encoded text (usually 20-50 lines)
- `-----END OPENSSH PRIVATE KEY-----` (or `END RSA PRIVATE KEY`)

**Example of correct key:**
```
-----BEGIN OPENSSH PRIVATE KEY-----
b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAABlwAAAAdzc2gtcn
NhAAAAAwEAAQAAAYEAtJ9K7xGvxLqN7Vq8tqK5cU3kN2P+wYjL0mF8pQzRx6cVbW9nMJ
L5kP2H8gN4vZ7wK6xQ9tF3mN8kL2pY5vR6cW9nL3kP8H7gM4uZ6wL5xP9sG3lO7kN
... (20-50 more lines)
wK6xQ9tF3mN8kL2pY5vR6cW9nL3kP8H7gM4uZ6wL5xP9sG3lO7kN2P+wYjL0mF8pQz
-----END OPENSSH PRIVATE KEY-----
```

**DO NOT copy:**
- Just part of the key
- The public key (.pub file)
- With extra spaces or text
- With `\n` escape sequences instead of real line breaks

### Step 4: Update GitHub Secret

1. **Go to:** https://github.com/Anamsayyed016/Naukrimili/settings/secrets/actions

2. **Find or create** `SSH_KEY` secret

3. **Paste** the complete private key (from Step 3)

4. **Click** "Update secret" or "Add secret"

### Step 5: Verify Other Secrets

While you're there, make sure these also exist:

| Secret | Example | How to Find |
|--------|---------|-------------|
| `HOST` | `srv1054971.hstgr.cloud` | The hostname/IP you SSH to |
| `SSH_USER` | `root` | The username you SSH with |
| `SSH_PORT` | `22` | The port (usually 22) |
| `NEXTAUTH_SECRET` | `abc123...` (32+ chars) | Random string |
| `DATABASE_URL` | `postgresql://user:pass@host/db` | Your database connection |
| `GOOGLE_CLIENT_ID` | `123-abc.apps.googleusercontent.com` | From Google Console |
| `GOOGLE_CLIENT_SECRET` | `GOCSPX-...` | From Google Console |

### Step 6: Re-run the Workflow

1. **Go to:** https://github.com/Anamsayyed016/Naukrimili/actions

2. **Click** on the failed workflow run

3. **Click** "Re-run all jobs"

## Expected Result

After fixing, you should see:

```
✅ SSH_KEY: SET (2400 chars)
✅ SSH key validation PASSED
   Format: BEGIN OPENSSH PRIVATE KEY
   Size: 2400 bytes
   Lines: 39
   Permissions: 600

🧪 Step 1/3: Testing network connectivity...
   ✅ Port 22 is reachable

🔐 Step 2/3: Testing SSH authentication...
   ✅ Authentication successful

⚙️ Step 3/3: Testing command execution...
✅ SSH Connection OK
Linux srv1054971 5.4.0-...

═══════════════════════════════════════
✅ SSH CONNECTION FULLY VERIFIED
═══════════════════════════════════════
```

## Still Failing?

### If validation fails at "SSH_KEY format":
- You copied an incomplete key
- Open the private key file in a text editor
- Select ALL (Ctrl+A), Copy (Ctrl+C)
- Update the secret again

### If it fails at "Network connectivity":
- Your server firewall may block GitHub Actions
- Allow SSH from GitHub's IP ranges: https://api.github.com/meta
- Or temporarily disable SSH IP restrictions

### If it fails at "Authentication":
- You're using the wrong private key
- Make sure you copied the key you use for successful SSH
- Test: `ssh -i ~/.ssh/YOUR_KEY -p PORT USER@HOST`

## Full Documentation

For complete troubleshooting: See [SSH_SECRET_SETUP_GUIDE.md](./SSH_SECRET_SETUP_GUIDE.md)

---

**TL;DR:**
1. Find the SSH private key you use to connect to your server
2. Copy the ENTIRE content (from `-----BEGIN` to `-----END`)
3. Update `SSH_KEY` secret at: https://github.com/Anamsayyed016/Naukrimili/settings/secrets/actions
4. Re-run the workflow
