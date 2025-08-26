import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { requireAuth } from '@/lib/auth-utils';
import { z } from 'zod';

const setupPinSchema = z.object({
  pin: z.string()
    .length(6, 'PIN must be exactly 6 digits')
    .regex(/^\d{6}$/, 'PIN must contain only numbers')
});

const updatePinSchema = z.object({
  currentPin: z.string()
    .length(6, 'Current PIN must be exactly 6 digits')
    .regex(/^\d{6}$/, 'Current PIN must contain only numbers'),
  newPin: z.string()
    .length(6, 'New PIN must be exactly 6 digits')
    .regex(/^\d{6}$/, 'New PIN must contain only numbers')
});

// Setup new PIN - POST /api/auth/setup-pin
export async function POST(request: NextRequest) {
  // Require authentication
  const auth = await requireAuth();
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { user } = auth;

  try {
    const body = await request.json();
    const { pin } = setupPinSchema.parse(body);

    // Check if user already has a PIN
    const existingUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { id: true, email: true, name: true }
    });

    if (!existingUser) {
      return NextResponse.json({
        success: false,
        error: 'User not found'
      }, { status: 404 });
    }

    // Hash the PIN for security
    const hashedPin = await bcrypt.hash(pin, 12);

    // Store PIN in user settings
    await prisma.settings.upsert({
      where: {
        userId_key: {
          userId: user.id,
          key: 'security_pin'
        }
      },
      update: {
        value: {
          hashedPin,
          setupAt: new Date().toISOString(),
          isActive: true
        },
        updatedAt: new Date()
      },
      create: {
        userId: user.id,
        key: 'security_pin',
        value: {
          hashedPin,
          setupAt: new Date().toISOString(),
          isActive: true
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Security PIN has been set up successfully',
      data: {
        setupAt: new Date().toISOString(),
        userId: user.id
      }
    });

  } catch (error: any) {
    console.error('❌ PIN setup error:', error);
    
    if (error.name === 'ZodError') {
      return NextResponse.json({
        success: false,
        error: 'Invalid PIN format',
        details: error.errors
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      error: 'Failed to set up PIN',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}

// Update existing PIN - PUT /api/auth/setup-pin
export async function PUT(request: NextRequest) {
  // Require authentication
  const auth = await requireAuth();
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { user } = auth;

  try {
    const body = await request.json();
    const { currentPin, newPin } = updatePinSchema.parse(body);

    // Get current PIN from database
    const pinSettings = await prisma.settings.findUnique({
      where: {
        userId_key: {
          userId: user.id,
          key: 'security_pin'
        }
      }
    });

    if (!pinSettings || !pinSettings.value || typeof pinSettings.value !== 'object') {
      return NextResponse.json({
        success: false,
        error: 'No PIN found. Please set up a PIN first.'
      }, { status: 404 });
    }

    const pinData = pinSettings.value as any;
    
    if (!pinData.hashedPin || !pinData.isActive) {
      return NextResponse.json({
        success: false,
        error: 'PIN is not active. Please set up a PIN first.'
      }, { status: 400 });
    }

    // Verify current PIN
    const isCurrentPinValid = await bcrypt.compare(currentPin, pinData.hashedPin);
    
    if (!isCurrentPinValid) {
      return NextResponse.json({
        success: false,
        error: 'Current PIN is incorrect'
      }, { status: 401 });
    }

    // Prevent using the same PIN
    const isSamePinAsNew = await bcrypt.compare(newPin, pinData.hashedPin);
    
    if (isSamePinAsNew) {
      return NextResponse.json({
        success: false,
        error: 'New PIN must be different from current PIN'
      }, { status: 400 });
    }

    // Hash new PIN
    const hashedNewPin = await bcrypt.hash(newPin, 12);

    // Update PIN in database
    await prisma.settings.update({
      where: {
        userId_key: {
          userId: user.id,
          key: 'security_pin'
        }
      },
      data: {
        value: {
          hashedPin: hashedNewPin,
          setupAt: pinData.setupAt, // Keep original setup date
          lastUpdatedAt: new Date().toISOString(),
          isActive: true
        },
        updatedAt: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      message: 'PIN has been updated successfully'
    });

  } catch (error: any) {
    console.error('❌ PIN update error:', error);
    
    if (error.name === 'ZodError') {
      return NextResponse.json({
        success: false,
        error: 'Invalid PIN format',
        details: error.errors
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      error: 'Failed to update PIN',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}

// Verify PIN - POST /api/auth/setup-pin/verify
export async function GET(request: NextRequest) {
  // Require authentication
  const auth = await requireAuth();
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { user } = auth;

  try {
    const { searchParams } = new URL(request.url);
    const pin = searchParams.get('pin');

    if (!pin) {
      return NextResponse.json({
        success: false,
        error: 'PIN is required for verification'
      }, { status: 400 });
    }

    // Validate PIN format
    if (!/^\d{6}$/.test(pin)) {
      return NextResponse.json({
        success: false,
        error: 'PIN must be exactly 6 digits'
      }, { status: 400 });
    }

    // Get PIN from database
    const pinSettings = await prisma.settings.findUnique({
      where: {
        userId_key: {
          userId: user.id,
          key: 'security_pin'
        }
      }
    });

    if (!pinSettings || !pinSettings.value || typeof pinSettings.value !== 'object') {
      return NextResponse.json({
        success: false,
        error: 'No PIN found. Please set up a PIN first.',
        hasPin: false
      }, { status: 404 });
    }

    const pinData = pinSettings.value as any;
    
    if (!pinData.hashedPin || !pinData.isActive) {
      return NextResponse.json({
        success: false,
        error: 'PIN is not active.',
        hasPin: false
      }, { status: 400 });
    }

    // Verify PIN
    const isPinValid = await bcrypt.compare(pin, pinData.hashedPin);
    
    if (!isPinValid) {
      return NextResponse.json({
        success: false,
        error: 'Invalid PIN',
        hasPin: true
      }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      message: 'PIN verified successfully',
      hasPin: true,
      verifiedAt: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ PIN verification error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to verify PIN',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}

// Check if user has PIN setup - HEAD /api/auth/setup-pin
export async function HEAD(request: NextRequest) {
  // Require authentication
  const auth = await requireAuth();
  if ("error" in auth) {
    return new NextResponse(null, { status: auth.status });
  }

  const { user } = auth;

  try {
    // Check if user has a PIN
    const pinSettings = await prisma.settings.findUnique({
      where: {
        userId_key: {
          userId: user.id,
          key: 'security_pin'
        }
      },
      select: { value: true }
    });

    const hasPin = pinSettings && 
                  pinSettings.value && 
                  typeof pinSettings.value === 'object' && 
                  (pinSettings.value as any).hashedPin && 
                  (pinSettings.value as any).isActive;

    return new NextResponse(null, { 
      status: hasPin ? 200 : 404,
      headers: {
        'X-Has-Pin': hasPin ? 'true' : 'false'
      }
    });

  } catch (error: any) {
    console.error('❌ PIN check error:', error);
    return new NextResponse(null, { status: 500 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200 });
}
