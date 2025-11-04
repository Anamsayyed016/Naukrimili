/**
 * Generic User Registration API
 * Handles basic email/password registration without role
 * User selects role later via /auth/role-selection
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { createVerificationToken } from '@/lib/auth/email-verification';
import { sendVerificationEmail } from '@/lib/email-templates/verification-email';

// Validation schema for generic registration
const registerSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters')
});

export async function POST(request: NextRequest) {
  try {
    console.log('🔐 Generic registration API called');
    
    // Parse request body
    const body = await request.json();
    
    // Validate input
    const validation = registerSchema.safeParse(body);
    
    if (!validation.success) {
      console.log('❌ Validation failed:', validation.error.errors);
      return NextResponse.json({
        success: false,
        error: 'Validation failed',
        details: validation.error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
      }, { status: 400 });
    }
    
    const data = validation.data;
    
    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email }
    });
    
    if (existingUser) {
      console.log('❌ Email already registered:', data.email);
      return NextResponse.json({
        success: false,
        error: 'Email already registered',
        message: 'This email is already associated with an account. Please sign in or use a different email.'
      }, { status: 400 });
    }
    
    // Hash password
    console.log('🔐 Hashing password...');
    const hashedPassword = await bcrypt.hash(data.password, 12);
    
    // Split name into firstName and lastName
    const nameParts = data.name.trim().split(' ');
    const firstName = nameParts[0] || data.name;
    const lastName = nameParts.slice(1).join(' ') || '';
    
    // Create user without role (user will select role later)
    console.log('💾 Creating user...');
    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        firstName,
        lastName,
        role: null,  // Role selected later via /auth/role-selection
        isActive: true,
        isVerified: false
      }
    });
    
    console.log('✅ User registration successful:', {
      userId: user.id,
      email: user.email
    });
    
    // Send email verification (non-blocking)
    try {
      const verificationToken = await createVerificationToken(user.email);
      await sendVerificationEmail(user.email, user.firstName, verificationToken);
      console.log('📧 Verification email sent to:', user.email);
    } catch (emailError) {
      console.error('⚠️ Failed to send verification email:', emailError);
      // Don't fail registration if email fails
    }
    
    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Registration successful! Please check your email to verify your account.',
      data: {
        userId: user.id,
        email: user.email,
        requiresRoleSelection: true
      }
    }, { status: 201 });
    
  } catch (error: any) {
    console.error('❌ Registration error:', error);
    
    // Handle unique constraint violations
    if (error.code === 'P2002') {
      return NextResponse.json({
        success: false,
        error: 'Email already exists',
        message: 'This email is already registered. Please sign in instead.'
      }, { status: 400 });
    }
    
    // Generic error response
    return NextResponse.json({
      success: false,
      error: 'Registration failed',
      message: 'An error occurred during registration. Please try again.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}

