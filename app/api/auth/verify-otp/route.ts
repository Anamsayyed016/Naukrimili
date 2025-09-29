/**
 * Verify OTP API Endpoint
 * Handles OTP verification and authentication
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/nextauth-config';
import { otpService } from '@/lib/services/otp-service';
import { z } from 'zod';

// Validation schema
const verifyOTPSchema = z.object({
  phoneNumber: z.string()
    .min(10, 'Phone number must be at least 10 digits')
    .max(15, 'Phone number must not exceed 15 digits')
    .regex(/^[\d\s\-\+\(\)]+$/, 'Invalid phone number format'),
  otpCode: z.string()
    .length(6, 'OTP must be exactly 6 digits')
    .regex(/^\d{6}$/, 'OTP must contain only numbers'),
  otpType: z.enum(['login', 'signup', 'password_reset', 'verification']).default('login')
});

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Verify OTP API called');

    // Get session (optional for OTP verification)
    const session = await auth();
    const userId = session?.user?.id;

    // Parse and validate request body
    const body = await request.json();
    const validationResult = verifyOTPSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json({
        success: false,
        error: 'Validation failed',
        details: validationResult.error.errors
      }, { status: 400 });
    }

    const { phoneNumber, otpCode, otpType } = validationResult.data;

    // Get client information
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Verify OTP
    const result = await otpService.verifyOTP({
      phoneNumber,
      otpCode,
      otpType,
      userId,
      ipAddress,
      userAgent
    });

    if (result.success) {
      console.log(`✅ OTP verified successfully for ${phoneNumber}`);
      
      return NextResponse.json({
        success: true,
        message: result.message,
        data: {
          otpId: result.otpId,
          verified: true,
          phoneNumber: phoneNumber.replace(/(\d{3})\d{4}(\d{3})/, '$1****$2'), // Mask phone number
          verifiedAt: new Date().toISOString()
        }
      });
    } else {
      console.error(`❌ OTP verification failed for ${phoneNumber}:`, result.error);
      
      return NextResponse.json({
        success: false,
        error: result.error,
        message: result.message,
        data: {
          attemptsRemaining: result.attemptsRemaining
        }
      }, { status: 400 });
    }

  } catch (error: any) {
    console.error('❌ Verify OTP API error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to verify OTP. Please try again.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    // Check OTP status (for authenticated users only)
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required'
      }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const phoneNumber = searchParams.get('phoneNumber');
    const otpType = searchParams.get('otpType') || 'login';

    if (!phoneNumber) {
      return NextResponse.json({
        success: false,
        error: 'Phone number is required'
      }, { status: 400 });
    }

    // This would require additional implementation to check OTP status
    // For now, return a simple response
    return NextResponse.json({
      success: true,
      message: 'OTP status check not implemented yet',
      data: {
        phoneNumber: phoneNumber.replace(/(\d{3})\d{4}(\d{3})/, '$1****$2'),
        otpType
      }
    });

  } catch (error: any) {
    console.error('❌ Check OTP status error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to check OTP status'
    }, { status: 500 });
  }
}
