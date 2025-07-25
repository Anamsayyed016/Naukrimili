import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Valid email is required' },
        { status: 400 }
      );
    }

    // TODO: Add your email service integration here (Mailchimp, SendGrid, etc.)
    console.log('New subscriber:', email);

    // For now, just simulate success
    return NextResponse.json(
      { 
        success: true,
        message: 'Successfully subscribed to newsletter' 
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Newsletter subscription error:', error);
    return NextResponse.json(
      { error: 'Failed to subscribe' },
      { status: 500 }
    );
  }
} 