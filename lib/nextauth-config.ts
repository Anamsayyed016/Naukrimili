import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import Credentials from "next-auth/providers/credentials"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"

// Custom adapter to handle name field properly
const customPrismaAdapter = {
  ...PrismaAdapter(prisma),
  async createUser(user) {
    console.log('🎉 Custom adapter createUser called for:', user.email);

    // Split name into firstName and lastName
    const nameParts = user.name ? user.name.split(' ') : ['', ''];
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    // Remove name field and add firstName/lastName
    const { name, ...userData} = user;

    const newUser = await prisma.user.create({
      data: {
        ...userData,
        firstName,
        lastName,
        // Set default values for required fields
        role: userData.role || null, // Don't default to jobseeker - user must select
        isActive: userData.isActive ?? true,
        isVerified: userData.isVerified ?? false,
      }
    });

    console.log('✅ User created in database:', newUser.id, newUser.email);

    // Send welcome email and notification for new user
    try {
      console.log('🔔 Creating welcome notification for new user:', newUser.id, newUser.email);

      // Create a simple notification record
      const notification = await prisma.notification.create({
        data: {
          userId: newUser.id,
          type: 'welcome',
          title: 'Welcome to NaukriMili!',
          message: `Welcome ${firstName && lastName ? `${firstName} ${lastName}` : firstName || 'User'}! Your account has been created successfully.`,
          isRead: false
        }
      });

      console.log('✅ Welcome notification created:', notification.id);

      // Send welcome email via internal API (non-blocking)
      const userName = firstName && lastName ? `${firstName} ${lastName}` : firstName || 'User';

      console.log('📧 Triggering welcome email for:', newUser.email);

      // Fire and forget - don't block OAuth flow
      fetch(`https://naukrimili.com/api/internal/send-welcome-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-internal-secret': 'naukrimili-secret-key-2024-production-deployment'
        },
        body: JSON.stringify({
          email: newUser.email,
          name: userName,
          provider: 'google'
        })
      }).then(res => {
        console.log('✅ Welcome email API response:', res.status, res.statusText);
        return res.json();
      }).then(data => {
        console.log('✅ Welcome email sent successfully:', data);
      }).catch(err => {
        console.error('❌ Failed to trigger welcome email:', err);
      });

      console.log('✅ Welcome notification created and email triggered for new user');
    } catch (notificationError) {
      console.error('❌ Failed to send welcome notification:', notificationError);
      console.error('❌ Error details:', notificationError);
      // Don't fail user creation if notification fails
    }

    return newUser;
  }
}

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
  adapter: customPrismaAdapter,
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
  callbacks: {
    async jwt({ token, user, account }) {
      console.log('🔍 JWT callback - Processing:', { 
        email: token.email, 
        provider: account?.provider,
        userId: user?.id 
      });

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
      
      const defaultRedirect = `${baseUrl}/roles/choose`;
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
