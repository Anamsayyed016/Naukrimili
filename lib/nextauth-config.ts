import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import GitHubProvider from "next-auth/providers/github"
import CredentialsProvider from "next-auth/providers/credentials"
import { getServerSession } from "next-auth/next"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"  // Use singleton instance instead of creating new one

// Allow build to proceed without NEXTAUTH_SECRET, but it must be set at runtime
const nextAuthSecret = process.env.NEXTAUTH_SECRET || (process.env.NODE_ENV === 'production' ? undefined : 'build-time-placeholder-secret-key-for-development');

// Log environment variable status at module load (only in development, not during build)
// Skip logging during build to prevent webpack from analyzing this
if (process.env.NODE_ENV === 'development' && typeof window === 'undefined') {
  console.log('🔧 NextAuth Config Loading:', {
    hasSecret: !!process.env.NEXTAUTH_SECRET,
    hasUrl: !!process.env.NEXTAUTH_URL,
    nextAuthUrl: process.env.NEXTAUTH_URL,
    hasGoogleId: !!process.env.GOOGLE_CLIENT_ID,
    hasGoogleSecret: !!process.env.GOOGLE_CLIENT_SECRET,
    hasDatabaseUrl: !!process.env.DATABASE_URL,
    nodeEnv: process.env.NODE_ENV,
  });
}

