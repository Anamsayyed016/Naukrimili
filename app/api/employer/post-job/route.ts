import { NextRequest, NextResponse } from 'next/server';
import { requireEmployerAuth } from '@/lib/auth-utils';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Job posting API called');
    
    const auth = await requireEmployerAuth();
    if ("error" in auth) {
      console.log('❌ Auth error:', auth.error, 'Status:', auth.status);
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { user } = auth;
    console.log('✅ User authenticated:', { id: user.id, email: user.email, role: user.role });
    
    const body = await request.json();
    console.log('📥 Request body received:', body);

    // Get the user's company
    console.log('🔍 Looking for company for user:', user.id);
    const company = await prisma.company.findFirst({
      where: { createdBy: user.id }
    });

    if (!company) {
      console.log('❌ No company found for user:', user.id);
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
