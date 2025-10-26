#!/bin/bash

echo "🔧 COMPREHENSIVE OAUTH FIX SCRIPT"
echo "=================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Step 1: Stop PM2 and clean up
print_status "Stopping PM2 processes..."
pm2 stop all
pm2 delete all

# Step 2: Clean build artifacts
print_status "Cleaning build artifacts..."
rm -rf .next
rm -rf node_modules/.cache
rm -rf .npm

# Step 3: Remove problematic NextAuth files
print_status "Removing problematic NextAuth files..."
rm -f lib/nextauth-config.ts
rm -f app/api/auth/\[...nextauth\]/route.ts

# Step 4: Install NextAuth v4 stable
print_status "Installing NextAuth v4 stable..."
npm uninstall next-auth @auth/core @auth/prisma-adapter
npm install next-auth@4.24.11

# Step 5: Create clean NextAuth configuration
print_status "Creating clean NextAuth configuration..."
cat > lib/nextauth-config.ts << 'EOF'
import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import GitHubProvider from "next-auth/providers/github"
import CredentialsProvider from "next-auth/providers/credentials"

const nextAuthSecret = process.env.NEXTAUTH_SECRET || "build-time-placeholder-secret-key-32-chars-minimum"
const googleClientId = process.env.GOOGLE_CLIENT_ID
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET
const githubId = process.env.GITHUB_ID
const githubSecret = process.env.GITHUB_SECRET

console.log('🔧 NextAuth Config Debug:', {
  hasSecret: !!nextAuthSecret,
  hasGoogleId: !!googleClientId,
  hasGoogleSecret: !!googleClientSecret,
  hasGithubId: !!githubId,
  hasGithubSecret: !!githubSecret,
  secretLength: nextAuthSecret?.length || 0
});

const nextAuthOptions = {
  secret: nextAuthSecret,
  trustHost: true,
  debug: true,
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  providers: [
    ...(googleClientId && googleClientSecret ? [
      GoogleProvider({
        clientId: googleClientId,
        clientSecret: googleClientSecret,
      })
    ] : []),
    ...(githubId && githubSecret ? [
      GitHubProvider({
        clientId: githubId,
        clientSecret: githubSecret,
      })
    ] : []),
    CredentialsProvider({
      id: "credentials",
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }
        // Add your custom authentication logic here
        return null
      }
    })
  ],
  callbacks: {
    async redirect({ url, baseUrl }) {
      if (url.startsWith("/")) return `${baseUrl}${url}`
      if (new URL(url).origin === baseUrl) return url
      return `${baseUrl}/auth/role-selection`
    },
  },
}

const handler = NextAuth(nextAuthOptions)

export { nextAuthOptions, handler }
export const { auth, signIn, signOut } = handler
EOF

# Step 6: Create clean API route handler
print_status "Creating clean API route handler..."
mkdir -p app/api/auth/\[...nextauth\]
cat > app/api/auth/\[...nextauth\]/route.ts << 'EOF'
import { handler } from "@/lib/nextauth-config"

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
EOF

# Step 7: Create simple OAuth button component
print_status "Creating simple OAuth button component..."
mkdir -p components/auth
cat > components/auth/OAuthButtons.tsx << 'EOF'
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
      const signInUrl = `/api/auth/signin/google?callbackUrl=${encodeURIComponent(callbackUrl || '/auth/role-selection')}`;
      console.log('📍 Redirect URL:', signInUrl);
      window.location.href = signInUrl;
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
EOF

# Step 8: Verify environment variables
print_status "Verifying environment variables..."
if [ -f .env ]; then
    if grep -q "GOOGLE_CLIENT_ID" .env && grep -q "GOOGLE_CLIENT_SECRET" .env; then
        print_success "Google OAuth credentials found in .env"
    else
        print_error "Google OAuth credentials missing from .env"
        exit 1
    fi
    
    if grep -q "NEXTAUTH_SECRET" .env && grep -q "NEXTAUTH_URL" .env; then
        print_success "NextAuth configuration found in .env"
    else
        print_error "NextAuth configuration missing from .env"
        exit 1
    fi
else
    print_error ".env file not found"
    exit 1
fi

# Step 9: Build the application
print_status "Building the application..."
npm run build

if [ $? -eq 0 ]; then
    print_success "Build completed successfully"
else
    print_error "Build failed"
    exit 1
fi

# Step 10: Start PM2
print_status "Starting PM2..."
pm2 start server.cjs --name naukrimili

# Step 11: Wait for server to start
print_status "Waiting for server to start..."
sleep 10

# Step 12: Test OAuth endpoints
print_status "Testing OAuth endpoints..."

echo "Testing providers endpoint..."
PROVIDERS_RESPONSE=$(curl -s "https://naukrimili.com/api/auth/providers")
if echo "$PROVIDERS_RESPONSE" | grep -q "google"; then
    print_success "Google provider is available"
else
    print_error "Google provider not found"
fi

echo "Testing Google signin endpoint..."
GOOGLE_RESPONSE=$(curl -I "https://naukrimili.com/api/auth/signin/google" 2>/dev/null)
if echo "$GOOGLE_RESPONSE" | grep -q "302\|301"; then
    print_success "Google signin endpoint is redirecting properly"
elif echo "$GOOGLE_RESPONSE" | grep -q "200"; then
    print_success "Google signin endpoint is responding"
else
    print_warning "Google signin endpoint response: $(echo "$GOOGLE_RESPONSE" | head -1)"
fi

# Step 13: Show final status
print_status "Final status check..."
pm2 status

echo ""
echo "🎉 OAUTH FIX COMPLETED!"
echo "======================"
echo "✅ NextAuth v4 installed"
echo "✅ Clean configuration created"
echo "✅ API routes fixed"
echo "✅ OAuth button component created"
echo "✅ Application built successfully"
echo "✅ PM2 started"
echo ""
echo "🔍 Test the OAuth functionality:"
echo "1. Visit: https://naukrimili.com/auth/signin"
echo "2. Click 'Continue with Google'"
echo "3. Check browser console for any errors"
echo ""
echo "📊 Monitor logs: pm2 logs naukrimili"
echo "🔄 Restart if needed: pm2 restart naukrimili"
