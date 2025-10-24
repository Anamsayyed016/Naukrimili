import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    return NextResponse.json({
      success: true,
      env: {
        NODE_ENV: process.env.NODE_ENV,
        OPENAI_API_KEY: process.env.OPENAI_API_KEY ? 'SET' : 'NOT SET',
        GEMINI_API_KEY: process.env.GEMINI_API_KEY ? 'SET' : 'NOT SET',
        OPENAI_KEY_LENGTH: process.env.OPENAI_API_KEY?.length || 0,
        GEMINI_KEY_LENGTH: process.env.GEMINI_API_KEY?.length || 0,
      }
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
