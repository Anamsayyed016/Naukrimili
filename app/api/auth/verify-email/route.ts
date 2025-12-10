/**
 * Email Verification API
 * Handles email verification token validation
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyEmailToken, markEmailAsVerified } from '@/lib/auth/email-verification';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    
    if (!token) {
      console.log('❌ No verification token provided');
      return NextResponse.json({
        success: false,
        error: 'Verification token is required',
        message: 'Please provide a valid verification token.'
      }, { status: 400 });
    }
    
    console.log('🔍 Verifying email token...');
    
    // Verify token
    const verification = await verifyEmailToken(token);
    
    if (!verification.valid) {
      console.log('❌ Token verification failed:', verification.error);
      return NextResponse.json({
        success: false,
        error: verification.error,
        message: verification.error
      }, { status: 400 });
    }
    
    // Mark email as verified
    const updated = await markEmailAsVerified(verification.email!);
    
    if (!updated) {
      console.log('❌ Failed to update user verification status');
      return NextResponse.json({
        success: false,
        error: 'Failed to verify email',
        message: 'An error occurred while verifying your email. Please try again.'
      }, { status: 500 });
    }
    
    console.log('✅ Email verified successfully for:', verification.email);
    
    // Return success
    return NextResponse.json({
      success: true,
      message: 'Email verified successfully!',
      data: {
        email: verification.email,
        verifiedAt: new Date().toISOString()
      }
    });
    
  } catch (error: unknown) {
    console.error('❌ Email verification error:', error);
    return NextResponse.json({
      success: false,
      error: 'Verification failed',
      message: 'An error occurred during email verification. Please try again.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}

