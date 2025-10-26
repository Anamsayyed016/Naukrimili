import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/nextauth-config";
import { prisma } from "@/lib/prisma";
import { trackJobApplication } from '@/lib/analytics/event-integration';
import { join } from 'path';
import { mkdir, writeFile } from 'fs/promises';

// Helper function to get sample job data
function getSampleJobData(jobId: string, companyId: string | null) {
  const sampleJobs = {
    '1': {
      title: 'Senior Software Engineer',
      company: 'TechCorp India',
      companyId: companyId,
      location: 'Bangalore, India',
      country: 'IN',
      description: 'We are looking for a Senior Software Engineer to join our growing team. You will be responsible for developing and maintaining high-quality software solutions.',
      requirements: 'React, Node.js, TypeScript, PostgreSQL',
      skills: 'React, Node.js, TypeScript, PostgreSQL, AWS, Docker',
      jobType: 'full-time',
      experienceLevel: 'senior',
      salary: '₹15,00,000 - ₹25,00,000',
      isRemote: false,
      isFeatured: true,
      isActive: true,
      source: 'manual',
      sourceId: 'sample-1',
      postedAt: new Date(),
      views: 150,
      applicationsCount: 25
    },
    '2': {
      title: 'Full Stack Developer',
      company: 'InnovateTech Solutions',
      companyId: companyId,
      location: 'Mumbai, India',
      country: 'IN',
      description: 'Join our dynamic team as a Full Stack Developer. You will work on cutting-edge web applications and contribute to our product development.',
      requirements: 'JavaScript, React, Node.js, MongoDB',
      skills: 'JavaScript, React, Node.js, MongoDB, Express, Git',
      jobType: 'full-time',
      experienceLevel: 'mid',
      salary: '₹8,00,000 - ₹15,00,000',
      isRemote: true,
      isFeatured: false,
      isActive: true,
      source: 'manual',
      sourceId: 'sample-2',
      postedAt: new Date(),
      views: 89,
      applicationsCount: 12
    },
    '3': {
      title: 'DevOps Engineer',
      company: 'CloudTech Systems',
      companyId: companyId,
      location: 'Pune, India',
      country: 'IN',
      description: 'We are seeking a skilled DevOps Engineer to manage our cloud infrastructure and deployment pipelines.',
      requirements: 'AWS, Docker, Kubernetes, CI/CD',
      skills: 'AWS, Docker, Kubernetes, Jenkins, Terraform, Linux',
      jobType: 'full-time',
      experienceLevel: 'senior',
      salary: '₹12,00,000 - ₹20,00,000',
      isRemote: false,
      isFeatured: true,
      isActive: true,
      source: 'manual',
      sourceId: 'sample-3',
      postedAt: new Date(),
      views: 67,
      applicationsCount: 8
    },
    '4': {
      title: 'Data Scientist',
      company: 'AI Innovations Ltd',
      companyId: companyId,
      location: 'Delhi, India',
      country: 'IN',
      description: 'Join our AI team as a Data Scientist and work on exciting machine learning projects that impact millions of users.',
      requirements: 'Python, Machine Learning, Statistics, SQL',
      skills: 'Python, Machine Learning, TensorFlow, Pandas, SQL, Statistics',
      jobType: 'full-time',
      experienceLevel: 'mid',
      salary: '₹10,00,000 - ₹18,00,000',
      isRemote: true,
      isFeatured: true,
      isActive: true,
      source: 'manual',
      sourceId: 'sample-4',
      postedAt: new Date(),
      views: 134,
      applicationsCount: 19
    },
    '5': {
      title: 'UI/UX Designer',
      company: 'Creative Design Studio',
      companyId: companyId,
      location: 'Chennai, India',
      country: 'IN',
      description: 'We are looking for a creative UI/UX Designer to join our design team and create amazing user experiences.',
      requirements: 'Figma, Adobe Creative Suite, User Research',
      skills: 'Figma, Adobe XD, Photoshop, Illustrator, User Research, Prototyping',
      jobType: 'full-time',
      experienceLevel: 'mid',
      salary: '₹6,00,000 - ₹12,00,000',
      isRemote: false,
      isFeatured: false,
      isActive: true,
      source: 'manual',
      sourceId: 'sample-5',
      postedAt: new Date(),
      views: 45,
      applicationsCount: 6
    },
    '6': {
      title: 'Product Manager',
      company: 'TechStart Inc',
      companyId: companyId,
      location: 'Hyderabad, India',
      country: 'IN',
      description: 'Lead product development initiatives and work closely with engineering teams to deliver exceptional products.',
      requirements: 'Product Management, Agile, Analytics',
      skills: 'Product Management, Agile, Jira, Analytics, User Stories, Roadmapping',
      jobType: 'full-time',
      experienceLevel: 'senior',
      salary: '₹18,00,000 - ₹30,00,000',
      isRemote: true,
      isFeatured: true,
      isActive: true,
      source: 'manual',
      sourceId: 'sample-6',
      postedAt: new Date(),
      views: 78,
      applicationsCount: 15
    },
    '7': {
      title: 'Software Engineer - Dubai',
      company: 'Global Tech Solutions',
      companyId: companyId,
      location: 'Dubai, UAE',
      country: 'AE',
      description: 'Join our Dubai office as a Software Engineer. Work on cutting-edge projects with international teams.',
      requirements: 'Java, Spring Boot, Microservices, Docker',
      skills: 'Java, Spring Boot, Microservices, Docker, Kubernetes, AWS',
      jobType: 'full-time',
      experienceLevel: 'mid',
      salary: 'AED 15,000 - AED 25,000',
      isRemote: false,
      isFeatured: true,
      isActive: true,
      source: 'manual',
      sourceId: 'sample-7',
      postedAt: new Date(),
      views: 178,
      applicationsCount: 32
    },
    '8': {
      title: 'Frontend Developer',
      company: 'WebCraft Studios',
      companyId: companyId,
      location: 'Kolkata, India',
      country: 'IN',
      description: 'Create beautiful and responsive web applications using modern frontend technologies.',
      requirements: 'React, TypeScript, CSS, HTML',
      skills: 'React, TypeScript, CSS3, HTML5, Redux, Webpack',
      jobType: 'full-time',
      experienceLevel: 'junior',
      salary: '₹4,00,000 - ₹8,00,000',
      isRemote: false,
      isFeatured: false,
      isActive: true,
      source: 'manual',
      sourceId: 'sample-8',
      postedAt: new Date(),
      views: 56,
      applicationsCount: 9
    }
  };

  return sampleJobs[jobId as keyof typeof sampleJobs] || null;
}

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Starting job application process...');
    
    // Get the authenticated user
    const session = await auth();
    if (!session?.user?.id) {
      console.log('❌ No authenticated user found');
      return NextResponse.json({
        success: false,
        error: 'Authentication required'
      }, { status: 401 });
    }

    const user = session.user;
    console.log('✅ User authenticated:', user.id);

    // Parse form data
    const formData = await request.formData();
    const jobId = formData.get('jobId') as string;
    const fullName = formData.get('fullName') as string;
    const email = formData.get('email') as string;
    const phone = formData.get('phone') as string;
    const location = formData.get('location') as string;
    const coverLetter = formData.get('coverLetter') as string;
    const expectedSalary = formData.get('expectedSalary') as string;
    const availability = formData.get('availability') as string;
    const resumeFile = formData.get('resume') as File | null;

    console.log('📝 Application data received:', {
      jobId,
      fullName,
      email,
      phone: phone ? 'provided' : 'not provided',
      location: location ? 'provided' : 'not provided',
      coverLetter: coverLetter ? 'provided' : 'not provided',
      expectedSalary: expectedSalary ? 'provided' : 'not provided',
      availability: availability ? 'provided' : 'not provided',
      resumeFile: resumeFile ? 'provided' : 'not provided'
    });

    // Enhanced validation with detailed error messages
    const validationErrors = [];
    if (!jobId?.trim()) validationErrors.push('Job ID is required');
    if (!fullName?.trim()) validationErrors.push('Full name is required');
    if (!email?.trim()) validationErrors.push('Email is required');
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      validationErrors.push('Invalid email format');
    }

    if (validationErrors.length > 0) {
      console.log('❌ Validation failed:', validationErrors);
      return NextResponse.json({
        success: false,
        error: 'Validation failed',
        details: validationErrors,
        code: 'VALIDATION_ERROR'
      }, { status: 400 });
    }

    // Enhanced job lookup with multiple strategies
    let job = await findJobWithFallback(jobId.trim());

    // If not found in database, check if it's a sample job and create it
    if (!job) {
      const sampleJobIds = ['1', '2', '3', '4', '5', '6', '7', '8'];
      if (sampleJobIds.includes(jobId)) {
        console.log('🔍 Creating sample job in database:', jobId);
        
        // Get the first company ID to link sample jobs to a real company
        let sampleCompanyId = null;
        try {
          const firstCompany = await prisma.company.findFirst({
            orderBy: { createdAt: 'asc' },
            select: { id: true }
          });
          sampleCompanyId = firstCompany?.id;
        } catch (_error) {
          console.log('No company found, sample job will be created without company link');
        }

        // Create the sample job in the database
        try {
          const sampleJobData = getSampleJobData(jobId, sampleCompanyId);
          job = await prisma.job.create({
            data: sampleJobData,
            include: {
              companyRelation: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          });
          console.log('✅ Sample job created in database:', job.id);
        } catch (createError) {
          console.error('❌ Failed to create sample job:', createError);
          return NextResponse.json({
            success: false,
            error: 'Failed to create sample job. Please try again.'
          }, { status: 500 });
        }
      } else {
        console.log('❌ Job not found for ID:', jobId);
        return NextResponse.json({
          success: false,
          error: 'Job not found. Please check the job ID and try again.'
        }, { status: 404 });
      }
    }

    console.log('✅ Job found:', job.title);

    // Get company ID
    let companyId = job.companyId;
    if (!companyId && job.company) {
      // Try to find existing company or create a new one
      try {
        let company = await prisma.company.findFirst({
          where: { name: job.company }
        });
        
        if (!company) {
          company = await prisma.company.create({
            data: {
              name: job.company,
              description: `Company for ${job.title} position`,
              website: null,
              industry: 'Technology',
              size: 'Medium',
              location: job.location || 'India',
              isActive: true
            }
          });
          console.log('✅ Company created:', company.name);
        }
        companyId = company.id;
      } catch (companyError) {
        console.warn('⚠️ Failed to create/find company:', companyError);
        // Continue without company ID
      }
    }

    // Handle resume upload if provided
    let resumeId = null;
    let resumeUrl = null;
    if (resumeFile && resumeFile.size > 0) {
      try {
        console.log('📄 Processing resume upload...');
        
        // Create a simple file name
        const fileName = `resume_${user.id}_${Date.now()}.pdf`;
        
        // Create uploads directory if it doesn't exist
        const uploadsDir = join(process.cwd(), 'uploads', 'resumes');
        await mkdir(uploadsDir, { recursive: true }).catch(() => {});
        
        // Save file to filesystem
        const filePath = join(uploadsDir, fileName);
        const fileBuffer = await resumeFile.arrayBuffer();
        await writeFile(filePath, Buffer.from(fileBuffer));
        
        resumeUrl = `/uploads/resumes/${fileName}`;
        
        // Create Resume record in database
        const resume = await prisma.resume.create({
          data: {
            userId: user.id,
            fileName: fileName,
            fileUrl: resumeUrl,
            fileSize: resumeFile.size,
            mimeType: resumeFile.type || 'application/pdf',
            isActive: true
          }
        });
        
        resumeId = resume.id;
        console.log('✅ Resume created in database:', resume.id);
      } catch (resumeError) {
        console.warn('⚠️ Failed to process resume:', resumeError);
        // Continue without resume
      }
    }

    // Create application with real user data
    const application = await prisma.application.create({
      data: {
        userId: user.id,
        jobId: parseInt(jobId, 10),
        notes: coverLetter || null,
        status: 'submitted',
        appliedAt: new Date(),
        coverLetter: coverLetter || null,
        resumeId: resumeId, // Link to uploaded resume if available
        companyId: companyId,
        applicationData: JSON.stringify({
          fullName: fullName,
          email: email,
          phone: phone || null,
          location: location || null,
          experience: null, // Not provided in form data
          education: null, // Not provided in form data
          skills: null, // Not provided in form data
          expectedSalary: expectedSalary || null,
          noticePeriod: availability || null, // Using availability as noticePeriod
          portfolioUrl: null, // Not provided in form data
          linkedinUrl: null, // Not provided in form data
          githubUrl: null // Not provided in form data
        })
      } as any,
      include: {
        job: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            location: true
          }
        },
        resume: {
          select: {
            id: true,
            fileName: true,
            fileUrl: true
          }
        }
      }
    });

    console.log('✅ Application created successfully:', application.id);

    // Send comprehensive notifications
    try {
      const jobTitle = (application as any).job?.title || 'the job';
      const companyName = (application as any).job?.company || 'Unknown Company';
      
      // Dynamic import to avoid circular dependency
      const { comprehensiveNotificationService } = await import('@/lib/comprehensive-notification-service');
      
      // Notify jobseeker
      await comprehensiveNotificationService.notifyJobseekerApplicationSubmitted(
        user.id, 
        jobTitle, 
        companyName
      );
      console.log('✅ Comprehensive notification sent to jobseeker');

      // Notify employer if they exist
      if (application.companyId) {
        const company = await prisma.company.findUnique({
          where: { id: application.companyId }
        });

        if (company?.createdBy) {
          await comprehensiveNotificationService.notifyEmployerNewApplication(
            company.createdBy,
            `${(user as any).firstName || ''} ${(user as any).lastName || ''}`.trim() || user.email || 'Anonymous',
            jobTitle,
            application.id
          );
          console.log('✅ Comprehensive notification sent to employer');
        }
      }

    } catch (notificationError) {
      console.error('❌ Failed to send comprehensive notifications:', notificationError);
      // Don't fail the application if notifications fail
    }

    // Create database notification for job seeker (legacy support)
    try {
      await prisma.notification.create({
        data: {
          userId: user.id,
          type: 'APPLICATION_UPDATE',
          title: 'Application Submitted Successfully!',
          message: `Your application for "${(application as any).job?.title || 'the job'}" has been submitted successfully.`,
          data: {
            applicationId: application.id,
            jobId: application.jobId,
            companyId: application.companyId
          }
        }
      });

      console.log('✅ Database notification created for job seeker:', user.id);

      // Send real-time notification via Socket.io (enhanced with role-based notifications)
      try {
        const { getSocketService } = await import('@/lib/socket-server');
        const socketService = getSocketService();
        
        if (socketService) {
          // Notify jobseeker about successful application submission
          await socketService.sendNotificationToUser(user.id, {
            type: 'APPLICATION_UPDATE',
            title: 'Application Submitted Successfully! 🎉',
            message: `Your application for "${(application as any).job?.title || 'the job'}" has been submitted successfully. The employer will review your application soon.`,
            data: {
              applicationId: application.id,
              jobId: application.jobId,
              companyId: application.companyId,
              jobTitle: (application as any).job?.title || 'Unknown Job',
              companyName: (application as any).job?.company || 'Unknown Company',
              action: 'view_application',
              actionUrl: `/dashboard/applications/${application.id}`
            }
          });
          
          // Also emit legacy new_notification event for backward compatibility
          socketService.io.to(`user:${user.id}`).emit('new_notification', {
            type: 'APPLICATION_UPDATE',
            title: 'Application Submitted Successfully! 🎉',
            message: `Your application for "${(application as any).job?.title || 'the job'}" has been submitted successfully.`,
            data: {
              applicationId: application.id,
              jobId: application.jobId,
              companyId: application.companyId,
              jobTitle: (application as any).job?.title || 'Unknown Job',
              companyName: (application as any).job?.company || 'Unknown Company'
            },
            timestamp: new Date().toISOString()
          });
          console.log('📡 Role-based notification sent to jobseeker for application submission');
        }
      } catch (socketError) {
        console.warn('⚠️ Failed to send real-time notification to jobseeker:', socketError);
      }

    } catch (dbError) {
      console.warn('⚠️ Failed to create database notification for job seeker:', dbError);
    }

    // Notify employer about new application
    if (companyId) {
      try {
        // Find the employer who created the company
        const employer = await prisma.user.findFirst({
          where: {
            createdCompanies: {
              some: { id: companyId }
            }
          },
          select: { id: true, firstName: true, lastName: true, email: true }
        });

        if (employer) {
          await prisma.notification.create({
            data: {
              userId: employer.id,
              type: 'APPLICATION_UPDATE',
              title: 'New Job Application Received! 🎉',
              message: `You have received a new application for "${(application as any).job?.title || 'the job'}" from ${fullName}.`,
              data: {
                applicationId: application.id,
                jobId: application.jobId,
                jobTitle: (application as any).job?.title || 'Unknown Job',
                applicantName: fullName,
                applicantEmail: email,
                applicantPhone: phone
              }
            }
          });

          console.log('✅ Database notification created for employer:', employer.id);

          // Send real-time notification via Socket.io (enhanced with role-based notifications)
          try {
            const { getSocketService } = await import('@/lib/socket-server');
            const socketService = getSocketService();
            
            if (socketService) {
              // Notify employer about new application received
              await socketService.sendNotificationToUser(employer.id, {
                type: 'APPLICATION_RECEIVED',
                title: 'New Job Application Received! 📝',
                message: `You have received a new application for "${(application as any).job?.title || 'the job'}" from ${fullName}.`,
                data: {
                  applicationId: application.id,
                  jobId: application.jobId,
                  jobTitle: (application as any).job?.title || 'Unknown Job',
                  applicantName: fullName,
                  applicantEmail: email,
                  applicantPhone: phone,
                  action: 'review_application',
                  actionUrl: `/employer/applications/${application.id}`
                }
              });
              
              // Also emit legacy new_notification event for backward compatibility
              socketService.io.to(`user:${employer.id}`).emit('new_notification', {
                type: 'APPLICATION_UPDATE',
                title: 'New Job Application Received! 🎉',
                message: `You have received a new application for "${(application as any).job?.title || 'the job'}" from ${fullName}.`,
                data: {
                  applicationId: application.id,
                  jobId: application.jobId,
                  jobTitle: (application as any).job?.title || 'Unknown Job',
                  applicantName: fullName,
                  applicantEmail: email,
                  applicantPhone: phone
                },
                timestamp: new Date().toISOString()
              });
              console.log('📡 Role-based notification sent to employer for new application');
            }
          } catch (socketError) {
            console.warn('⚠️ Failed to send real-time notification to employer:', socketError);
          }
        }
      } catch (employerNotificationError) {
        console.warn('⚠️ Failed to notify employer:', employerNotificationError);
      }
    }

    // Track job application event
    try {
      await trackJobApplication(
        session.user.id,
        session.user.role || 'jobseeker',
        jobId,
        job.title,
        job.company || 'Unknown Company',
        application.id
      );
    } catch (_error) {
      console.error('❌ Failed to track job application:', error);
    }

    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Application submitted successfully!',
      application: {
        id: application.id,
        jobTitle: (application as any).job?.title || 'Unknown Job',
        companyName: (application as any).job?.company || 'Unknown Company',
        status: application.status,
        appliedAt: application.appliedAt
      }
    });

  } catch (error: any) {
    console.error('❌ Error in job application:', error);
    
    // Return detailed error information
    return NextResponse.json({
      success: false,
      error: 'Failed to submit application. Please try again.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      code: 'SUBMISSION_ERROR'
    }, { status: 500 });
  }
}

