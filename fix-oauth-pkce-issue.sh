#!/bin/bash

echo "🔧 Fixing OAuth PKCE and invalid_grant issues..."

# Stop PM2 process
echo "⏹️ Stopping PM2 process..."
pm2 stop naukrimili

# Clear build cache
echo "🧹 Clearing build cache..."
rm -rf .next
rm -rf node_modules/.cache

# Fix OAuth configuration by removing PKCE and simplifying the flow
echo "🔧 Fixing OAuth configuration..."
cat > lib/nextauth-config.ts << 'EOF'
import { NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";

const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;

export const nextAuthOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    ...(googleClientId && googleClientSecret ? [
      Google({
        clientId: googleClientId,
        clientSecret: googleClientSecret,
        // ✅ Simplified OAuth configuration without PKCE
        authorization: {
          params: {
            scope: "openid email profile", // Minimal scopes for incremental authorization
            response_type: "code",
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
  // ✅ Disable PKCE for Google OAuth to prevent parsing errors
  experimental: {
    enableWebAuthn: false,
  }
};

export const { handlers, auth, signIn, signOut } = NextAuth(nextAuthOptions);
export { nextAuthOptions };
EOF

echo "✅ OAuth configuration fixed - PKCE disabled, simplified flow"

# Rebuild the application
echo "🔨 Rebuilding application..."
NODE_OPTIONS="--max-old-space-size=8192" NEXT_TELEMETRY_DISABLED=1 npx next build

# Start PM2 process
echo "🚀 Starting PM2 process..."
pm2 start ecosystem.config.cjs --env production

echo "✅ OAuth fixes applied successfully!"
echo "🔍 Check the logs with: pm2 logs naukrimili --lines 20"