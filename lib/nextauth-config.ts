/**
 * NextAuth.js Configuration for Gmail Authentication
 * Clean, conflict-free configuration
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
              id: user.id,
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
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role || 'user';
      }
      if (account?.provider) {
        token.provider = account.provider;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id || token.sub || '';
        (session.user as any).role = token.role || 'user';
      }
      return session;
    },
    async signIn({ user, account, profile }) {
      try {
        // Allow all sign-ins for now
        // You can add additional validation here
        return true;
      } catch (error) {
        console.error('SignIn callback error:', error);
        return false;
      }
    },
    async redirect({ url, baseUrl }) {
      // Security: Only allow relative URLs and same-origin URLs
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    }
  },
  pages: {
    signIn: '/auth/login',
    error: '/auth/error'
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
    }
  }
};
