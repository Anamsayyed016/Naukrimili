# 🔍 Quick Verification Guide

## Run Verification Script

### On Linux/Mac Server (via SSH):
```bash
bash verify-oauth-gemini.sh
```

### On Windows (PowerShell):
```powershell
.\verify-oauth-gemini.ps1
```

## Expected Output

### ✅ SUCCESS - You should see:
```
✅ Google OAuth provider configured successfully
✅ Gemini client initialized
✅ OAuth API Endpoint: RESPONDING
✅ PM2 Server Status: ONLINE

📊 Result: 4/4 checks passed
🎉 SUCCESS! All systems are working correctly!
```

### ❌ FAILURE - Common Issues:

#### 1. "Google OAuth initialization message not found"
**Cause**: Environment variables not loaded by PM2
**Fix**:
```bash
# Make sure .env is in the project root
cat .env | grep GOOGLE

# Restart PM2 completely
pm2 delete naukrimili
pm2 start ecosystem.config.cjs

# Wait 10 seconds then check logs
pm2 logs naukrimili --lines 50
```

#### 2. "PM2 Server Status: OFFLINE"
**Cause**: Server crashed or not started
**Fix**:
```bash
# Check PM2 status
pm2 status

# Check error logs
pm2 logs naukrimili --err --lines 50

# Restart
pm2 restart naukrimili
```

#### 3. "OAuth API Endpoint: NOT RESPONDING"
**Cause**: Server not fully started or port blocked
**Fix**:
```bash
# Check if port 3000 is listening
netstat -tuln | grep 3000

# Check server logs
pm2 logs naukrimili --lines 50 | grep "ready"
```

## Manual Verification Commands

If the script doesn't work, try these individual commands:

```bash
# 1. Check PM2 status
pm2 status naukrimili

# 2. Check recent logs
pm2 logs naukrimili --lines 100 --nostream | grep -E "Google|Gemini"

# 3. Test API endpoint
curl http://localhost:3000/api/auth/providers | jq

# 4. Check environment file
grep -E "GOOGLE|GEMINI" .env

# 5. View full error logs
pm2 logs naukrimili --err --lines 50
```

## What These Keys Enable

### ✅ Google OAuth (`GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET`)
- **Gmail Sign-In Button** on `/auth/signin`
- One-click registration with Google account
- Auto-populated profile from Gmail
- Secure authentication via Google

### ✅ Gemini API (`GEMINI_API_KEY`)
- **AI Resume Parsing** on `/resumes` page
- Automatic form filling from resume
- Smart skills extraction
- Work experience summarization
- ATS score calculation

## Testing the Features

### 1. Test Google OAuth:
```bash
# Open browser
https://naukrimili.com/auth/signin

# Click "Sign in with Google"
# Should redirect to Google login
# After login, should redirect back to role selection
```

### 2. Test Gemini AI:
```bash
# Open browser
https://naukrimili.com/resumes

# Upload a resume (PDF/DOC/DOCX)
# Should see:
#   - Progress bar
#   - AI processing message
#   - Auto-filled form fields
#   - ATS score
```

## Need Help?

### Show me the verification results:
```bash
bash verify-oauth-gemini.sh > verification-results.txt
cat verification-results.txt
```

### Get full logs:
```bash
pm2 logs naukrimili --lines 200 > full-logs.txt
cat full-logs.txt | grep -E "Google|Gemini|OAuth|Error"
```

### Environment check:
```bash
echo "=== Environment Variables ==="
grep -E "GOOGLE_CLIENT_ID|GOOGLE_CLIENT_SECRET|GEMINI_API_KEY" .env
echo ""
echo "=== PM2 Environment ==="
pm2 env naukrimili | grep -E "GOOGLE|GEMINI"
```

## Success Indicators

When everything is working, you'll see these in the logs:

```
🔧 NextAuth Configuration:
   NEXTAUTH_URL: https://naukrimili.com
   NEXTAUTH_SECRET: ✅ Set
   Environment: production

✅ Google OAuth provider configured successfully
✅ Gemini client initialized
```

And the API will respond with:
```json
{
  "google": {
    "id": "google",
    "name": "Google",
    "type": "oauth",
    "signinUrl": "https://naukrimili.com/api/auth/signin/google",
    "callbackUrl": "https://naukrimili.com/api/auth/callback/google"
  },
  "credentials": {
    "id": "credentials",
    "name": "credentials",
    "type": "credentials"
  }
}
```

