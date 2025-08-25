# 🔐 Dynamic Google & LinkedIn OAuth2 Authentication Setup Guide

## 📋 **Overview**
This implementation provides secure, dynamic OAuth2 authentication for Google and LinkedIn with environment-based configuration, session management, and comprehensive security features.

## 🎯 **Features Implemented**

### ✅ **Core OAuth2 Features**
- ✅ Google OAuth2 authentication
- ✅ LinkedIn OAuth2 authentication  
- ✅ Dynamic environment-based configuration
- ✅ User profile data extraction (name, email, profile picture)
- ✅ Database integration with session management
- ✅ Account linking (multiple OAuth providers per user)
- ✅ Graceful error handling
- ✅ Secure logout and session invalidation
- ✅ CSRF protection and secure cookies

### ✅ **Security Best Practices**
- ✅ Environment-based client credentials
- ✅ Secure session management with NextAuth.js
- ✅ HTTPS enforcement in production
- ✅ Secure cookie configuration
- ✅ JWT token validation
- ✅ SQL injection protection via Prisma ORM
- ✅ Rate limiting ready integration points

## 🛠️ **Setup Instructions**

### **1. Environment Configuration**

Copy `.env.example` to `.env.local` and configure:

```env
# Environment Detection
NODE_ENV=development
ENVIRONMENT=development

# NextAuth.js Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-super-secret-key-here-min-32-chars

# Google OAuth2 (Development)
GOOGLE_CLIENT_ID_DEV=your-google-dev-client-id
GOOGLE_CLIENT_SECRET_DEV=your-google-dev-client-secret

# LinkedIn OAuth2 (Development)  
LINKEDIN_CLIENT_ID_DEV=your-linkedin-dev-client-id
LINKEDIN_CLIENT_SECRET_DEV=your-linkedin-dev-client-secret

# OAuth Redirect URIs
OAUTH_REDIRECT_URI_DEV=http://localhost:3000

# Database
DATABASE_URL="postgresql://username:password@localhost:5432/jobportal?schema=public"
```

### **2. Google OAuth2 Setup**

1. **Go to Google Cloud Console**: https://console.cloud.google.com/
2. **Create a new project** or select existing one
3. **Enable Google+ API**:
   - Go to "APIs & Services" > "Library"
   - Search for "Google+ API" and enable it
4. **Create OAuth2 credentials**:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth 2.0 Client IDs"
   - Application type: "Web application"
   - Name: "Job Portal - Development"
   - Authorized redirect URIs:
     ```
     http://localhost:3000/api/auth/callback/google
     https://staging.jobportal.com/api/auth/callback/google
     https://jobportal.com/api/auth/callback/google
     ```
5. **Copy Client ID and Secret** to environment variables

### **3. LinkedIn OAuth2 Setup**

1. **Go to LinkedIn Developer Portal**: https://www.linkedin.com/developers/
2. **Create a new app**:
   - App name: "Job Portal"
   - LinkedIn Page: Your company page
   - Privacy policy URL: Your privacy policy
   - App logo: Upload your logo
3. **Configure OAuth2**:
   - Go to "Auth" tab
   - Add redirect URLs:
     ```
     http://localhost:3000/api/auth/callback/linkedin
     https://staging.jobportal.com/api/auth/callback/linkedin
     https://jobportal.com/api/auth/callback/linkedin
     ```
4. **Request scope permissions**:
   - `r_liteprofile` (Basic profile info)
   - `r_emailaddress` (Email address)
5. **Copy Client ID and Secret** to environment variables

### **4. Database Setup**

The OAuth tables are already included in the Prisma schema:

```sql
-- NextAuth.js OAuth tables
Account
Session  
VerificationToken
User (enhanced with OAuth support)
```

Run database migration:
```bash
npx prisma db push
npx prisma generate
```

## 🎯 **Usage Examples**

### **Frontend Authentication**

```tsx
import { useAuth } from '@/hooks/useAuth';
import OAuthButtons from '@/components/auth/OAuthButtons';

function LoginForm() {
  const { signIn, isLoading, isAuthenticated, user } = useAuth();

  if (isAuthenticated) {
    return <div>Welcome, {user?.name}!</div>;
  }

  return (
    <div>
      {/* OAuth Buttons */}
      <OAuthButtons callbackUrl="/dashboard" />
      
      {/* Traditional Email/Password */}
      <form onSubmit={handleSubmit}>
        <input name="email" type="email" />
        <input name="password" type="password" />
        <button type="submit">Sign In</button>
      </form>
    </div>
  );
}
```

### **Protected Routes**

```tsx
import { useAuth } from '@/hooks/useAuth';

function ProtectedPage() {
  const { requireAuth, isLoading } = useAuth();

  if (isLoading) return <div>Loading...</div>;
  
  if (!requireAuth('/dashboard')) {
    return null; // Will redirect to login
  }

  return <div>Protected content</div>;
}
```

### **Role-Based Access**

```tsx
import { useAuth } from '@/hooks/useAuth';

function AdminPanel() {
  const { requireRole, isLoading } = useAuth();

  if (isLoading) return <div>Loading...</div>;
  
  if (!requireRole('admin', '/unauthorized')) {
    return null; // Will redirect
  }

  return <div>Admin content</div>;
}
```

### **Account Linking**

