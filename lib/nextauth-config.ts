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
            token.id = dbUser.id;
            token.role = dbUser.role;
            token.email = dbUser.email;
            token.name = dbUser.name;
          } else {
            token.email = profile.email || token.email;
            token.name = profile.name || token.name;
            token.picture = (profile as any).picture || token.picture;
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
      return session;
    },
    async signIn({ user, account, profile }) {
      // Handle OAuth sign-ins
      if (account?.provider === 'google' && profile) {
        try {
          const existingUser = await prisma.user.findUnique({
            where: { email: profile.email || '' }
          });

          if (!existingUser) {
            // Create new user from Google OAuth
            await prisma.user.create({
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
          } else {
            // Update existing user
            await prisma.user.update({
              where: { id: existingUser.id },
              data: {
                emailVerified: new Date(),
                updatedAt: new Date(),
                name: existingUser.name || profile.name || ''
              }
            });
          }
        } catch (error) {
          console.error('Error handling Google OAuth user:', error);
        }
      }
      
      return true;
    },
    async redirect({ url, baseUrl }) {
      console.log('🔀 Redirect callback - url:', url, 'baseUrl:', baseUrl);
      
      // Handle relative URLs
      if (url.startsWith('/')) {
        const redirectUrl = `${baseUrl}${url}`;
        console.log('🔀 Redirecting to relative URL:', redirectUrl);
        return redirectUrl;
      }
      
      // Handle absolute URLs that start with baseUrl
      if (url.startsWith(baseUrl)) {
        console.log('🔀 Redirecting to absolute URL:', url);
        return url;
      }
      
      // For OAuth callbacks, redirect to role selection
      if (url.includes('/api/auth/callback/')) {
        const roleSelectionUrl = `${baseUrl}/auth/role-selection`;
        console.log('🔀 OAuth callback detected, redirecting to role selection:', roleSelectionUrl);
        return roleSelectionUrl;
      }
      
      // Default redirect to role selection for new users
      const defaultUrl = `${baseUrl}/auth/role-selection`;
      console.log('🔀 Default redirect to role selection:', defaultUrl);
      return defaultUrl;
    }
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error'
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  useSecureCookies: process.env.NODE_ENV === 'production',
  secret: process.env.NEXTAUTH_SECRET || 'fallback-secret-key-change-in-production',
});