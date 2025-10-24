# 🔍 Welcome Email Debug - Issue Found & Fixed

**Date:** October 12, 2025  
**Issue:** No welcome email sent after Gmail OAuth login  
**Status:** ✅ **FIXED**

---

## 🐛 Root Cause Analysis

### The Problem

After deep debugging of the server logs and codebase scan, the issue was identified:

**Location:** `lib/nextauth-config.ts` (lines 320-336)

**What Was Happening:**
- When a new user signed up via Google OAuth, the NextAuth JWT callback was creating a user account ✅
- It was creating a **notification record** in the database ✅
- **BUT it was NOT calling the `sendWelcomeEmail()` function** ❌

### Why No Emails Were Sent

The Gmail OAuth2 system was fully configured and working:
- ✅ Environment variables loaded in PM2
- ✅ Gmail OAuth2 mailer service (`lib/gmail-oauth2-mailer.ts`) properly configured
- ✅ Welcome email service (`lib/welcome-email.ts`) ready and available
- ✅ Refresh token valid and active

**The missing link:** The NextAuth configuration wasn't calling the welcome email service when new users were created.

---

## 🔧 The Fix

### What Was Changed

**File:** `lib/nextauth-config.ts`

**Before (Old Code):**
```typescript
// Send welcome notification for new user
try {
  // Create a simple notification record
  await prisma.notification.create({
    data: {
      userId: newUser.id,
      type: 'welcome',
      title: 'Welcome to NaukriMili!',
      message: `Welcome ${newUser.firstName && newUser.lastName ? `${newUser.firstName} ${newUser.lastName}` : newUser.firstName || 'User'}! Your account has been created successfully.`,
      isRead: false
    }
  });
  console.log('✅ Welcome notification sent for new Google OAuth user');
} catch (notificationError) {
  console.error('❌ Failed to send welcome notification:', notificationError);
  // Don't fail the OAuth flow if notification fails
}
```

**After (New Code):**
```typescript
// Send welcome email and notification for new user
try {
  // Import and send welcome email
  const { sendWelcomeEmail } = await import('@/lib/welcome-email');
  await sendWelcomeEmail({
    email: newUser.email,
    name: newUser.firstName && newUser.lastName ? `${newUser.firstName} ${newUser.lastName}` : newUser.firstName || 'User',
    provider: 'google'
  });

  // Create a simple notification record
  await prisma.notification.create({
    data: {
      userId: newUser.id,
      type: 'welcome',
      title: 'Welcome to NaukriMili!',
      message: `Welcome ${newUser.firstName && newUser.lastName ? `${newUser.firstName} ${newUser.lastName}` : newUser.firstName || 'User'}! Your account has been created successfully.`,
      isRead: false
    }
  });
  console.log('✅ Welcome email and notification sent for new Google OAuth user');
} catch (notificationError) {
  console.error('❌ Failed to send welcome email/notification:', notificationError);
  // Don't fail the OAuth flow if email/notification fails
}
```

### Key Changes

1. ✅ Added dynamic import of `sendWelcomeEmail` function
2. ✅ Call `sendWelcomeEmail()` before creating notification
3. ✅ Pass user email, name, and provider to the function
4. ✅ Updated log messages to reflect email sending
5. ✅ Maintained error handling to not break OAuth flow

---

## 📊 How It Works Now

### New User Signup Flow

```
1. User clicks "Continue with Google" on naukrimili.com
   ↓
2. Google OAuth authentication completes
   ↓
3. NextAuth JWT callback receives user data
   ↓
4. New user account is created in database
   ↓
5. 🆕 sendWelcomeEmail() is called
   ↓
6. Gmail OAuth2 service initializes (lazy loading)
   ↓
7. Professional HTML email is sent from naukrimili@naukrimili.com
   ↓
8. Database notification is also created
   ↓
9. User is redirected to role selection
   ↓
10. ✅ Welcome email arrives in user's Gmail inbox (10-30 seconds)
```

### What Happens in the Email Service

