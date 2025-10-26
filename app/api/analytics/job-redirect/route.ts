import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    // Log the redirect for analytics
    console.log('📊 Job Redirect:', {
      jobId: data.jobId,
      jobTitle: data.jobTitle,
      company: data.company,
      source: data.source,
      redirectUrl: data.redirectUrl,
      timestamp: data.timestamp,
      userAgent: request.headers.get('user-agent'),
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip')
    });
    
    // Here you could save to database, send to analytics service, etc.
    // For now, we'll just log it
    
    return NextResponse.json({ success: true });
  } catch (_error) {
    console.error('❌ Analytics error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}