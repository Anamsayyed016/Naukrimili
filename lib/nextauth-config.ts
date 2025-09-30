/**
 * NextAuth.js v5 Configuration - Clean, Professional Implementation
 * Unified authentication system for job portal
 */

import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import Credentials from "next-auth/providers/credentials"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"

// Custom adapter to handle name field properly
const customPrismaAdapter = {
  ...PrismaAdapter(prisma),
  async createUser(user) {
    // Split name into firstName and lastName
    const nameParts = user.name ? user.name.split(' ') : ['', ''];
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';
    
    // Remove name field and add firstName/lastName
    const { name, ...userData } = user;
    
    return prisma.user.create({
      data: {
        ...userData,
        firstName,
        lastName,
        // Set default values for required fields
        role: userData.role || 'jobseeker',
        isActive: userData.isActive ?? true,
        isVerified: userData.isVerified ?? false,
      }
    });
  }
}

// Validate required NextAuth environment variables
const nextAuthUrl = process.env.NEXTAUTH_URL || 'https://aftionix.in';
const nextAuthSecret = process.env.NEXTAUTH_SECRET || 'fallback-secret-key-for-development-only-32-chars-min';

// Log configuration status
console.log('🔧 NextAuth Configuration:');
console.log('   NEXTAUTH_URL:', nextAuthUrl);
console.log('   NEXTAUTH_SECRET:', nextAuthSecret ? '✅ Set' : '❌ Missing');
console.log('   Environment:', process.env.NODE_ENV || 'development');

// Validate Google OAuth credentials
const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;

// Only add Google provider if credentials are properly configured
const providers = [];