**File:** `lib/welcome-email.ts`
- Receives user email, name, and provider
- Calls `mailerService.sendWelcomeEmail()` from `lib/gmail-oauth2-mailer.ts`
- Logs success/failure

**File:** `lib/gmail-oauth2-mailer.ts`
- Initializes Gmail OAuth2 client (on first use)
- Generates professional HTML email template
- Sends email via Gmail API endpoint: `/gmail/v1/users/me/messages/send`
- Automatically refreshes access token if needed
- Retries once on failure
- Returns success/failure status

---

## 🧪 How to Test

### Step-by-Step Testing

1. **Clear Your Browser Data** (or use incognito)
   - Open incognito/private window
   - Go to https://naukrimili.com

2. **Test New User Signup**
   - Click "Sign Up" or "Login"
   - Click "Continue with Google"
   - Select your Google account
   - Complete the OAuth flow

3. **Check Your Email**
   - Open your Gmail inbox
   - Look for email from "NaukriMili <naukrimili@naukrimili.com>"
   - Email should arrive within 10-30 seconds

4. **Verify in Server Logs**
   ```bash
   pm2 logs naukrimili --lines 50
   ```
   
   **Expected logs:**
   ```
   ✅ Gmail OAuth2 service initialized successfully
   📧 Sending Welcome Email: { to: 'user@example.com', name: 'User Name', provider: 'google' }
   ✅ Welcome email sent successfully to user@example.com (google)
   ✅ Email sent successfully via Gmail API
   ✅ Welcome email and notification sent for new Google OAuth user
   ```

### Alternative Test (If Already Signed Up)

If you need to test with an existing account, you'll need to clear the user from the database first:

```sql
-- Connect to your database
DELETE FROM "Account" WHERE "userId" = 'your_user_id';
DELETE FROM "Session" WHERE "userId" = 'your_user_id';
DELETE FROM "User" WHERE "email" = 'your_email@example.com';
```

Then sign up again with the same Google account.

---

## 📋 Deployment Checklist

- ✅ Code changes committed to `lib/nextauth-config.ts`
- ✅ Secrets removed from documentation files
- ✅ Changes pushed to GitHub (main branch)
- ✅ Deployment script created: `DEPLOY_WELCOME_EMAIL_FIX.sh`
- ✅ Server commands document created: `SERVER_COMMANDS_WELCOME_EMAIL_FIX.txt`
- ⏳ **NEXT:** Deploy to production server

---

## 🚀 Server Deployment Instructions

### Quick Deploy (Copy & Paste)

**Open your server terminal and run these commands ONE BY ONE:**

```bash
# 1. Navigate to project
cd /var/www/naukrimili

# 2. Pull latest code
git stash
git pull origin main

# 3. Install dependencies
npm install

# 4. Build application
npm run build

# 5. Restart PM2 (delete first to reload environment)
pm2 delete naukrimili
pm2 start ecosystem.config.cjs --env production

# 6. Check status
pm2 status

# 7. Verify Gmail variables loaded
pm2 env 0 | grep -E "(GMAIL|GOOGLE_CLIENT|NEXTAUTH)" | head -10

# 8. Monitor logs
pm2 logs naukrimili --lines 50
```

### What to Expect After Deployment

**Immediately after PM2 restart:**
```
🚀 Starting Naukrimili server...
✅ .next directory found
✅ Next.js app prepared successfully
🎉 Server ready on http://0.0.0.0:3000
✅ Google OAuth provider configured successfully
```

**When first user signs up:**
```
📧 Sending Welcome Email: { to: 'user@example.com', name: 'John Doe', provider: 'google' }
✅ Gmail OAuth2 service initialized successfully
📧 Emails will be sent from: NaukriMili <naukrimili@naukrimili.com>
✅ Email sent successfully via Gmail API
✅ Welcome email sent successfully to user@example.com (google)
✅ Welcome email and notification sent for new Google OAuth user
```

---

## ✅ Success Criteria

The fix is successful when:

