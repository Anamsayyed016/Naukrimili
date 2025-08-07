import { NextRequest, NextResponse } from 'next/server';

// Mock user database (in a real app, this would be a proper database)
const users = new Map();

export async function POST(request: NextRequest) {
  try {
    const { name, email, password, confirmPassword, phone, location } = await request.json();

    // Validation
    if (!name || !email || !password) {
      return NextResponse.json(
        { success: false, error: 'Name, email, and password are required' },
        { status: 400 }
      );
    }

    if (password !== confirmPassword) {
      return NextResponse.json(
        { success: false, error: 'Passwords do not match' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    // Check if user already exists
    for (const userData of users.values()) {
      if (userData.email === email) {
        return NextResponse.json(
          { success: false, error: 'User with this email already exists' },
          { status: 409 }
        );
      }
    }

    // Create new user
    const userId = `user_${Date.now()}`;
    const newUser = {
      name,
      email,
      password, // In real app, hash this with bcrypt
      phone: phone || '',
      location: location || '',
      role: 'jobseeker',
      bio: '',
      experience: '',
      skills: [],
      joinedAt: new Date().toISOString(),
      resume: null
    };

    users.set(userId, newUser);

    // Remove password from response
    const { password: _, ...userWithoutPassword } = newUser;

    return NextResponse.json({
      success: true,
      message: 'Registration successful',
      user: { id: userId, ...userWithoutPassword },
      token: `mock_token_${userId}` // In a real app, use JWT
    });

  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { success: false, error: 'Registration failed' },
      { status: 500 }
    );
  }
}
