import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import Credentials from "next-auth/providers/credentials"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"

// Custom Prisma Adapter to handle name field mapping
const baseAdapter = PrismaAdapter(prisma);

const adapter = {
  ...baseAdapter,
  createUser: async (user: any) => {
    console.log('🎉 Custom adapter createUser called for:', user.email);
    
    // Split name into firstName and lastName
    const nameParts = user.name ? user.name.split(' ') : ['', ''];
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    // Remove name field and add firstName/lastName
    const { name, ...userData } = user;

    const newUser = await prisma.user.create({
      data: {
        id: userData.id,
        email: userData.email,
        emailVerified: userData.emailVerified || null,
        image: userData.image || null,
        firstName,
        lastName,
        // Set default values for required fields
        role: null, // Don't default to jobseeker - user must select
        isActive: true,
        isVerified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    });

    console.log('✅ User created successfully:', newUser.email);
    return newUser;
  }
};

const nextAuthSecret = process.env.NEXTAUTH_SECRET || "naukrimili-secret-key-2024-production-deployment";

if (!nextAuthSecret) {
  throw new Error("NEXTAUTH_SECRET is not set");
}

const googleClientId = process.env.GOOGLE_CLIENT_ID
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET

if (!googleClientId || !googleClientSecret) {
  console.warn("⚠️ Google OAuth credentials not properly configured. Google sign-in will be disabled.");
  console.warn("   GOOGLE_CLIENT_ID:", googleClientId ? 'Set' : 'Missing');
  console.warn("   GOOGLE_CLIENT_SECRET:", googleClientSecret ? 'Set' : 'Missing');
}

const nextAuthOptions = {
  adapter: adapter,
  secret: nextAuthSecret,
  trustHost: true,
  debug: false,
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  providers: [
    ...(googleClientId && googleClientSecret ? [
      Google({
        clientId: googleClientId,
        clientSecret: googleClientSecret,
        authorization: {
          params: {
            access_type: "offline",
            prompt: "consent",
            scope: "openid email profile",
          }
        },
        profile(profile) {
          return {
            id: profile.sub,
            email: profile.email,
            name: profile.name,
            image: profile.picture,
          }
        }
      })
    ] : []),
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        
        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string }
        });
        
        if (!user) return null;
        
        // In a real app, you would hash the password and compare
        // For now, we will just return the user
        return {
          id: user.id,
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
          image: user.image
        };
      }
    })
  ],
  session: {
    strategy: 'jwt' as const,
    maxAge: 24 * 60 * 60, // 1 day
  },
  useSecureCookies: process.env.NODE_ENV === 'production',
  cookies: {
    sessionToken: {
      name: `__Secure-next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60, // 1 day
      },
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

          // Update token with fresh data
          token.role = dbUser.role;
          token.isActive = dbUser.isActive;
          token.isVerified = dbUser.isVerified;
          token.firstName = dbUser.firstName;
          token.lastName = dbUser.lastName;
        }
      }

      // Handle new user creation
      if (user && account) {
        console.log('🔍 JWT callback - New user/account:', {
          userId: user.id,
          email: user.email,
          provider: account.provider
        });

        token.id = user.id;
        token.role = (user as any).role || null;
        token.isActive = (user as any).isActive ?? true;
        token.isVerified = (user as any).isVerified ?? false;
        token.firstName = (user as any).firstName || '';
        token.lastName = (user as any).lastName || '';
      }

      return token;
    },
    async session({ session, token }) {
      console.log('🔍 Session callback - Processing:', {
        email: session.user?.email,
        tokenId: token.id,
        tokenRole: token.role
      });

      if (token.id) {
        session.user.id = token.id as string;
        (session.user as any).role = token.role;
        (session.user as any).isActive = token.isActive;
        (session.user as any).isVerified = token.isVerified;
        (session.user as any).firstName = token.firstName;
        (session.user as any).lastName = token.lastName;
      }

      return session;
    },
    async signIn({ user, account, profile }) {
      console.log('🔍 SignIn callback - Processing:', {
        email: user.email,
        provider: account?.provider,
        profileId: profile?.sub
      });

      if (account?.provider === 'google') {
        console.log('🔍 SignIn callback - Google OAuth detected');
        return true;
      }

      if (account?.provider === 'credentials') {
        console.log('🔍 SignIn callback - Credentials OAuth detected');
        return true;
      }

      return true;
    }
  }
};

export const { handlers, auth, signIn, signOut } = NextAuth(nextAuthOptions);
export { nextAuthOptions };
