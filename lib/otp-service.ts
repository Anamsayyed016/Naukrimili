/**
 * OTP Service for Secure Authentication
 * Handles OTP generation, storage, verification, and cleanup
 */

import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { getPostmarkService } from './postmark-service';

export interface OTPData {
  email: string;
  purpose: 'login' | 'registration' | 'verification';
  userName?: string;
}

export interface OTPVerification {
  email: string;
  otp: string;
  purpose: string;
}

export interface OTPResult {
  success: boolean;
  message: string;
  otpId?: string;
  error?: string;
}

class OTPService {
  private readonly OTP_LENGTH = 6;
  private readonly OTP_EXPIRY_MINUTES = 10;
  private readonly MAX_ATTEMPTS = 3;

  /**
   * Generate and send OTP via email
   */
  async generateAndSendOTP(data: OTPData): Promise<OTPResult> {
    try {
      const { email, purpose, userName } = data;

      // Clean up expired OTPs for this email
      await this.cleanupExpiredOTPs(email);

      // Check for existing active OTP
      const existingOTP = await prisma.oTP.findFirst({
        where: {
          email,
          purpose,
          isUsed: false,
          expiresAt: {
            gt: new Date()
          }
        }
      });

      if (existingOTP) {
        const timeLeft = Math.ceil((existingOTP.expiresAt.getTime() - Date.now()) / 60000);
        return {
          success: false,
          message: `Please wait ${timeLeft} minutes before requesting a new OTP`,
          error: 'OTP_ALREADY_SENT'
        };
      }

      // Generate new OTP
      const otp = this.generateOTP();
      const hashedOTP = await bcrypt.hash(otp, 12);
      const expiresAt = new Date(Date.now() + this.OTP_EXPIRY_MINUTES * 60 * 1000);

      // Store OTP in database
      const otpRecord = await prisma.oTP.create({
        data: {
          email,
          otp: hashedOTP,
          purpose,
          expiresAt,
          maxAttempts: this.MAX_ATTEMPTS
        }
      });

      // Send OTP via email
      const postmarkService = getPostmarkService();
      const emailResult = await postmarkService.sendOTPEmail({
        to: email,
        otp,
        userName,
        purpose
      });

      if (!emailResult.success) {
        // If email fails, delete the OTP record
        await prisma.oTP.delete({
          where: { id: otpRecord.id }
        });

        return {
          success: false,
          message: 'Failed to send OTP email',
          error: emailResult.error
        };
      }

      console.log(`✅ OTP sent successfully to ${email} for ${purpose}`);

      return {
        success: true,
        message: `OTP sent to ${email}. It will expire in ${this.OTP_EXPIRY_MINUTES} minutes.`,
        otpId: otpRecord.id
      };

    } catch (error: any) {
      console.error('❌ OTP generation failed:', error);
      
      return {
        success: false,
        message: 'Failed to generate OTP',
        error: error.message
      };
    }
  }

