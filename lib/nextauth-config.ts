import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import GitHub from "next-auth/providers/github"
import Credentials from "next-auth/providers/credentials"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"

// Custom Prisma Adapter to handle name field mapping
const baseAdapter = PrismaAdapter(prisma);

const adapter = {
  ...baseAdapter,
  createUser: async (user: any) => {
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

    // Send welcome email and notification for new user
    try {

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

      // Send welcome email
      const userName = firstName && lastName ? `${firstName} ${lastName}` : firstName || 'User';

      try {
        const { sendWelcomeEmail } = await import('@/lib/welcome-email');
        await sendWelcomeEmail({
          email: newUser.email,
          name: userName,
          provider: 'google'
        });
      } catch (emailError) {
        // Don't block user creation if email fails
      }
    } catch (notificationError) {
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

// Validate NEXTAUTH_URL - Allow undefined on client side when trustHost is true
const nextAuthUrl = process.env.NEXTAUTH_URL || undefined

// Only validate server-side, client side will use trustHost to auto-detect
if (typeof window === 'undefined') {
  if (!nextAuthUrl) {
    console.warn("⚠️ NEXTAUTH_URL environment variable is not set. Using trustHost for auto-detection.");
  } else if (!nextAuthUrl.startsWith('http')) {
    console.error("❌ NEXTAUTH_URL must be a valid URL starting with http:// or https://");
    throw new Error("NEXTAUTH_URL must be a valid URL");
  } else {
    console.log("✅ NEXTAUTH_URL is properly configured:", nextAuthUrl);
  }
}

const googleClientId = process.env.GOOGLE_CLIENT_ID
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET

if (!googleClientId || !googleClientSecret) {
  console.warn("⚠️ Google OAuth credentials not properly configured. Google sign-in will be disabled.");
  console.warn("   GOOGLE_CLIENT_ID:", googleClientId ? 'Set' : 'Missing');
  console.warn("   GOOGLE_CLIENT_SECRET:", googleClientSecret ? 'Set' : 'Missing');
} else {
  console.log("✅ Google OAuth credentials are properly configured");
}

const nextAuthOptions = {
  adapter: adapter,
  secret: nextAuthSecret,
  trustHost: true,
  debug: false, // CRITICAL: Debug disabled for regional OAuth compatibility
  basePath: '/api/auth',
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  providers: [
    ...(googleClientId && googleClientSecret ? [
      Google({
        clientId: googleClientId,
        clientSecret: googleClientSecret,
        // Regional OAuth optimization for Maharashtra/MP compatibility
        authorization: {
          params: {
            scope: "openid email profile",
            access_type: "offline",
            prompt: "select_account",
            // Regional optimizations
            include_granted_scopes: "true",
            response_type: "code"
          }
        }
      })
    ] : []),
    ...(process.env.GITHUB_ID && process.env.GITHUB_SECRET ? [
      GitHub({
        clientId: process.env.GITHUB_ID,
        clientSecret: process.env.GITHUB_SECRET,
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
        
      }
      
      return token;
    },
    async session({ session, token }) {
      if (token) {
        (session.user as any).id = token.id as string;
        (session.user as any).role = token.role as string;
        (session.user as any).isActive = token.isActive as boolean;
        (session.user as any).isVerified = token.isVerified as boolean;
        (session.user as any).name = token.name as string;
        (session.user as any).image = token.image as string;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      // Handle relative URLs
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      
      // Handle same origin URLs
      if (new URL(url).origin === baseUrl) return url;
      
      // Default redirect to role selection
      return `${baseUrl}/auth/role-selection`;
    },
    async signIn() {
      return true;
    }
  },
  session: {
    strategy: 'jwt' as const,
    maxAge: 7 * 24 * 60 * 60, // 7 days for better UX
  },
  // Regional OAuth optimizations
  experimental: {
    enableWebAuthn: false, // Disable for regional compatibility
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
  events: {}
};

// Initialize NextAuth with error handling for client-side
let handlers: any;
let auth: any;
let signIn: any;
let signOut: any;

try {
  const nextAuthResult = NextAuth(nextAuthOptions);
  handlers = nextAuthResult.handlers;
  auth = nextAuthResult.auth;
  signIn = nextAuthResult.signIn;
  signOut = nextAuthResult.signOut;
} catch (error: any) {
  // If initialization fails (e.g., on client side), create safe fallbacks
  if (typeof window !== 'undefined') {
    console.warn('⚠️ NextAuth initialization warning (client-side):', error?.message);
    // Export safe fallbacks that won't break the app
    handlers = { GET: () => new Response('Not available', { status: 500 }), POST: () => new Response('Not available', { status: 500 }) };
    auth = async () => null;
    signIn = async () => ({ error: 'Configuration', ok: false });
    signOut = async () => ({ ok: false });
  } else {
    // Server-side: re-throw the error
    throw error;
  }
}

export { handlers, auth, signIn, signOut };
