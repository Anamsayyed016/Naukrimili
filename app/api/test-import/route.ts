import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  return NextResponse.json({
    success: true,
    message: 'Next.js imports are working correctly',
    timestamp: new Date().toISOString()
  });
}
