# Fix Google OAuth "Authorization Error"

## 🚨 Current Issue
You're getting "Error 401: invalid_client" because the Google OAuth client is not properly configured.

## 🔧 Step-by-Step Fix

### 1. Create Environment File
Create a `.env.local` file in your project root with these variables:

```env
# Google OAuth Configuration
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret_here

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/jobportal

# Gemini AI Configuration
GEMINI_API_KEY=your_gemini_api_key_here

# JWT Configuration
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRE=7d
```

### 2. Google Cloud Console Setup

1. **Go to [Google Cloud Console](https://console.cloud.google.com/)**
2. **Create or select a project**
3. **Enable APIs:**
   - Go to "APIs & Services" > "Library"
   - Enable "Gmail API"
   - Enable "Google+ API" (if available)
4. **Create OAuth 2.0 Credentials:**
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth 2.0 Client IDs"
   - Choose "Web application"
   - Add these Authorized redirect URIs:
     ```
     http://localhost:3000/api/auth/callback/google
     http://localhost:3002/api/auth/callback/google
     ```
   - Add these Authorized JavaScript origins:
     ```
     http://localhost:3000
     http://localhost:3002
     ```
5. **Copy your credentials:**
   - Copy the Client ID
   - Copy the Client Secret
   - Update your `.env.local` file with these values

### 3. Generate NextAuth Secret
Run this command to generate a secure secret:
```bash
openssl rand -base64 32
```
Or use an online generator and add it to `NEXTAUTH_SECRET` in your `.env.local` file.

### 4. Restart Your Development Server
```bash
npm run dev
# or
pnpm dev
```

### 5. Test the Fix
1. Go to `http://localhost:3000/auth/login`
2. Click "Continue with Google"
3. You should now see the Google sign-in page instead of the error

## 🔍 Troubleshooting

### If you still get errors:

1. **Check Environment Variables:**
   ```bash
   # Make sure your .env.local file is in the project root
   # Make sure there are no spaces around the = sign
   ```

2. **Verify Google Cloud Console:**
   - Ensure the OAuth consent screen is configured
   - Make sure the Gmail API is enabled
   - Check that redirect URIs match exactly

3. **Check NextAuth Debug:**
   - The debug mode is now enabled in development
   - Check your browser console and server logs for detailed error messages

4. **Common Issues:**
   - **"Invalid redirect URI"**: Make sure the redirect URI in Google Cloud Console exactly matches your `NEXTAUTH_URL`
   - **"Client secret missing"**: Ensure `GOOGLE_CLIENT_SECRET` is set in `.env.local`
   - **"OAuth client not found"**: Verify the Client ID is correct and the OAuth client is properly configured

## 🎯 Quick Test

After setting up, test with this simple flow:
1. Visit `/auth/login`
2. Click "Continue with Google"
3. Complete Google sign-in
4. You should be redirected to `/dashboard`

## 📞 Need Help?

If you're still having issues:
1. Check the browser console for errors
2. Check the server logs for NextAuth debug information
3. Verify all environment variables are set correctly
4. Make sure you're using the correct port (3000 or 3002) 