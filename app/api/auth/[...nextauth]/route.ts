import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import GitHubProvider from "next-auth/providers/github"
import CredentialsProvider from "next-auth/providers/credentials"
import { PrismaClient } from "@prisma/client"

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
          return null
        }
        // Add your custom authentication logic here
        return null
      }
    })
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      console.log('NextAuth signIn callback - user:', user?.email)
      
      if (account?.provider === 'google' || account?.provider === 'github') {
        try {
          // Check if user exists in database
          let dbUser = await prisma.user.findUnique({
            where: { email: user.email! }
          })

          // If user doesn't exist, create them
          if (!dbUser) {
            dbUser = await prisma.user.create({
              data: {
                email: user.email!,
                name: user.name || '',
                image: user.image || '',
              }
            })
            console.log('Created new user in database:', dbUser.id)
          } else {
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
    async session({ session, token }) {
      console.log('NextAuth session callback - token:', token)
      
      if (session?.user) {
        // Get user from database
        const dbUser = await prisma.user.findUnique({
          where: { email: session.user.email! }
        })

        if (dbUser) {
          session.user.id = dbUser.id.toString()
          session.user.role = dbUser.role
          session.user.name = dbUser.name || null
          session.user.image = dbUser.image || null
        }
      }

      return session
    },
    async redirect({ url, baseUrl }) {
      if (url.startsWith("/")) return `${baseUrl}${url}`
      if (new URL(url).origin === baseUrl) return url
      return `${baseUrl}/auth/role-selection`
    },
  },
}

const handler = NextAuth(authOptions)

export const GET = handler
export const POST = handler
