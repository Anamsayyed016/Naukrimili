import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth-utils';
import { prisma } from '@/lib/prisma';
import { createNotification } from '@/lib/notification-service';
import { jobNotificationEmailService } from '@/lib/job-notification-emails';

export async function GET() {
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
        { 
          success: false,
          error: "Company not found",
          message: "No company profile found for this employer"
        },
        { status: 404 }
      );
    }
    
    console.log('✅ Company found:', { id: company.id, name: company.name });

    return NextResponse.json({
      success: true,
      data: {
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

export async function POST(request: Request) {
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
        { 
          success: false,
          error: "Company profile already exists",
          message: "You already have a company profile. Please use the company dashboard to manage your existing profile.",
          existingCompany: {
            id: existingCompany.id,
            name: existingCompany.name,
            industry: existingCompany.industry,
            location: existingCompany.location
          }
        },
        { status: 400 }
      );
    }

    // Validate required address fields for Google JobPosting compliance
    const missingFields = [];
    if (!body.name) missingFields.push('name');
    if (!body.description) missingFields.push('description');
    if (!body.location) missingFields.push('location');
    if (!body.industry) missingFields.push('industry');
    if (!body.size) missingFields.push('size');
    if (!body.streetAddress) missingFields.push('streetAddress');
    if (!body.city) missingFields.push('city');
    if (!body.postalCode) missingFields.push('postalCode');

    if (missingFields.length > 0) {
      console.log('❌ Missing required fields:', missingFields);
      return NextResponse.json(
        { 
          error: `Missing required fields: ${missingFields.join(', ')}`,
          missingFields,
          message: 'Street address, city, and postal code are required for Google job listing compliance'
        },
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
        streetAddress: body.streetAddress,
        city: body.city,
        state: body.state,
        postalCode: body.postalCode,
        country: body.country || 'IN',
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
      } as any
    });

    console.log('✅ Company created successfully:', { id: company.id, name: company.name });

    // Send email notification for company creation
    try {
      const companyUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/employer/company/profile`;
      
      await jobNotificationEmailService.sendCompanyCreationConfirmation({
        companyName: company.name,
        industry: company.industry,
        location: company.location,
        size: company.size,
        employerEmail: basicUser.email,
        employerName: basicUser.name || 'Employer',
        companyId: company.id.toString(),
        companyUrl
      });
      
      console.log('📧 Company creation confirmation email sent successfully');
    } catch (emailError) {
      console.error('❌ Failed to send company creation email:', emailError);
      // Don't fail the company creation if email notification fails
    }

    // Send real-time notification via Socket.io (enhanced with role-based notifications)
    try {
      const { getSocketService } = await import('@/lib/socket-server');
      const socketService = getSocketService();
      
      if (socketService) {
        // Notify admins about new company creation
        await socketService.sendNotificationToAdmins({
          type: 'COMPANY_CREATED',
          title: 'New Company Registration! 🏢',
          message: `A new company "${company.name}" has been registered and requires verification.`,
          data: {
            companyId: company.id.toString(),
            companyName: company.name,
            industry: company.industry,
            location: company.location,
            createdBy: basicUser.id,
            action: 'verify_company',
            actionUrl: `/admin/companies/${company.id.toString()}`
          }
        });
        
        // Also emit legacy company_created event for backward compatibility
        socketService.io.emit('company_created', {
          companyId: company.id.toString(),
          companyName: company.name,
          industry: company.industry,
          location: company.location,
          userId: basicUser.id,
          timestamp: new Date().toISOString(),
          type: 'company_created'
        });
        console.log('📡 Role-based notification sent to admins for company creation');
      }
    } catch (socketError) {
      console.error('❌ Failed to send socket notification:', socketError);
      // Don't fail the company creation if socket notification fails
    }

    // Create database notification
    try {
      await createNotification({
        userId: basicUser.id,
        title: 'Company Profile Created! 🎉',
        message: `Your company "${company.name}" has been successfully created. You can now start posting jobs!`,
        type: 'success',
        data: {
          companyId: company.id.toString(),
          companyName: company.name,
          action: 'company_created'
        }
      });
      console.log('✅ Database notification created for company creation');
    } catch (notificationError) {
      console.error('❌ Failed to create database notification:', notificationError);
      // Don't fail the company creation if notification creation fails
    }

    // Send email notification to employer
    try {
      const { mailerService } = await import('@/lib/gmail-oauth2-mailer');
      const userName = basicUser.name || basicUser.email;
      
      await mailerService.sendCompanyCreatedEmail(
        basicUser.email,
        userName,
        company.name,
        company.industry,
        company.location
      );
      console.log('✅ Company creation email sent to:', basicUser.email);
    } catch (emailError) {
      console.error('❌ Failed to send company creation email:', emailError);
      // Don't fail the company creation if email fails
    }

    return NextResponse.json({
      success: true,
      message: 'Company profile created successfully',
      data: {
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

export async function PUT(request: Request) {
  try {
    console.log('🔍 Company profile update API called');
    
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
    console.log('📥 Update request body received:', body);

    // Find existing company
    const existingCompany = await prisma.company.findFirst({
      where: { createdBy: basicUser.id }
    });

    if (!existingCompany) {
      console.log('❌ No company found for user:', basicUser.id);
      return NextResponse.json(
        { error: "Company not found" },
        { status: 404 }
      );
    }

    // Validate required fields
    if (!body.name || !body.description || !body.location || !body.industry || !body.size) {
      return NextResponse.json(
        { error: "Missing required fields: name, description, location, industry, size" },
        { status: 400 }
      );
    }

    // Update the company
    console.log('🔨 Updating company in database...');
    const updatedCompany = await prisma.company.update({
      where: { id: existingCompany.id },
      data: {
        name: body.name,
        description: body.description,
        website: body.website || null,
        location: body.location,
        industry: body.industry,
        size: body.size,
        founded: body.founded ? parseInt(body.founded) : null,
        updatedAt: new Date()
      }
    });

    console.log('✅ Company updated successfully:', { id: updatedCompany.id, name: updatedCompany.name });

    return NextResponse.json({
      success: true,
      message: 'Company profile updated successfully',
      data: {
        ...updatedCompany,
        hasCompleteProfile: !!(updatedCompany.name && updatedCompany.description && updatedCompany.location && updatedCompany.industry)
      }
    });

  } catch (error) {
    console.error('❌ Error updating company profile:', error);
    return NextResponse.json(
      { error: 'Failed to update company profile', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    console.log('🔍 Company profile delete API called');
    
    const basicUser = await getAuthenticatedUser();
    if (!basicUser) {
      console.log('❌ No authenticated user found');
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    if (basicUser.role !== 'employer') {
      console.log('❌ User is not an employer, role:', basicUser.role);
      return NextResponse.json({ error: "Employer account required" }, { status: 403 });
    }

    // Find existing company
    const existingCompany = await prisma.company.findFirst({
      where: { createdBy: basicUser.id }
    });

    if (!existingCompany) {
      console.log('❌ No company found for user:', basicUser.id);
      return NextResponse.json(
        { error: "Company not found" },
        { status: 404 }
      );
    }

    // Delete the company
    console.log('🗑️ Deleting company from database...');
    await prisma.company.delete({
      where: { id: existingCompany.id }
    });

    console.log('✅ Company deleted successfully:', { id: existingCompany.id, name: existingCompany.name });

    return NextResponse.json({
      success: true,
      message: 'Company profile deleted successfully'
    });

  } catch (error) {
    console.error('❌ Error deleting company profile:', error);
    return NextResponse.json(
      { error: 'Failed to delete company profile', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}