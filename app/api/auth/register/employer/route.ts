/**
 * Employer Registration API
 * Handles email/password registration for employers
 * Creates User + Company records in a transaction
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { createVerificationToken } from '@/lib/auth/email-verification';
import { sendVerificationEmail } from '@/lib/email-templates/verification-email';

// Validation schema for employer registration
const employerRegisterSchema = z.object({
  // Personal Info
  firstName: z.string().min(1, 'First name is required').max(50),
  lastName: z.string().min(1, 'Last name is required').max(50),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  phone: z.string().optional(),
  
  // Company Info
  companyName: z.string().min(1, 'Company name is required').max(200),
  companyWebsite: z.string().url().optional().or(z.literal('')),
  recruiterName: z.string().max(100).optional(),
  companyIndustry: z.string().optional(),
  companySize: z.string().optional(),
  companyFounded: z.number().int().min(1800).max(new Date().getFullYear()).optional().nullable(),
  
  // Optional Job Info (first job posting)
  jobTitle: z.string().optional(),
  jobDescription: z.string().optional(),
  jobLocation: z.string().optional(),
  salaryMin: z.number().optional().nullable(),
  salaryMax: z.number().optional().nullable(),
  salaryCurrency: z.string().optional(),
  requiredSkills: z.array(z.string()).optional(),
  openings: z.number().int().min(1).optional(),
  isRemote: z.boolean().optional(),
  isHybrid: z.boolean().optional(),
  
  role: z.literal('employer')
});

export async function POST(request: NextRequest) {
  try {
    console.log('🔐 Employer registration API called');
    
    // Parse request body
    const body = await request.json();
    
    // Validate input
    const validation = employerRegisterSchema.safeParse(body);
    
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
    
    // Create user and company in a transaction
    console.log('💾 Creating user and company...');
    const result = await prisma.$transaction(async (tx) => {
      // Create user
      const user = await tx.user.create({
        data: {
          email: data.email,
          password: hashedPassword,
          firstName: data.firstName,
          lastName: data.lastName,
          phone: data.phone || null,
          role: data.role || 'employer', // Set role from registration data
          isActive: true,
          isVerified: false
        }
      });
      
      console.log('✅ User created:', user.id);
      
      // Create company
      const company = await tx.company.create({
        data: {
          name: data.companyName,
          website: data.companyWebsite || null,
          industry: data.companyIndustry || null,
          size: data.companySize || null,
          founded: data.companyFounded || null,
          createdBy: user.id,
          isActive: true,
          isVerified: false
        }
      });
      
      console.log('✅ Company created:', company.id);
      
      // Optionally create first job if data provided
      let job = null;
      if (data.jobTitle && data.jobDescription) {
        job = await tx.job.create({
          data: {
            title: data.jobTitle,
            description: data.jobDescription,
            location: data.jobLocation || null,
            salaryMin: data.salaryMin || null,
            salaryMax: data.salaryMax || null,
            salaryCurrency: data.salaryCurrency || 'INR',
            skills: (data.requiredSkills && data.requiredSkills.length > 0) 
              ? data.requiredSkills.join(', ') 
              : '',
            isRemote: data.isRemote || false,
            isHybrid: data.isHybrid || false,
            isActive: true,
            companyId: company.id,
            createdBy: user.id,
            company: data.companyName
          }
        });
        
        console.log('✅ First job created:', job.id);
      }
      
      return { user, company, job };
    });
    
    console.log('✅ Employer registration successful:', {
      userId: result.user.id,
      companyId: result.company.id,
      email: result.user.email
    });
    
    // Send email verification (non-blocking)
    try {
      const verificationToken = await createVerificationToken(result.user.email);
      await sendVerificationEmail(result.user.email, result.user.firstName, verificationToken);
      console.log('📧 Verification email sent to:', result.user.email);
    } catch (emailError) {
      console.error('⚠️ Failed to send verification email:', emailError);
      // Don't fail registration if email fails
    }
    
    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Registration successful! You can now sign in with your credentials.',
      data: {
        userId: result.user.id,
        email: result.user.email,
        companyId: result.company.id,
        companyName: result.company.name,
        hasJob: !!result.job
      }
    }, { status: 201 });
    
  } catch (error: unknown) {
    console.error('❌ Employer registration error:', error);
    
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

