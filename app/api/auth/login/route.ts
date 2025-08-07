import { NextRequest, NextResponse } from 'next/server';

// Mock user database (in a real app, this would be a proper database)
const users = new Map([
  ['user_123', {
    email: 'john.doe@example.com',
    password: 'password123', // In real app, this would be hashed
    name: 'John Doe',
    phone: '+91 9876543210',
    location: 'Mumbai, Maharashtra',
    role: 'jobseeker',
    joinedAt: '2024-01-15'
  }],
  ['admin_001', {
    email: 'admin@jobportal.com',
    password: 'admin123',
    name: 'Admin',
    role: 'admin',
    joinedAt: '2024-01-01'
  }]
]);

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();
    
    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Find user by email
    let foundUser = null;
    let userId = null;
    for (const [id, userData] of users.entries()) {
      if (userData.email === email) {
        foundUser = userData;
        userId = id;
        break;
      }
    }

    if (!foundUser || foundUser.password !== password) {
      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Remove password from response
    const { password: _, ...userWithoutPassword } = foundUser;

    return NextResponse.json({
      success: true,
      message: 'Login successful',
      user: { id: userId, ...userWithoutPassword },
      token: `mock_token_${userId}` // In a real app, use JWT
    });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, error: 'Login failed' },
      { status: 500 }
    );
  }
}
