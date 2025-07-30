import { handleApiError } from '@/lib/error-handler';

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email || !email.includes('@')) {
      return Response.json(
        { error: 'Valid email is required' },
        { status: 400 }
      );
    }

    // TODO: Add your email service integration here (Mailchimp, SendGrid, etc.)
    console.log('New subscriber:', email);

    // For now, just simulate success
    return Response.json(
      { 
        success: true,
        message: 'Successfully subscribed to newsletter' 
      },
      { status: 200 }
    );
  } catch (error) {
    return handleApiError(error, {
      endpoint: 'POST /api/subscribe',
      context: { email: 'unknown' }
    });
  }
} 