import NextAuth from "next-auth";
import { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";

const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }
        
        try {
          // Check if backend API is available for authentication
          const backendUrl = process.env.BACKEND_API_URL;
          if (backendUrl) {
            const response = await fetch(`${backendUrl}/auth/login`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                email: credentials.email,
                password: credentials.password,
              }),
            });

            if (response.ok) {
              const user = await response.json();
              return {
                id: user.id,
                email: user.email,
                name: user.name,
              };
            }
          }

          // Fallback for demo purposes
          if (credentials.email === 'demo@example.com' && credentials.password === 'demo123') {
            return {
              id: "demo-user",
              email: credentials.email,
              name: "Demo User",
            };
          }
          
          return null;
        } catch (error) {
          console.error("Authentication error:", error);
          return null;
        }
      }
    }),
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET ? [
      GoogleProvider({
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      })
    ] : []),
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/auth/login",
    signOut: "/auth/logout",
    error: "/auth/error",
  },
  callbacks: {
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = (token.sub || token.id) as string;
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.id = user.id;
      }
      return token;
    }
  },
  secret: process.env.NEXTAUTH_SECRET || 'fallback-secret-for-development',
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
