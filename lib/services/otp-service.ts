/**
 * OTP Service
 * Handles OTP generation, verification, and management
 */

import { prisma } from '@/lib/prisma';
import { whatsappAPI } from './whatsapp-api-service';
import { createNotification } from '@/lib/notification-service';

export interface OTPGenerationOptions {
  phoneNumber: string;
  email?: string;
  userId?: string;
  otpType?: 'login' | 'signup' | 'password_reset' | 'verification';
  purpose?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
}

export interface OTPVerificationOptions {
  phoneNumber: string;
  otpCode: string;
  otpType?: 'login' | 'signup' | 'password_reset' | 'verification';
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface OTPResult {
  success: boolean;
  message: string;
  otpId?: string;
  expiresAt?: Date;
  attemptsRemaining?: number;
  error?: string;
}

export class OTPService {
  private static instance: OTPService;
  private readonly OTP_LENGTH = 6;
  private readonly OTP_EXPIRY_MINUTES = 5;
  private readonly MAX_ATTEMPTS = 3;

  private constructor() {}

  public static getInstance(): OTPService {
    if (!OTPService.instance) {
      OTPService.instance = new OTPService();
    }
    return OTPService.instance;
  }

  /**
   * Generate and send OTP
   */
  async generateOTP(options: OTPGenerationOptions): Promise<OTPResult> {
    try {
      console.log(`🔐 Generating OTP for ${options.phoneNumber} (${options.otpType})`);

      // Validate phone number
      if (!this.isValidPhoneNumber(options.phoneNumber)) {
        return {
          success: false,
          message: 'Invalid phone number format',
          error: 'INVALID_PHONE'
        };
      }

      // Check for existing unused OTPs
      const existingOTP = await this.getActiveOTP(options.phoneNumber, options.otpType);
      
      if (existingOTP) {
        // Check if we can resend (not too frequent)
        const timeSinceLastOTP = Date.now() - existingOTP.createdAt.getTime();
        const minResendInterval = 60 * 1000; // 1 minute

        if (timeSinceLastOTP < minResendInterval) {
          const waitTime = Math.ceil((minResendInterval - timeSinceLastOTP) / 1000);
          return {
            success: false,
            message: `Please wait ${waitTime} seconds before requesting another OTP`,
            error: 'RATE_LIMITED'
          };
        }

        // Mark existing OTP as used
        await this.markOTPAsUsed(existingOTP.id);
      }

      // Generate new OTP
      const otpCode = this.generateOTPCode();
      const expiresAt = new Date(Date.now() + this.OTP_EXPIRY_MINUTES * 60 * 1000);

      // Save OTP to database
      const otpRecord = await (prisma as any).otpVerification.create({
        data: {
          userId: options.userId,
          phoneNumber: options.phoneNumber,
          email: options.email,
          otpCode,
          otpType: options.otpType || 'login',
          purpose: options.purpose || 'verification',
          expiresAt,
          maxAttempts: this.MAX_ATTEMPTS,
          ipAddress: options.ipAddress,
          userAgent: options.userAgent,
          metadata: options.metadata
        }
      });

      // Send OTP via WhatsApp
      const whatsappResult = await whatsappAPI.sendOTP(
        options.phoneNumber,
        otpCode,
        options.otpType || 'login'
      );

      if (!whatsappResult.success) {
        console.error('❌ Failed to send OTP via WhatsApp:', whatsappResult.error);
        
        // Still return success but with warning
        return {
          success: true,
          message: 'OTP generated but delivery may be delayed',
          otpId: otpRecord.id,
          expiresAt,
          attemptsRemaining: this.MAX_ATTEMPTS
        };
      }

      // Send notification if user is logged in
      if (options.userId) {
        try {
          await createNotification({
            userId: options.userId,
            type: 'OTP_SENT',
            title: 'OTP Sent',
            message: `Verification code sent to ${this.maskPhoneNumber(options.phoneNumber)}`,
            data: {
              phoneNumber: options.phoneNumber,
              otpType: options.otpType,
              expiresAt: expiresAt?.toISOString()
            }
          });

          // Note: Socket.IO notifications are handled separately to avoid circular dependencies
        } catch (error) {
          console.warn('⚠️ Failed to send OTP notification:', error);
        }
      }

      console.log(`✅ OTP generated and sent successfully: ${otpRecord.id}`);
      
      return {
        success: true,
        message: 'OTP sent successfully',
        otpId: otpRecord.id,
        expiresAt,
        attemptsRemaining: this.MAX_ATTEMPTS
      };

    } catch (error: any) {
      console.error('❌ OTP generation error:', error);
      return {
        success: false,
        message: 'Failed to generate OTP',
        error: error.message || 'UNKNOWN_ERROR'
      };
    }
  }

