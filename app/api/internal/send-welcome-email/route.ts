/**
 * Internal API Route for Sending Welcome Emails
 * This is called server-side only from NextAuth callbacks
 */

import { NextRequest, NextResponse } from 'next/server';
import { sendWelcomeEmail } from '@/lib/welcome-email';

// This route is for internal server-side use only
export async function POST(request: NextRequest) {
  try {
    // Verify this is an internal request (optional security measure)
    const internalSecret = request.headers.get('x-internal-secret');
    if (internalSecret !== process.env.NEXTAUTH_SECRET) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { email, name, provider } = body;

    if (!email || !name) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Send the welcome email
    await sendWelcomeEmail({
      email,
      name,
      provider: provider || 'google'
    });

    return NextResponse.json({
      success: true,
      message: 'Welcome email sent successfully'
    });

  } catch (_error) {
    console.error('❌ Error in send-welcome-email API:', error);
    return NextResponse.json(
      { 
        error: 'Failed to send welcome email',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

