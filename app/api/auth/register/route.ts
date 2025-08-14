import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database-service';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, password, role = 'jobseeker', phone, location } = body;

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
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });
    
    if (existingUser) {
      return NextResponse.json({
        success: false,
        error: 'User with this email already exists'
      }, { status: 409 });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create new user
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
        phone,
        location,
        isActive: true
      }
    });

    // Return user data (without password)
    const { password: _, ...userData } = newUser;

    return NextResponse.json({
      success: true,
      message: 'User registered successfully',
      user: userData
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