  /**
   * Verify OTP
   */
  async verifyOTP(options: OTPVerificationOptions): Promise<OTPResult> {
    try {
      console.log(`🔍 Verifying OTP for ${options.phoneNumber}`);

      // Find active OTP
      const otpRecord = await this.getActiveOTP(options.phoneNumber, options.otpType);

      if (!otpRecord) {
        return {
          success: false,
          message: 'No valid OTP found. Please request a new one.',
          error: 'OTP_NOT_FOUND'
        };
      }

      // Check if OTP is expired
      if (new Date() > otpRecord.expiresAt) {
        await this.markOTPAsUsed(otpRecord.id);
        return {
          success: false,
          message: 'OTP has expired. Please request a new one.',
          error: 'OTP_EXPIRED'
        };
      }

      // Check if OTP is already used
      if (otpRecord.isUsed || otpRecord.isVerified) {
        return {
          success: false,
          message: 'OTP has already been used. Please request a new one.',
          error: 'OTP_USED'
        };
      }

      // Check attempt limit
      if (otpRecord.attempts >= otpRecord.maxAttempts) {
        await this.markOTPAsUsed(otpRecord.id);
        return {
          success: false,
          message: 'Maximum verification attempts exceeded. Please request a new OTP.',
          error: 'MAX_ATTEMPTS_EXCEEDED'
        };
      }

      // Verify OTP code
      const isOTPValid = otpRecord.otpCode === options.otpCode;

      // Update attempts
      await (prisma as any).otpVerification.update({
        where: { id: otpRecord.id },
        data: { attempts: otpRecord.attempts + 1 }
      });

      if (!isOTPValid) {
        const attemptsRemaining = otpRecord.maxAttempts - (otpRecord.attempts + 1);
        
        if (attemptsRemaining <= 0) {
          await this.markOTPAsUsed(otpRecord.id);
          return {
            success: false,
            message: 'Invalid OTP. Maximum attempts exceeded. Please request a new OTP.',
            error: 'MAX_ATTEMPTS_EXCEEDED'
          };
        }

        // Note: Socket.IO notifications are handled separately to avoid circular dependencies

        return {
          success: false,
          message: `Invalid OTP. ${attemptsRemaining} attempts remaining.`,
          error: 'INVALID_OTP',
          attemptsRemaining
        };
      }

      // Mark OTP as verified
      await (prisma as any).otpVerification.update({
        where: { id: otpRecord.id },
        data: {
          isVerified: true,
          isUsed: true,
          verifiedAt: new Date()
        }
      });

      // Send success notification if user is logged in
      if (options.userId) {
        try {
          await createNotification({
            userId: options.userId,
            type: 'OTP_VERIFIED',
            title: 'OTP Verified',
            message: 'Your phone number has been successfully verified',
            data: {
              phoneNumber: options.phoneNumber,
              otpType: options.otpType,
              verifiedAt: new Date().toISOString()
            }
          });

          // Note: Socket.IO notifications are handled separately to avoid circular dependencies
        } catch (error) {
          console.warn('⚠️ Failed to send OTP verification notification:', error);
        }
      }

      console.log(`✅ OTP verified successfully: ${otpRecord.id}`);

      return {
        success: true,
        message: 'OTP verified successfully',
        otpId: otpRecord.id
      };

    } catch (error: any) {
      console.error('❌ OTP verification error:', error);
      return {
        success: false,
        message: 'Failed to verify OTP',
        error: error.message || 'UNKNOWN_ERROR'
      };
    }
  }

