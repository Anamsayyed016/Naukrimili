/**
 * Jobseeker Registration API
 * Handles email/password registration for jobseekers
 * Creates User record with professional information
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { createVerificationToken } from '@/lib/auth/email-verification';
import { sendVerificationEmail } from '@/lib/email-templates/verification-email';
import { consumePhoneVerificationToken } from '@/lib/services/otp-service';
import { normalizePhoneForStorage, assertPhoneAvailable } from '@/lib/auth/phone-lookup';
import { strongPasswordZodSchema } from '@/lib/auth/password-policy';
import { isOtpAuthEnabled } from '@/lib/auth/auth-features';

const jobseekerRegisterSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(50),
  lastName: z.string().min(1, 'Last name is required').max(50),
  email: z.string().email('Invalid email address'),
  password: strongPasswordZodSchema,
  phone: z.string().optional(),
  phoneVerificationToken: z.string().optional(),
  skills: z
    .union([
      z.array(z.string()),
      z.string().transform((val) => (val ? val.split(',').map((s) => s.trim()).filter(Boolean) : [])),
    ])
    .optional(),
  experience: z.string().optional(),
  education: z.string().optional(),
  locationPreference: z.string().optional(),
  salaryExpectation: z
    .union([z.number().nullable(), z.string().transform((val) => (val ? parseInt(val, 10) : null))])
    .optional(),
  jobTypePreference: z.array(z.string()).optional(),
  remotePreference: z.boolean().optional(),
  role: z.literal('jobseeker'),
});

export async function POST(request: NextRequest) {
  try {
    console.log('🔐 Jobseeker registration API called');
    const otpRequired = isOtpAuthEnabled();

    const body = await request.json();
    const validation = jobseekerRegisterSchema.safeParse(body);

    if (!validation.success) {
      console.log('❌ Validation failed:', validation.error.errors);
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: validation.error.errors.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        },
        { status: 400 }
      );
    }

    const data = validation.data;

    if (otpRequired) {
      if (!data.phone || data.phone.replace(/\D/g, '').length < 10) {
        return NextResponse.json(
          {
            success: false,
            error: 'Phone required',
            message: 'Please provide a valid 10-digit Indian mobile number.',
          },
          { status: 400 }
        );
      }
      if (!data.phoneVerificationToken) {
        return NextResponse.json(
          {
            success: false,
            error: 'Phone not verified',
            message: 'Mobile verification is required before registering.',
          },
          { status: 400 }
        );
      }
    }

    let normalizedPhone: string | null = null;
    if (data.phone?.trim()) {
      normalizedPhone = normalizePhoneForStorage(data.phone);
      if (!normalizedPhone) {
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid phone number',
            message: 'Please provide a valid 10-digit Indian mobile number.',
          },
          { status: 400 }
        );
      }

      if (otpRequired) {
        const phoneToken = await consumePhoneVerificationToken(
          data.phoneVerificationToken!,
          data.phone
        );
        if (!phoneToken) {
          return NextResponse.json(
            {
              success: false,
              error: 'Phone not verified',
              message: 'Mobile verification expired or invalid. Please verify your phone again.',
            },
            { status: 400 }
          );
        }
      }

      const phoneAvailability = await assertPhoneAvailable(normalizedPhone);
      if (!phoneAvailability.available) {
        return NextResponse.json(
          {
            success: false,
            error: 'Phone already registered',
            message: phoneAvailability.error || 'This mobile number is already in use.',
          },
          { status: 400 }
        );
      }
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      console.log('❌ Email already registered:', data.email);
      return NextResponse.json(
        {
          success: false,
          error: 'Email already registered',
          message:
            'This email is already associated with an account. Please sign in or use a different email.',
        },
        { status: 400 }
      );
    }

    console.log('🔐 Hashing password...');
    const hashedPassword = await bcrypt.hash(data.password, 12);

    console.log('💾 Creating jobseeker user...');
    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: normalizedPhone,
        phoneVerified: otpRequired && !!normalizedPhone,
        role: data.role || 'jobseeker',
        skills: Array.isArray(data.skills) ? JSON.stringify(data.skills) : data.skills || '[]',
        experience: data.experience || null,
        education: data.education || null,
        location: data.locationPreference || null,
        bio: data.salaryExpectation ? `Expected Salary: ${data.salaryExpectation}` : null,
        isActive: true,
        isVerified: false,
      },
    });

    console.log('✅ Jobseeker registration successful:', {
      userId: user.id,
      email: user.email,
    });

    try {
      const verificationToken = await createVerificationToken(user.email);
      await sendVerificationEmail(user.email, user.firstName, verificationToken);
      console.log('📧 Verification email sent to:', user.email);
    } catch (emailError) {
      console.error('⚠️ Failed to send verification email:', emailError);
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Registration successful! You can now sign in with your credentials.',
        data: {
          userId: user.id,
          email: user.email,
          role: user.role,
        },
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error('❌ Jobseeker registration error:', error);

    const prismaError = error as { code?: string; message?: string };
    if (prismaError.code === 'P2002') {
      return NextResponse.json(
        {
          success: false,
          error: 'Email already exists',
          message: 'This email is already registered. Please sign in instead.',
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Registration failed',
        message: 'An error occurred during registration. Please try again.',
        details: process.env.NODE_ENV === 'development' ? prismaError.message : undefined,
      },
      { status: 500 }
    );
  }
}
