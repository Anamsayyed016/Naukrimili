import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  return NextResponse.json({ 
    success: true, 
    message: 'API endpoint working' 
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    return NextResponse.json({ 
      success: true, 
      data: body 
    });
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: 'Invalid request' 
    }, { status: 400 });
  }
}
