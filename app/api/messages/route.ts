import { NextRequest, NextResponse } from 'next/server';


export async function GET(request: NextRequest): Promise<NextResponse> {
  return NextResponse.json({
    success: true,
    message: 'API endpoint working',
  });
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    // Validate body type if needed, e.g. if expecting specific fields
    if (!body || typeof body !== 'object') {
      return NextResponse.json({
        success: false,
        error: 'Request body must be a valid object',
      }, { status: 400 });
    }
    return NextResponse.json({
      success: true,
      data: body,
    });
  } catch (error: unknown) {
    let errorMsg = 'Invalid request';
    if (error instanceof SyntaxError) {
      errorMsg = 'Malformed JSON';
    }
    return NextResponse.json({
      success: false,
      error: errorMsg,
    }, { status: 400 });
  }
}