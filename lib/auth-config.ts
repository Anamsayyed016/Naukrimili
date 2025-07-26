import { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { env } from "./env";
import { userLoginSchema } from "./validation";
import bcrypt from "bcryptjs";

// Password validation
const passwordSchema = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
};

export function validatePassword(password: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (password.length < passwordSchema.minLength) {
    errors.push(`Password must be at least ${passwordSchema.minLength} characters long`);
  }
  
  if (passwordSchema.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  }
  
  if (passwordSchema.requireLowercase && !/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter");
  }
  
  if (passwordSchema.requireNumbers && !/\d/.test(password)) {
    errors.push("Password must contain at least one number");
  }
  
  if (passwordSchema.requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push("Password must contain at least one special character");
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

// Rate limiting for authentication attempts
const authAttempts = new Map<string, { count: number; lastAttempt: number }>();
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

export function checkRateLimit(identifier: string): { allowed: boolean; remainingAttempts?: number; lockoutUntil?: number } {
  const now = Date.now();
  const attempts = authAttempts.get(identifier);
  
  if (!attempts) {
    authAttempts.set(identifier, { count: 1, lastAttempt: now });
    return { allowed: true, remainingAttempts: MAX_ATTEMPTS - 1 };
  }
  
  // Reset if lockout period has passed
  if (now - attempts.lastAttempt > LOCKOUT_DURATION) {
    authAttempts.set(identifier, { count: 1, lastAttempt: now });
    return { allowed: true, remainingAttempts: MAX_ATTEMPTS - 1 };
  }
  
  if (attempts.count >= MAX_ATTEMPTS) {
    return { 
      allowed: false, 
      lockoutUntil: attempts.lastAttempt + LOCKOUT_DURATION 
    };
  }
  
  attempts.count++;
  attempts.lastAttempt = now;
  
  return { 
    allowed: true, 
    remainingAttempts: MAX_ATTEMPTS - attempts.count 
  };
}

export function clearRateLimit(identifier: string): void {
  authAttempts.delete(identifier);
}

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required");
        }

        // Validate input format
        const validation = userLoginSchema.safeParse(credentials);
        if (!validation.success) {
          throw new Error("Invalid email or password format");
        }

        const { email, password } = validation.data;
        
        // Check rate limiting
        const rateLimit = checkRateLimit(email);
        if (!rateLimit.allowed) {
          const lockoutMinutes = Math.ceil((rateLimit.lockoutUntil! - Date.now()) / 60000);
          throw new Error(`Too many failed attempts. Try again in ${lockoutMinutes} minutes.`);
        }

        try {
          // Here you would typically check against your database
          // For now, using a demo user
          if (email === "demo@example.com" && password === "Demo123!") {
            clearRateLimit(email);
            return {
              id: "demo-user",
              email: email,
              name: "Demo User",
              role: "jobseeker"
            };
          }

          throw new Error("Invalid credentials");
        } catch (error) {
          // Don't clear rate limit on failed authentication
          throw error;
        }
      }
    }),
    ...(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET ? [
      GoogleProvider({
        clientId: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
        authorization: {
          params: {
            prompt: "consent",
            access_type: "offline",
            response_type: "code"
          }
        }
      })
    ] : []),
  ],
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours
    updateAge: 60 * 60, // 1 hour
  },
  jwt: {
    maxAge: 24 * 60 * 60, // 24 hours
  },
  pages: {
    signIn: "/auth/login",
    signOut: "/auth/logout",
    error: "/auth/error",
  },
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.sub = user.id;
        token.role = (user as any).role || "jobseeker";
        token.email = user.email;
        token.name = user.name;
      }
      
      if (account) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
      }
      
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.sub!;
        (session.user as any).role = token.role;
        session.user.email = token.email!;
        session.user.name = token.name!;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      // Ensure redirects are to the same origin
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    }
  },
  secret: env.NEXTAUTH_SECRET,
  debug: env.NODE_ENV === "development",
  events: {
    async signIn({ user, account, profile }) {
      console.log(`User signed in: ${user.email}`);
    },
    async signOut({ session, token }) {
      console.log(`User signed out: ${token?.email}`);
    }
  }
};