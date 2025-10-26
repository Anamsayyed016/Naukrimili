/**
 * Verify Phone Number API Endpoint
 * Handles phone number verification for existing users
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/nextauth-config';
import { otpService } from '@/lib/services/otp-service';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Validation schema
const verifyPhoneSchema = z.object({
  phoneNumber: z.string()
    .min(10, 'Phone number must be at least 10 digits')
    .max(15, 'Phone number must not exceed 15 digits')
    .regex(/^[\d\s\-\+\(\)]+$/, 'Invalid phone number format'),
  otpCode: z.string()
    .length(6, 'OTP must be exactly 6 digits')
    .regex(/^\d{6}$/, 'OTP must contain only numbers')
});

export async function POST(request: NextRequest) {
  try {
    console.log('📱 Verify Phone API called');

    // Get authenticated user
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required'
      }, { status: 401 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = verifyPhoneSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json({
        success: false,
        error: 'Validation failed',
        details: validationResult.error.errors
      }, { status: 400 });
    }

    const { phoneNumber, otpCode } = validationResult.data;

    // Get client information
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Verify OTP
    const otpResult = await otpService.verifyOTP({
      phoneNumber,
      otpCode,
      otpType: 'verification',
      userId: session.user.id,
      ipAddress,
      userAgent
    });

    if (!otpResult.success) {
      return NextResponse.json({
        success: false,
        error: otpResult.error,
        message: otpResult.message,
        data: {
          attemptsRemaining: otpResult.attemptsRemaining
        }
      }, { status: 400 });
    }

    // Update user's phone verification status
    try {
      await prisma.user.update({
        where: { id: session.user.id },
        data: {
          phone: phoneNumber,
          // Note: These fields will be available after database migration
          // phoneVerified: true,
          // otpRequired: false,
          // lastOtpSent: new Date()
        }
      });

      console.log(`✅ Phone number verified for user ${session.user.id}`);

      return NextResponse.json({
        success: true,
        message: 'Phone number verified successfully',
        data: {
          phoneNumber: phoneNumber.replace(/(\d{3})\d{4}(\d{3})/, '$1****$2'),
          verified: true,
          verifiedAt: new Date().toISOString()
        }
      });

    } catch (error: any) {
      console.error('❌ Error updating user phone verification:', error);
      
      return NextResponse.json({
        success: false,
        error: 'Failed to update phone verification status',
        message: 'OTP verified but failed to update account. Please try again.'
      }, { status: 500 });
    }

  } catch (error: any) {
    console.error('❌ Verify Phone API error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to verify phone number. Please try again.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}

export async function GET(_request: NextRequest) {
  try {
    // Get user's phone verification status
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required'
      }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        phone: true,
        // Note: These fields will be available after database migration
        // phoneVerified: true,
        // otpRequired: true,
        // lastOtpSent: true
      }
    });

    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'User not found'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        phone: user.phone ? user.phone.replace(/(\d{3})\d{4}(\d{3})/, '$1****$2') : null,
        // Note: These fields will be available after database migration
        phoneVerified: false, // user.phoneVerified,
        otpRequired: false, // user.otpRequired,
        lastOtpSent: null // user.lastOtpSent
      }
    });

  } catch (error: any) {
    console.error('❌ Get phone status error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to get phone verification status'
    }, { status: 500 });
  }
}
