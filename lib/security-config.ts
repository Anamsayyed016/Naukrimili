// Security configuration for Google Cloud OAuth
export const securityConfig = {
  // Cross-Account Protection settings
  crossAccountProtection: {
    enabled: true,
    allowedDomains: ['naukrimili.com', 'localhost'],
    trustedOrigins: ['https://naukrimili.com', 'http://localhost:3000'],
  },
  
  // OAuth security settings
  oauth: {
    useSecureFlows: true,
    enablePKCE: true, // Enabled for secure OAuth flows
    requireConsent: false, // Disabled to allow seamless login
    incrementalAuthorization: true,
    initialScopes: ['openid', 'email', 'profile'], // Minimal initial scopes
    additionalScopes: {
      profile_edit: ['https://www.googleapis.com/auth/userinfo.profile'],
      email_send: ['https://www.googleapis.com/auth/userinfo.email'],
      advanced_features: [
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/userinfo.email'
      ]
    }
  },
  
  // Session security
  session: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax' as const,
    maxAge: 24 * 60 * 60, // 1 day
  },
  
  // CORS settings
  cors: {
    origin: process.env.NEXTAUTH_URL || 'https://naukrimili.com',
    credentials: true,
  }
};

export default securityConfig;

