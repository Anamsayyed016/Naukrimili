import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { pin, confirmPin } = body;

    if (!pin || !confirmPin) {
      return NextResponse.json(
        { error: 'PIN and confirmation are required' },
        { status: 400 }
      );
    }

    if (pin !== confirmPin) {
      return NextResponse.json(
        { error: 'PINs do not match' },
        { status: 400 }
      );
    }

    if (pin.length !== 4 || !/^\d+$/.test(pin)) {
      return NextResponse.json(
        { error: 'PIN must be exactly 4 digits' },
        { status: 400 }
      );
    }

    // TODO: Get user from session when authentication is implemented
    // For now, return success (in production, implement proper user authentication)
    
    return NextResponse.json({
      success: true,
      message: 'Security PIN set successfully'
    });

  } catch (error) {
    console.error('Setup PIN error:', error);
    return NextResponse.json(
      { error: 'Failed to set security PIN' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { currentPin, newPin, confirmNewPin } = body;

    if (!currentPin || !newPin || !confirmNewPin) {
      return NextResponse.json(
        { error: 'Current PIN, new PIN, and confirmation are required' },
        { status: 400 }
      );
    }

    if (newPin !== confirmNewPin) {
      return NextResponse.json(
        { error: 'New PINs do not match' },
        { status: 400 }
      );
    }

    if (newPin.length !== 4 || !/^\d+$/.test(newPin)) {
      return NextResponse.json(
        { error: 'New PIN must be exactly 4 digits' },
        { status: 400 }
      );
    }

    // TODO: Verify current PIN and update when authentication is implemented
    // For now, return success (in production, implement proper PIN verification)
    
    return NextResponse.json({
      success: true,
      message: 'Security PIN updated successfully'
    });

  } catch (error) {
    console.error('Update PIN error:', error);
    return NextResponse.json(
      { error: 'Failed to update security PIN' },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200 });
}
