# 🔧 Fix Google OAuth "redirect_uri_mismatch" Error

## 🚨 Problem
You're getting `Error 400: redirect_uri_mismatch` because Google Cloud Console doesn't have the correct redirect URIs configured.

## ✅ IMMEDIATE SOLUTION

### Step 1: Open Google Cloud Console
Click this link to go directly to your OAuth client settings:
**[https://console.cloud.google.com/apis/credentials/oauthclient/464019128002-k08cl8jrjq0refk8hmgpadkovqg0kvtm](https://console.cloud.google.com/apis/credentials/oauthclient/464019128002-k08cl8jrjq0refk8hmgpadkovqg0kvtm)**

### Step 2: Add Authorized Redirect URIs
In the "Authorized redirect URIs" section, add these EXACT URLs:
```
http://localhost:3000/api/auth/callback/google
http://127.0.0.1:3000/api/auth/callback/google
```

### Step 3: Add Authorized JavaScript Origins
In the "Authorized JavaScript origins" section, add these EXACT URLs:
```
http://localhost:3000
http://127.0.0.1:3000
```

### Step 4: Save and Wait
1. Click the **SAVE** button
2. Wait 2-3 minutes for Google to propagate the changes

### Step 5: Test
1. Clear your browser cache/cookies for localhost
2. Go to: `http://localhost:3000/auth/login`
3. Click "Sign in with Google"
4. It should work now! 🎉

## 🔍 Alternative Quick Fix

If you want to use port 3002 instead (as mentioned in some of your docs):

1. **Update your .env file:**
```env
NEXTAUTH_URL=http://localhost:3002
```

2. **Add these URIs to Google Cloud Console:**
```
http://localhost:3002/api/auth/callback/google
http://127.0.0.1:3002/api/auth/callback/google
```

3. **Restart your dev server on port 3002:**
```bash
npm run dev -- --port 3002
```

## 🚨 Common Mistakes to Avoid

❌ **Don't add these:**
- https:// (use http:// for localhost)
- Trailing slashes
- Wrong port numbers
- Typos in the callback path

✅ **Make sure you have:**
- Exact match: `http://localhost:3000/api/auth/callback/google`
- No trailing slashes
- Correct port (3000 or 3002)
- Both localhost and 127.0.0.1 versions

## 🎯 Verification
After the fix, you should see:
1. Google OAuth consent screen (not an error page)
2. Permission request for email, profile, and Gmail access
3. Successful redirect back to your app
4. User logged in successfully

## ⚡ Need Help?
If it still doesn't work:
1. Check browser console for errors
2. Verify all environment variables in .env
3. Make sure you waited 2-3 minutes after saving in Google Cloud Console
4. Try using incognito/private browsing mode
