import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

// Enhanced user interface for session
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role: 'jobseeker' | 'employer' | 'recruiter' | 'admin';
      profileCompletion: number;
      createdAt?: Date;
      updatedAt?: Date;
    };
  }

  interface User {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role: 'jobseeker' | 'employer' | 'recruiter' | 'admin';
    profileCompletion: number;
    createdAt?: Date;
    updatedAt?: Date;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: 'jobseeker' | 'employer' | 'recruiter' | 'admin';
    profileCompletion: number;
    createdAt?: Date;
    updatedAt?: Date;
  }
}

// Mock user database - replace with actual database
const mockUsers = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john.doe@example.com',
    password: 'password123', // In real app, this would be hashed
    role: 'jobseeker' as const,
    profileCompletion: 85,
    image: null,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2025-08-01')
  },
  {
    id: '2',
    name: 'Sarah Johnson',
    email: 'sarah.johnson@techcorp.com',
    password: 'recruiter123',
    role: 'recruiter' as const,
    profileCompletion: 100,
    image: '/avatars/recruiter1.jpg',
    createdAt: new Date('2024-02-20'),
    updatedAt: new Date('2025-07-30')
  },
  {
    id: '3',
    name: 'Mike Chen',
    email: 'mike.chen@startup.io',
    password: 'employer123',
    role: 'employer' as const,
    profileCompletion: 90,
    image: '/avatars/employer1.jpg',
    createdAt: new Date('2024-03-10'),
    updatedAt: new Date('2025-07-28')
  }
];

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        // Find user in mock database
        const user = mockUsers.find(u => u.email === credentials.email);
        
        if (!user) {
          return null;
        }

        // In a real app, verify hashed password
        if (user.password !== credentials.password) {
          return null;
        }

        // Return user object (excluding password)
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          role: user.role,
          profileCompletion: user.profileCompletion,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        };
      }
    })
  ],
  pages: {
    signIn: '/auth/login',
    error: '/auth/error'
  },
  callbacks: {
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.profileCompletion = token.profileCompletion;
        session.user.createdAt = token.createdAt;
        session.user.updatedAt = token.updatedAt;
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.profileCompletion = user.profileCompletion;
        token.createdAt = user.createdAt;
        token.updatedAt = user.updatedAt;
      }
      return token;
    }
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60 // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET || 'fallback-secret-for-development-only'
};