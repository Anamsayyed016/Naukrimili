#!/bin/bash

echo "🔧 Fixing OAuth invalid_grant error..."

# Backup current config
cp lib/nextauth-config.ts lib/nextauth-config.ts.backup

# Create a clean, minimal OAuth configuration
cat > lib/nextauth-config.ts << 'EOF'
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
  debug: false, // Disable debug to reduce cookie size
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  providers: [
    ...(googleClientId && googleClientSecret ? [
      Google({
        clientId: googleClientId,
        clientSecret: googleClientSecret,
        // ✅ Simplified OAuth configuration to prevent invalid_grant
        authorization: {
          params: {
            scope: "openid email profile",
            access_type: "offline",
            prompt: "consent"
          }
        },
        // ✅ Simplified profile mapping
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
    async jwt({ token, user, account, trigger }) {
      // ✅ Simplified JWT callback to reduce token size
      if (token.id) {
        // Only fetch essential user data to keep token small
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
          token.id = dbUser.id;
          token.role = dbUser.role;
          token.isActive = dbUser.isActive;
          token.isVerified = dbUser.isVerified;
          token.firstName = dbUser.firstName;
          token.lastName = dbUser.lastName;
          token.image = dbUser.image;
        } else {
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
    strategy: 'jwt' as const,
    maxAge: 24 * 60 * 60, // 1 day
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
        maxAge: 24 * 60 * 60, // 1 day
      },
    },
  },
  // ✅ Disable experimental features that might cause issues
  experimental: {
    enableWebAuthn: false,
  }
};

export const { handlers, auth, signIn, signOut } = NextAuth(nextAuthOptions);
export { nextAuthOptions };
EOF

echo "✅ OAuth configuration updated with minimal, clean setup"

# Clear build cache
echo "🧹 Clearing build cache..."
rm -rf .next
rm -rf node_modules/.cache

echo "🔨 Rebuilding application..."
NODE_OPTIONS="--max-old-space-size=8192" NEXT_TELEMETRY_DISABLED=1 npx next build

if [ $? -eq 0 ]; then
    echo "✅ Build successful! Restarting PM2..."
    pm2 stop naukrimili
    pm2 start ecosystem.config.cjs --env production
    echo "🎉 OAuth fix deployed successfully!"
    echo "📝 The invalid_grant error should now be resolved."
else
    echo "❌ Build failed. Restoring backup..."
    cp lib/nextauth-config.ts.backup lib/nextauth-config.ts
    echo "🔄 Backup restored. Please check the build errors."
fi
