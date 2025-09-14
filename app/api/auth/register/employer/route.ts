import { NextRequest, NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const employerRegisterSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  companyName: z.string().min(1, 'Company name is required'),
  recruiterName: z.string().optional(),
  companyWebsite: z.string().url().optional().or(z.literal('')),
  companyIndustry: z.string().optional(),
  companySize: z.string().optional(),
  companyFounded: z.number().optional(),
  jobTitle: z.string().optional(),
  jobDescription: z.string().optional(),
  jobLocation: z.string().optional(),
  salaryMin: z.number().optional(),
  salaryMax: z.number().optional(),
  salaryCurrency: z.string().default('INR'),
  requiredSkills: z.array(z.string()).default([]),
  openings: z.number().min(1, 'At least 1 opening required'),
  isRemote: z.boolean().default(false),
  isHybrid: z.boolean().default(false),
  role: z.literal('employer')
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Employer Registration request body:', body);
    
    const validatedData = employerRegisterSchema.parse(body);
    console.log('Validated employer data:', validatedData);

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await hash(validatedData.password, 12);

    // Create full name from first and last name
    const fullName = `${validatedData.firstName} ${validatedData.lastName}`.trim();

    // Create employer user
    const user = await prisma.user.create({
      data: {
        name: fullName,
        email: validatedData.email,
        password: hashedPassword,
        role: 'employer',
        phone: validatedData.phone || null,
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        companyName: validatedData.companyName,
        recruiterName: validatedData.recruiterName || null,
        companyWebsite: validatedData.companyWebsite || null,
        companyIndustry: validatedData.companyIndustry || null,
        companySize: validatedData.companySize || null,
        companyFounded: validatedData.companyFounded || null,
        skills: "[]", // Default empty skills array
        jobTypePreference: null, // Not applicable for employers
        isActive: true,
        isVerified: false
      }
    });

    console.log('Employer user created successfully:', user.id);

    // Create company profile
    const company = await prisma.company.create({
      data: {
        name: validatedData.companyName,
        description: `Company profile for ${validatedData.companyName}`,
        website: validatedData.companyWebsite || null,
        industry: validatedData.companyIndustry || null,
        size: validatedData.companySize || null,
        founded: validatedData.companyFounded || null,
        isVerified: false,
        createdBy: user.id
      }
    });

    console.log('Company created for employer:', company.id);

    // If job information is provided, create a job posting
    let job = null;
    if (validatedData.jobTitle && validatedData.jobDescription) {
      job = await prisma.job.create({
        data: {
          title: validatedData.jobTitle,
          description: validatedData.jobDescription,
          location: validatedData.jobLocation || null,
          company: validatedData.companyName,
          companyId: company.id,
          skills: JSON.stringify(validatedData.requiredSkills || []),
          salaryMin: validatedData.salaryMin || null,
          salaryMax: validatedData.salaryMax || null,
          salaryCurrency: validatedData.salaryCurrency,
          isRemote: validatedData.isRemote,
          isHybrid: validatedData.isHybrid,
          source: 'manual',
          country: 'IN',
          isActive: true
        }
      });
      console.log('Job posting created:', job.id);
    }

    return NextResponse.json({
      success: true,
      message: 'Employer account created successfully',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        companyName: user.companyName
      },
      company: {
        id: company.id,
        name: company.name
      },
      job: job ? {
        id: job.id,
        title: job.title
      } : null,
      token: `user_${user.id}_${Date.now()}` // Simple token for now
    });

  } catch (error) {
    console.error('Employer registration error:', error);
    
    if (error instanceof z.ZodError) {
      console.error('Validation errors:', error.errors);
      return NextResponse.json(
        { 
          error: 'Validation failed', 
          details: error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// OPTIONS handler for CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-csrf-token',
    },
  });
}
