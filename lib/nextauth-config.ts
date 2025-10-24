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

      // Send welcome email
      const userName = firstName && lastName ? `${firstName} ${lastName}` : firstName || 'User';
      console.log('📧 Triggering welcome email for:', newUser.email);

      try {
        const { sendWelcomeEmail } = await import('@/lib/welcome-email');
        await sendWelcomeEmail({
          email: newUser.email,
          name: userName,
          provider: 'google'
        });
        console.log('✅ Welcome email sent successfully to:', newUser.email);
      } catch (emailError) {
        console.error('❌ Failed to send welcome email:', emailError);
        // Don't block user creation if email fails
      }

      console.log('✅ Welcome flow completed for:', newUser.email);
    } catch (notificationError) {
      console.error('❌ Failed to send welcome notification:', notificationError);
      // Don't fail user creation if notification fails
    }

    return newUser;
  },
}; 

// Validate NEXTAUTH_SECRET - Allow build to proceed but warn for production
const nextAuthSecret = process.env.NEXTAUTH_SECRET || 'build-time-placeholder-secret-key-32-chars-minimum'

if (!process.env.NEXTAUTH_SECRET) {
  console.warn("⚠️ NEXTAUTH_SECRET environment variable is not set. Using placeholder for build.");
  console.warn("⚠️ Make sure to set NEXTAUTH_SECRET before running in production!");
} else if (process.env.NEXTAUTH_SECRET.length < 32) {
  console.error("❌ NEXTAUTH_SECRET must be at least 32 characters long!");
  throw new Error("NEXTAUTH_SECRET must be at least 32 characters long");
}

console.log("✅ NEXTAUTH_SECRET is properly configured");

// Validate NEXTAUTH_URL - this is REQUIRED for production
const nextAuthUrl = process.env.NEXTAUTH_URL

if (!nextAuthUrl) {
  console.error("❌ NEXTAUTH_URL environment variable is REQUIRED but not set!");
  console.error("❌ Authentication will fail without a proper URL.");
  throw new Error("NEXTAUTH_URL environment variable is required");
}

if (!nextAuthUrl.startsWith('http')) {
  console.error("❌ NEXTAUTH_URL must be a valid URL starting with http:// or https://");
  throw new Error("NEXTAUTH_URL must be a valid URL");
}

console.log("✅ NEXTAUTH_URL is properly configured:", nextAuthUrl);

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
  debug: false, // Disable debug for better performance
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  providers: [
    ...(googleClientId && googleClientSecret ? [
      Google({
        clientId: googleClientId,
        clientSecret: googleClientSecret,
        // Fast OAuth configuration
        authorization: {
          params: {
            scope: "openid email profile",
            access_type: "offline",
            prompt: "select_account"
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
    async jwt({ token, user, account, profile }) {
      console.log('🔄 JWT callback:', { token: token.id, user: user?.email, account: account?.provider });
      
      if (user) {
        // Store only essential data to prevent large cookies
        token.id = user.id;
        token.role = (user as any).role;
        token.isActive = (user as any).isActive;
        token.isVerified = (user as any).isVerified;
        
        // Create a clean name field
        const firstName = (user as any).firstName || '';
        const lastName = (user as any).lastName || '';
        const fullName = `${firstName} ${lastName}`.trim();
        
        // Only store clean names, fallback to email if corrupted
        if (fullName && !fullName.includes('PDF') && !fullName.includes('%') && fullName.length < 50) {
          token.name = fullName;
        } else {
          token.name = user.email?.split('@')[0] || 'User';
        }
        
        // Only store image if it's a reasonable size
        if ((user as any).image && (user as any).image.length < 200) {
          token.image = (user as any).image;
        }
        
        console.log('✅ JWT name set:', token.name);
      }
      
      return token;
    },
    async session({ session, token }) {
      console.log('🔄 Session callback:', { 
        sessionUser: session.user?.email, 
        tokenId: token.id,
        tokenName: token.name
      });
      
      if (token) {
        (session.user as any).id = token.id as string;
        (session.user as any).role = token.role as string;
        (session.user as any).isActive = token.isActive as boolean;
        (session.user as any).isVerified = token.isVerified as boolean;
        (session.user as any).name = token.name as string;
        (session.user as any).image = token.image as string;
        
        console.log('✅ Session name set:', (session.user as any).name);
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      console.log('🔄 Redirect callback:', { url, baseUrl });
      
      // Handle relative URLs
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      
      // Handle same origin URLs
      if (new URL(url).origin === baseUrl) return url;
      
      // Default redirect to role selection
      return `${baseUrl}/auth/role-selection`;
    },
    // Add signIn callback for better error handling
    async signIn({ user, account, profile, email, credentials }) {
      console.log('🔄 SignIn callback:', { 
        user: user?.email, 
        account: account?.provider, 
        profile: profile?.email 
      });
      
      // Allow all sign-ins for now
      return true;
    }
  },
  session: {
    strategy: 'jwt' as const,
    maxAge: 7 * 24 * 60 * 60, // 7 days for better UX
  },
  useSecureCookies: process.env.NODE_ENV === 'production',
  cookies: {
    sessionToken: {
      name: `__Secure-next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax' as const,
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 1 * 60 * 60, // 1 hour - further reduced to prevent large sessions
      },
    },
  },
  // Add proper error handling
  events: {
    async signIn({ user, account, profile, isNewUser }) {
      console.log('🎉 SignIn event:', { 
        user: user.email, 
        account: account?.provider, 
        isNewUser 
      });
    },
    async signOut({ token }) {
      console.log('👋 SignOut event:', { user: token?.email });
    },
    async createUser({ user }) {
      console.log('👤 User created:', { 
        email: user.email, 
        id: user.id,
        timestamp: new Date().toISOString()
      });
    },
    async linkAccount({ user, account, profile }) {
      console.log('🔗 Account linked:', { 
        user: user.email, 
        provider: account.provider,
        providerAccountId: account.providerAccountId,
        timestamp: new Date().toISOString()
      });
    }
  }
};

export const { handlers, auth, signIn, signOut } = NextAuth(nextAuthOptions);
