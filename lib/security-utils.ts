import crypto from 'crypto';
import bcrypt from 'bcryptjs';

/**
 * 🔒 Comprehensive Security Utilities
 * Provides encryption, validation, and security functions
 */

// Encryption key (should be in environment variables)
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'fallback-encryption-key-32-chars';

/**
 * Encrypt sensitive data (OAuth tokens, 2FA secrets, etc.)
 */
export function encryptData(data: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY.slice(0, 32)), iv);
  
  let encrypted = cipher.update(data, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  return `${iv.toString('hex')}:${encrypted}`;
}

/**
 * Decrypt sensitive data
 */
export function decryptData(encryptedData: string): string {
  try {
    const [ivHex, encrypted] = encryptedData.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY.slice(0, 32)), iv);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Decryption failed:', error);
    return '';
  }
}

/**
 * Generate secure PIN (4-6 digits)
 */
export function generateSecurePIN(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Validate PIN format and strength
 */
export function validatePIN(pin: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!pin || pin.length < 4 || pin.length > 6) {
    errors.push('PIN must be 4-6 digits');
  }
  
  if (!/^\d+$/.test(pin)) {
    errors.push('PIN must contain only numbers');
  }
  
  // Check for common weak patterns
  if (/(.)\1{2,}/.test(pin)) {
    errors.push('PIN cannot have 3 or more repeated digits');
  }
  
  if (/123|234|345|456|567|678|789|012/.test(pin)) {
    errors.push('PIN cannot be a sequential pattern');
  }
  
  if (/0000|1111|2222|3333|4444|5555|6666|7777|8888|9999/.test(pin)) {
    errors.push('PIN cannot be all the same digit');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Hash PIN securely
 */
export async function hashPIN(pin: string): Promise<string> {
  return bcrypt.hash(pin, 12);
}

/**
 * Verify PIN
 */
export async function verifyPIN(pin: string, hashedPIN: string): Promise<boolean> {
  return bcrypt.compare(pin, hashedPIN);
}

/**
 * Generate backup codes for 2FA
 */
export function generateBackupCodes(count: number = 8): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    // Generate 8-character alphanumeric codes
    const code = crypto.randomBytes(4).toString('hex').toUpperCase();
    codes.push(code);
  }
  return codes;
}

/**
 * Hash backup codes
 */
export async function hashBackupCodes(codes: string[]): Promise<string[]> {
  return Promise.all(codes.map(code => bcrypt.hash(code, 10)));
}

/**
 * Verify backup code
 */
export async function verifyBackupCode(code: string, hashedCodes: string[]): Promise<boolean> {
  for (const hashedCode of hashedCodes) {
    if (await bcrypt.compare(code, hashedCode)) {
      return true;
    }
  }
  return false;
}

/**
 * Check if account should be locked due to failed attempts
 */
export function shouldLockAccount(loginAttempts: number, lastAttempt: Date): boolean {
  const MAX_ATTEMPTS = 5;
  const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes
  
  if (loginAttempts >= MAX_ATTEMPTS) {
    const timeSinceLastAttempt = Date.now() - lastAttempt.getTime();
    return timeSinceLastAttempt < LOCKOUT_DURATION;
  }
  
  return false;
}

/**
 * Calculate lockout duration
 */
export function calculateLockoutDuration(loginAttempts: number): number {
  // Progressive lockout: 15min, 30min, 1hr, 2hr, 4hr
  const durations = [15, 30, 60, 120, 240]; // minutes
  const index = Math.min(loginAttempts - 5, durations.length - 1);
  return durations[index] * 60 * 1000; // Convert to milliseconds
}

/**
 * Generate secure random token
 */
export function generateSecureToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Hash password with bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

/**
 * Verify password
 */
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

/**
 * Validate password strength
 */
export function validatePasswordStrength(password: string): { isValid: boolean; score: number; errors: string[] } {
  const errors: string[] = [];
  let score = 0;
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  } else {
    score += Math.min(password.length * 2, 20); // Max 20 points for length
  }
  
  if (/[a-z]/.test(password)) score += 10;
  if (/[A-Z]/.test(password)) score += 10;
  if (/[0-9]/.test(password)) score += 10;
  if (/[^A-Za-z0-9]/.test(password)) score += 15;
  
  if (score < 30) {
    errors.push('Password is too weak. Include uppercase, lowercase, numbers, and symbols.');
  }
  
  // Check for common weak patterns
  if (/password|123|qwerty|admin/i.test(password)) {
    errors.push('Password contains common weak patterns');
    score -= 20;
  }
  
  if (/(.)\1{2,}/.test(password)) {
    errors.push('Password has too many repeated characters');
    score -= 10;
  }
  
  return {
    isValid: errors.length === 0 && score >= 30,
    score: Math.max(0, score),
    errors
  };
}

/**
 * Sanitize user input for security
 */
export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .substring(0, 1000); // Limit length
}

/**
 * Get client IP address from request
 */
export function getClientIP(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  if (realIP) {
    return realIP;
  }
  
  return 'unknown';
}

/**
 * Get user agent from request
 */
export function getUserAgent(request: Request): string {
  return request.headers.get('user-agent') || 'unknown';
}

/**
 * Log security event to database
 */
export async function logSecurityEvent(
  eventType: string,
  userId: number | null,
  details: Record<string, unknown>,
  ipAddress?: string
): Promise<void> {
  try {
    // Log to console for now (can be extended to database logging later)
    console.log('Security Event:', {
      timestamp: new Date().toISOString(),
      eventType,
      userId,
      details,
      ipAddress
    });
    
    // TODO: Implement database logging when security log model is available
    // await prisma.securityLog.create({
    //   data: {
    //     eventType,
    //     userId,
    //     details: details as any,
    //     ipAddress,
    //     timestamp: new Date()
    //   }
    // });
  } catch (error) {
    console.error('Failed to log security event:', error);
  }
}
