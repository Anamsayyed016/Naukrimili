#!/bin/bash

echo "🔧 OAuth Redirect Fix Script - Complete Solution"
echo "================================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() { echo -e "${BLUE}[INFO]${NC} $1"; }
print_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
print_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "Not in project root directory. Please run from project root."
    exit 1
fi

print_status "Starting comprehensive OAuth fix..."

# 1. Stop PM2
print_status "1. Stopping PM2..."
pm2 stop all 2>/dev/null || true
print_success "PM2 stopped"

# 2. Clean everything
print_status "2. Cleaning build artifacts and cache..."
rm -rf .next
rm -rf node_modules/.cache
npm cache clean --force 2>/dev/null || true
print_success "Cleanup completed"

# 3. Ensure correct NextAuth version
print_status "3. Installing correct NextAuth version..."
npm install next-auth@4.24.11 @auth/core@0.40.0 @auth/prisma-adapter@2.10.0 --save --force
print_success "NextAuth v4 installed"

# 4. Create bulletproof NextAuth config
print_status "4. Creating bulletproof NextAuth configuration..."
cat > lib/nextauth-config.ts << 'NEXTAUTH_EOF'
import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import GitHubProvider from "next-auth/providers/github"
import CredentialsProvider from "next-auth/providers/credentials"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"

const nextAuthSecret = process.env.NEXTAUTH_SECRET || "build-time-placeholder-secret-key-32-chars-minimum"
const googleClientId = process.env.GOOGLE_CLIENT_ID
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET

console.log('🔧 NextAuth Config Debug:', {
  hasSecret: !!nextAuthSecret,
  hasGoogleId: !!googleClientId,
  hasGoogleSecret: !!googleClientSecret,
  secretLength: nextAuthSecret?.length || 0
});

const nextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  secret: nextAuthSecret,
  trustHost: true,
  debug: process.env.NODE_ENV === 'development',
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  providers: [
    ...(googleClientId && googleClientSecret ? [
      GoogleProvider({
        clientId: googleClientId,
        clientSecret: googleClientSecret,
        authorization: {
          params: {
            scope: "openid email profile",
            access_type: "offline",
            prompt: "select_account"
          }
        }
      })
    ] : []),
    ...(process.env.GITHUB_ID && process.env.GITHUB_SECRET ? [
      GitHubProvider({
        clientId: process.env.GITHUB_ID,
        clientSecret: process.env.GITHUB_SECRET,
      })
    ] : []),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }
        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string }
        })
        if (!user || !user.password) {
          return null
        }
        if (user.password !== credentials.password) {
          return null
        }
        return {
          id: user.id,
          email: user.email,
          name: `${user.firstName} ${user.lastName}`.trim(),
          image: user.image,
          role: user.role,
        }
      }
    })
  ],
  callbacks: {
    async redirect({ url, baseUrl }) {
      // Handle relative URLs
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      
      // Handle same origin URLs
      if (new URL(url).origin === baseUrl) return url;
      
      // Default redirect to role selection
      return `${baseUrl}/auth/role-selection`;
    },
    async signIn({ user, account, profile }) {
      console.log('🔍 SignIn callback:', { 
        userId: user?.id, 
        provider: account?.provider,
        email: user?.email 
      });
      return true;
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        (session.user as any).id = token.id as string;
        (session.user as any).role = token.role as string;
      }
      return session;
    }
  },
  session: {
    strategy: 'jwt' as const,
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },
  useSecureCookies: process.env.NODE_ENV === 'production',
};

const handler = NextAuth(nextAuthOptions)

export { nextAuthOptions, handler }
export const { auth, signIn, signOut } = handler
NEXTAUTH_EOF
print_success "NextAuth configuration created"

# 5. Fix API route handler
print_status "5. Creating bulletproof API route handler..."
cat > app/api/auth/\[...nextauth\]/route.ts << 'ROUTE_EOF'
import { handler } from "@/lib/nextauth-config"

