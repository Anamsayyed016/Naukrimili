/**
 * API Endpoint: Initiate OTP verification for Google OAuth users
 * POST /api/auth/google-oauth-initiate-otp
 * 
 * This endpoint is called after successful Google OAuth to:
 * 1. Generate and send OTP to user's email
 * 2. Return redirect URL to OTP verification page
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/nextauth-config';
import { getOTPService } from '@/lib/otp-service';
import { z } from 'zod';

const initiateOTPSchema = z.object({
  email: z.string().email('Invalid email address')
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = initiateOTPSchema.parse(body);

    // Get the current session to verify the user is in Google OAuth flow
    const session = await getServerSession(authOptions);
    
    console.log('🔍 Google OAuth Initiate OTP - Session Debug:', {
      hasSession: !!session,
      userEmail: session?.user?.email,
      requestedEmail: validatedData.email,
      userData: session?.user ? {
        id: (session.user as any).id,
        email: (session.user as any).email,
        requiresOTP: (session.user as any).requiresOTP,
        otpPurpose: (session.user as any).otpPurpose,
        isVerified: (session.user as any).isVerified
      } : null
    });
    
    if (!session?.user?.email || session.user.email !== validatedData.email) {
      console.log('❌ Session validation failed:', {
        hasSession: !!session,
        sessionEmail: session?.user?.email,
        requestedEmail: validatedData.email
      });
      return NextResponse.json({
        success: false,
        message: 'Invalid session or email mismatch',
        error: 'INVALID_SESSION'
      }, { status: 401 });
    }

    // Check if session indicates OTP is required for Google OAuth
    const user = session.user as any;
    if (!user.requiresOTP || user.otpPurpose !== 'gmail-oauth') {
      console.log('❌ OTP not required for session:', {
        requiresOTP: user.requiresOTP,
        otpPurpose: user.otpPurpose,
        isVerified: user.isVerified
      });
      return NextResponse.json({
        success: false,
        message: 'OTP verification not required for this session',
        error: 'OTP_NOT_REQUIRED'
      }, { status: 400 });
    }

    // Generate and send OTP for Google OAuth verification
    const otpService = getOTPService();
    const result = await otpService.generateAndSendOTP({
      email: validatedData.email,
      purpose: 'gmail-oauth',
      userName: user.name || undefined
    });

    if (result.success) {
      console.log(`✅ OTP sent successfully for Google OAuth user: ${validatedData.email}`);
      
      return NextResponse.json({
        success: true,
        message: 'OTP sent successfully. Please check your email.',
        redirectUrl: '/auth/verify-otp',
        email: validatedData.email,
        purpose: 'gmail-oauth'
      });
    } else {
      console.error(`❌ Failed to send OTP for Google OAuth user: ${validatedData.email}`, result.error);
      
      return NextResponse.json({
        success: false,
        message: result.message || 'Failed to send OTP',
        error: result.error
      }, { status: 400 });
    }

  } catch (error: any) {
    console.error('❌ Google OAuth initiate OTP API error:', error);
    
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
