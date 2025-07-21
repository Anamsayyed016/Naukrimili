# Fix OAuth Redirect URI Mismatch Error

## 🚨 Current Error
```
Error 400: redirect_uri_mismatch
Request details: redirect_uri=http://localhost:3000/api/auth/callback/google
```

## 🔧 Solution Steps

### Step 1: Update Google Cloud Console

1. **Open Google Cloud Console**
   - Go to [https://console.cloud.google.com/](https://console.cloud.google.com/)
   - Select your project

2. **Navigate to OAuth Credentials**
   - Go to "APIs & Services" → "Credentials"
   - Find your OAuth 2.0 Client ID: `464019128002-k08cl8jrjq0refk8hmgpadkovqg0kvtm.apps.googleusercontent.com`
   - Click the edit button (pencil icon)

3. **Add Authorized Redirect URIs**
   Add these URIs to the "Authorized redirect URIs" section:
   ```
   http://localhost:3000/api/auth/callback/google
   http://127.0.0.1:3000/api/auth/callback/google
   ```

4. **Add Authorized JavaScript Origins**
   Add these origins to the "Authorized JavaScript origins" section:
   ```
   http://localhost:3000
   http://127.0.0.1:3000
   ```

5. **Save Changes**
   - Click "Save" button
   - Wait 5-10 minutes for changes to propagate

### Step 2: Verify Environment Configuration

Your current environment variables should be:
```env
GOOGLE_CLIENT_ID=464019128002-k08cl8jrjq0refk8hmgpadkovqg0kvtm.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=ynpaByRH0nWr00e4Qxz9/Ad90zdTiwZGEwfA9dKuZtE=
```

### Step 3: Enable Required APIs

1. **Gmail API**
   - Go to [https://console.cloud.google.com/apis/library/gmail.googleapis.com](https://console.cloud.google.com/apis/library/gmail.googleapis.com)
   - Click "Enable"

2. **Google+ API** (if available)
   - Search for "Google+ API" in the API Library
   - Enable it if found (this is deprecated but may be required for some OAuth flows)

### Step 4: Configure OAuth Consent Screen

1. **Go to OAuth Consent Screen**
   - Navigate to "APIs & Services" → "OAuth consent screen"

2. **Configure the consent screen**
   - User Type: External (for testing)
   - App name: Your app name
   - User support email: Your email
   - Developer contact information: Your email

3. **Add Scopes**
   Add these scopes:
   ```
   .../auth/userinfo.email
   .../auth/userinfo.profile
   .../auth/gmail.readonly
   .../auth/gmail.send
   openid
   ```

4. **Add Test Users** (if using External)
   - Add your Gmail address as a test user

### Step 5: Test the Fix

1. **Restart your development server**
   ```bash
   npm run dev
   ```

2. **Clear browser cache and cookies**
   - Clear cookies for localhost
   - Or use incognito/private browsing

3. **Test authentication**
   - Go to `http://localhost:3000/auth/login`
   - Click "Continue with Google"
   - Complete the OAuth flow

## 🔍 Troubleshooting

### If you still get redirect URI errors:

1. **Double-check the URI exactly matches:**
   ```
   http://localhost:3000/api/auth/callback/google
   ```

2. **Try using 127.0.0.1 instead:**
   - Update `NEXTAUTH_URL=http://127.0.0.1:3000`
   - Add `http://127.0.0.1:3000/api/auth/callback/google` to redirect URIs

3. **Wait for propagation:**
   - Google Cloud Console changes can take 5-10 minutes to take effect

4. **Check for typos:**
   - Ensure no trailing slashes
   - Ensure correct protocol (http, not https for localhost)

### Common Issues:

- **Case sensitivity**: URIs are case-sensitive
- **Trailing slashes**: Don't add trailing slashes
- **Protocol mismatch**: Use http for localhost, not https
- **Port mismatch**: Ensure the port matches your dev server

## ✅ Success Indicators

When fixed correctly, you should:
1. See the Google OAuth consent screen
2. Be able to grant permissions
3. Get redirected back to your application
4. See your user session established

## 🎯 Quick Test

Run this command to verify your setup:
```bash
node scripts/verify-gmail-setup.js
```

The verification should show all green checkmarks.
