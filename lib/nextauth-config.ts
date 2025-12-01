import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import GitHubProvider from "next-auth/providers/github"
import CredentialsProvider from "next-auth/providers/credentials"
import { getServerSession } from "next-auth/next"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"  // Use singleton instance instead of creating new one

// Allow build to proceed without NEXTAUTH_SECRET, but it must be set at runtime
const nextAuthSecret = process.env.NEXTAUTH_SECRET || (process.env.NODE_ENV === 'production' ? undefined : 'build-time-placeholder-secret-key-for-development');

if (!process.env.NEXTAUTH_SECRET && process.env.NODE_ENV === 'production') {
  console.warn("⚠️ NEXTAUTH_SECRET environment variable is not set. This will cause runtime errors in production!");
} else if (!process.env.NEXTAUTH_SECRET) {
  console.warn("⚠️ NEXTAUTH_SECRET environment variable is not set. Using placeholder for build.");
}

const authOptions = {
  secret: nextAuthSecret,
  trustHost: true,
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === 'production' 
        ? '__Secure-next-auth.session-token' 
        : 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
  providers: [
    // Only add OAuth providers if credentials are available (avoid build-time errors)
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),
    ...(process.env.GITHUB_ID && process.env.GITHUB_SECRET
      ? [
          GitHubProvider({
            clientId: process.env.GITHUB_ID,
            clientSecret: process.env.GITHUB_SECRET,
          }),
        ]
      : []),
    CredentialsProvider({
      id: "credentials",
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          console.error('❌ Credentials missing: email or password not provided');
          return null;
        }

        try {
          // Find user by email
          const user = await prisma.user.findUnique({
            where: { email: credentials.email as string }
          });

          // Check if user exists
          if (!user) {
            console.error('❌ User not found:', credentials.email);
            return null;
          }

          // Check if user has a password (required for credentials login)
          if (!user.password) {
            console.error('❌ User has no password set:', credentials.email);
            return null;
          }

          // Check if user is active
          if (!user.isActive) {
            console.error('❌ User account is inactive:', credentials.email);
            return null;
          }

          // Verify password using bcrypt; support legacy plaintext and upgrade in-place
          let isValidPassword = false;
          try {
            isValidPassword = await bcrypt.compare(
              credentials.password as string,
              user.password
            );
          } catch (_e) {
            isValidPassword = false;
          }

          // Legacy fallback: if stored password is plaintext and matches, hash and upgrade
          if (!isValidPassword && user.password === (credentials.password as string)) {
            try {
              const newHash = await bcrypt.hash(credentials.password as string, 12);
              await prisma.user.update({
                where: { id: user.id },
                data: { password: newHash },
              });
              isValidPassword = true;
              console.log('🔐 Upgraded legacy plaintext password to bcrypt hash for:', credentials.email);
            } catch (upgradeError) {
              console.error('❌ Failed upgrading legacy password hash:', upgradeError);
              isValidPassword = true; // allow this login but log the error
            }
          }

          if (!isValidPassword) {
            console.error('❌ Invalid password for user:', credentials.email);
            return null;
          }

          console.log('✅ Credentials authentication successful for:', credentials.email);

          // Return user object for NextAuth
          return {
            id: user.id,
            email: user.email,
            name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
            image: user.image,
            role: user.role ?? null,
          };
        } catch (error) {
          console.error('❌ Credentials auth error:', error);
          return null;
        }
      }
    })
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      console.log('NextAuth signIn callback - user:', user?.email, 'provider:', account?.provider, 'account:', account)
      
      // Handle credentials provider - account may be null or have provider = 'credentials'
      if (!account || account?.provider === 'credentials') {
        // For credentials provider, user is already validated in authorize function
        // Just ensure the user object has required fields
        if (user?.id && user?.email) {
          console.log('✅ Credentials sign-in successful for:', user.email);
          return true;
        }
        console.error('❌ Credentials sign-in failed - missing user data:', { hasId: !!user?.id, hasEmail: !!user?.email });
        return false;
      }
      
      // Handle OAuth providers (Google, GitHub) - KEEP EXISTING CODE
      if (account?.provider === 'google' || account?.provider === 'github') {
        try {
          // Check if user exists in database
          let dbUser = await prisma.user.findUnique({
            where: { email: user.email! }
          })

          // Parse name into firstName and lastName
          const nameParts = (user.name || '').split(' ')
          const firstName = nameParts[0] || ''
          const lastName = nameParts.slice(1).join(' ') || ''

          // If user doesn't exist, create them
          if (!dbUser) {
            dbUser = await prisma.user.create({
              data: {
                email: user.email!,
                firstName,
                lastName,
                image: user.image || '',
                role: null,  // Explicitly set to null for role selection
                roleLocked: false,
                isActive: true,
                isVerified: true  // OAuth users are pre-verified
              }
            })
            console.log('Created new user in database:', dbUser.id, '(role: null - needs selection)')
            // Fire-and-forget welcome email (non-blocking)
            ;(async () => {
              try {
                const { mailerService } = await import('@/lib/gmail-oauth2-mailer')
                await mailerService.sendWelcomeEmail(user.email!, firstName || user.email!, account.provider)
              } catch (e) {
                console.warn('Welcome email failed:', e)
              }
            })()
          } else {
            // Update name if it changed
            if (firstName && dbUser.firstName !== firstName) {
              dbUser = await prisma.user.update({
                where: { id: dbUser.id },
                data: {
                  firstName,
                  lastName,
                  image: user.image || dbUser.image
                }
              })
            }
            console.log('User already exists in database:', dbUser.id)
          }

          // Attach the database user ID to the session user
          user.id = dbUser.id.toString()
          user.role = dbUser.role ?? null
        } catch (error) {
          console.error('Error in signIn callback:', error)
          return false
        }
      }

      return true
    },
    async jwt({ token, user, account }) {
      console.log('JWT callback - user:', user?.email, 'account provider:', account?.provider, 'has token.id:', !!token.id);
      
      // Initial sign in - user object is available (works for both credentials and OAuth)
      // For credentials, account may be null/undefined, so check user only
      if (user) {
        token.id = user.id;
        token.role = (user as any).role ?? null;
        token.email = user.email;
        token.name = user.name;
        token.image = (user as any).image;
        console.log('✅ JWT callback - Initial sign in:', { id: token.id, role: token.role, email: token.email, provider: account?.provider || 'credentials' });
        return token;
      }

      // Subsequent requests - fetch fresh user data from database
      if (token.id) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.id as string }
          });

          if (dbUser && dbUser.isActive) {
            token.role = dbUser.role ?? null;
            token.email = dbUser.email;
            token.name = `${dbUser.firstName || ''} ${dbUser.lastName || ''}`.trim() || dbUser.email;
            token.image = dbUser.image;
          } else {
            // User not found or inactive
            console.error('❌ JWT callback - User not found or inactive:', token.id);
            return {};
          }
        } catch (error) {
          console.error('❌ JWT callback error:', error);
          return {};
        }
      }

      return token;
    },
    async session({ session, token }) {
      console.log('NextAuth session callback - token:', { id: token.id, role: token.role, email: token.email })
      
      if (session?.user && token) {
        // Add user data from token to session
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.name = token.name as string;
        session.user.image = token.image as string | null;
      }

      return session;
    },
    async redirect({ url, baseUrl }) {
      console.log('🔄 NextAuth redirect callback called');
      console.log('📍 URL param:', url);
      console.log('📍 BaseUrl:', baseUrl);
      
      // Normalize baseUrl to canonical format (remove www, force https)
      const { getBaseUrl } = await import('@/lib/url-utils');
      const canonicalBaseUrl = getBaseUrl();
      
      // Handle relative URLs
      if (url.startsWith("/")) {
        console.log('✅ Relative URL detected:', url);
        return `${canonicalBaseUrl}${url}`;
      }
      
      // Handle same-origin URLs - normalize to canonical
      try {
        const urlObj = new URL(url);
        if (urlObj.origin === baseUrl || urlObj.origin.replace('www.', '') === canonicalBaseUrl.replace('https://', '')) {
          console.log('✅ Same-origin URL detected, normalizing:', url);
          return `${canonicalBaseUrl}${urlObj.pathname}${urlObj.search}${urlObj.hash}`;
        }
      } catch {
        // If URL parsing fails, use canonical base URL
      }
      
      // For OAuth callbacks, check user role DIRECTLY from database
      // This prevents the confusing role-selection page flash for existing users
      try {
        console.log('🔍 Checking user role for redirect decision...');
        
        // Extract email from the URL or get current session
        const session = await getServerSession(authOptions);
        
        if (session?.user?.email) {
          console.log('👤 Session found for:', session.user.email);
          
          // Fetch user directly from database to get current role
          const dbUser = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: { role: true, id: true, roleLocked: true }
          });
          
          console.log('📊 Database user:', { id: dbUser?.id, role: dbUser?.role, roleLocked: dbUser?.roleLocked });
          
          if (dbUser?.role) {
            // User has a role - redirect directly to their dashboard
            console.log(`✅ Existing user with role "${dbUser.role}", redirecting to dashboard`);
            switch (dbUser.role) {
              case 'jobseeker':
                console.log('➡️  Redirecting to: /dashboard/jobseeker');
                return `${canonicalBaseUrl}/dashboard/jobseeker`;
              case 'employer':
                console.log('➡️  Redirecting to: /dashboard/company');
                return `${canonicalBaseUrl}/dashboard/company`;
              case 'admin':
                console.log('➡️  Redirecting to: /dashboard/admin');
                return `${canonicalBaseUrl}/dashboard/admin`;
              default:
                console.warn(`⚠️ Unknown role: ${dbUser.role}, sending to role selection`);
                return `${canonicalBaseUrl}/auth/role-selection`;
            }
          } else {
            // User exists but no role - need to select role
            console.log('🆕 NEW USER - No role set, MUST go to role selection');
            console.log('➡️  Redirecting to: /auth/role-selection');
            return `${canonicalBaseUrl}/auth/role-selection`;
          }
        } else {
          console.warn('⚠️ No session user email found');
        }
      } catch (error) {
        console.error('❌ Redirect callback error:', error);
      }
      
      // Fallback to role selection for safety
      console.log('⚠️ Fallback: No user found in session, defaulting to role selection');
      console.log('➡️  Redirecting to: /auth/role-selection');
      return `${canonicalBaseUrl}/auth/role-selection`;
    },
  },
  session: {
    strategy: 'jwt' as const,
  },
}

const handler = NextAuth(authOptions)

export default handler
export { authOptions }

// Export auth function for use in API routes
export async function auth() {
  return await getServerSession(authOptions)
}
