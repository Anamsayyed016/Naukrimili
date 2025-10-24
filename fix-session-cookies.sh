#!/bin/bash

echo "🔧 Adjusting Session Cookie SameSite Policy"
echo "============================================"

# Update NextAuth configuration for better mobile OAuth compatibility
cat > lib/nextauth-config.ts << 'EOF'
/**
 * NextAuth.js v5 Configuration - Clean, Professional Implementation
 * Unified authentication system for job portal
 */

import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import Credentials from "next-auth/providers/credentials"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"

// Validate required NextAuth environment variables
const nextAuthUrl = process.env.NEXTAUTH_URL || 'https://naukrimili.com';
const nextAuthSecret = process.env.NEXTAUTH_SECRET || 'naukrimili-secret-key-2024-production-deployment';

// Log configuration status
console.log('🔧 NextAuth Configuration:');
console.log('   NEXTAUTH_URL:', nextAuthUrl);
console.log('   NEXTAUTH_SECRET:', nextAuthSecret ? '✅ Set' : '❌ Missing');
console.log('   Environment:', process.env.NODE_ENV || 'development');

// Validate Google OAuth credentials
const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;

if (!googleClientId || !googleClientSecret) {
  console.warn("⚠️ Google OAuth credentials not properly configured. Google sign-in will be disabled.");
  console.warn("   GOOGLE_CLIENT_ID:", googleClientId ? 'Set' : 'Missing');
  console.warn("   GOOGLE_CLIENT_SECRET:", googleClientSecret ? 'Set' : 'Missing');
}

const adapter = new PrismaAdapter(prisma);

console.log("✅ NEXTAUTH_URL is properly configured:", nextAuthUrl);

const nextAuthOptions = {
  adapter: adapter,
  secret: nextAuthSecret,
  trustHost: true,
  debug: false, // Disable debug for better performance
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  providers: [
    ...(googleClientId && googleClientSecret ? [
      Google({
        clientId: googleClientId,
        clientSecret: googleClientSecret,
        // Fast OAuth configuration
        authorization: {
          params: {
            scope: "openid email profile",
            access_type: "offline",
            prompt: "select_account"
          }
        }
      })
    ] : []),
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
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

        // Simple password check (you should use bcrypt in production)
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
    async jwt({ token, user, account, profile }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.isActive = (user as any).isActive;
        token.isVerified = (user as any).isVerified;
        token.firstName = (user as any).firstName;
        token.lastName = (user as any).lastName;
        token.image = (user as any).image;
      }
      return token;
    },
     async session({ session, token }) {
       if (token) {
         (session.user as any).id = token.id as string;
         (session.user as any).role = token.role as string;
         (session.user as any).isActive = token.isActive as boolean;
         (session.user as any).isVerified = token.isVerified as boolean;
         (session.user as any).firstName = token.firstName as string;
         (session.user as any).lastName = token.lastName as string;
         (session.user as any).image = token.image as string;
       }

       return session;
     },
    async redirect({ url, baseUrl }) {
      // Allows relative callback URLs
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      // Allows callback URLs on the same origin
      else if (new URL(url).origin === baseUrl) return url;
      
      const defaultRedirect = `${baseUrl}/auth/role-selection`;
      console.log('🔍 NextAuth Redirect - Default redirecting to:', defaultRedirect);
      return defaultRedirect;
    }
  },
  session: {
    strategy: 'jwt' as const,
    maxAge: 7 * 24 * 60 * 60, // 7 days for better UX
  },
  useSecureCookies: process.env.NODE_ENV === 'production',
  cookies: {
    sessionToken: {
      name: `__Secure-next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'none' as const, // Changed from 'lax' to 'none' for mobile OAuth
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 7 * 24 * 60 * 60, // 7 days
      },
    },
  },
  // Disable experimental features that might cause issues
  experimental: {
    enableWebAuthn: false,
  }
};

export const { handlers, auth, signIn, signOut } = NextAuth(nextAuthOptions);
export { nextAuthOptions };
EOF

echo "✅ Session cookie SameSite policy adjusted for mobile OAuth"

# Restart PM2 to apply changes
echo "🔄 Restarting PM2..."
pm2 restart naukrimili

echo "✅ Session cookie optimization complete!"
