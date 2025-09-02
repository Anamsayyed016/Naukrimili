/**
 * API Endpoint: Send OTP for Authentication
 * POST /api/auth/otp/send
 */

import { NextRequest, NextResponse } from 'next/server';
import { getOTPService } from '@/lib/otp-service';
import { z } from 'zod';

const sendOTPSchema = z.object({
  email: z.string().email('Invalid email address'),
  purpose: z.enum(['login', 'registration', 'verification']),
  userName: z.string().optional()
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = sendOTPSchema.parse(body);

    const otpService = getOTPService();
    const result = await otpService.generateAndSendOTP({
      email: validatedData.email,
      purpose: validatedData.purpose,
      userName: validatedData.userName
    });

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: result.message
      });
    } else {
      return NextResponse.json({
        success: false,
        message: result.message,
        error: result.error
      }, { status: 400 });
    }

  } catch (error: any) {
    console.error('❌ Send OTP API error:', error);
    
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