```tsx
import { useState } from 'react';

function AccountSettings() {
  const { user, isOAuthUser, getAuthProvider } = useAuth();
  const [linkedAccounts, setLinkedAccounts] = useState([]);

  useEffect(() => {
    // Fetch linked accounts
    fetch('/api/auth/accounts')
      .then(res => res.json())
      .then(data => setLinkedAccounts(data.accounts));
  }, []);

  return (
    <div>
      <h3>Linked Accounts</h3>
      {linkedAccounts.map(account => (
        <div key={account.id}>
          {account.provider} - {account.providerAccountId}
          <button onClick={() => unlinkAccount(account.id)}>
            Unlink
          </button>
        </div>
      ))}
      
      <OAuthButtons callbackUrl="/settings" />
    </div>
  );
}
```

## 🛡️ **Security Features**

### **Environment-Based Configuration**
```typescript
// Dynamic config based on NODE_ENV
const config = oauthConfig.getOAuthConfig();
// Automatically selects DEV/STAGING/PROD credentials
```

### **Secure Session Management**
```typescript
// JWT tokens with secure settings
session: {
  strategy: 'jwt',
  maxAge: 7 * 24 * 60 * 60, // 7 days
}

// Secure cookies in production
cookies: {
  sessionToken: {
    options: {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    },
  },
}
```

### **CSRF Protection**
```typescript
// Built-in CSRF protection
csrfToken: {
  name: 'next-auth.csrf-token',
  options: {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  },
}
```

## 🔍 **API Endpoints**

### **Authentication Endpoints**
- `GET/POST /api/auth/[...nextauth]` - NextAuth.js handler
- `POST /api/auth/register` - User registration
- `GET /api/auth/accounts` - Get linked accounts
- `POST /api/auth/accounts` - Link new account
- `DELETE /api/auth/accounts/[id]` - Unlink account

### **OAuth Flows**
- `GET /api/auth/signin/google` - Initiate Google OAuth
- `GET /api/auth/signin/linkedin` - Initiate LinkedIn OAuth
- `GET /api/auth/callback/google` - Google OAuth callback
- `GET /api/auth/callback/linkedin` - LinkedIn OAuth callback

### **Validation**
- `GET /api/auth/config/validate` - Validate OAuth configuration

## 📊 **OAuth Scopes**

### **Google Scopes**
```typescript
[
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
  'openid'
]
```

### **LinkedIn Scopes**
```typescript
[
  'r_liteprofile',    // Basic profile information
  'r_emailaddress'    // Email address
]
```

## 🚀 **Production Deployment**

### **Environment Variables for Production**
```env
NODE_ENV=production
ENVIRONMENT=production

NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=generate-a-strong-32-character-secret

GOOGLE_CLIENT_ID_PROD=your-production-google-client-id
GOOGLE_CLIENT_SECRET_PROD=your-production-google-client-secret

LINKEDIN_CLIENT_ID_PROD=your-production-linkedin-client-id
LINKEDIN_CLIENT_SECRET_PROD=your-production-linkedin-client-secret

OAUTH_REDIRECT_URI_PROD=https://your-domain.com
```

### **Security Checklist**
- ✅ HTTPS enabled
- ✅ Strong NEXTAUTH_SECRET (32+ characters)
- ✅ Secure cookie settings enabled
- ✅ OAuth redirect URIs match production domain
- ✅ Database connection secured
- ✅ Environment variables protected
- ✅ CORS configured properly

## 🔧 **Configuration Validation**

Test your OAuth configuration:

```bash
curl http://localhost:3000/api/auth/config/validate
```

Response:
```json
{
  "success": true,
  "validation": { "valid": true, "errors": [] },
  "environment": { "environment": "development", "nodeEnv": "development" },
  "providers": {
    "google": { "clientId": "✓ Configured", "clientSecret": "✓ Configured" },
    "linkedin": { "clientId": "✓ Configured", "clientSecret": "✓ Configured" }
  },
  "security": {
    "nextAuthSecret": "✓ Configured",
    "secureCookies": false
  }
}
```

## 🎉 **Implementation Summary**

✅ **Dynamic OAuth2 Authentication System Complete!**

**Key Features Delivered:**
1. 🌐 **Multi-Provider OAuth** (Google + LinkedIn)
2. 🔄 **Environment-Based Configuration** (Dev/Staging/Prod)
3. 🛡️ **Enterprise Security** (CSRF, Secure Cookies, JWT)
4. 🔗 **Account Linking** (Multiple providers per user)
5. ⚡ **Real-Time Session Management**
6. 🎯 **Role-Based Access Control**
7. 📱 **Mobile-Friendly OAuth Flows**
8. 🔍 **Comprehensive Error Handling**

Your OAuth2 authentication system is now ready for production deployment with enterprise-grade security and scalability!

## 🆘 **Troubleshooting**

### Common Issues:
1. **OAuth Error: Invalid Client** - Check client IDs match environment
2. **Redirect URI Mismatch** - Verify redirect URIs in provider consoles
3. **Session Not Persisting** - Check NEXTAUTH_SECRET is set
4. **Database Connection Failed** - Verify DATABASE_URL is correct
5. **CORS Issues** - Check domain configuration in OAuth providers

### Debug Mode:
Set `debug: true` in NextAuth config for detailed logs in development.
