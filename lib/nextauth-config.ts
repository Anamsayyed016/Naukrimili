import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import Credentials from "next-auth/providers/credentials"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"

// Use Prisma Adapter - events callback will handle welcome emails
const adapter = PrismaAdapter(prisma);

// Allow build to proceed without NEXTAUTH_SECRET, but it must be set at runtime
const nextAuthSecret = process.env.NEXTAUTH_SECRET || 'build-time-placeholder-secret-key'

if (!process.env.NEXTAUTH_SECRET) {
  console.warn("⚠️ NEXTAUTH_SECRET environment variable is not set. Using placeholder for build.");
  console.warn("⚠️ Make sure to set NEXTAUTH_SECRET before running in production!");
}

const googleClientId = process.env.GOOGLE_CLIENT_ID
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET

if (!googleClientId || !googleClientSecret) {
  console.warn("⚠️ Google OAuth credentials not properly configured. Google sign-in will be disabled.");
  console.warn("   GOOGLE_CLIENT_ID:", googleClientId ? 'Set' : 'Missing');
  console.warn("   GOOGLE_CLIENT_SECRET:", googleClientSecret ? 'Set' : 'Missing');
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: adapter,
  secret: nextAuthSecret,
  trustHost: true,
  debug: true, // Enable debug to troubleshoot welcome email
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  providers: [
    ...(googleClientId && googleClientSecret ? [
      Google({
        clientId: googleClientId,
        clientSecret: googleClientSecret,
      })
    ] : []),
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

         const user = await prisma.user.findUnique({
           where: { email: credentials.email as string }
         })

        if (!user || !user.password) {
          return null
        }

        // Simple password check (you should use bcrypt in production)
        if (user.password !== credentials.password) {
          return null
        }

        return {
          id: user.id,
          email: user.email,
          name: `${user.firstName} ${user.lastName}`.trim(),
          image: user.image,
          role: user.role,
        }
      }
    })
  ],
  events: {
    async createUser(message) {
      console.log('🎉 NextAuth event - createUser triggered for:', message.user.email);
      
      try {
        // Get the newly created user
        const user = await prisma.user.findUnique({
          where: { email: message.user.email! },
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true
          }
        });

        if (!user) {
          console.error('❌ User not found after creation:', message.user.email);
          return;
        }

        console.log('✅ User found:', user.id, user.email);

        // Create welcome notification
        const notification = await prisma.notification.create({
          data: {
            userId: user.id,
            type: 'welcome',
            title: 'Welcome to NaukriMili!',
            message: `Welcome ${user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.firstName || 'User'}! Your account has been created successfully.`,
            isRead: false
          }
        });

        console.log('✅ Welcome notification created:', notification.id);

        // Send welcome email
        const userName = user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.firstName || 'User';
        console.log('📧 Triggering welcome email for:', user.email);

        try {
          const { sendWelcomeEmail } = await import('@/lib/welcome-email');
          await sendWelcomeEmail({
            email: user.email,
            name: userName,
            provider: 'google'
          });
          console.log('✅ Welcome email sent successfully to:', user.email);
        } catch (emailError) {
          console.error('❌ Failed to send welcome email:', emailError);
        }

        console.log('✅ Welcome flow completed for:', user.email);
      } catch (error) {
        console.error('❌ Error in createUser event:', error);
      }
    },
  },
  callbacks: {
    async jwt({ token, user, account, trigger }) {
      console.log('🔍 JWT callback - Processing:', { 
        email: token.email, 
        provider: account?.provider,
        userId: user?.id,
        trigger: trigger
      });

      // Always fetch fresh user data from database to ensure we have the latest role
      if (token.id) {
        console.log('🔍 JWT callback - Fetching fresh user data for:', token.id);
        
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            isActive: true,
            isVerified: true,
            image: true
          }
        });

        if (dbUser) {
          console.log('🔍 JWT callback - Fresh user data:', {
            id: dbUser.id,
            email: dbUser.email,
            role: dbUser.role,
            isActive: dbUser.isActive,
            isVerified: dbUser.isVerified
          });

          token.id = dbUser.id;
          token.role = dbUser.role;
          token.isActive = dbUser.isActive;
          token.isVerified = dbUser.isVerified;
          token.firstName = dbUser.firstName;
          token.lastName = dbUser.lastName;
          token.image = dbUser.image;
        }
      }

      // Handle initial OAuth sign-in
      if (account?.provider === 'google' && user) {
        console.log('🔍 JWT callback - Processing Google OAuth:', { 
          email: user.email, 
          userId: user.id 
        });

        // Get the user from database to ensure we have the latest data
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            isActive: true,
            isVerified: true,
            image: true
          }
        });

        if (dbUser) {
          console.log('🔍 JWT callback - User found in database:', {
            id: dbUser.id,
            email: dbUser.email,
            role: dbUser.role,
            isActive: dbUser.isActive,
            isVerified: dbUser.isVerified
          });

          token.id = dbUser.id;
          token.role = dbUser.role;
          token.isActive = dbUser.isActive;
          token.isVerified = dbUser.isVerified;
          token.firstName = dbUser.firstName;
          token.lastName = dbUser.lastName;
          token.image = dbUser.image;
        } else {
          console.log('🔍 JWT callback - User NOT found in database, using token data');
          token.id = user.id;
          token.role = (user as any).role;
          token.isActive = (user as any).isActive;
          token.isVerified = (user as any).isVerified;
          token.firstName = (user as any).firstName;
          token.lastName = (user as any).lastName;
        }
      }

      return token;
    },
     async session({ session, token }) {
       if (token) {
         (session.user as any).id = token.id as string;
         (session.user as any).role = token.role as string;
         (session.user as any).isActive = token.isActive as boolean;
         (session.user as any).isVerified = token.isVerified as boolean;
         (session.user as any).firstName = token.firstName as string;
         (session.user as any).lastName = token.lastName as string;
         (session.user as any).image = token.image as string;
       }

       return session;
     },
    async redirect({ url, baseUrl }) {
      // Allows relative callback URLs
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      // Allows callback URLs on the same origin
      else if (new URL(url).origin === baseUrl) return url;
      
      const defaultRedirect = `${baseUrl}/auth/role-selection`;
      console.log('🔍 NextAuth Redirect - Default redirecting to:', defaultRedirect);
      return defaultRedirect;
    }
  },
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 1 day (reduced from 30 days)
  },
  useSecureCookies: process.env.NODE_ENV === 'production'
});
