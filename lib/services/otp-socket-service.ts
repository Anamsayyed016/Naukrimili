/**
 * OTP Socket Service
 * Handles real-time OTP notifications via Socket.IO
 */

import { getSocketService } from '../socket-server';

export interface OTPSocketNotification {
  type: 'OTP_SENT' | 'OTP_VERIFIED' | 'OTP_FAILED' | 'OTP_EXPIRED';
  phoneNumber: string;
  otpId?: string;
  message: string;
  data?: Record<string, unknown>;
}

export class OTPSocketService {
  private static instance: OTPSocketService;

  private constructor() {}

  public static getInstance(): OTPSocketService {
    if (!OTPSocketService.instance) {
      OTPSocketService.instance = new OTPSocketService();
    }
    return OTPSocketService.instance;
  }

  /**
   * Send OTP sent notification
   */
  async notifyOTPSent(userId: string, phoneNumber: string, otpId: string): Promise<void> {
    try {
      const socketService = getSocketService();
      if (!socketService) {
        console.warn('⚠️ Socket service not available for OTP notification');
        return;
      }

      await socketService.sendNotificationToUser(userId, {
        type: 'OTP_SENT',
        title: 'OTP Sent',
        message: `Verification code sent to ${this.maskPhoneNumber(phoneNumber)}`,
        data: {
          phoneNumber,
          otpId,
          timestamp: new Date().toISOString()
        }
      });

      console.log(`📱 OTP sent notification sent to user ${userId}`);
    } catch (error: unknown) {
      console.error('❌ Failed to send OTP sent notification:', error);
    }
  }

  /**
   * Send OTP verified notification
   */
  async notifyOTPVerified(userId: string, phoneNumber: string, otpId: string): Promise<void> {
    try {
      const socketService = getSocketService();
      if (!socketService) {
        console.warn('⚠️ Socket service not available for OTP notification');
        return;
      }

      await socketService.sendNotificationToUser(userId, {
        type: 'OTP_VERIFIED',
        title: 'Phone Verified',
        message: `Your phone number ${this.maskPhoneNumber(phoneNumber)} has been verified successfully`,
        data: {
          phoneNumber,
          otpId,
          verifiedAt: new Date().toISOString()
        }
      });

      console.log(`✅ OTP verified notification sent to user ${userId}`);
    } catch (error: unknown) {
      console.error('❌ Failed to send OTP verified notification:', error);
    }
  }

  /**
   * Send OTP failed notification
   */
  async notifyOTPFailed(userId: string, phoneNumber: string, reason: string, attemptsRemaining?: number): Promise<void> {
    try {
      const socketService = getSocketService();
      if (!socketService) {
        console.warn('⚠️ Socket service not available for OTP notification');
        return;
      }

      let message = `OTP verification failed: ${reason}`;
      if (attemptsRemaining !== undefined) {
        message += `. ${attemptsRemaining} attempts remaining`;
      }

      await socketService.sendNotificationToUser(userId, {
        type: 'OTP_FAILED',
        title: 'OTP Verification Failed',
        message,
        data: {
          phoneNumber,
          reason,
          attemptsRemaining,
          timestamp: new Date().toISOString()
        }
      });

      console.log(`❌ OTP failed notification sent to user ${userId}`);
    } catch (error: unknown) {
      console.error('❌ Failed to send OTP failed notification:', error);
    }
  }

  /**
   * Send OTP expired notification
   */
  async notifyOTPExpired(userId: string, phoneNumber: string): Promise<void> {
    try {
      const socketService = getSocketService();
      if (!socketService) {
        console.warn('⚠️ Socket service not available for OTP notification');
        return;
      }

      await socketService.sendNotificationToUser(userId, {
        type: 'OTP_EXPIRED',
        title: 'OTP Expired',
        message: `Your verification code for ${this.maskPhoneNumber(phoneNumber)} has expired. Please request a new one.`,
        data: {
          phoneNumber,
          expiredAt: new Date().toISOString()
        }
      });

      console.log(`⏰ OTP expired notification sent to user ${userId}`);
    } catch (error: unknown) {
      console.error('❌ Failed to send OTP expired notification:', error);
    }
  }

  /**
   * Send OTP status update
   */
  async sendOTPStatusUpdate(userId: string, notification: OTPSocketNotification): Promise<void> {
    try {
      const socketService = getSocketService();
      if (!socketService) {
        console.warn('⚠️ Socket service not available for OTP status update');
        return;
      }

      await socketService.sendNotificationToUser(userId, {
        type: notification.type,
        title: this.getNotificationTitle(notification.type),
        message: notification.message,
        data: {
          phoneNumber: notification.phoneNumber,
          otpId: notification.otpId,
          ...notification.data,
          timestamp: new Date().toISOString()
        }
      });

      console.log(`📱 OTP status update sent to user ${userId}: ${notification.type}`);
    } catch (error: unknown) {
      console.error('❌ Failed to send OTP status update:', error);
    }
  }

  /**
   * Broadcast OTP system status to admins
   */
  async broadcastOTPSystemStatus(status: 'healthy' | 'degraded' | 'down', details?: Record<string, unknown>): Promise<void> {
    try {
      const socketService = getSocketService();
      if (!socketService) {
        console.warn('⚠️ Socket service not available for OTP system status broadcast');
        return;
      }

      await socketService.sendNotificationToRoom('admin', {
        type: 'SYSTEM_ANNOUNCEMENT',
        title: 'OTP System Status',
        message: `OTP system is ${status.toUpperCase()}`,
        data: {
          system: 'otp',
          status,
          details,
          timestamp: new Date().toISOString()
        }
      });

      console.log(`📢 OTP system status broadcast: ${status}`);
    } catch (error: unknown) {
      console.error('❌ Failed to broadcast OTP system status:', error);
    }
  }

  /**
   * Get notification title based on type
   */
  private getNotificationTitle(type: string): string {
    switch (type) {
      case 'OTP_SENT':
        return 'OTP Sent';
      case 'OTP_VERIFIED':
        return 'Phone Verified';
      case 'OTP_FAILED':
        return 'OTP Verification Failed';
      case 'OTP_EXPIRED':
        return 'OTP Expired';
      default:
        return 'OTP Update';
    }
  }

  /**
   * Mask phone number for display
   */
  private maskPhoneNumber(phoneNumber: string): string {
    const cleaned = phoneNumber.replace(/\D/g, '');
    if (cleaned.length >= 10) {
      const last4 = cleaned.slice(-4);
      return `+${cleaned.slice(0, -4).replace(/\d/g, '*')}${last4}`;
    }
    return phoneNumber;
  }
}

// Export singleton instance
export const otpSocketService = OTPSocketService.getInstance();
