import { NextRequest, NextResponse } from 'next/server';
import { requireEmployerAuth } from '@/lib/auth-utils';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Company profile API called');
    
    const auth = await requireEmployerAuth();
    if ("error" in auth) {
      console.log('❌ Auth error:', auth.error, 'Status:', auth.status);
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { user } = auth;
    console.log('✅ User authenticated:', { id: user.id, email: user.email, role: user.role });
    
    // Get the user's company
    console.log('🔍 Looking for company for user:', user.id);
    const company = await prisma.company.findFirst({
      where: { createdBy: user.id },
      select: {
        id: true,
        name: true,
        description: true,
        website: true,
        location: true,
        industry: true,
        size: true,
        founded: true,
        logo: true,
        isVerified: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!company) {
      console.log('❌ No company found for user:', user.id);
      return NextResponse.json(
        { error: "Company not found" },
        { status: 404 }
      );
    }
    
    console.log('✅ Company found:', { id: company.id, name: company.name });

    return NextResponse.json({
      success: true,
      company: {
        ...company,
        hasCompleteProfile: !!(company.name && company.description && company.location && company.industry)
      }
    });

  } catch (error) {
    console.error('❌ Error fetching company profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch company profile', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Company creation API called');
    
    const auth = await requireEmployerAuth();
    if ("error" in auth) {
      console.log('❌ Auth error:', auth.error, 'Status:', auth.status);
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { user } = auth;
    console.log('✅ User authenticated:', { id: user.id, email: user.email, role: user.role });
    
    const body = await request.json();
    console.log('📥 Request body received:', body);

    // Check if company already exists
    const existingCompany = await prisma.company.findFirst({
      where: { createdBy: user.id }
    });

    if (existingCompany) {
      console.log('❌ Company already exists for user:', user.id);
      return NextResponse.json(
        { error: "Company profile already exists" },
        { status: 400 }
      );
    }

    // Create the company
    console.log('🔨 Creating company in database...');
    const company = await prisma.company.create({
      data: {
        name: body.name,
        description: body.description,
        website: body.website,
        location: body.location,
        industry: body.industry,
        size: body.size,
        founded: body.founded ? parseInt(body.founded) : null,
        logo: body.logo,
        socialLinks: body.socialLinks ? JSON.stringify(body.socialLinks) : null,
        benefits: body.benefits ? JSON.stringify(body.benefits) : null,
        specialties: body.specialties ? JSON.stringify(body.specialties) : null,
        culture: body.culture,
        mission: body.mission,
        vision: body.vision,
        createdBy: user.id,
        isVerified: false
      }
    });

    console.log('✅ Company created successfully:', { id: company.id, name: company.name });

    // Send notification to user
    try {
      const { createNotification } = await import('@/lib/notification-service');
      await createNotification({
        userId: user.id,
        title: 'Company Profile Created! 🎉',
        message: `Your company "${company.name}" has been successfully created. You can now start posting jobs!`,
        type: 'success',
        data: {
          companyId: company.id,
          companyName: company.name,
          action: 'company_created'
        }
      });
      console.log('✅ Company creation notification sent');
    } catch (notificationError) {
      console.error('❌ Failed to send company creation notification:', notificationError);
      // Don't fail the company creation if notification fails
    }

    return NextResponse.json({
      success: true,
      message: 'Company profile created successfully',
      company: {
        id: company.id,
        name: company.name,
        description: company.description,
        website: company.website,
        location: company.location,
        industry: company.industry,
        size: company.size,
        founded: company.founded,
        logo: company.logo,
        isVerified: company.isVerified,
        hasCompleteProfile: !!(company.name && company.description && company.location && company.industry)
      }
    });

  } catch (error) {
    console.error('❌ Error creating company profile:', error);
    return NextResponse.json(
      { error: 'Failed to create company profile', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}