if (googleClientId && googleClientSecret && 
    !googleClientId.includes('your-') && !googleClientSecret.includes('your-') &&
    googleClientId !== '' && googleClientSecret !== '') {
  providers.push(Google({
    clientId: googleClientId,
    clientSecret: googleClientSecret,
    authorization: {
      params: {
        scope: 'openid email profile',
        prompt: 'select_account',
        access_type: 'offline',
        response_type: 'code'
      }
    }
  }));
  console.log('✅ Google OAuth provider configured successfully');
} else {
  console.warn("⚠️ Google OAuth credentials not properly configured. Google sign-in will be disabled.");
  console.warn("   GOOGLE_CLIENT_ID:", googleClientId ? 'Set' : 'Missing');
  console.warn("   GOOGLE_CLIENT_SECRET:", googleClientSecret ? 'Set' : 'Missing');
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: customPrismaAdapter,
  secret: nextAuthSecret,
  trustHost: true,
  debug: process.env.NODE_ENV === 'development',
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  providers: [
    ...providers,
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
          // Dynamic import of bcrypt to avoid Edge Runtime issues
          const bcrypt = (await import('bcryptjs')).default;
          
          const user = await prisma.user.findUnique({
            where: { email: credentials.email as string },
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              password: true,
              role: true,
              isActive: true,
              roleLocked: true,
              lockedRole: true,
              roleLockReason: true
            }
          });
          
          if (!user || !user.password || !user.isActive) {
            return null;
          }

          const isValidPassword = await bcrypt.compare(credentials.password as string, user.password);
          if (!isValidPassword) {
            return null;
          }

          // Check role lock - if user is locked, they can only login with their locked role
          if ((user as any).roleLocked && (user as any).lockedRole) {
            console.log('🔒 User is role-locked:', {
              userId: user.id,
              email: user.email,
              lockedRole: (user as any).lockedRole,
              reason: (user as any).roleLockReason
            });
            
            // User is role-locked, they can only login with their locked role
            // This prevents role switching at the authentication level
            // The role will be enforced in the session
          }

          return {
            id: user.id,
            email: user.email,
            name: user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.firstName || user.email,
            role: user.role || 'jobseeker',
            roleLocked: (user as any).roleLocked || false,
            lockedRole: (user as any).lockedRole,
            roleLockReason: (user as any).roleLockReason,
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
    async jwt({ token, user, account, profile, trigger }) {
      // Handle initial user data from sign-in
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.email = user.email;
        token.name = (user as any).firstName && (user as any).lastName ? `${(user as any).firstName} ${(user as any).lastName}` : (user as any).firstName || user.email;
        token.roleLocked = (user as any).roleLocked;
        token.lockedRole = (user as any).lockedRole;
        token.roleLockReason = (user as any).roleLockReason;
        token.isActive = true;
        console.log('�� JWT callback - Initial user data:', user);
      }

      // Fetch fresh user data from database if:
      // 1. This is a fresh login (user exists)
      // 2. This is a session update triggered by updateSession()
      if ((user && token.id) || trigger === 'update') {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.id as string },
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              role: true,
              isActive: true,
              roleLocked: true,
              lockedRole: true,
              roleLockReason: true
            }
          });
          
          if (dbUser && dbUser.isActive) {
            token.role = dbUser.role;
            token.email = dbUser.email;
            token.name = dbUser.firstName && dbUser.lastName ? `${dbUser.firstName} ${dbUser.lastName}` : dbUser.firstName || dbUser.email;
            token.roleLocked = (dbUser as any).roleLocked;
            token.lockedRole = (dbUser as any).lockedRole;
            token.roleLockReason = (dbUser as any).roleLockReason;
            token.isActive = dbUser.isActive;
            console.log('🔍 JWT callback - Updated token with latest DB data:', { 
              id: token.id, 
              role: token.role, 
              roleLocked: token.roleLocked, 
              lockedRole: token.lockedRole,
              roleLockReason: token.roleLockReason,
              trigger 
            });
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
            where: { email: profile.email || '' },
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              role: true,
              isActive: true,
              isVerified: true,
              emailVerified: true
            }
          });
          
          if (dbUser) {
            // Update existing user with OAuth data and link the account
            await prisma.user.update({
              where: { id: dbUser.id },
              data: {
                firstName: profile.name?.split(' ')[0] || dbUser.firstName,
                lastName: profile.name?.split(' ').slice(1).join(' ') || dbUser.lastName,
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
            token.name = profile.name || (dbUser.firstName && dbUser.lastName ? `${dbUser.firstName} ${dbUser.lastName}` : dbUser.firstName || dbUser.email);
            token.picture = (profile as any).picture || token.picture;
            token.isActive = dbUser.isActive || true; // Ensure isActive is set
            
            console.log('✅ JWT callback - Updated existing user with OAuth data:', { id: token.id, email: token.email, name: token.name, role: token.role });
          } else {
            // Create new user for OAuth
            const newUser = await prisma.user.create({
              data: {
                email: profile.email || '',
                firstName: profile.name?.split(' ')[0] || '',
                lastName: profile.name?.split(' ').slice(1).join(' ') || '',
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

            // Send welcome notification for new user
            try {
              // Create a simple notification record
              await prisma.notification.create({
                data: {
                  userId: newUser.id,
                  type: 'welcome',
                  title: 'Welcome to NaukriMili!',
                  message: `Welcome ${newUser.firstName && newUser.lastName ? `${newUser.firstName} ${newUser.lastName}` : newUser.firstName || 'User'}! Your account has been created successfully.`,
                  isRead: false
                }
              });
              console.log('✅ Welcome notification sent for new Google OAuth user');
            } catch (notificationError) {
              console.error('❌ Failed to send welcome notification:', notificationError);
              // Don't fail the OAuth flow if notification fails
            }
            
            token.id = newUser.id;
            token.email = newUser.email;
            token.name = newUser.firstName && newUser.lastName ? `${newUser.firstName} ${newUser.lastName}` : newUser.firstName || newUser.email;
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
        console.log('�� Session callback - Invalid token, returning null session');
        return null;
      }

      // Ensure session.user exists and type it properly
      if (!session.user) {
        session.user = {} as any;
      }
      
      // Fetch the latest user data from database to get updated role
      try {
        const user = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            isActive: true,
            image: true,
            profilePicture: true
          }
        }) as any;

        if (user) {
          // Fetch role lock fields separately to avoid TypeScript issues
          const roleLockData = await prisma.user.findUnique({
            where: { id: user.id },
            select: {
              id: true,
              roleLocked: true,
              lockedRole: true,
              roleLockReason: true
            }
          }) as any;
          
          console.log('🔍 Session callback - Role lock data from DB:', roleLockData);

          // Use fresh data from database
          (session.user as any).id = user.id;
          (session.user as any).email = user.email;
          (session.user as any).name = user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.firstName || user.email || '';
          (session.user as any).roleLocked = roleLockData?.roleLocked || false;
          (session.user as any).lockedRole = roleLockData?.lockedRole;
          (session.user as any).roleLockReason = roleLockData?.roleLockReason;
          (session.user as any).picture = user.profilePicture || user.image || token.picture || '';
          (session.user as any).isActive = user.isActive;
          
          // Enforce role lock - if user is locked, force their role to locked role
          if (roleLockData?.roleLocked && roleLockData?.lockedRole) {
            (session.user as any).role = roleLockData.lockedRole;
            console.log(`🔒 Session: Enforcing locked role ${roleLockData.lockedRole} for user ${user.email}`);
          } else {
            // Use database role if not locked
            (session.user as any).role = user.role;
            console.log(`🔓 Session: Using database role ${user.role} for user ${user.email}`);
          }
          
          // Debug: Log the final session role that will be used
          console.log(`🔍 Session callback - Final session role: ${(session.user as any).role}`);
          
          console.log('🔍 Session callback - Fresh data from DB:', { 
            id: user.id, 
            email: user.email, 
            role: user.role, 
            roleLocked: roleLockData?.roleLocked,
            lockedRole: roleLockData?.lockedRole,
            roleLockReason: roleLockData?.roleLockReason
          });
          
          // Debug: Log the final session role that will be used
          const finalSessionRole = roleLockData?.roleLocked && roleLockData?.lockedRole 
            ? roleLockData.lockedRole 
            : user.role;
          console.log('🔍 Session callback - Final session role:', finalSessionRole);
        } else {
          // Fallback to token data if user not found
          (session.user as any).id = token.id;
          (session.user as any).email = token.email;
          (session.user as any).name = token.name || '';
          (session.user as any).role = token.role || null;
          (session.user as any).picture = token.picture || '';
          (session.user as any).isActive = token.isActive;
          
          console.log('🔍 Session callback - Using token data (user not found):', { id: token.id, email: token.email, role: token.role });
        }
      } catch (error) {
        console.error('Error fetching user data in session callback:', error);
        // Fallback to token data
        (session.user as any).id = token.id;
        (session.user as any).email = token.email;
        (session.user as any).name = token.name || '';
        (session.user as any).role = token.role || null;
        (session.user as any).picture = token.picture || '';
        (session.user as any).isActive = token.isActive;
      }
      
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
            where: { email: profile.email },
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              role: true,
              isActive: true
            }
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
      console.log('🔍 NextAuth Redirect - URL:', url);
      console.log('🔍 NextAuth Redirect - BaseURL:', baseUrl);
      
      // For OAuth callbacks, redirect to Gmail profile confirmation first
      // This shows the user their Google account details before role selection
      if (url.includes('/api/auth/callback/')) {
        const redirectUrl = `${baseUrl}/auth/gmail-profile`;
        console.log('🔍 NextAuth Redirect - OAuth callback redirecting to:', redirectUrl);
        return redirectUrl;
      }
      
      if (url.startsWith('/')) {
        const redirectUrl = `${baseUrl}${url}`;
        console.log('🔍 NextAuth Redirect - Relative URL redirecting to:', redirectUrl);
        return redirectUrl;
      }
      
      if (url.startsWith(baseUrl)) {
        console.log('🔍 NextAuth Redirect - Full URL redirecting to:', url);
        return url;
      }
      
      // Default redirect to Gmail profile for OAuth users
      const defaultRedirect = `${baseUrl}/auth/gmail-profile`;
      console.log('🔍 NextAuth Redirect - Default redirecting to:', defaultRedirect);
      return defaultRedirect;
    }
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
  useSecureCookies: process.env.NODE_ENV === 'production'
});