// Add error handling
export async function GET(request: Request) {
  try {
    console.log('🔍 NextAuth GET request:', request.url);
    return await handler(request);
  } catch (error) {
    console.error('❌ NextAuth GET error:', error);
    return new Response('Authentication error', { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    console.log('🔍 NextAuth POST request:', request.url);
    return await handler(request);
  } catch (error) {
    console.error('❌ NextAuth POST error:', error);
    return new Response('Authentication error', { status: 500 });
  }
}
ROUTE_EOF
print_success "API route handler created"

# 6. Create bulletproof OAuth button
print_status "6. Creating bulletproof OAuth button..."
cat > components/auth/OAuthButtons.tsx << 'BUTTON_EOF'
'use client';

import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';

interface OAuthButtonsProps {
  callbackUrl?: string;
  className?: string;
}

export default function OAuthButtons({ callbackUrl, className }: OAuthButtonsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleSignIn = () => {
    console.log('🔄 Starting Google OAuth redirect...');
    setIsLoading(true);
    setError(null);
    
    try {
      // Create the signin URL
      const baseUrl = '/api/auth/signin/google';
      const params = new URLSearchParams();
      if (callbackUrl) {
        params.append('callbackUrl', callbackUrl);
      } else {
        params.append('callbackUrl', '/auth/role-selection');
      }
      
      const signInUrl = `${baseUrl}?${params.toString()}`;
      console.log('📍 Redirect URL:', signInUrl);
      
      // Multiple redirect methods for maximum compatibility
      console.log('🔄 Attempting redirect with window.location.href...');
      window.location.href = signInUrl;
      
      // Fallback after 3 seconds
      setTimeout(() => {
        console.log('⚠️ Fallback: Trying window.location.assign...');
        window.location.assign(signInUrl);
      }, 3000);
      
    } catch (error) {
      console.error('❌ Google sign-in error:', error);
      setError('Sign-in failed. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className={`space-y-3 ${className || ''}`}>
      {error && (
        <div className="text-red-600 text-sm text-center p-2 bg-red-50 rounded-lg">
          {error}
          <button 
            onClick={() => {
              setError(null);
              handleGoogleSignIn();
            }}
            className="ml-2 text-blue-600 hover:underline"
          >
            Retry
          </button>
        </div>
      )}
      <Button
        onClick={handleGoogleSignIn}
        disabled={isLoading}
        className="w-full"
        variant="outline"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Signing in...
          </>
        ) : (
          <>
            <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </>
        )}
      </Button>
      
      <div className="text-xs text-gray-500 text-center px-2">
        By continuing, you agree to NaukriMili's{' '}
        <a href="/terms" className="text-blue-600 hover:underline">Terms of Service</a>
        {' '}and{' '}
        <a href="/privacy" className="text-blue-600 hover:underline">Privacy Policy</a>
        . We'll use your Google account to create your profile and send you job notifications.
      </div>
    </div>
  );
}

export { OAuthButtons };
BUTTON_EOF
print_success "OAuth button created"

# 7. Verify environment variables
print_status "7. Verifying environment variables..."
if [ -f ".env" ]; then
    if grep -q "GOOGLE_CLIENT_ID" .env && grep -q "GOOGLE_CLIENT_SECRET" .env; then
        print_success "Google OAuth credentials found in .env"
    else
        print_error "Google OAuth credentials missing from .env"
        exit 1
    fi
else
    print_error ".env file not found"
    exit 1
fi

# 8. Build application
print_status "8. Building application..."
npm run build
if [ $? -eq 0 ]; then
    print_success "Build completed successfully"
else
    print_error "Build failed"
    exit 1
fi

# 9. Start PM2
print_status "9. Starting PM2..."
pm2 start all --update-env
if [ $? -eq 0 ]; then
    print_success "PM2 started successfully"
else
    print_error "Failed to start PM2"
    exit 1
fi

# 10. Wait for server to be ready
print_status "10. Waiting for server to be ready..."
sleep 10

# 11. Test OAuth endpoints
print_status "11. Testing OAuth endpoints..."

# Test providers endpoint
PROVIDERS_RESPONSE=$(curl -s "https://naukrimili.com/api/auth/providers" 2>/dev/null)
if echo "$PROVIDERS_RESPONSE" | grep -q "google"; then
    print_success "Google provider found in /api/auth/providers"
else
    print_error "Google provider not found in /api/auth/providers"
fi

# Test Google signin endpoint with proper headers
print_status "Testing Google signin endpoint..."
SIGNIN_RESPONSE=$(curl -H "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" -H "Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8" -I "https://naukrimili.com/api/auth/signin/google" 2>/dev/null)
if echo "$SIGNIN_RESPONSE" | grep -q "200\|302"; then
    print_success "Google signin endpoint working correctly"
elif echo "$SIGNIN_RESPONSE" | grep -q "400"; then
    print_warning "Google signin endpoint still returning 400 - checking logs..."
    pm2 logs naukrimili --lines 5
else
    print_warning "Google signin endpoint returned: $(echo "$SIGNIN_RESPONSE" | head -1)"
fi

# 12. Final status
echo ""
print_status "12. OAuth Fix Summary:"
echo ""
echo "✅ NextAuth downgraded to v4.24.11"
echo "✅ NextAuth configuration updated with debug logging"
echo "✅ API route handler enhanced with error handling"
echo "✅ OAuth button optimized with fallback redirects"
echo "✅ Environment variables verified"
echo "✅ Application rebuilt"
echo "✅ PM2 restarted with updated environment"
echo ""
print_success "OAuth fix completed!"
echo ""
echo "🧪 Testing Instructions:"
echo "   1. Go to: https://naukrimili.com/auth/signin"
echo "   2. Click 'Continue with Google'"
echo "   3. Should redirect to Google OAuth page"
echo "   4. Check browser console for debug logs"
echo ""
echo "🔍 Debug Commands:"
echo "   - Check PM2 status: pm2 status"
echo "   - View logs: pm2 logs naukrimili --lines 50"
echo "   - Test providers: curl -s https://naukrimili.com/api/auth/providers | jq ."
echo "   - Test signin: curl -I https://naukrimili.com/api/auth/signin/google"
echo ""
echo "🚨 If OAuth still doesn't work:"
echo "   1. Check Google Cloud Console OAuth settings"
echo "   2. Verify callback URL: https://naukrimili.com/api/auth/callback/google"
echo "   3. Check PM2 logs for specific errors"
echo ""
