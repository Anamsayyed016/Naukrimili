/**
 * WhatsApp API Service
 * Handles OTP delivery via WhatsApp using the provided API token
 */

export interface WhatsAppMessage {
  to: string;
  message: string;
  type: 'otp' | 'notification' | 'alert';
}

export interface WhatsAppResponse {
  success: boolean;
  messageId?: string;
  error?: string;
  details?: Record<string, unknown>;
}

export class WhatsAppAPIService {
  private static instance: WhatsAppAPIService;
  private apiToken: string;
  private baseUrl: string;

  private constructor() {
    this.apiToken = process.env.WHATSAPP_API_TOKEN || '';
    this.baseUrl = process.env.WHATSAPP_API_URL || 'https://graph.facebook.com/v18.0';
    
    if (!this.apiToken) {
      console.warn('⚠️ WhatsApp API token not configured. OTP delivery will be simulated.');
    }
  }

  public static getInstance(): WhatsAppAPIService {
    if (!WhatsAppAPIService.instance) {
      WhatsAppAPIService.instance = new WhatsAppAPIService();
    }
    return WhatsAppAPIService.instance;
  }

  /**
   * Send OTP via WhatsApp
   */
  async sendOTP(phoneNumber: string, otpCode: string, purpose: string = 'verification'): Promise<WhatsAppResponse> {
    try {
      console.log(`📱 Sending OTP via WhatsApp to ${phoneNumber}`);
      
      // Format phone number (remove spaces, add country code if needed)
      const formattedPhone = this.formatPhoneNumber(phoneNumber);
      
      // Create OTP message
      const message = this.createOTPMessage(otpCode, purpose);
      
      const whatsappMessage: WhatsAppMessage = {
        to: formattedPhone,
        message,
        type: 'otp'
      };

      // Send via WhatsApp API
      const response = await this.sendMessage(whatsappMessage);
      
      if (response.success) {
        console.log(`✅ OTP sent successfully to ${formattedPhone}`);
      } else {
        console.error(`❌ Failed to send OTP to ${formattedPhone}:`, response.error);
      }

      return response;

    } catch (error: unknown) {
      console.error('❌ WhatsApp OTP send error:', error);
      return {
        success: false,
        error: error.message || 'Failed to send OTP via WhatsApp'
      };
    }
  }

  /**
   * Send notification via WhatsApp
   */
  async sendNotification(phoneNumber: string, message: string): Promise<WhatsAppResponse> {
    try {
      console.log(`📱 Sending notification via WhatsApp to ${phoneNumber}`);
      
      const formattedPhone = this.formatPhoneNumber(phoneNumber);
      
      const whatsappMessage: WhatsAppMessage = {
        to: formattedPhone,
        message,
        type: 'notification'
      };

      return await this.sendMessage(whatsappMessage);

    } catch (error: unknown) {
      console.error('❌ WhatsApp notification send error:', error);
      return {
        success: false,
        error: error.message || 'Failed to send notification via WhatsApp'
      };
    }
  }

  /**
   * Send message via WhatsApp API
   */
  private async sendMessage(message: WhatsAppMessage): Promise<WhatsAppResponse> {
    try {
      // If no API token, simulate the response for development
      if (!this.apiToken) {
        console.log('🔧 Simulating WhatsApp message (no API token configured)');
        return {
          success: true,
          messageId: `sim_${Date.now()}`,
          details: {
            simulated: true,
            message: message.message,
            to: message.to
          }
        };
      }

      // Prepare WhatsApp API request
      const requestBody = {
        messaging_product: 'whatsapp',
        to: message.to,
        type: 'text',
        text: {
          body: message.message
        }
      };

      // Send to WhatsApp API
      const response = await fetch(`${this.baseUrl}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      const responseData = await response.json();

      if (response.ok) {
        return {
          success: true,
          messageId: responseData.messages?.[0]?.id,
          details: responseData
        };
      } else {
        return {
          success: false,
          error: responseData.error?.message || 'WhatsApp API error',
          details: responseData
        };
      }

    } catch (error: unknown) {
      console.error('❌ WhatsApp API request error:', error);
      return {
        success: false,
        error: error.message || 'Network error while sending WhatsApp message'
      };
    }
  }

  /**
   * Format phone number for WhatsApp
   */
  private formatPhoneNumber(phoneNumber: string): string {
    // Remove all non-digit characters
    let cleaned = phoneNumber.replace(/\D/g, '');
    
    // Add country code if not present (assuming India +91)
    if (cleaned.length === 10) {
      cleaned = '91' + cleaned;
    } else if (cleaned.startsWith('0')) {
      cleaned = '91' + cleaned.substring(1);
    }
    
    return cleaned;
  }

  /**
   * Create OTP message template
   */
  private createOTPMessage(otpCode: string, purpose: string): string {
    const templates = {
      login: `🔐 NaukriMili Login OTP\n\nYour verification code is: *${otpCode}*\n\nThis code will expire in 5 minutes.\n\nDo not share this code with anyone.\n\n- NaukriMili Team`,
      
      signup: `🎉 Welcome to NaukriMili!\n\nYour verification code is: *${otpCode}*\n\nThis code will expire in 5 minutes.\n\nComplete your registration to get started.\n\n- NaukriMili Team`,
      
      password_reset: `🔄 Password Reset OTP\n\nYour verification code is: *${otpCode}*\n\nThis code will expire in 5 minutes.\n\nIf you didn't request this, please ignore.\n\n- NaukriMili Team`,
      
      verification: `✅ Account Verification\n\nYour verification code is: *${otpCode}*\n\nThis code will expire in 5 minutes.\n\nComplete verification to secure your account.\n\n- NaukriMili Team`
    };

    return templates[purpose as keyof typeof templates] || templates.verification;
  }

  /**
   * Verify WhatsApp API configuration
   */
  async verifyConfiguration(): Promise<{ valid: boolean; error?: string }> {
    try {
      if (!this.apiToken) {
        return {
          valid: false,
          error: 'WhatsApp API token not configured'
        };
      }

      // Test API connection
      const response = await fetch(`${this.baseUrl}/me`, {
        headers: {
          'Authorization': `Bearer ${this.apiToken}`
        }
      });

      if (response.ok) {
        return { valid: true };
      } else {
        const errorData = await response.json();
        return {
          valid: false,
          error: errorData.error?.message || 'Invalid API token'
        };
      }

    } catch (error: unknown) {
      return {
        valid: false,
        error: error.message || 'Failed to verify WhatsApp API configuration'
      };
    }
  }

  /**
   * Get delivery status of a message
   */
  async getMessageStatus(messageId: string): Promise<{ status: string; details?: Record<string, unknown> }> {
    try {
      if (!this.apiToken) {
        return { status: 'simulated' };
      }

      const response = await fetch(`${this.baseUrl}/messages/${messageId}`, {
        headers: {
          'Authorization': `Bearer ${this.apiToken}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        return {
          status: data.status || 'unknown',
          details: data
        };
      } else {
        return { status: 'error' };
      }

    } catch (error: unknown) {
      console.error('❌ Error getting message status:', error);
      return { status: 'error' };
    }
  }
}

// Export singleton instance
export const whatsappAPI = WhatsAppAPIService.getInstance();
