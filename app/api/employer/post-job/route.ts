import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth-utils';
import { prisma } from '@/lib/prisma';
import { jobNotificationEmailService } from '@/lib/job-notification-emails';

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
        salaryCurrency: body.currencyCode || 'INR',
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
          // Currency information
          currencyCode: body.currencyCode || 'USD',
          currencySymbol: body.currencySymbol || '$',
          // AI enhancement metadata
          aiEnhanced: true,
          enhancedAt: new Date().toISOString()
        }
      }
    });

    console.log('✅ Job created successfully:', { id: job.id, title: job.title });

    // Send email notifications
    try {
      const jobUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/jobs/${job.id.toString()}`;
      const adminEmails = process.env.ADMIN_EMAILS ? process.env.ADMIN_EMAILS.split(',') : [];
      
      // Send confirmation email to employer
      await jobNotificationEmailService.sendJobPostingConfirmation({
        jobTitle: job.title,
        companyName: company.name,
        location: job.location,
        jobType: job.jobType,
        experienceLevel: job.experienceLevel,
        salary: job.salary,
        employerEmail: basicUser.email,
        employerName: basicUser.name || 'Employer',
        jobId: job.id.toString(),
        jobUrl
      });
      
      // Send notification to admins
      if (adminEmails.length > 0) {
        await jobNotificationEmailService.sendJobPostingNotificationToAdmins({
          jobTitle: job.title,
          companyName: company.name,
          location: job.location,
          jobType: job.jobType,
          experienceLevel: job.experienceLevel,
          salary: job.salary,
          employerEmail: basicUser.email,
          employerName: basicUser.name || 'Employer',
          jobId: job.id.toString(),
          jobUrl,
          adminEmails
        });
      }
      
      console.log('📧 Email notifications sent successfully');
    } catch (emailError) {
      console.error('❌ Failed to send email notifications:', emailError);
      // Don't fail the job posting if email notifications fail
    }

    // Send real-time notification via Socket.io (enhanced with role-based notifications)
    try {
      // Import socket service for role-based notifications
      const { getSocketService } = await import('@/lib/socket-server');
      const socketService = getSocketService();
      
      if (socketService) {
        // Send role-based notification to jobseekers
        await socketService.sendNotificationToJobseekers({
          type: 'JOB_CREATED',
          title: 'New Job Posted! 🎉',
          message: `A new job "${job.title}" has been posted by ${company.name}. Check it out!`,
          data: {
            jobId: job.id.toString(),
            jobTitle: job.title,
            companyName: company.name,
            location: job.location,
            action: 'view_job',
            actionUrl: `/jobs/${job.id.toString()}`
          }
        });

        // Also emit legacy job_created event for backward compatibility
        socketService.io.emit('job_created', {
          jobId: job.id.toString(),
          jobTitle: job.title,
          company: job.company,
          location: job.location,
          userId: basicUser.id,
          timestamp: new Date().toISOString(),
          type: 'job_created'
        });
        
        console.log('📡 Role-based notification sent to jobseekers for job creation');
      }
    } catch (socketError) {
      console.error('❌ Failed to send socket notification:', socketError);
      // Don't fail the job posting if socket notification fails
    }

    // Create database notification
    try {
      await prisma.notification.create({
        data: {
          userId: basicUser.id,
          title: 'Job Posted Successfully! 🎉',
          message: `Your job "${job.title}" has been posted and is now live on the platform.`,
          type: 'success',
          data: {
            jobId: job.id.toString(),
            jobTitle: job.title,
            action: 'job_created'
          }
        }
      });
      console.log('✅ Database notification created for job creation');
    } catch (notificationError) {
      console.error('❌ Failed to create database notification:', notificationError);
      // Don't fail the job posting if notification creation fails
    }

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

  } catch (_error) {
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