  /**
   * Get active OTP for phone number
   */
  private async getActiveOTP(phoneNumber: string, otpType?: string) {
    return await (prisma as any).otpVerification.findFirst({
      where: {
        phoneNumber,
        otpType: otpType || 'login',
        isUsed: false,
        isVerified: false,
        expiresAt: {
          gt: new Date()
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
  }

  /**
   * Mark OTP as used
   */
  private async markOTPAsUsed(otpId: string) {
    await (prisma as any).otpVerification.update({
      where: { id: otpId },
      data: { isUsed: true }
    });
  }

  /**
   * Generate random OTP code
   */
  private generateOTPCode(): string {
    const digits = '0123456789';
    let otp = '';
    
    for (let i = 0; i < this.OTP_LENGTH; i++) {
      otp += digits[Math.floor(Math.random() * digits.length)];
    }
    
    return otp;
  }

  /**
   * Validate phone number format
   */
  private isValidPhoneNumber(phoneNumber: string): boolean {
    // Remove all non-digit characters
    const cleaned = phoneNumber.replace(/\D/g, '');
    
    // Check if it's a valid Indian phone number (10 digits) or international (10-15 digits)
    return cleaned.length >= 10 && cleaned.length <= 15;
  }

  /**
   * Mask phone number for display
   */
  private maskPhoneNumber(phoneNumber: string): string {
    const cleaned = phoneNumber.replace(/\D/g, '');
    if (cleaned.length >= 10) {
      const last4 = cleaned.slice(-4);
      const masked = '*'.repeat(cleaned.length - 4) + last4;
      return `+${masked}`;
    }
    return phoneNumber;
  }

  /**
   * Clean up expired OTPs
   */
  async cleanupExpiredOTPs(): Promise<number> {
    try {
      const result = await (prisma as any).otpVerification.updateMany({
        where: {
          expiresAt: {
            lt: new Date()
          },
          isUsed: false
        },
        data: {
          isUsed: true
        }
      });

      console.log(`🧹 Cleaned up ${result.count} expired OTPs`);
      return result.count;

    } catch (error: any) {
      console.error('❌ Error cleaning up expired OTPs:', error);
      return 0;
    }
  }

  /**
   * Get OTP statistics
   */
  async getOTPStats(userId?: string): Promise<{
    totalGenerated: number;
    totalVerified: number;
    totalExpired: number;
    successRate: number;
  }> {
    try {
      const where = userId ? { userId } : {};

      const [totalGenerated, totalVerified, totalExpired] = await Promise.all([
        (prisma as any).otpVerification.count({ where }),
        (prisma as any).otpVerification.count({ where: { ...where, isVerified: true } }),
        (prisma as any).otpVerification.count({ 
          where: { 
            ...where, 
            expiresAt: { lt: new Date() },
            isVerified: false
          } 
        })
      ]);

      const successRate = totalGenerated > 0 ? (totalVerified / totalGenerated) * 100 : 0;

      return {
        totalGenerated,
        totalVerified,
        totalExpired,
        successRate: Math.round(successRate * 100) / 100
      };

    } catch (error: any) {
      console.error('❌ Error getting OTP stats:', error);
      return {
        totalGenerated: 0,
        totalVerified: 0,
        totalExpired: 0,
        successRate: 0
      };
    }
  }
}

// Export singleton instance
export const otpService = OTPService.getInstance();
