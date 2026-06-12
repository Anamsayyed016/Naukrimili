import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth-utils';
import { prisma } from '@/lib/prisma';
import { jobNotificationEmailService } from '@/lib/job-notification-emails';
import { jobCacheService } from '@/lib/job-cache-service';

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

    const parseOptionalInt = (value: unknown): number | null => {
      if (value === null || value === undefined || value === '') return null;
      const n = typeof value === 'number' ? value : parseInt(String(value).replace(/[^\d]/g, ''), 10);
      return Number.isFinite(n) && n > 0 ? n : null;
    };

    const salaryMin = parseOptionalInt(body.salaryMin);
    const salaryMax = parseOptionalInt(body.salaryMax);
    const salaryDisplay =
      typeof body.salary === 'string' && body.salary.trim()
        ? body.salary.trim()
        : salaryMin && salaryMax
          ? `₹${salaryMin.toLocaleString('en-IN')} - ₹${salaryMax.toLocaleString('en-IN')} ${body.salaryFrequency || 'Per Month'}`
          : salaryMin
            ? `₹${salaryMin.toLocaleString('en-IN')} ${body.salaryFrequency || 'Per Month'}`
            : salaryMax
              ? `₹${salaryMax.toLocaleString('en-IN')} ${body.salaryFrequency || 'Per Month'}`
              : null;

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
        salary: salaryDisplay,
        salaryMin,
        salaryMax,
        salaryCurrency: body.currencyCode || 'INR',
        benefits: body.benefits || null,
        jobType: body.jobType,
        experienceLevel: body.experienceLevel,
        skills: JSON.stringify(body.skills || []),
        isRemote: body.isRemote || false,
        isHybrid: body.isHybrid || false,
        isUrgent: body.isUrgent || false,
        isFeatured: body.isFeatured || false,
        sector: body.sector || company.sector || company.industry || null,
        source: 'manual',
        sourceId: `manual_${Date.now()}`,
        companyId: company.id,
        createdBy: basicUser.id,
        rawJson: {
          ...body,
          // Enhanced location data
          locationType: body.locationType || 'single',
          multipleLocations: body.multipleLocations || [],
          radiusDistance: body.radiusDistance || body.locationRadiusKm || 25,
          radiusCenter: body.radiusCenter || '',
          city: body.city || '',
          area: body.area || '',
          pinCode: body.pinCode || body.pincode || '',
          state: body.state || '',
          // Salary
          salaryFrequency: body.salaryFrequency || 'Per Month',
          // Currency information
          currencyCode: body.currencyCode || 'INR',
          currencySymbol: body.currencySymbol || '₹',
          // Contact information
          contactEmail: body.contactEmail || basicUser.email,
          contactPhone: body.contactPhone || '',
          hideEmail: body.hideEmail === true,
          hidePhone: body.hidePhone === true || body.hideContact === true,
          hideContact: body.hidePhone === true || body.hideContact === true,
          openings: body.openings ?? 1,
          // AI enhancement metadata
          aiEnhanced: true,
          enhancedAt: new Date().toISOString()
        }
      }
    });

    console.log('✅ Job created successfully:', { id: job.id, title: job.title });

    await jobCacheService.invalidateJobsListingCache();

    try {
      const { notifyJobIndexNow } = await import('@/lib/indexnow');
      notifyJobIndexNow(job);
    } catch (indexNowError) {
      console.error('[IndexNow] Job notify failed:', indexNowError);
    }

    // Send email notifications
    try {
      const { getBaseUrl } = await import('@/lib/url-utils');
      const { generateSEOJobUrl, cleanJobDataForSEO } = await import('@/lib/seo-url-utils');
      const baseUrl = getBaseUrl();
      // Generate SEO-friendly job URL
      const cleanJob = cleanJobDataForSEO({
        id: job.id.toString(),
        title: job.title,
        company: job.company || company.name,
        location: job.location || '',
      });
      const seoJobUrl = generateSEOJobUrl(cleanJob);
      const jobUrl = `${baseUrl}${seoJobUrl}`;
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
