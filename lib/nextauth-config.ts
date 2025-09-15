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
            role: user.role || 'jobseeker',
            isActive: user.isActive || true
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
        token.isActive = true;
        console.log('🔍 JWT callback - Initial user data:', user);
      }

      // Only fetch user data if this is a fresh login (not a token refresh)
      if (user && token.id) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.id as string }
          });
          
          if (dbUser && dbUser.isActive) {
            token.role = dbUser.role;
            token.email = dbUser.email;
            token.name = dbUser.name;
            token.isActive = dbUser.isActive;
            console.log('🔍 JWT callback - Updated token with latest DB data:', { id: token.id, role: token.role });
          } else {
            // User not found or inactive, invalidate token
            return {};
          }
        } catch (error) {
          console.error('Error fetching user data in JWT callback:', error);
          return {};
        }
      }
      
      // Handle OAuth provider data
      if (account?.provider === 'google' && profile) {
        try {
          console.log('🔍 JWT callback - Processing Google OAuth:', { email: profile.email, name: profile.name });
          
          const dbUser = await prisma.user.findUnique({
            where: { email: profile.email || '' }
          });
          
          if (dbUser) {
            // Update existing user with OAuth data and link the account
            await prisma.user.update({
              where: { id: dbUser.id },
              data: {
                name: profile.name || dbUser.name,
                isVerified: true,
                emailVerified: new Date()
              }
            });

            // Ensure the OAuth account is linked to the user
            const existingAccount = await prisma.account.findFirst({
              where: {
                userId: dbUser.id,
                provider: 'google',
                providerAccountId: account.providerAccountId
              }
            });

            if (!existingAccount) {
              await prisma.account.create({
                data: {
                  userId: dbUser.id,
                  type: account.type,
                  provider: account.provider,
                  providerAccountId: account.providerAccountId,
                  refresh_token: account.refresh_token as string,
                  access_token: account.access_token as string,
                  expires_at: account.expires_at as number,
                  token_type: account.token_type as string,
                  scope: account.scope as string,
                  id_token: account.id_token as string,
                  session_state: account.session_state as string
                }
              });
              console.log('✅ JWT callback - Linked OAuth account to existing user');
            }
            
            token.id = dbUser.id;
            token.role = dbUser.role;
            token.email = dbUser.email;
            token.name = profile.name || dbUser.name;
            token.picture = (profile as any).picture || token.picture;
            token.isActive = dbUser.isActive || true; // Ensure isActive is set
            
            console.log('✅ JWT callback - Updated existing user with OAuth data:', { id: token.id, email: token.email, name: token.name, role: token.role });
          } else {
            // Create new user for OAuth
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

            // Create the OAuth account link
            await prisma.account.create({
              data: {
                userId: newUser.id,
                type: account.type,
                provider: account.provider,
                providerAccountId: account.providerAccountId,
                refresh_token: account.refresh_token as string,
                access_token: account.access_token as string,
                expires_at: account.expires_at as number,
                token_type: account.token_type as string,
                scope: account.scope as string,
                id_token: account.id_token as string,
                session_state: account.session_state as string
              }
            });
            
            token.id = newUser.id;
            token.email = newUser.email;
            token.name = newUser.name;
            token.picture = (profile as any).picture || token.picture;
            token.role = null; // Will be set when user selects role
            token.isActive = newUser.isActive || true; // Ensure isActive is set
            
            console.log('✅ JWT callback - Created new OAuth user with account link:', { id: token.id, email: token.email, name: token.name, role: token.role });
          }
        } catch (error) {
          console.error('Error in JWT callback:', error);
        }
      }
      
      return token;
    },
    async session({ session, token }) {
      // Only create session if token has valid user data
      if (!token.id || !token.email || !token.isActive) {
        console.log('🔍 Session callback - Invalid token, returning null session');
        return null;
      }

      // Ensure session.user exists and type it properly
      if (!session.user) {
        session.user = {} as any;
      }
      
      // Populate session.user with token data
      (session.user as any).id = token.id;
      (session.user as any).email = token.email;
      (session.user as any).name = token.name || '';
      (session.user as any).role = token.role || null;
      (session.user as any).picture = token.picture || '';
      (session.user as any).isActive = token.isActive;
      
      console.log('🔍 Session callback - Valid session created:', { id: token.id, email: token.email, role: token.role });
      
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
          
          // Check if user exists with this email
          const existingUser = await prisma.user.findUnique({
            where: { email: profile.email }
          });

          if (existingUser) {
            console.log('✅ Existing user found, allowing OAuth linking:', existingUser.email);
            // Allow linking OAuth account to existing user
            return true;
          }

          console.log('✅ New user, allowing OAuth signup:', profile.email);
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
      // Always redirect to role selection after OAuth
      if (url.includes('/api/auth/callback/')) {
        return `${baseUrl}/auth/role-selection`;
      }
      
      if (url.startsWith('/')) {
        return `${baseUrl}${url}`;
      }
      
      if (url.startsWith(baseUrl)) {
        return url;
      }
      
      return `${baseUrl}/auth/role-selection`;
    }
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error'
  },
  events: {
    async linkAccount({ user, account, profile }) {
      console.log('🔗 Account linked:', { userId: user.id, provider: account.provider });
    },
  },
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 1 day (reduced from 30 days)
  },
  useSecureCookies: process.env.NODE_ENV === 'production',
  secret: process.env.NEXTAUTH_SECRET || 'fallback-secret-key-change-in-production',
  trustHost: true,
  debug: false,
});