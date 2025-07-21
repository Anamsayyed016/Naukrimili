# Gmail OAuth Authentication Setup

## Overview

This guide will help you set up Gmail OAuth authentication for your job portal application, similar to how we handled the Gemini API integration.

## 🔧 Setup Instructions

### 1. Google Cloud Console Setup

1. **Go to Google Cloud Console**
   - Visit [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select an existing one

2. **Enable Gmail API**
   - Go to "APIs & Services" > "Library"
   - Search for "Gmail API"
   - Click on it and press "Enable"

3. **Create OAuth 2.0 Credentials**
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth 2.0 Client IDs"
   - Choose "Web application" as the application type
   - Add authorized redirect URIs:
     - `http://localhost:3002/api/auth/callback/google` (for development)
     - `https://yourdomain.com/api/auth/callback/google` (for production)

4. **Get Your Credentials**
   - Copy the Client ID (you already have: `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`)
   - Copy the Client Secret

### 2. Environment Configuration

Create a `.env.local` file in your project root with the following variables:

```env
# Gmail OAuth Configuration
GOOGLE_CLIENT_ID=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
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:3002/api/auth/callback/google

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3002
NEXTAUTH_SECRET=your_nextauth_secret_here

# Other existing configurations
GEMINI_API_KEY=your_gemini_api_key_here
MONGODB_URI=mongodb://localhost:27017
DATABASE_NAME=naurkrimili
```

### 3. Install Dependencies

The required packages have already been installed:
- `next-auth` - Authentication framework
- `googleapis` - Google APIs client library

### 4. Test the Integration

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Visit the Gmail integration page:**
   - Go to `http://localhost:3002/gmail`
   - You should see the Gmail integration interface

3. **Test Google Sign-in:**
   - Go to `http://localhost:3002/auth/login`
   - Click "Continue with Google"
   - Complete the OAuth flow

## 🚀 Features Implemented

### 1. **NextAuth Configuration**
- Google OAuth provider setup
- JWT session management
- Custom callback handling

### 2. **Gmail Service**
- Email reading and searching
- Email composition and sending
- Profile information retrieval
- Attachment handling

### 3. **API Endpoints**
- `/api/auth/[...nextauth]` - NextAuth configuration
- `/api/gmail/profile` - Get Gmail profile
- `/api/gmail/emails` - Get and search emails
- `/api/gmail/send` - Send emails

### 4. **Frontend Components**
- `GmailIntegration` - Main Gmail interface
- Updated login page with Google OAuth
- Session management with NextAuth

## 🔐 Security Features

### 1. **OAuth 2.0 Flow**
- Secure token-based authentication
- Automatic token refresh
- Scope-limited access (Gmail read/write only)

### 2. **Session Management**
- JWT-based sessions
- Secure token storage
- Automatic session expiration

### 3. **API Security**
- Authentication checks on all Gmail endpoints
- Input validation
- Error handling

## 📧 Gmail API Scopes

The integration requests the following Gmail scopes:
- `openid` - OpenID Connect authentication
- `email` - Access to email address
- `profile` - Access to basic profile information
- `https://www.googleapis.com/auth/gmail.readonly` - Read Gmail messages
- `https://www.googleapis.com/auth/gmail.send` - Send Gmail messages

## 🛠️ Usage Examples

### 1. **Reading Emails**
```typescript
// The GmailIntegration component automatically fetches emails
// Users can search emails using the search interface
```

### 2. **Sending Emails**
```typescript
// Users can compose and send emails through the interface
// The system handles authentication automatically
```

### 3. **Searching Emails**
```typescript
// Users can search emails using Gmail search syntax
// Examples: "from:example@gmail.com", "subject:job", "is:unread"
```

## 🔧 Troubleshooting

### Common Issues:

1. **"Invalid redirect URI"**
   - Ensure the redirect URI in Google Cloud Console matches your environment
   - Check that `NEXTAUTH_URL` is set correctly

2. **"Access token not found"**
   - Make sure the user is signed in with Google
   - Check that the Gmail API is enabled in Google Cloud Console

3. **"Gmail API not enabled"**
   - Enable the Gmail API in Google Cloud Console
   - Wait a few minutes for the changes to propagate

4. **"Client secret missing"**
   - Add your Google Client Secret to the `.env.local` file
   - Restart the development server

## 🎯 Next Steps

1. **Add to Navigation**
   - Add a link to `/gmail` in your navigation menu
   - Consider adding a Gmail icon

2. **Enhance Features**
   - Add email templates for job applications
   - Implement email notifications for job updates
   - Add email scheduling functionality

3. **Production Deployment**
   - Update redirect URIs for production domain
   - Set up proper environment variables
   - Configure HTTPS for production

## 📚 Additional Resources

- [NextAuth.js Documentation](https://next-auth.js.org/)
- [Gmail API Documentation](https://developers.google.com/gmail/api)
- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2) 