#!/bin/bash

echo "🔧 Complete OAuth Configuration Fix for Production..."

# Backup current config
cp lib/nextauth-config.ts lib/nextauth-config.ts.backup.$(date +%Y%m%d_%H%M%S)

# Check environment variables
echo "🔍 Checking environment variables..."
if [ -z "$GOOGLE_CLIENT_ID" ]; then
    echo "❌ GOOGLE_CLIENT_ID not found in environment"
    exit 1
fi

if [ -z "$GOOGLE_CLIENT_SECRET" ]; then
    echo "❌ GOOGLE_CLIENT_SECRET not found in environment"
    exit 1
fi

if [ -z "$NEXTAUTH_SECRET" ]; then
    echo "❌ NEXTAUTH_SECRET not found in environment"
    exit 1
fi

echo "✅ Environment variables found"

# Create a completely clean OAuth configuration
cat > lib/nextauth-config.ts << 'EOL'
import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import Credentials from "next-auth/providers/credentials"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"

// Get environment variables
const nextAuthSecret = process.env.NEXTAUTH_SECRET;
const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;

if (!nextAuthSecret) {
  throw new Error('NEXTAUTH_SECRET is not set');
}

if (!googleClientId || !googleClientSecret) {
  throw new Error('Google OAuth credentials are not set');
}

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
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    });

    console.log('✅ User created successfully:', newUser.email);
    return newUser;
  }
};

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
    Google({
      clientId: googleClientId,
      clientSecret: googleClientSecret,
      // ✅ Clean OAuth configuration
      profile(profile) {
        return {
          id: profile.sub,
          email: profile.email,
          name: profile.name,
          image: profile.picture,
        }
      }
    }),
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
          const user = await prisma.user.findUnique({
            where: { email: credentials.email }
          });

          if (!user) {
            return null;
          }

          return {
            id: user.id,
            email: user.email,
            name: `${user.firstName} ${user.lastName}`.trim(),
            image: user.image,
          };
        } catch (error) {
          console.error('Auth error:', error);
          return null;
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
    async signIn({ user, account, profile }) {
      if (account?.provider === 'google') {
        try {
          // Check if user exists
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email! }
          });

          if (!existingUser) {
            console.log('🆕 New Google user signing in:', user.email);
          } else {
            console.log('👤 Existing Google user signing in:', user.email);
          }

          return true;
        } catch (error) {
          console.error('❌ SignIn error:', error);
          return false;
        }
      }
      return true;
    }
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
  }
};

export const { handlers, auth, signIn, signOut } = NextAuth(nextAuthOptions);
EOL

echo "✅ OAuth configuration created"

# Stop the application
echo "🛑 Stopping application..."
pm2 stop naukrimili

# Rebuild the application
echo "🔧 Rebuilding application..."
NODE_OPTIONS="--max-old-space-size=8192" NEXT_TELEMETRY_DISABLED=1 npx next build

if [ $? -eq 0 ]; then
    echo "✅ Build successful"
    
    # Start the application
    echo "🚀 Starting application..."
    pm2 start naukrimili
    
    # Wait a moment for startup
    sleep 5
    
    # Check if application is running
    if pm2 list | grep -q "naukrimili.*online"; then
        echo "✅ OAuth fix completed successfully!"
        echo "🔍 Application is running and ready for testing"
    else
        echo "❌ Application failed to start"
        pm2 logs naukrimili --lines 10
    fi
else
    echo "❌ Build failed, restoring backup..."
    mv lib/nextauth-config.ts.backup.* lib/nextauth-config.ts
    echo "🔄 Original configuration restored"
    pm2 start naukrimili
fi
