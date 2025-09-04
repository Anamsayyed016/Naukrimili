/**
 * NextAuth.js Configuration for Google OAuth Authentication
 * Clean implementation without OTP verification
 */

// Type declarations for Node.js environment
declare const process: {
  env: {
    [key: string]: string | undefined;
  };
};

import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from '@/lib/prisma';
// @ts-ignore - bcryptjs types are available but may have module resolution issues
import bcrypt from 'bcryptjs';
import { sendWelcomeEmail } from '@/lib/welcome-email';
import { createWelcomeNotification } from '@/lib/notification-service';

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
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
    // LinkedIn OAuth Provider (commented out until credentials are configured)
    // LinkedInProvider({
    //   clientId: process.env.LINKEDIN_CLIENT_ID || '',
    //   clientSecret: process.env.LINKEDIN_CLIENT_SECRET || '',
    //   authorization: {
    //     params: {
    //       scope: 'r_liteprofile r_emailaddress',
    //     }
    //   }
    // }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            console.log('Missing credentials');
            return null;
          }

          console.log('Attempting login for:', credentials.email);

          // Check if user exists in database
          const user = await prisma.user.findUnique({
            where: { email: credentials.email }
          });
          
          if (!user) {
            console.log('User not found:', credentials.email);
            return null;
          }

          if (!user.password) {
            console.log('User has no password (OAuth only):', credentials.email);
            return null;
          }

          // Verify password
          const isValidPassword = await bcrypt.compare(credentials.password, user.password);
          if (!isValidPassword) {
            console.log('Invalid password for:', credentials.email);
            return null;
          }

          // Check if user is active
          if (!user.isActive) {
            console.log('User account inactive:', credentials.email);
            return null;
          }

          console.log('Login successful for:', credentials.email);

          return {
            id: user.id.toString(),
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
          token.id = user.id.toString();
          token.role = user.role || 'jobseeker';
          token.email = user.email;
          // Set isNewUser flag for credentials login (always false for existing users)
          token.isNewUser = false;
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
                  role: 'jobseeker',
                  isActive: true,
                  isVerified: true, // Google OAuth users are automatically verified
                  emailVerified: new Date()
                }
              });
              
              token.id = newUser.id.toString();
              token.role = newUser.role;
              token.email = profile.email || '';
              token.name = profile.name || '';
              // Mark as new user for OAuth registration
              token.isNewUser = true;
              
              console.log(`✅ Google OAuth: New user created and verified for ${profile.email}`);
              
              // Create welcome notification for new OAuth users (async, don't await to avoid blocking)
              createWelcomeNotification(
                newUser.id,
                profile.name || 'User',
                'Google'
              ).catch(error => {
                console.error('Failed to create welcome notification:', error);
              });
              
              // Send welcome email for new OAuth users (async, don't await to avoid blocking)
              sendWelcomeEmail({
                email: profile.email || '',
                name: profile.name || '',
                provider: 'google'
              }).catch(error => {
                console.error('Failed to send welcome email:', error);
              });
            } else {
              // Update existing user
              await prisma.user.update({
                where: { id: existingUser.id },
                data: {
                  emailVerified: new Date(),
                  updatedAt: new Date()
                }
              });
              
              token.id = existingUser.id.toString();
              token.role = existingUser.role;
              token.email = profile.email || '';
              token.name = profile.name || '';
              // Mark as existing user
              token.isNewUser = false;
              
              console.log(`✅ Google OAuth: Existing user logged in for ${profile.email}`);
            }
          } catch (error) {
            console.error('Error handling Google OAuth user:', error);
          }
        }
        
        // Handle LinkedIn OAuth (if implemented)
        if (account?.provider === 'linkedin' && profile) {
          try {
            const existingUser = await prisma.user.findUnique({
              where: { email: profile.email || '' }
            });

            if (!existingUser) {
              // Create new user from LinkedIn OAuth
              const newUser = await prisma.user.create({
                data: {
                  email: profile.email || '',
                  name: profile.name || '',
                  role: 'jobseeker',
                  isActive: true,
                  isVerified: true, // LinkedIn OAuth users are automatically verified
                  emailVerified: new Date()
                }
              });
              
              token.id = newUser.id.toString();
              token.role = newUser.role;
              token.email = profile.email || '';
              token.name = profile.name || '';
              // Mark as new user for OAuth registration
              token.isNewUser = true;
              
              console.log(`✅ LinkedIn OAuth: New user created and verified for ${profile.email}`);
              
              // Create welcome notification for new OAuth users (async, don't await to avoid blocking)
              createWelcomeNotification(
                newUser.id,
                profile.name || 'User',
                'LinkedIn'
              ).catch(error => {
                console.error('Failed to create welcome notification:', error);
              });
              
              // Send welcome email for new OAuth users (async, don't await to avoid blocking)
              sendWelcomeEmail({
                email: profile.email || '',
                name: profile.name || '',
                provider: 'linkedin'
              }).catch(error => {
                console.error('Failed to send welcome email:', error);
              });
            } else {
              // Update existing user
              await prisma.user.update({
                where: { id: existingUser.id },
                data: {
                  emailVerified: new Date(),
                  updatedAt: new Date()
                }
              });
              
              token.id = existingUser.id.toString();
              token.role = existingUser.role;
              token.email = profile.email || '';
              token.name = profile.name || '';
              // Mark as existing user
              token.isNewUser = false;
              
              console.log(`✅ LinkedIn OAuth: Existing user logged in for ${profile.email}`);
            }
          } catch (error) {
            console.error('Error handling LinkedIn OAuth user:', error);
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
          (session.user as any).isVerified = true;
          // Pass isNewUser flag to session for frontend use
          (session.user as any).isNewUser = token.isNewUser || false;
        }
        return session;
      } catch (error) {
        console.error('Session callback error:', error);
        return session;
      }
    },
    async signIn({ user, account, profile, email, credentials }) {
      try {
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
  useSecureCookies: process.env.NODE_ENV === 'production',
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  debug: false,
  secret: process.env.NEXTAUTH_SECRET || 'fallback-secret-key-change-in-production',
};