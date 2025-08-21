/**
 * NextAuth.js Configuration for Google OAuth Authentication
 * Enhanced with comprehensive error handling and debugging
 */

import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { prisma } from '@/lib/prisma';

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      authorization: {
        params: {
          scope: 'openid email profile',
          prompt: 'consent',
          access_type: 'offline',
          response_type: 'code'
        }
      }
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        try {
          // Check if user exists in database
          const user = await prisma.user.findUnique({
            where: { email: credentials?.email || '' }
          });
          
          if (user && credentials?.password) {
            // In production, hash and verify password
            // For now, allow basic auth
            return {
              id: user.id.toString(), // Convert Int to string for NextAuth compatibility
              email: user.email,
              name: user.name,
              role: user.role || 'user'
            };
          }
          return null;
        } catch (error) {
          console.error('Credentials auth error:', error);
          return null;
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user, account, profile }) {
      try {
        if (user) {
          token.id = user.id;
          token.role = (user as any).role || 'user';
          token.email = user.email;
        }
        if (account?.provider) {
          token.provider = account.provider;
        }
        return token;
      } catch (error) {
        console.error('JWT callback error:', error);
        return token;
      }
    },
    async session({ session, token }) {
      try {
        if (session.user) {
          (session.user as any).id = token.id || token.sub || '';
          (session.user as any).role = token.role || 'user';
          (session.user as any).email = token.email || '';
        }
        return session;
      } catch (error) {
        console.error('Session callback error:', error);
        return session;
      }
    },
    async signIn({ user, account, profile, email, credentials }) {
      try {
        console.log('🔐 SignIn callback triggered:', {
          user: user?.email,
          account: account?.provider,
          profile: profile?.email,
          hasCredentials: !!credentials
        });

        // Allow all sign-ins for now
        // You can add additional validation here
        return true;
      } catch (error) {
        console.error('❌ SignIn callback error:', error);
        return false;
      }
    },
    async redirect({ url, baseUrl }) {
      try {
        // Security: Only allow relative URLs and same-origin URLs
        if (url.startsWith("/")) return `${baseUrl}${url}`;
        if (new URL(url).origin === baseUrl) return url;
        return baseUrl;
      } catch (error) {
        console.error('❌ Redirect callback error:', error);
        return baseUrl;
      }
    }
  },
  pages: {
    signIn: '/auth/login',
    error: '/auth/error',
    signOut: '/auth/logout'
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  debug: process.env.NODE_ENV === 'development',
  secret: process.env.NEXTAUTH_SECRET,
  useSecureCookies: process.env.NODE_ENV === 'production',
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production'
      }
    },
    callbackUrl: {
      name: `next-auth.callback-url`,
      options: {
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production'
      }
    },
    csrfToken: {
      name: `next-auth.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production'
      }
    }
  },
  events: {
    async signIn({ user, account, profile, isNewUser }) {
      console.log('✅ User signed in:', {
        email: user.email,
        provider: account?.provider,
        isNewUser
      });
    },
    async signOut({ session, token }) {
      console.log('👋 User signed out:', {
        email: session?.user?.email
      });
    },
    async createUser({ user }) {
      console.log('👤 New user created:', {
        email: user.email,
        id: user.id
      });
    },
    async linkAccount({ user, account, profile }) {
      console.log('🔗 Account linked:', {
        email: user.email,
        provider: account.provider
      });
    }
  }
};
