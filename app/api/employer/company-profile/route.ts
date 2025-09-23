import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth-utils';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Company profile API called');
    
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
    
    // Get the user's company
    console.log('🔍 Looking for company for user:', basicUser.id);
    const company = await prisma.company.findFirst({
      where: { createdBy: basicUser.id },
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
      console.log('❌ No company found for user:', basicUser.id);
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

    // Check if company already exists
    const existingCompany = await prisma.company.findFirst({
      where: { createdBy: basicUser.id }
    });

    if (existingCompany) {
      console.log('❌ Company already exists for user:', basicUser.id);
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
        createdBy: basicUser.id,
        isVerified: false
      }
    });

    console.log('✅ Company created successfully:', { id: company.id, name: company.name });

    // Send notification to user
    try {
      const { createNotification } = await import('@/lib/notification-service');
      await createNotification({
        userId: basicUser.id,
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