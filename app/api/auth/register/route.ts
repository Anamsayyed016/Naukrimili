import { NextRequest, NextResponse } from 'next/server';

// Mock user storage (in real app, this would be a database)
let users: any[] = [];
let userId = 1;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, password, role = 'jobseeker' } = body;

    // Basic validation
    if (!name || !email || !password) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: name, email, and password are required'
      }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({
        success: false,
        error: 'Password must be at least 6 characters long'
      }, { status: 400 });
    }

    // Check if user already exists
    const existingUser = users.find(user => user.email === email);
    if (existingUser) {
      return NextResponse.json({
        success: false,
        error: 'User with this email already exists'
      }, { status: 409 });
    }

    // Create new user
    const newUser = {
      id: userId++,
      name,
      email,
      password: `hashed_${password}`, // In real app, hash the password
      role,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      profileCompletion: 0,
      isActive: true
    };

    users.push(newUser);

    // Return user data (without password)
    const { password: _, ...userData } = newUser;

    return NextResponse.json({
      success: true,
      message: 'User registered successfully',
      user: userData,
      token: `mock_token_${Date.now()}` // In real app, generate JWT token
    }, { status: 201 });

  } catch (error: any) {
    console.error('Registration error:', error);
    return NextResponse.json({
      success: false,
      error: 'Registration failed',
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
