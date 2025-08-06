// Mock Auth Library for Frontend Only

export type UserRole = 'jobseeker' | 'company' | 'admin';
export interface User {
  email: string;
  password: string; // hashed
  role: UserRole;
}

const USERS_KEY = 'mock_users';
const TOKEN_KEY = 'mock_token';
const TOKEN_EXPIRY_HOURS = 24;

function getUsers(): User[] {
  if (typeof window === 'undefined') return [];
  const users = localStorage.getItem(USERS_KEY);
  return users ? JSON.parse(users) : [];
}

function saveUsers(users: User[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function hashPassword(password: string) {
  return 'password_' + btoa(password);
}

function generateMockJWT(user: User) {
  const exp = Date.now() + TOKEN_EXPIRY_HOURS * 60 * 60 * 1000;
  return btoa(JSON.stringify({ email: user.email, role: user.role, exp }));
}

function verifyMockJWT(token: string) {
  try {
    const decoded = JSON.parse(atob(token));
    if (decoded.exp < Date.now()) return null;
    return decoded;
  } catch {
    return null;
  }
}

function isTokenExpired(token: string) {
  const decoded = verifyMockJWT(token);
  return !decoded;
}

function getUserRole(token: string): UserRole | null {
  const decoded = verifyMockJWT(token);
  return decoded ? decoded.role : null;
}

// API: Register
export async function register(email: string, password: string, role: UserRole) {
  return new Promise<{ success: boolean; token?: string; error?: string }>((resolve) => {
    setTimeout(() => {
      const users = getUsers();
      if (users.find(u => u.email === email)) {
        resolve({ success: false, error: 'Email already registered.' });
        return;
      }
      // Validation
      if (!/^\S+@\S+\.\S+$/.test(email)) {
        resolve({ success: false, error: 'Invalid email format.' });
        return;
      }
      if (!/^(?=.*[0-9])(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/.test(password)) {
        resolve({ success: false, error: 'Password too weak.' });
        return;
      }
      const hashed = hashPassword(password);
      const user: User = { email, password: hashed, role };
      users.push(user);
      saveUsers(users);
      const token = generateMockJWT(user);
      localStorage.setItem(TOKEN_KEY, token);
      resolve({ success: true, token });
    }, 500);
  });
}

// API: Login
export async function login(email: string, password: string) {
  return new Promise<{ success: boolean; token?: string; user?: User; error?: string }>((resolve) => {
    setTimeout(() => {
      const users = getUsers();
      let user = users.find(u => u.email === email);
      // For demo: if user does not exist, create one with role based on email
      if (!user) {
        let role: UserRole = 'jobseeker';
        if (email.startsWith('company')) role = 'company';
        else if (email.startsWith('admin')) role = 'admin';
        user = { email, password: hashPassword(password), role };
        users.push(user);
        saveUsers(users);
      }
      // Always succeed for demo
      const token = generateMockJWT(user);
      localStorage.setItem(TOKEN_KEY, token);
      resolve({ success: true, token, user: { ...user, password: '' } });
    }, 500);
  });
}

// API: Get Me (protected)
export async function getMe(token: string) {
  return new Promise<{ success: boolean; user?: User; error?: string }>((resolve) => {
    setTimeout(() => {
      const decoded = verifyMockJWT(token);
      if (!decoded) {
        resolve({ success: false, error: 'Invalid or expired token.' });
        return;
      }
      const users = getUsers();
      const user = users.find(u => u.email === decoded.email);
      if (!user) {
        resolve({ success: false, error: 'User not found.' });
        return;
      }
      resolve({ success: true, user: { ...user, password: '' } });
    }, 300);
  });
}
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
        if (!credentials?.email || !credentials?.password) return null;
        try {
          const user = {
            id: "1",
            email: credentials.email,
            name: "Test User",
          };
          return user;
        } catch (error) {
          console.error("Authentication error:", error);
          return null;
        }
      }
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
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
        session.user.id = token.sub || '';
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
      }
      return token;
    }
  },
  secret: process.env.NEXTAUTH_SECRET,
};

export { authOptions, hashPassword, generateMockJWT, verifyMockJWT, isTokenExpired, getUserRole };
