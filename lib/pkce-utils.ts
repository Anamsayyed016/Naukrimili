import crypto from 'crypto';

/**
 * PKCE (Proof Key for Code Exchange) Utilities
 * Implements RFC 7636 for secure OAuth 2.0 flows
 */

// Generate a cryptographically secure random string for code_verifier
export function generateCodeVerifier(): string {
  // Generate 32 random bytes (256 bits) and encode as base64url
  const randomBytes = crypto.randomBytes(32);
  return base64URLEncode(randomBytes);
}

// Generate code_challenge from code_verifier using SHA256
export function generateCodeChallenge(codeVerifier: string): string {
  const hash = crypto.createHash('sha256');
  hash.update(codeVerifier);
  const digest = hash.digest();
  return base64URLEncode(digest);
}

// Base64 URL encoding (RFC 4648 Section 5)
function base64URLEncode(buffer: Buffer): string {
  return buffer
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

// Verify that a code_challenge matches the code_verifier
export function verifyCodeChallenge(
  codeVerifier: string, 
  codeChallenge: string
): boolean {
  const computedChallenge = generateCodeChallenge(codeVerifier);
  return computedChallenge === codeChallenge;
}

// Generate complete PKCE pair
export function generatePKCEPair(): { codeVerifier: string; codeChallenge: string } {
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = generateCodeChallenge(codeVerifier);
  
  console.log('🔐 PKCE Pair Generated:');
  console.log('  Code Verifier:', codeVerifier);
  console.log('  Code Challenge:', codeChallenge);
  console.log('  Verification:', verifyCodeChallenge(codeVerifier, codeChallenge) ? '✅ Valid' : '❌ Invalid');
  
  return { codeVerifier, codeChallenge };
}

// Store PKCE verifier securely in session
export function storePKCEVerifier(session: any, codeVerifier: string): void {
  if (session) {
    session.pkceCodeVerifier = codeVerifier;
    session.pkceTimestamp = Date.now();
  }
}

// Retrieve PKCE verifier from session
export function getPKCEVerifier(session: any): string | null {
  if (session?.pkceCodeVerifier) {
    // Check if verifier is not too old (5 minutes max)
    const age = Date.now() - (session.pkceTimestamp || 0);
    if (age < 5 * 60 * 1000) {
      return session.pkceCodeVerifier;
    }
  }
  return null;
}

// Clean up PKCE data from session
export function clearPKCEVerifier(session: any): void {
  if (session) {
    delete session.pkceCodeVerifier;
    delete session.pkceTimestamp;
  }
}