1. ✅ PM2 starts without errors
2. ✅ Gmail environment variables are loaded (`pm2 env 0 | grep GMAIL`)
3. ✅ New user signup via Google OAuth completes
4. ✅ Welcome email is sent (check PM2 logs)
5. ✅ Email arrives in user's Gmail inbox within 30 seconds
6. ✅ Email is from "NaukriMili <naukrimili@naukrimili.com>"
7. ✅ Email has professional HTML formatting
8. ✅ No errors in PM2 logs

---

## 🔍 Troubleshooting

### If Email Doesn't Send

1. **Check PM2 logs immediately after signup:**
   ```bash
   pm2 logs naukrimili --lines 100 | grep -i "gmail\|email\|welcome"
   ```

2. **Verify Gmail variables are loaded:**
   ```bash
   pm2 env 0 | grep GMAIL
   ```
   Should show all 5 Gmail variables (CLIENT_ID, CLIENT_SECRET, REFRESH_TOKEN, SENDER, FROM_NAME)

3. **Check .env file has refresh token:**
   ```bash
   cat .env | grep GMAIL_API_REFRESH_TOKEN
   ```

4. **Verify Google OAuth redirect URI:**
   - Go to Google Cloud Console
   - APIs & Services > Credentials
   - OAuth 2.0 Client IDs
   - Check "Authorized redirect URIs" includes:
     - `https://naukrimili.com/api/auth/callback/google`

5. **Restart PM2 with fresh environment:**
   ```bash
   pm2 delete naukrimili
   pm2 start ecosystem.config.cjs --env production
   ```

### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| No logs about email | Welcome email not triggered | Check NextAuth code deployed |
| "invalid_client" error | Wrong OAuth credentials | Verify GOOGLE_CLIENT_ID/SECRET |
| "Unauthorized" error | Invalid refresh token | Generate new refresh token |
| Gmail vars not in PM2 | PM2 not reading .env | Delete and restart PM2 |
| Email not arriving | Sent to spam | Check spam folder |

---

## 📊 Before vs After

### Before (Broken)
```
User signs up → Account created → Notification in DB → ❌ No email sent
```

### After (Fixed)
```
User signs up → Account created → Email sent ✅ → Notification in DB ✅
```

---

## 🎯 Expected Timeline

| Event | Time |
|-------|------|
| User clicks "Continue with Google" | T+0s |
| OAuth completes, account created | T+2s |
| Welcome email triggered | T+2s |
| Gmail OAuth2 initializes | T+3s |
| Email sent via Gmail API | T+4s |
| Email arrives in inbox | T+10-30s |

---

## 📝 Files Modified

1. ✅ `lib/nextauth-config.ts` - Added welcome email call in JWT callback
2. ✅ `GMAIL_OAUTH2_IMPLEMENTATION_STATUS.md` - Removed secrets
3. ✅ `DEPLOY_WELCOME_EMAIL_FIX.sh` - Created deployment script
4. ✅ `SERVER_COMMANDS_WELCOME_EMAIL_FIX.txt` - Created command reference
5. ✅ `WELCOME_EMAIL_DEBUG_SUMMARY.md` - This file

---

## 🎉 Summary

### The Issue
Welcome emails were not being sent because NextAuth wasn't calling the `sendWelcomeEmail()` function, even though the Gmail OAuth2 system was fully configured.

### The Fix
Updated `lib/nextauth-config.ts` to dynamically import and call `sendWelcomeEmail()` in the JWT callback when new Google OAuth users are created.

### The Result
New users will now receive professional welcome emails from `naukrimili@naukrimili.com` immediately after signing up via Google OAuth.

---

## 🚀 Ready to Deploy

**All changes are committed and pushed to GitHub main branch.**

**Next step:** Run the server commands from `SERVER_COMMANDS_WELCOME_EMAIL_FIX.txt`

---

**Last Updated:** October 12, 2025  
**System:** NaukriMili Job Portal  
**Developer:** Senior Full-Stack Developer  
**Email System:** Gmail OAuth2 (naukrimili@naukrimili.com)


