/**
 * API Endpoint: Complete Google OAuth authentication after OTP verification
 * POST /api/auth/complete-google-oauth
 * 
 * This endpoint is called after successful OTP verification to:
 * 1. Update the user's verification status
 * 2. Return the user data for session completion
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/nextauth-config';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const completeOAuthSchema = z.object({
  email: z.string().email('Invalid email address')
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = completeOAuthSchema.parse(body);

    // Get the current session to verify the user is in Google OAuth flow
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email || session.user.email !== validatedData.email) {
      return NextResponse.json({
        success: false,
        message: 'Invalid session or email mismatch',
        error: 'INVALID_SESSION'
      }, { status: 401 });
    }

    // Find and verify the user
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
        message: 'User not found',
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

    if (!user.isVerified) {
      return NextResponse.json({
        success: false,
        message: 'User not verified. Please complete OTP verification first.',
        error: 'USER_NOT_VERIFIED'
      }, { status: 400 });
    }

    console.log(`✅ Google OAuth authentication completed for ${validatedData.email}`);

    return NextResponse.json({
      success: true,
      message: 'Google OAuth authentication completed successfully',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        isVerified: user.isVerified,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        location: user.location,
        bio: user.bio,
        skills: user.skills,
        experience: user.experience,
        education: user.education,
        profilePicture: user.profilePicture,
        createdAt: user.createdAt
      },
      authMethod: 'google-oauth'
    });

  } catch (error: any) {
    console.error('❌ Complete Google OAuth API error:', error);
    
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
