import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  console.log('🔍 Test route called with URL:', request.url);
  return NextResponse.json({ 
    success: true, 
    message: 'Test route working',
    url: request.url 
  });
}
