import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth-utils';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Job posting API called');
    
    // First try to get basic user auth
    const basicUser = await getAuthenticatedUser();
    if (!basicUser) {
      console.log('❌ No authenticated user found');
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    if (basicUser.role !== 'employer') {
      console.log('❌ User is not an employer, role:', basicUser.role);
      return NextResponse.json({ error: "Employer account required" }, { status: 403 });
    }

    console.log('✅ User authenticated:', { id: basicUser.id, email: basicUser.email, role: basicUser.role });
    
    const body = await request.json();
    console.log('📥 Request body received:', body);

    // Get the user's company
    console.log('🔍 Looking for company for user:', basicUser.id);
    const company = await prisma.company.findFirst({
      where: { createdBy: basicUser.id }
    });

    if (!company) {
      console.log('❌ No company found for user:', basicUser.id);
      return NextResponse.json(
        { error: "Company not found. Please complete your company profile first." },
        { status: 400 }
      );
    }
    
    console.log('✅ Company found:', { id: company.id, name: company.name });

    // Create the job with enhanced location data
    console.log('🔨 Creating job in database...');
    const job = await prisma.job.create({
      data: {
        title: body.title,
        company: company.name,
        location: body.location,
        country: body.country || 'IN',
        description: body.description,
        requirements: body.requirements ? JSON.stringify([body.requirements]) : JSON.stringify([]),
        salary: body.salary,
        jobType: body.jobType,
        experienceLevel: body.experienceLevel,
        skills: JSON.stringify(body.skills || []),
        isRemote: body.isRemote || false,
        isHybrid: body.isHybrid || false,
        isUrgent: body.isUrgent || false,
        isFeatured: body.isFeatured || false,
        sector: body.sector,
        source: 'manual',
        sourceId: `manual_${Date.now()}`,
        companyId: company.id,
        rawJson: {
          ...body,
          // Enhanced location data
          locationType: body.locationType || 'single',
          multipleLocations: body.multipleLocations || [],
          radiusDistance: body.radiusDistance || 25,
          radiusCenter: body.radiusCenter || '',
          city: body.city || '',
          state: body.state || '',
          // AI enhancement metadata
          aiEnhanced: true,
          enhancedAt: new Date().toISOString()
        }
      }
    });

    console.log('✅ Job created successfully:', { id: job.id, title: job.title });

    return NextResponse.json({
      success: true,
      message: 'Job posted successfully',
      job: {
        id: job.id,
        title: job.title,
        company: job.company,
        location: job.location
      }
    });

  } catch (error) {
    console.error('❌ Error posting job:', error);
    console.error('❌ Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined
    });
    return NextResponse.json(
      { error: 'Failed to post job', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200 });
}
