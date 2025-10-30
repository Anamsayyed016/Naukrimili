import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import GitHubProvider from "next-auth/providers/github"
import CredentialsProvider from "next-auth/providers/credentials"
import { PrismaClient } from "@prisma/client"
import { getServerSession } from "next-auth/next"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

const authOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  trustHost: true,
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
    }),
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
              }
            })
            console.log('Created new user in database:', dbUser.id)
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
      if (url.startsWith("/")) return `${baseUrl}${url}`
      if (new URL(url).origin === baseUrl) return url
      return `${baseUrl}/auth/role-selection`
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
