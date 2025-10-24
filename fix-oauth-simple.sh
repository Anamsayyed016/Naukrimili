#!/bin/bash

echo "🔧 Simple OAuth Configuration Fix..."

# Backup current config
cp lib/nextauth-config.ts lib/nextauth-config.ts.backup.$(date +%Y%m%d_%H%M%S)

# Stop the application
echo "🛑 Stopping application..."
pm2 stop naukrimili

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

// Custom Prisma Adapter
const baseAdapter = PrismaAdapter(prisma);

const adapter = {
  ...baseAdapter,
  createUser: async (user: any) => {
    console.log('🎉 Custom adapter createUser called for:', user.email);
    
    const nameParts = user.name ? user.name.split(' ') : ['', ''];
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';
    const { name, ...userData } = user;

    const newUser = await prisma.user.create({
      data: {
        id: userData.id,
        email: userData.email,
        emailVerified: userData.emailVerified || null,
        image: userData.image || null,
        firstName,
        lastName,
        role: null,
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
    ...(googleClientId && googleClientSecret ? [
      Google({
        clientId: googleClientId,
        clientSecret: googleClientSecret,
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
    maxAge: 30 * 24 * 60 * 60,
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60,
  }
};

export const { handlers, auth, signIn, signOut } = NextAuth(nextAuthOptions);
EOL

echo "✅ OAuth configuration created"

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
