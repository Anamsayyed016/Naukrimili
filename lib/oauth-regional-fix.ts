/**
 * Quick OAuth Regional Fix
 * Fast solution for regional OAuth issues
 */

export const OAUTH_REGIONAL_FIXES = {
  // Add all possible domains to Google OAuth console
  authorizedOrigins: [
    'https://naukrimili.com',
    'https://www.naukrimili.com',
    'http://localhost:3000'
  ],
  
  // Add all possible callback URLs
  authorizedRedirects: [
    'https://naukrimili.com/api/auth/callback/google',
    'https://www.naukrimili.com/api/auth/callback/google',
    'http://localhost:3000/api/auth/callback/google'
  ],
  
  // Performance optimizations
  optimizations: {
    disableDebug: true,
    useSelectAccount: true, // Faster than consent
    minimalScopes: ['openid', 'email', 'profile'],
    sessionMaxAge: 7 * 24 * 60 * 60 // 7 days
  }
};

// Quick fix for Google OAuth console
export const GOOGLE_OAUTH_CONSOLE_FIXES = `
🔧 GOOGLE OAUTH CONSOLE FIXES NEEDED:

1. DELETE the disabled client secret (****jYZ7)
2. ADD these Authorized JavaScript origins:
   - https://naukrimili.com
   - https://www.naukrimili.com
   - http://localhost:3000

3. ADD these Authorized redirect URIs:
   - https://naukrimili.com/api/auth/callback/google
   - https://www.naukrimili.com/api/auth/callback/google
   - http://localhost:3000/api/auth/callback/google

4. SAVE changes and wait 5 minutes for propagation
`;
