# Google OAuth Setup Guide

## Quick Setup Steps

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com/
   - Create a new project or select existing one

2. **Enable Google+ API**
   - Go to "APIs & Services" > "Library"
   - Search for "Google+ API" and enable it

3. **Create OAuth 2.0 Credentials**
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth 2.0 Client IDs"
   - Choose "Web application"
   - Set authorized redirect URIs:
     - `http://localhost:3000/api/auth/callback/google` (for development)
     - `https://aftionix.in/api/auth/callback/google` (for production)

4. **Update .env.local**
   ```bash
   GOOGLE_CLIENT_ID=your-actual-client-id.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=your-actual-client-secret
   ```

5. **Test the Setup**
   - Start your development server: `npm run dev`
   - Go to http://localhost:3000/auth/signin
   - Click "Continue with Google"
   - You should be redirected to Google's consent screen

## Troubleshooting

- **"Invalid client" error**: Check that your client ID and secret are correct
- **"Redirect URI mismatch"**: Ensure the redirect URI in Google Console matches exactly
- **"Access blocked"**: Make sure the Google+ API is enabled in your project
- **Console warnings**: The app will warn you if credentials are not properly configured

## Current Status

✅ OAuth buttons use proper NextAuth signIn method
✅ Redirect logic simplified and improved
✅ Error handling enhanced
✅ Credential validation added

⚠️ **Action Required**: Update your .env.local with actual Google OAuth credentials
