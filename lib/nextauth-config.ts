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
  // Temporarily disable adapter to test OAuth without database dependency
  // adapter: PrismaAdapter(prisma),
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
        // Handle initial user data from sign-in
        if (user) {
          token.id = user.id?.toString() || token.sub;
          token.role = user.role || null;
          token.email = user.email || token.email;
          token.name = user.name || token.name;
          token.isNewUser = false;
        }
        
        // Handle OAuth provider data - fetch user from database
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
              token.isOAuthUser = true;
            } else {
              token.email = profile.email || token.email;
              token.name = profile.name || token.name;
              token.picture = (profile as any).picture || token.picture;
              token.isOAuthUser = true;
            }
          } catch (error) {
            console.error('Error fetching user in JWT callback:', error);
            token.email = profile.email || token.email;
            token.name = profile.name || token.name;
            token.picture = (profile as any).picture || token.picture;
            token.isOAuthUser = true;
          }
        }
        
        if (account?.provider === 'linkedin' && profile) {
          try {
            const dbUser = await prisma.user.findUnique({
              where: { email: profile.email || '' }
            });
            
            if (dbUser) {
              token.id = dbUser.id;
              token.role = dbUser.role;
              token.email = dbUser.email;
              token.name = dbUser.name;
              token.isOAuthUser = true;
            } else {
              token.email = profile.email || token.email;
              token.name = profile.name || token.name;
              token.picture = (profile as any).picture || token.picture;
              token.isOAuthUser = true;
            }
          } catch (error) {
            console.error('Error fetching user in JWT callback:', error);
            token.email = profile.email || token.email;
            token.name = profile.name || token.name;
            token.picture = (profile as any).picture || token.picture;
            token.isOAuthUser = true;
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
          (session.user as any).role = token.role || null; // Don't default to jobseeker
          (session.user as any).email = token.email || '';
          (session.user as any).name = token.name || '';
          (session.user as any).picture = token.picture || '';
          (session.user as any).isVerified = true;
          // Pass flags to session for frontend use
          (session.user as any).isNewUser = token.isNewUser || false;
          (session.user as any).isOAuthUser = token.isOAuthUser || false;
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
        
        // Handle OAuth sign-ins
        if (account?.provider === 'google' && profile) {
          try {
            const existingUser = await prisma.user.findUnique({
              where: { email: profile.email || '' }
            });

            if (!existingUser) {
              // Create new user from Google OAuth without a role - they'll select it later
              const newUser = await prisma.user.create({
                data: {
                  email: profile.email || '',
                  name: profile.name || '',
                  role: null, // No default role - user will select
                  isActive: true,
                  isVerified: true, // Google OAuth users are automatically verified
                  emailVerified: new Date()
                }
              });
              
              console.log(`✅ Google OAuth: New user created for ${profile.email}`);
              
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
              // Update existing user - handle both OAuth and credential users
              await prisma.user.update({
                where: { id: existingUser.id },
                data: {
                  emailVerified: new Date(),
                  updatedAt: new Date(),
                  // If user was created with credentials, update name from OAuth
                  name: existingUser.name || profile.name || ''
                }
              });
              
              console.log(`✅ Google OAuth: Existing user logged in for ${profile.email}`);
            }
          } catch (error) {
            console.error('Error handling Google OAuth user:', error);
            // Don't throw error, just log it to prevent auth failure
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
                  role: null, // No default role - user will select
                  isActive: true,
                  isVerified: true, // LinkedIn OAuth users are automatically verified
                  emailVerified: new Date()
                }
              });
              
              console.log(`✅ LinkedIn OAuth: New user created for ${profile.email}`);
              
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
              
              console.log(`✅ LinkedIn OAuth: Existing user logged in for ${profile.email}`);
            }
          } catch (error) {
            console.error('Error handling LinkedIn OAuth user:', error);
          }
        }
        
        return true;
      } catch (error) {
        console.error('Sign-in callback error:', error);
        return false;
      }
    },
    async redirect({ url, baseUrl }) {
      console.log('Redirect callback:', { url, baseUrl });
      
      // Handle relative URLs
      if (url.startsWith('/')) {
        return `${baseUrl}${url}`;
      }
      
      // Handle absolute URLs that start with baseUrl
      if (url.startsWith(baseUrl)) {
        return url;
      }
      
      // For OAuth callbacks, always redirect to home page
      // This ensures new users go to home page where they can choose role
      return `${baseUrl}/`;
    }
  },
  pages: {
    signIn: '/auth/unified',
    error: '/auth/error'
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // Update every 24 hours
  },
  useSecureCookies: process.env.NODE_ENV === 'production',
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  debug: false,
  secret: process.env.NEXTAUTH_SECRET || 'fallback-secret-key-change-in-production',
};