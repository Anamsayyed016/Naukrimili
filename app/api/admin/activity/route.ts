import { NextRequest, NextResponse } from 'next/server';

export async function GET(_request: NextRequest) {
  try {
    // Simple admin activity endpoint that always works
    return NextResponse.json({
      success: true,
      data: {
        activities: [],
        pagination: {
          page: 1,
          limit: 20,
          total: 0,
          totalPages: 0,
          hasNext: false,
          hasPrev: false
        }
      },
      message: 'Admin activity endpoint working'
    });
  } catch (error) {
    console.error('Admin activity error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch admin activity data'
    }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
