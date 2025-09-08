/**
 * NextAuth.js v5 Configuration - Clean, Professional Implementation
 * Unified authentication system for job portal
 */

import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import Credentials from "next-auth/providers/credentials"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

// Validate Google OAuth credentials
const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;

if (!googleClientId || !googleClientSecret || 
    googleClientId.includes('your-') || googleClientSecret.includes('your-')) {
  console.warn('⚠️ Google OAuth credentials not properly configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env.local');
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      authorization: {
        params: {
          scope: 'openid email profile',
          prompt: 'select_account',
          access_type: 'offline',
          response_type: 'code'
        }
      }
    }),
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          const user = await prisma.user.findUnique({
            where: { email: credentials.email as string }
          });
          
          if (!user || !user.password || !user.isActive) {
            return null;
          }

          const isValidPassword = await bcrypt.compare(credentials.password as string, user.password);
          if (!isValidPassword) {
            return null;
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role || 'jobseeker'
          };
        } catch (error) {
          console.error('Credentials auth error:', error);
          return null;
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user, account, profile }) {
      // Handle initial user data from sign-in
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.email = user.email;
        token.name = user.name;
      }
      
      // Handle OAuth provider data
      if (account?.provider === 'google' && profile) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { email: profile.email || '' }
          });
          
          if (dbUser) {
            // Link OAuth account to existing user
            await prisma.account.upsert({
              where: {
                provider_providerAccountId: {
                  provider: 'google',
                  providerAccountId: account.providerAccountId || ''
                }
              },
              update: {
                userId: dbUser.id,
                type: account.type,
                access_token: account.access_token as string,
                expires_at: account.expires_at as number,
                token_type: account.token_type as string,
                scope: account.scope as string,
                id_token: account.id_token as string,
                session_state: account.session_state as string | null
              },
              create: {
                userId: dbUser.id,
                type: account.type,
                provider: account.provider,
                providerAccountId: account.providerAccountId || '',
                access_token: account.access_token as string,
                expires_at: account.expires_at as number,
                token_type: account.token_type as string,
                scope: account.scope as string,
                id_token: account.id_token as string,
                session_state: account.session_state as string | null
              }
            });
            
            token.id = dbUser.id;
            token.role = dbUser.role;
            token.email = dbUser.email;
            token.name = dbUser.name;
            console.log('✅ JWT callback - Linked OAuth account to existing user:', dbUser);
          } else {
            // For new OAuth users, create user first then set token data
            const newUser = await prisma.user.create({
              data: {
                email: profile.email || '',
                name: profile.name || '',
                role: null, // User will select role later
                isActive: true,
                isVerified: true,
                emailVerified: new Date(),
                skills: '',
                jobTypePreference: 'full-time'
              }
            });
            
            // Create OAuth account for new user
            await prisma.account.create({
              data: {
                userId: newUser.id,
                type: account.type,
                provider: account.provider,
                providerAccountId: account.providerAccountId || '',
                access_token: account.access_token as string,
                expires_at: account.expires_at as number,
                token_type: account.token_type as string,
                scope: account.scope as string,
                id_token: account.id_token as string,
                session_state: account.session_state as string | null
              }
            });
            
            token.id = newUser.id;
            token.email = newUser.email;
            token.name = newUser.name;
            token.picture = (profile as any).picture || token.picture;
            token.role = null; // Will be set when user selects role
            console.log('✅ JWT callback - Created new OAuth user with account:', newUser);
          }
        } catch (error) {
          console.error('Error in JWT callback:', error);
        }
      }
      
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id || token.sub;
        (session.user as any).role = token.role;
        (session.user as any).email = token.email;
        (session.user as any).name = token.name;
        (session.user as any).picture = token.picture;
      }
      console.log('🔍 Session callback - User ID:', token.id);
      console.log('🔍 Session callback - User email:', token.email);
      console.log('🔍 Session callback - User role:', token.role);
      return session;
    },
    async signIn({ user, account, profile }) {
      // Handle OAuth sign-ins
      if (account?.provider === 'google' && profile) {
        try {
          // Validate that we have required profile data
          if (!profile.email) {
            console.error('Google OAuth profile missing email');
            return false;
          }

          console.log('✅ Google OAuth signIn callback - Profile:', profile.email);
          return true;
        } catch (error) {
          console.error('Error in Google OAuth signIn callback:', error);
          return false;
        }
      }
      
      // Handle credentials sign-ins
      if (account?.provider === 'credentials') {
        return true; // Already validated in credentials provider
      }
      
      return true;
    },
    async redirect({ url, baseUrl }) {
      // Always redirect to homepage after OAuth
      if (url.includes('/api/auth/callback/')) {
        return `${baseUrl}/`;
      }
      
      if (url.startsWith('/')) {
        return `${baseUrl}${url}`;
      }
      
      if (url.startsWith(baseUrl)) {
        return url;
      }
      
      return `${baseUrl}/`;
    }
  },
  pages: {
    signIn: '/',
    error: '/auth/error'
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  useSecureCookies: process.env.NODE_ENV === 'production',
  secret: process.env.NEXTAUTH_SECRET || 'fallback-secret-key-change-in-production',
  trustHost: true,
  debug: process.env.NODE_ENV === 'development',
});