if (!process.env.NEXTAUTH_SECRET && process.env.NODE_ENV === 'production') {
  console.error("❌ NEXTAUTH_SECRET environment variable is not set. This will cause runtime errors in production!");
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
        sameSite: 'none',
        path: '/',
        secure: true,
        domain: '.naukrimili.com',
      },
    },
    callbackUrl: {
      name: process.env.NODE_ENV === 'production'
        ? '__Secure-next-auth.callback-url'
        : 'next-auth.callback-url',
      options: {
        sameSite: 'none',
        path: '/',
        secure: true,
        domain: '.naukrimili.com',
      },
    },
    csrfToken: {
      name: process.env.NODE_ENV === 'production'
        ? '__Host-next-auth.csrf-token'
        : 'next-auth.csrf-token',
      options: {
        httpOnly: true,
        sameSite: 'none',
        path: '/',
        secure: true,
        domain: '.naukrimili.com',
      },
    },
    state: {
      name: process.env.NODE_ENV === 'production'
        ? '__Secure-next-auth.state'
        : 'next-auth.state',
      options: {
        httpOnly: true,
        sameSite: 'none',
        path: '/',
        secure: true,
        domain: '.naukrimili.com',
      },
    },
  },
  providers: [
    // Only add OAuth providers if credentials are available (avoid build-time errors)
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? (() => {
          console.log('✅ Google OAuth provider configured');
          console.log('   GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID.substring(0, 30) + '...');
          console.log('   GOOGLE_CLIENT_SECRET:', 'Set');
          return [
            GoogleProvider({
              clientId: process.env.GOOGLE_CLIENT_ID,
              clientSecret: process.env.GOOGLE_CLIENT_SECRET,
              authorization: {
                params: {
                  prompt: "consent",
                  access_type: "offline",
                  response_type: "code"
                }
              }
            }),
          ];
        })()
      : (() => {
          // Log warning with detailed info for debugging
          const hasId = !!process.env.GOOGLE_CLIENT_ID;
          const hasSecret = !!process.env.GOOGLE_CLIENT_SECRET;
          console.warn('⚠️ Google OAuth credentials are missing!');
          console.warn('   GOOGLE_CLIENT_ID:', hasId ? `Set (${process.env.GOOGLE_CLIENT_ID?.substring(0, 30)}...)` : '❌ Missing');
          console.warn('   GOOGLE_CLIENT_SECRET:', hasSecret ? '✅ Set (hidden)' : '❌ Missing');
          if (!hasId || !hasSecret) {
            console.warn('   Google sign-in will be DISABLED until both credentials are configured.');
            console.warn('   Make sure GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are set in environment variables.');
          }
          return [];
        })()),
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
          console.log(`🔍 Processing ${account.provider} OAuth sign-in for:`, user.email);
          
          // Validate required user data
          if (!user.email) {
            console.error(`❌ ${account.provider} OAuth sign-in failed: user email is missing`);
            return false;
          }
          
          // Check if user exists in database
          let dbUser;
          try {
            dbUser = await prisma.user.findUnique({
              where: { email: user.email! }
            });
          } catch (dbError: any) {
            console.error(`❌ Database error while checking user existence:`, dbError?.message);
            console.error('❌ Database error stack:', dbError?.stack);
            // Allow sign-in to continue - user might still be created
            dbUser = null;
          }

          // Parse name into firstName and lastName
          const nameParts = (user.name || '').split(' ')
          const firstName = nameParts[0] || ''
          const lastName = nameParts.slice(1).join(' ') || ''

          // If user doesn't exist, create them
          if (!dbUser) {
            try {
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
              });
              console.log('✅ Created new user in database:', dbUser.id, '(role: null - needs selection)');
              
              // Fire-and-forget welcome email (non-blocking)
              ;(async () => {
                try {
                  const { mailerService } = await import('@/lib/gmail-oauth2-mailer');
                  await mailerService.sendWelcomeEmail(user.email!, firstName || user.email!, account.provider);
                } catch (e: any) {
                  console.warn('⚠️ Welcome email failed:', e?.message);
                }
              })();
            } catch (createError: any) {
              console.error(`❌ Failed to create user in database:`, createError?.message);
              console.error('❌ Create user error stack:', createError?.stack);
              return false; // Fail sign-in if we can't create user
            }
          } else {
            // Update name if it changed
            try {
              if (firstName && dbUser.firstName !== firstName) {
                dbUser = await prisma.user.update({
                  where: { id: dbUser.id },
                  data: {
                    firstName,
                    lastName,
                    image: user.image || dbUser.image
                  }
                });
              }
              console.log('✅ User already exists in database:', dbUser.id);
            } catch (updateError: any) {
              console.warn('⚠️ Failed to update user info:', updateError?.message);
              // Don't fail sign-in if update fails - user can still sign in
            }
          }

          // Attach the database user ID to the session user
          if (dbUser) {
            user.id = dbUser.id.toString();
            user.role = dbUser.role ?? null;
            console.log(`✅ ${account.provider} OAuth sign-in successful for:`, user.email);
          } else {
            console.error('❌ No database user found or created');
            return false;
          }
        } catch (error: any) {
          console.error(`❌ Error in ${account.provider} OAuth signIn callback:`, error?.message);
          console.error('❌ Error stack:', error?.stack);
          return false;
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
      try {
        console.log('🔄 NextAuth redirect callback called');
        console.log('📍 URL param:', url);
        console.log('📍 BaseUrl:', baseUrl);
        
        // Normalize baseUrl to canonical format (remove www, force https)
        const { getBaseUrl } = await import('@/lib/url-utils');
        const canonicalBaseUrl = getBaseUrl();
        
        // CRITICAL FIX: Detect and break redirect loops
        // Check if URL is pointing to signin page with nested callbackUrl parameters
        try {
          const urlObj = new URL(url);
          const callbackUrlParam = urlObj.searchParams.get('callbackUrl');
          
          // If callbackUrl contains signin page and is nested (recursively encoded), break the loop
          if (callbackUrlParam) {
            try {
              const decodedCallback = decodeURIComponent(callbackUrlParam);
              // Check if it's a signin page URL with another callbackUrl (nested)
              if (decodedCallback.includes('/auth/signin') && decodedCallback.includes('callbackUrl')) {
                console.log('⚠️ Redirect loop detected - breaking loop by redirecting to role selection');
                return `${canonicalBaseUrl}/auth/role-selection`;
              }
            } catch (decodeError) {
              // If decoding fails, it might be deeply nested - break the loop
              if (callbackUrlParam.includes('%2Fauth%2Fsignin') || callbackUrlParam.includes('auth/signin')) {
                console.log('⚠️ Redirect loop detected (nested encoding) - breaking loop');
                return `${canonicalBaseUrl}/auth/role-selection`;
              }
            }
          }
          
          // If URL is pointing to signin page, redirect to role selection to break potential loops
          if (urlObj.pathname === '/auth/signin' || urlObj.pathname.includes('/auth/signin')) {
            console.log('⚠️ Redirecting from signin page - breaking potential loop');
            return `${canonicalBaseUrl}/auth/role-selection`;
          }
        } catch (urlError) {
          // If URL parsing fails, check if it's a signin-related string
          if (url.includes('/auth/signin')) {
            console.log('⚠️ Signin page detected in malformed URL - redirecting to role selection');
            return `${canonicalBaseUrl}/auth/role-selection`;
          }
        }
        
        // Handle relative URLs
        if (url.startsWith("/")) {
          console.log('✅ Relative URL detected:', url);
          // Check if relative URL is signin page
          if (url.startsWith('/auth/signin')) {
            return `${canonicalBaseUrl}/auth/role-selection`;
          }
          return `${canonicalBaseUrl}${url}`;
        }
        
        // Handle same-origin URLs - normalize to canonical
        try {
          const urlObj = new URL(url);
          if (urlObj.origin === baseUrl || urlObj.origin.replace('www.', '') === canonicalBaseUrl.replace('https://', '')) {
            // If it's the signin page, redirect to role selection
            if (urlObj.pathname === '/auth/signin' || urlObj.pathname.includes('/auth/signin')) {
              console.log('✅ Same-origin signin page - redirecting to role selection');
              return `${canonicalBaseUrl}/auth/role-selection`;
            }
            console.log('✅ Same-origin URL detected, normalizing:', url);
            return `${canonicalBaseUrl}${urlObj.pathname}${urlObj.search}${urlObj.hash}`;
          }
        } catch (urlError) {
          // If URL parsing fails, use canonical base URL
          console.warn('⚠️ URL parsing failed, using canonical base URL:', urlError);
        }
        
        // For OAuth callbacks, redirect to role-selection page
        // Role checking will be done on the role-selection page itself
        // This avoids issues with session not being available during OAuth redirect flow
        console.log('🔄 OAuth redirect flow - sending to role selection');
        return `${canonicalBaseUrl}/auth/role-selection`;
      } catch (error: any) {
        console.error('❌ Fatal error in redirect callback:', error?.message);
        console.error('❌ Error stack:', error?.stack);
        // Return a safe fallback URL
        const fallbackUrl = process.env.NEXTAUTH_URL || baseUrl || 'https://naukrimili.com';
        return `${fallbackUrl}/auth/role-selection`;
      }
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
