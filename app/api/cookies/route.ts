import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Return a simple response for the cookies endpoint
    return NextResponse.json({ 
      success: true, 
      message: 'Cookies endpoint working',
      cookies: request.cookies.getAll()
    });
  } catch (error) {
    console.error('Cookies endpoint error:', error);
    return NextResponse.json(
      { error: 'Failed to process cookies request' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Handle cookie operations if needed
    return NextResponse.json({ 
      success: true, 
      message: 'Cookie operation completed',
      data: body
    });
  } catch (error) {
    console.error('Cookies POST error:', error);
    return NextResponse.json(
      { error: 'Failed to process cookie operation' },
      { status: 500 }
    );
  }
}
