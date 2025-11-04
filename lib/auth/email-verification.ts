/**
 * Email Verification Utility
 * Handles verification token generation and validation
 */

import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

/**
 * Generate a secure random verification token
 */
export function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Create verification token for email
 * @param email - User's email address
 * @param expiresInHours - Token expiry time in hours (default: 24)
 */
export async function createVerificationToken(
  email: string,
  expiresInHours: number = 24
): Promise<string> {
  try {
    // Generate unique token
    const token = generateToken();
    
    // Calculate expiry time
    const expires = new Date();
    expires.setHours(expires.getHours() + expiresInHours);
    
    // Delete any existing tokens for this email (cleanup)
    await prisma.verificationToken.deleteMany({
      where: { identifier: email }
    });
    
    // Create new verification token
    await prisma.verificationToken.create({
      data: {
        identifier: email,
        token,
        expires
      }
    });
    
    console.log('✅ Verification token created for:', email);
    
    return token;
    
  } catch (error) {
    console.error('❌ Error creating verification token:', error);
    throw new Error('Failed to create verification token');
  }
}

/**
 * Verify email verification token
 * @param token - Verification token from email link
 */
export async function verifyEmailToken(token: string): Promise<{
  valid: boolean;
  email?: string;
  error?: string;
}> {
  try {
    // Find token in database
    const verificationToken = await prisma.verificationToken.findUnique({
      where: { token }
    });
    
    if (!verificationToken) {
      console.log('❌ Verification token not found:', token);
      return {
        valid: false,
        error: 'Invalid verification token. The link may be incorrect or already used.'
      };
    }
    
    // Check if token has expired
    if (new Date() > verificationToken.expires) {
      console.log('❌ Verification token expired:', token);
      
      // Delete expired token
      await prisma.verificationToken.delete({
        where: { token }
      });
      
      return {
        valid: false,
        error: 'Verification link has expired. Please request a new verification email.'
      };
    }
    
    // Token is valid
    console.log('✅ Verification token valid for:', verificationToken.identifier);
    
    return {
      valid: true,
      email: verificationToken.identifier
    };
    
  } catch (error) {
    console.error('❌ Error verifying token:', error);
    return {
      valid: false,
      error: 'Failed to verify token. Please try again.'
    };
  }
}

/**
 * Mark user email as verified
 * @param email - User's email address
 */
export async function markEmailAsVerified(email: string): Promise<boolean> {
  try {
    // Update user record
    await prisma.user.update({
      where: { email },
      data: {
        emailVerified: new Date(),
        isVerified: true
      }
    });
    
    // Delete verification token (one-time use)
    await prisma.verificationToken.deleteMany({
      where: { identifier: email }
    });
    
    console.log('✅ Email verified for user:', email);
    
    return true;
    
  } catch (error) {
    console.error('❌ Error marking email as verified:', error);
    return false;
  }
}

/**
 * Clean up expired verification tokens
 * Should be run periodically (e.g., daily cron job)
 */
export async function cleanupExpiredTokens(): Promise<number> {
  try {
    const result = await prisma.verificationToken.deleteMany({
      where: {
        expires: {
          lt: new Date()
        }
      }
    });
    
    console.log(`🧹 Cleaned up ${result.count} expired verification tokens`);
    
    return result.count;
    
  } catch (error) {
    console.error('❌ Error cleaning up expired tokens:', error);
    return 0;
  }
}