/**
 * Enhanced job lookup with multiple fallback strategies
 */
async function findJobWithFallback(jobId: string) {
  try {
    console.log(`🔍 Looking up job with ID: ${jobId}`);
    
    // Strategy 1: Direct numeric ID lookup
    const numericId = parseInt(jobId, 10);
    if (!isNaN(numericId)) {
      try {
        const job = await prisma.job.findUnique({
          where: { id: numericId },
          include: {
            companyRelation: {
              select: {
                id: true,
                name: true
              }
            }
          }
        });
        if (job) {
          console.log('✅ Job found by numeric ID:', job.title);
          return job;
        }
      } catch (_error) {
        console.warn('⚠️ Numeric ID lookup failed:', error);
      }
    }
    
    // Strategy 2: SourceId lookup
    try {
      const job = await prisma.job.findFirst({
        where: { sourceId: jobId },
        include: {
          companyRelation: {
            select: {
              id: true,
              name: true
            }
          }
        }
      });
      if (job) {
        console.log('✅ Job found by sourceId:', job.title);
        return job;
      }
    } catch (_error) {
      console.warn('⚠️ SourceId lookup failed:', error);
    }
    
    // Strategy 3: String ID lookup (for external jobs)
    try {
      const job = await prisma.job.findFirst({
        where: { 
          OR: [
            { sourceId: jobId }
          ]
        },
        include: {
          companyRelation: {
            select: {
              id: true,
              name: true
            }
          }
        }
      });
      if (job) {
        console.log('✅ Job found by string ID:', job.title);
        return job;
      }
    } catch (_error) {
      console.warn('⚠️ String ID lookup failed:', error);
    }
    
    console.log(`❌ Job not found with any strategy: ${jobId}`);
    return null;
  } catch (_error) {
    console.error('❌ Job lookup failed:', error);
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      userId: session.user.id
    };

    if (status && status !== 'all') {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { job: { title: { contains: search, mode: 'insensitive' } } },
        { job: { company: { contains: search, mode: 'insensitive' } } }
      ];
    }

    // Get applications with pagination
    const [applications, total] = await Promise.all([
      prisma.application.findMany({
        where,
        skip,
        take: limit,
        orderBy: { appliedAt: 'desc' },
        include: {
          job: {
            select: {
              id: true,
              title: true,
              company: true,
              location: true,
              jobType: true,
              salary: true,
              isRemote: true,
              postedAt: true
            }
          }
        }
      }),
      prisma.application.count({ where })
    ]);

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      success: true,
      data: {
        applications,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      }
    });

  } catch (error: any) {
    console.error('❌ Applications GET API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch applications',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}