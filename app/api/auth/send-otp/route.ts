/**
 * Send OTP API Endpoint
 * Handles OTP generation and delivery via WhatsApp
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/nextauth-config';
import { otpService } from '@/lib/services/otp-service';
import { z } from 'zod';

// Validation schema
const sendOTPSchema = z.object({
  phoneNumber: z.string()
    .min(10, 'Phone number must be at least 10 digits')
    .max(15, 'Phone number must not exceed 15 digits')
    .regex(/^[\d\s\-\+\(\)]+$/, 'Invalid phone number format'),
  email: z.string().email().optional(),
  otpType: z.enum(['login', 'signup', 'password_reset', 'verification']).default('login'),
  purpose: z.string().optional().default('verification')
});

export async function POST(request: NextRequest) {
  try {
    console.log('🔐 Send OTP API called');

    // Get session (optional for OTP generation)
    const session = await auth();
    const userId = session?.user?.id;

    // Parse and validate request body
    const body = await request.json();
    const validationResult = sendOTPSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json({
        success: false,
        error: 'Validation failed',
        details: validationResult.error.errors
      }, { status: 400 });
    }

    const { phoneNumber, email, otpType, purpose } = validationResult.data;

    // Get client information
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Generate and send OTP
    const result = await otpService.generateOTP({
      phoneNumber,
      email,
      userId,
      otpType,
      purpose,
      ipAddress,
      userAgent,
      metadata: {
        source: 'api',
        endpoint: '/api/auth/send-otp',
        timestamp: new Date().toISOString()
      }
    });

    if (result.success) {
      console.log(`✅ OTP sent successfully to ${phoneNumber}`);
      
      return NextResponse.json({
        success: true,
        message: result.message,
        data: {
          otpId: result.otpId,
          expiresAt: result.expiresAt,
          attemptsRemaining: result.attemptsRemaining,
          phoneNumber: phoneNumber.replace(/(\d{3})\d{4}(\d{3})/, '$1****$2') // Mask phone number
        }
      });
    } else {
      console.error(`❌ Failed to send OTP to ${phoneNumber}:`, result.error);
      
      return NextResponse.json({
        success: false,
        error: result.error,
        message: result.message
      }, { status: 400 });
    }

  } catch (error: any) {
    console.error('❌ Send OTP API error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to send OTP. Please try again.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}

export async function GET(_request: NextRequest) {
  try {
    // Get OTP statistics (for authenticated users only)
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required'
      }, { status: 401 });
    }

    const stats = await otpService.getOTPStats(session.user.id);

    return NextResponse.json({
      success: true,
      data: stats
    });

  } catch (error: any) {
    console.error('❌ Get OTP stats error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to get OTP statistics'
    }, { status: 500 });
  }
}
