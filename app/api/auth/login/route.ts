import { NextRequest, NextResponse } from 'next/server';

// Mock user storage (in real app, this would be a database)
const mockUsers = [
  {
    id: 1,
    email: 'admin@jobportal.com',
    password: 'admin123',
    name: 'Admin User',
    role: 'admin'
  },
  {
    id: 2,
    email: 'jobseeker@example.com',
    password: 'password123',
    name: 'John Doe',
    role: 'jobseeker'
  },
  {
    id: 3,
    email: 'employer@example.com',
    password: 'password123',
    name: 'Jane Smith',
    role: 'employer'
  }
];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Basic validation
    if (!email || !password) {
      return NextResponse.json({
        success: false,
        error: 'Email and password are required'
      }, { status: 400 });
    }

    // Find user
    const user = mockUsers.find(u => u.email === email && u.password === password);
    
    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'Invalid email or password'
      }, { status: 401 });
    }

    // Return user data (without password)
    const { password: _, ...userData } = user;

    return NextResponse.json({
      success: true,
      message: 'Login successful',
      user: userData,
      token: `mock_token_${Date.now()}_${user.id}` // In real app, generate JWT token
    });

  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json({
      success: false,
      error: 'Login failed',
      message: error.message
    }, { status: 500 });
  }
}

// OPTIONS handler for CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
