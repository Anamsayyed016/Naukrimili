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

          // Verify password using bcrypt
          const isValidPassword = await bcrypt.compare(
            credentials.password as string,
            user.password
          );

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
            role: user.role || 'jobseeker',
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
      console.log('NextAuth signIn callback - user:', user?.email, 'provider:', account?.provider)
      
      // Handle credentials provider
      if (account?.provider === 'credentials') {
        // Credentials are already validated in the authorize function
        // Just ensure the user object has required fields
        if (user?.id && user?.email) {
          console.log('✅ Credentials sign-in successful for:', user.email);
          return true;
        }
        return false;
      }
      
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
          user.role = dbUser.role || null
        } catch (error) {
          console.error('Error in signIn callback:', error)
          return false
        }
      }

      return true
    },
    async jwt({ token, user, account }) {
      // Initial sign in - user object is available
      if (user && account) {
        token.id = user.id;
        token.role = (user as any).role || 'jobseeker';
        token.email = user.email;
        token.name = user.name;
        console.log('✅ JWT callback - Initial sign in:', { id: token.id, role: token.role, email: token.email });
        return token;
      }

      // Subsequent requests - fetch fresh user data from database
      if (token.id) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.id as string }
          });

          if (dbUser && dbUser.isActive) {
            token.role = dbUser.role || 'jobseeker';
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
}

const handler = NextAuth(authOptions)

export default handler
export { authOptions }

// Export auth function for use in API routes
export async function auth() {
  return await getServerSession(authOptions)
}
