/**
 * NextAuth.js Configuration for Google OAuth Authentication
 * Enhanced with comprehensive error handling and debugging
 */

import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      authorization: {
        params: {
          scope: 'openid email profile',
          prompt: 'select_account', // Better for mobile
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
          if (!credentials?.email || !credentials?.password) {
            return null;
          }

          // Check if user exists in database
          const user = await prisma.user.findUnique({
            where: { email: credentials.email }
          });
          
          if (!user || !user.password) {
            return null;
          }

          // Verify password
          const isValidPassword = await bcrypt.compare(credentials.password, user.password);
          if (!isValidPassword) {
            return null;
          }

          // Check if user is active
          if (!user.isActive) {
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
      try {
        if (user) {
          token.id = user.id;
          token.role = user.role || 'jobseeker';
          token.email = user.email;
        }
        
        if (account?.provider === 'google' && profile) {
          // Handle Google OAuth user creation/update
          try {
            const existingUser = await prisma.user.findUnique({
              where: { email: profile.email || '' }
            });

            if (!existingUser) {
              // Create new user from Google OAuth
              const newUser = await prisma.user.create({
                data: {
                  email: profile.email || '',
                  name: profile.name || '',
                  role: 'jobseeker', // Default role for OAuth users
                  isActive: true,
                  isVerified: true,
                  emailVerified: new Date()
                }
              });
              token.id = newUser.id;
              token.role = newUser.role;
            } else {
              // Update existing user
              await prisma.user.update({
                where: { id: existingUser.id },
                data: {
                  emailVerified: new Date(),
                  updatedAt: new Date()
                }
              });
              token.id = existingUser.id;
              token.role = existingUser.role;
            }
          } catch (error) {
            console.error('Error handling Google OAuth user:', error);
          }
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
          (session.user as any).role = token.role || 'jobseeker';
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
        // Log sign-in attempt
        console.log('Sign-in attempt:', { 
          provider: account?.provider, 
          email: user.email, 
          role: user.role 
        });
        
        return true;
      } catch (error) {
        console.error('Sign-in callback error:', error);
        return false;
      }
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
};
