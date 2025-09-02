/**
 * API Endpoint: Verify OTP for Authentication
 * POST /api/auth/otp/verify
 */

import { NextRequest, NextResponse } from 'next/server';
import { getOTPService } from '@/lib/otp-service';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const verifyOTPSchema = z.object({
  email: z.string().email('Invalid email address'),
  otp: z.string().length(6, 'OTP must be 6 digits'),
  purpose: z.enum(['login', 'registration', 'verification'])
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = verifyOTPSchema.parse(body);

    const otpService = getOTPService();
    const result = await otpService.verifyOTP(validatedData);

    if (!result.success) {
      return NextResponse.json({
        success: false,
        message: result.message,
        error: result.error
      }, { status: 400 });
    }

    // Handle different purposes after successful OTP verification
    if (validatedData.purpose === 'login') {
      // Find user and return login success
      const user = await prisma.user.findUnique({
        where: { email: validatedData.email },
        include: {
          accounts: true,
          settings: true
        }
      });

      if (!user) {
        return NextResponse.json({
          success: false,
          message: 'User not found. Please register first.',
          error: 'USER_NOT_FOUND'
        }, { status: 404 });
      }

      if (!user.isActive) {
        return NextResponse.json({
          success: false,
          message: 'Account is deactivated. Please contact support.',
          error: 'ACCOUNT_DEACTIVATED'
        }, { status: 403 });
      }

      // Update last login
      await prisma.user.update({
        where: { id: user.id },
        data: { updatedAt: new Date() }
      });

      return NextResponse.json({
        success: true,
        message: 'Login successful',
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          isVerified: user.isVerified
        }
      });

    } else if (validatedData.purpose === 'registration') {
      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: validatedData.email }
      });

      if (existingUser) {
        return NextResponse.json({
          success: false,
          message: 'User already exists. Please login instead.',
          error: 'USER_EXISTS'
        }, { status: 400 });
      }

      return NextResponse.json({
        success: true,
        message: 'Email verified successfully. You can now complete registration.',
        verified: true
      });

    } else if (validatedData.purpose === 'verification') {
      // Mark user as verified
      const user = await prisma.user.findUnique({
        where: { email: validatedData.email }
      });

      if (!user) {
        return NextResponse.json({
          success: false,
          message: 'User not found',
          error: 'USER_NOT_FOUND'
        }, { status: 404 });
      }

      await prisma.user.update({
        where: { id: user.id },
        data: {
          isVerified: true,
          emailVerified: new Date()
        }
      });

      return NextResponse.json({
        success: true,
        message: 'Email verification successful',
        verified: true
      });
    }

    return NextResponse.json({
      success: true,
      message: 'OTP verified successfully'
    });

  } catch (error: any) {
    console.error('❌ Verify OTP API error:', error);
    
    if (error.name === 'ZodError') {
      return NextResponse.json({
        success: false,
        message: 'Invalid request data',
        errors: error.errors
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      message: 'Internal server error'
    }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200 });
}
