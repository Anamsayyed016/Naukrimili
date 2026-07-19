#!/bin/bash

echo "🔧 Complete OAuth Fix Script"
echo "============================"

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

# 1. Stop PM2
print_status "1. Stopping PM2..."
pm2 stop all 2>/dev/null || true
print_success "PM2 stopped"

# 2. Clean build artifacts
print_status "2. Cleaning build artifacts..."
rm -rf .next
print_success "Build artifacts cleaned"

# 3. Ensure NextAuth v4
print_status "3. Ensuring NextAuth v4..."
npm install next-auth@4.24.11 @auth/core@0.40.0 @auth/prisma-adapter@2.10.0 --save
print_success "NextAuth v4 installed"

# 4. Fix NextAuth config for v4
print_status "4. Creating NextAuth v4 config..."
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

const nextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  secret: nextAuthSecret,
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
};

const handler = NextAuth(nextAuthOptions)

export { nextAuthOptions, handler }
export const { auth, signIn, signOut } = handler
NEXTAUTH_EOF
print_success "NextAuth v4 config created"

# 5. Fix API route handler
print_status "5. Fixing API route handler..."
cat > app/api/auth/\[...nextauth\]/route.ts << 'ROUTE_EOF'
import { handler } from "@/lib/nextauth-config"

export { handler as GET, handler as POST }
ROUTE_EOF
print_success "API route handler fixed"

# 6. Fix OAuth button
print_status "6. Creating simple OAuth button..."
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
BUTTON_EOF
print_success "OAuth button created"

# 7. Build application
print_status "7. Building application..."
npm run build
if [ $? -eq 0 ]; then
    print_success "Build completed successfully"
else
    print_error "Build failed"
    exit 1
fi

# 8. Start PM2
print_status "8. Starting PM2..."
pm2 start all --update-env
if [ $? -eq 0 ]; then
    print_success "PM2 started successfully"
else
    print_error "Failed to start PM2"
    exit 1
fi

# 9. Test OAuth
print_status "9. Testing OAuth endpoints..."
sleep 5
PROVIDERS_RESPONSE=$(curl -s "https://naukrimili.com/api/auth/providers" 2>/dev/null)
if echo "$PROVIDERS_RESPONSE" | grep -q "google"; then
    print_success "Google provider found"
else
    print_error "Google provider not found"
fi

echo ""
print_success "OAuth fix completed!"
echo ""
echo "🧪 Test Instructions:"
echo "   1. Go to: https://naukrimili.com/auth/signin"
echo "   2. Click 'Continue with Google'"
echo "   3. Should redirect to Google OAuth"
echo ""