  /**
   * Verify OTP code
   */
  async verifyOTP(verification: OTPVerification): Promise<OTPResult> {
    try {
      const { email, otp, purpose } = verification;

      // Find the most recent OTP for this email and purpose
      const otpRecord = await prisma.oTP.findFirst({
        where: {
          email,
          purpose,
          isUsed: false,
          expiresAt: {
            gt: new Date()
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      if (!otpRecord) {
        return {
          success: false,
          message: 'Invalid or expired OTP',
          error: 'OTP_NOT_FOUND'
        };
      }

      // Check if max attempts exceeded
      if (otpRecord.attempts >= otpRecord.maxAttempts) {
        await prisma.oTP.update({
          where: { id: otpRecord.id },
          data: { isUsed: true }
        });

        return {
          success: false,
          message: 'Maximum verification attempts exceeded. Please request a new OTP.',
          error: 'MAX_ATTEMPTS_EXCEEDED'
        };
      }

      // Verify OTP
      const isValidOTP = await bcrypt.compare(otp, otpRecord.otp);

      if (!isValidOTP) {
        // Increment attempts
        await prisma.oTP.update({
          where: { id: otpRecord.id },
          data: {
            attempts: otpRecord.attempts + 1
          }
        });

        const remainingAttempts = otpRecord.maxAttempts - (otpRecord.attempts + 1);
        
        return {
          success: false,
          message: `Invalid OTP. ${remainingAttempts} attempts remaining.`,
          error: 'INVALID_OTP'
        };
      }

      // Mark OTP as used
      await prisma.oTP.update({
        where: { id: otpRecord.id },
        data: { isUsed: true }
      });

      console.log(`✅ OTP verified successfully for ${email}`);

      return {
        success: true,
        message: 'OTP verified successfully',
        otpId: otpRecord.id
      };

    } catch (error: any) {
      console.error('❌ OTP verification failed:', error);
      
      return {
        success: false,
        message: 'Failed to verify OTP',
        error: error.message
      };
    }
  }

  /**
   * Resend OTP (with rate limiting)
   */
  async resendOTP(data: OTPData): Promise<OTPResult> {
    try {
      const { email, purpose } = data;

      // Check if user can request a new OTP (rate limiting)
      const recentOTPs = await prisma.oTP.count({
        where: {
          email,
          purpose,
          createdAt: {
            gte: new Date(Date.now() - 2 * 60 * 1000) // Last 2 minutes
          }
        }
      });

      if (recentOTPs > 0) {
        return {
          success: false,
          message: 'Please wait 2 minutes before requesting a new OTP',
          error: 'RATE_LIMITED'
        };
      }

      // Generate and send new OTP
      return await this.generateAndSendOTP(data);

    } catch (error: any) {
      console.error('❌ OTP resend failed:', error);
      
      return {
        success: false,
        message: 'Failed to resend OTP',
        error: error.message
      };
    }
  }

  /**
   * Clean up expired OTPs
   */
  async cleanupExpiredOTPs(email?: string): Promise<void> {
    try {
      const whereClause = {
        OR: [
          { expiresAt: { lt: new Date() } },
          { isUsed: true }
        ]
      };

      if (email) {
        (whereClause as any).email = email;
      }

      const deletedCount = await prisma.oTP.deleteMany({
        where: whereClause
      });

      if (deletedCount.count > 0) {
        console.log(`🧹 Cleaned up ${deletedCount.count} expired OTPs`);
      }
    } catch (error) {
      console.error('❌ Failed to cleanup expired OTPs:', error);
    }
  }

  /**
   * Get OTP status for an email
   */
  async getOTPStatus(email: string, purpose: string): Promise<{
    hasActiveOTP: boolean;
    attemptsRemaining: number;
    expiresAt?: Date;
  }> {
    try {
      const otpRecord = await prisma.oTP.findFirst({
        where: {
          email,
          purpose,
          isUsed: false,
          expiresAt: {
            gt: new Date()
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      if (!otpRecord) {
        return {
          hasActiveOTP: false,
          attemptsRemaining: 0
        };
      }

      return {
        hasActiveOTP: true,
        attemptsRemaining: otpRecord.maxAttempts - otpRecord.attempts,
        expiresAt: otpRecord.expiresAt
      };
    } catch (error) {
      console.error('❌ Failed to get OTP status:', error);
      return {
        hasActiveOTP: false,
        attemptsRemaining: 0
      };
    }
  }

  /**
   * Generate secure OTP
   */
  private generateOTP(): string {
    // Generate cryptographically secure random number
    const randomBytes = crypto.randomBytes(4);
    const randomNumber = randomBytes.readUInt32BE(0);
    
    // Convert to 6-digit OTP
    const otp = (randomNumber % 1000000).toString().padStart(6, '0');
    
    return otp;
  }

  /**
   * Validate OTP format
   */
  private isValidOTPFormat(otp: string): boolean {
    return /^\d{6}$/.test(otp);
  }
}

// Create singleton instance
let otpService: OTPService | null = null;

export function getOTPService(): OTPService {
  if (!otpService) {
    otpService = new OTPService();
  }
  return otpService;
}

export default OTPService;
