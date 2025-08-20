import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPIN, validatePIN, logSecurityEvent, getClientIP, getUserAgent } from '@/lib/security-utils';
import { z } from 'zod';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/nextauth-config';

const setupPinSchema = z.object({
  pin: z.string().min(4).max(6),
  confirmPin: z.string().min(4).max(6)
}).refine((data) => data.pin === data.confirmPin, {
  message: "PINs don't match",
  path: ["confirmPin"],
});

export async function POST(request: NextRequest) {
  try {
    // Verify user is authenticated
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required'
      }, { status: 401 });
    }

    const body = await request.json();
    const { pin, confirmPin } = setupPinSchema.parse(body);
    
    const clientIP = getClientIP(request);
    const userAgent = getUserAgent(request);

    // Validate PIN format and strength
    const pinValidation = validatePIN(pin);
    if (!pinValidation.isValid) {
      return NextResponse.json({
        success: false,
        error: 'PIN does not meet security requirements',
        details: pinValidation.errors
      }, { status: 400 });
    }

    // Get user details
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { accounts: true }
    });

    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'User not found'
      }, { status: 404 });
    }

    // Check if user is OAuth user
    if (user.accounts.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'This endpoint is only for OAuth users'
      }, { status: 400 });
    }

    // Check if PIN is already set
    if (user.securityPin) {
      return NextResponse.json({
        success: false,
        error: 'Security PIN is already configured for this account'
      }, { status: 400 });
    }

    // Hash the PIN
    const hashedPIN = await hashPIN(pin);

    // Update user with security PIN
    await prisma.user.update({
      where: { id: user.id },
      data: {
        securityPin: hashedPIN,
        updatedAt: new Date()
      }
    });

    // Log successful PIN setup
    await logSecurityEvent(user.id, 'pin_setup_success', true, { 
      ipAddress: clientIP,
      userAgent,
      pinLength: pin.length
    }, request);

    return NextResponse.json({
      success: true,
      message: 'Security PIN has been successfully set up.',
      note: 'You can now use this PIN to sign in to your account.'
    });

  } catch (error: any) {
    console.error('Setup PIN error:', error);
    
    if (error.name === 'ZodError') {
      return NextResponse.json({
        success: false,
        error: 'Invalid input data',
        details: error.errors
      }, { status: 400 });
    }
    
    return NextResponse.json({
      success: false,
      error: 'Failed to set up security PIN',
      message: error.message
    }, { status: 500 });
  }
}

// GET endpoint to check if user needs PIN setup
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required'
      }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { 
        id: true, 
        securityPin: true, 
        accounts: { select: { provider: true } } 
      }
    });

    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'User not found'
      }, { status: 404 });
    }

    const isOAuthUser = user.accounts.length > 0;
    const needsPinSetup = isOAuthUser && !user.securityPin;

    return NextResponse.json({
      success: true,
      isOAuthUser,
      needsPinSetup,
      hasPin: !!user.securityPin
    });

  } catch (error: any) {
    console.error('Check PIN setup error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to check PIN setup status',
      message: error.message
    }, { status: 500 });
  }
}

// OPTIONS handler for CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
