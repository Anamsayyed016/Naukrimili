/**
 * NextAuth.js Configuration with Dynamic OAuth2 Providers
 * Supports Google and LinkedIn OAuth with environment-based credentials
 */

import { NextAuthOptions } from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from '@/lib/database-service';
import { oauthConfig } from '@/lib/oauth-config';
import bcrypt from 'bcryptjs';
import { User as PrismaUser } from '@prisma/client';

// Custom LinkedIn Provider (NextAuth doesn't have built-in LinkedIn v2)
const LinkedInProvider = {
  id: 'linkedin',
  name: 'LinkedIn',
  type: 'oauth' as const,
  version: '2.0',
  authorization: {
    url: 'https://www.linkedin.com/oauth/v2/authorization',
    params: {
      scope: oauthConfig.getLinkedInScopes().join(' '),
      response_type: 'code',
    },
  },
  token: 'https://www.linkedin.com/oauth/v2/accessToken',
  userinfo: {
    url: 'https://api.linkedin.com/v2/people/~:(id,firstName,lastName,profilePicture(displayImage~:playableStreams))',
    async request({ tokens }: any) {
      // Get profile info
      const profileResponse = await fetch(
        'https://api.linkedin.com/v2/people/~:(id,firstName,lastName,profilePicture(displayImage~:playableStreams))',
        {
          headers: {
            Authorization: `Bearer ${tokens.access_token}`,
            'cache-control': 'no-cache',
            'X-Restli-Protocol-Version': '2.0.0',
          },
        }
      );
      
      const profile = await profileResponse.json();
      
      // Get email address
      const emailResponse = await fetch(
        'https://api.linkedin.com/v2/emailAddress?q=members&projection=(elements*(handle~))',
        {
          headers: {
            Authorization: `Bearer ${tokens.access_token}`,
            'cache-control': 'no-cache',
            'X-Restli-Protocol-Version': '2.0.0',
          },
        }
      );
      
      const emailData = await emailResponse.json();
      const email = emailData.elements?.[0]?.['handle~']?.emailAddress;
      
      // Get profile picture
      const picture = profile.profilePicture?.['displayImage~']?.elements?.[0]?.identifiers?.[0]?.identifier;
      
      return {
        id: profile.id,
        name: `${profile.firstName?.localized?.en_US || ''} ${profile.lastName?.localized?.en_US || ''}`.trim(),
        email,
        image: picture,
        firstName: profile.firstName?.localized?.en_US,
        lastName: profile.lastName?.localized?.en_US,
      };
    },
  },
  profile(profile: any) {
    return {
      id: profile.id,
      name: profile.name,
      email: profile.email,
      image: profile.image,
      firstName: profile.firstName,
      lastName: profile.lastName,
    };
  },
  options: {},
};

// Get dynamic OAuth configuration
const config = oauthConfig.getOAuthConfig();

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  
  providers: [
    // Google OAuth Provider
    GoogleProvider({
      clientId: config.google.clientId,
      clientSecret: config.google.clientSecret,
      authorization: {
        params: {
          scope: oauthConfig.getGoogleScopes().join(' '),
        },
      },
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
          firstName: profile.given_name,
          lastName: profile.family_name,
          emailVerified: profile.email_verified ? new Date() : null,
        };
      },
    }),
    
    // LinkedIn OAuth Provider (Custom)
    {
      ...LinkedInProvider,
      clientId: config.linkedin.clientId,
      clientSecret: config.linkedin.clientSecret,
    } as any,
    
    // Credentials Provider for Email/Password Login
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Invalid credentials');
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user || !user.password) {
          throw new Error('Invalid credentials');
        }

        const isPasswordValid = await bcrypt.compare(credentials.password, user.password);

        if (!isPasswordValid) {
          throw new Error('Invalid credentials');
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim(),
          image: user.image || user.profilePicture,
          role: user.role,
        };
      },
    }),
  ],

  pages: {
    signIn: '/auth/signin',
    signUp: '/auth/signup',
    error: '/auth/error',
    verifyRequest: '/auth/verify-request',
  },

  session: {
    strategy: 'jwt',
    maxAge: parseInt(process.env.SESSION_MAX_AGE || '604800'), // 7 days
  },

  jwt: {
    secret: process.env.NEXTAUTH_SECRET,
    maxAge: parseInt(process.env.SESSION_MAX_AGE || '604800'), // 7 days
  },

  callbacks: {
    async signIn({ user, account, profile }) {
      // Allow OAuth sign-ins
      if (account?.provider === 'google' || account?.provider === 'linkedin') {
        return true;
      }
      
      // Allow credentials sign-in
      if (account?.provider === 'credentials') {
        return true;
      }
      
      return false;
    },

    async jwt({ token, user, account, profile }) {
      // Initial sign in
      if (user) {
        token.role = (user as any).role || 'jobseeker';
        token.userId = user.id;
        
        // Store OAuth provider info
        if (account?.provider) {
          token.provider = account.provider;
        }
      }
      
      return token;
    },

    async session({ session, token }) {
      if (token) {
        session.user.id = token.userId as string;
        session.user.role = token.role as string;
        session.user.provider = token.provider as string;
      }
      
      return session;
    },

    async redirect({ url, baseUrl }) {
      // Allows relative callback URLs
      if (url.startsWith('/')) return `${baseUrl}${url}`;
      
      // Allows callback URLs on the same origin
      if (new URL(url).origin === baseUrl) return url;
      
      return baseUrl;
    },
  },

  events: {
    async createUser({ user }) {
      console.log(`New user created: ${user.email}`);
    },
    
    async signIn({ user, account, isNewUser }) {
      console.log(`User signed in: ${user.email} via ${account?.provider}`);
      
      if (isNewUser) {
        console.log(`New user registered via OAuth: ${user.email}`);
      }
    },
    
    async linkAccount({ user, account }) {
      console.log(`Account linked: ${account.provider} to user ${user.email}`);
    },
  },

  debug: process.env.NODE_ENV === 'development',
  
  // Security configurations
  useSecureCookies: process.env.NODE_ENV === 'production',
  
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
    callbackUrl: {
      name: `next-auth.callback-url`,
      options: {
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
    csrfToken: {
      name: `next-auth.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
};
