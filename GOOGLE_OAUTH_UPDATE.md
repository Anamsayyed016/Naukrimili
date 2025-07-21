# Google OAuth Configuration Update

## Important: Update Your Redirect URIs

Since the application is now running on port 3003, you need to update your redirect URIs in the Google Cloud Console:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to your project
3. Go to APIs & Services > Credentials
4. Edit your OAuth 2.0 Client ID
5. Add the following redirect URI:
   - `http://localhost:3003/api/auth/callback/google`

This is necessary because your application is now running on port 3003 instead of the default port 3000.

## Restart Required

After updating the redirect URIs in the Google Cloud Console, restart your development server:

```bash
npm run dev
```

## Testing Google Authentication

Test the Google authentication by visiting:

```
http://localhost:3003/auth/login
```

Click on the "Continue with Google" button to test the authentication flow.