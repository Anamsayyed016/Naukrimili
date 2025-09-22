import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/nextauth-config";
import { prisma } from "@/lib/prisma";
import { getSocketService } from "@/lib/socket-server";

// Helper function to get sample job data
function getSampleJobData(jobId: string, companyId: string | null) {
  const sampleJobs = {
    '1': {
      id: '1',
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
      id: '2',
      title: 'Frontend Developer',
      company: 'Digital Solutions Ltd',
      companyId: companyId,
      location: 'Mumbai, India',
      country: 'IN',
      description: 'Join our frontend team to build beautiful and responsive user interfaces. Experience with modern JavaScript frameworks required.',
      requirements: 'JavaScript, React, CSS, HTML',
      skills: 'JavaScript, React, Vue.js, CSS3, HTML5, Webpack',
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
      id: '3',
      title: 'Data Analyst',
      company: 'Analytics Pro',
      companyId: companyId,
      location: 'Delhi, India',
      country: 'IN',
      description: 'We need a Data Analyst to help us make sense of large datasets and provide insights to drive business decisions.',
      requirements: 'Python, SQL, Excel, Statistics',
      skills: 'Python, SQL, Excel, Statistics, Tableau, Power BI',
      jobType: 'full-time',
      experienceLevel: 'entry',
      salary: '₹6,00,000 - ₹12,00,000',
      isRemote: false,
      isFeatured: false,
      isActive: true,
      source: 'manual',
      sourceId: 'sample-3',
      postedAt: new Date(),
      views: 67,
      applicationsCount: 8
    },
    '4': {
      id: '4',
      title: 'Product Manager',
      company: 'InnovateTech',
      companyId: companyId,
      location: 'Hyderabad, India',
      country: 'IN',
      description: 'Lead product development from concept to launch. Work with cross-functional teams to deliver exceptional user experiences.',
      requirements: 'Product Management, Agile, User Research, Analytics',
      skills: 'Product Management, Agile, User Research, Analytics, Figma, JIRA',
      jobType: 'full-time',
      experienceLevel: 'senior',
      salary: '₹20,00,000 - ₹35,00,000',
      isRemote: true,
      isFeatured: true,
      isActive: true,
      source: 'manual',
      sourceId: 'sample-4',
      postedAt: new Date(),
      views: 203,
      applicationsCount: 45
    },
    '5': {
      id: '5',
      title: 'DevOps Engineer',
      company: 'Cloud Systems',
      companyId: companyId,
      location: 'Pune, India',
      country: 'IN',
      description: 'Build and maintain our cloud infrastructure. Automate deployment processes and ensure system reliability.',
      requirements: 'AWS, Docker, Kubernetes, Linux',
      skills: 'AWS, Docker, Kubernetes, Linux, Terraform, Jenkins',
      jobType: 'full-time',
      experienceLevel: 'mid',
      salary: '₹12,00,000 - ₹20,00,000',
      isRemote: false,
      isFeatured: false,
      isActive: true,
      source: 'manual',
      sourceId: 'sample-5',
      postedAt: new Date(),
      views: 134,
      applicationsCount: 18
    },
    '6': {
      id: '6',
      title: 'UX Designer',
      company: 'Creative Studio',
      companyId: companyId,
      location: 'Chennai, India',
      country: 'IN',
      description: 'Create intuitive and engaging user experiences. Work closely with product and engineering teams.',
      requirements: 'Figma, Adobe Creative Suite, User Research, Prototyping',
      skills: 'Figma, Adobe Creative Suite, User Research, Prototyping, Sketch, InVision',
      jobType: 'full-time',
      experienceLevel: 'mid',
      salary: '₹10,00,000 - ₹18,00,000',
      isRemote: true,
      isFeatured: false,
      isActive: true,
      source: 'manual',
      sourceId: 'sample-6',
      postedAt: new Date(),
      views: 92,
      applicationsCount: 15
    },
    '7': {
      id: '7',
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
      id: '8',
      title: 'Marketing Manager',
      company: 'Growth Marketing Co',
      companyId: companyId,
      location: 'Bangalore, India',
      country: 'IN',
      description: 'Drive marketing strategies and campaigns. Lead a team of marketing professionals.',
      requirements: 'Digital Marketing, Analytics, Team Management, Content Strategy',
      skills: 'Digital Marketing, Google Analytics, Facebook Ads, Content Strategy, SEO, SEM',
      jobType: 'full-time',
      experienceLevel: 'senior',
      salary: '₹12,00,000 - ₹20,00,000',
      isRemote: true,
      isFeatured: false,
      isActive: true,
      source: 'manual',
      sourceId: 'sample-8',
      postedAt: new Date(),
      views: 95,
      applicationsCount: 14
    }
  };

  return sampleJobs[jobId as keyof typeof sampleJobs] || null;
}

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 GET /api/applications called');
    const session = await auth();
    
    if (!session?.user?.email) {
      console.log('❌ No session or email found');
      return NextResponse.json({
        success: false,
        error: 'Authentication required'
      }, { status: 401 });
    }
    
    console.log('�� Session user:', { email: session.user.email });

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const status = searchParams.get("status");
    const search = searchParams.get("search");

    const skip = (page - 1) * limit;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      console.log('❌ User not found for email:', session.user.email);
      return NextResponse.json({
        success: false,
        error: 'User not found'
      }, { status: 404 });
    }
    
    console.log('✅ User found:', { userId: user.id, email: user.email, role: user.role });

    const where: any = { userId: user.id };

    if (status && status !== "all") {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { job: { title: { contains: search, mode: "insensitive" } } },
        { job: { company: { contains: search, mode: "insensitive" } } }
      ];
    }

    console.log('🔍 Querying applications with where clause:', where);
    
    const [applications, total] = await Promise.all([
      prisma.application.findMany({
        where,
        include: {
          job: {
            select: {
              id: true,
              title: true,
              company: true,
              location: true,
              jobType: true,
              salary: true,
              isRemote: true
            }
          },
          company: {
            select: {
              id: true,
              name: true,
              logo: true,
              website: true
            }
          }
        },
        orderBy: { appliedAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.application.count({ where })
    ]);
    
    console.log('📊 Applications query results:', { 
      applicationsCount: applications.length, 
      total, 
      where 
    });

    return NextResponse.json({
      success: true,
      data: {
        applications,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Error fetching applications:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch applications'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 POST /api/applications called');
    const session = await auth();
    
    if (!session?.user?.email) {
      console.log('❌ No session or email found');
      return NextResponse.json({
        success: false,
        error: 'Authentication required'
      }, { status: 401 });
    }
    
    console.log('�� Session user:', { email: session.user.email });

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      console.log('❌ User not found for email:', session.user.email);
      return NextResponse.json({
        success: false,
        error: 'User not found'
      }, { status: 404 });
    }
    
    console.log('✅ User found:', { userId: user.id, email: user.email, role: user.role });

    const formData = await request.formData();
    const jobId = formData.get('jobId') as string;
    const fullName = formData.get('fullName') as string;
    const email = formData.get('email') as string;
    const phone = formData.get('phone') as string;
    const location = formData.get('location') as string;
    const coverLetter = formData.get('coverLetter') as string;
    const expectedSalary = formData.get('expectedSalary') as string;
    const availability = formData.get('availability') as string;
    const resume = formData.get('resume') as File;

    console.log('📝 Form data received:', {
      jobId,
      fullName,
      email,
      phone,
      coverLetter: coverLetter?.substring(0, 50) + '...',
      resumeSize: resume?.size || 0
    });

    // Validate required fields
    if (!jobId || !fullName || !email) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: jobId, fullName, and email are required'
      }, { status: 400 });
    }

    // Check if job exists in database first
    let job = await prisma.job.findUnique({
      where: { id: jobId }
    });

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
        } catch (error) {
          console.log('No company found, sample job will be created without company link');
        }

        // Create the sample job in the database
        try {
          const sampleJobData = getSampleJobData(jobId, sampleCompanyId);
          job = await prisma.job.create({
            data: sampleJobData
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

    console.log('✅ Job found:', { jobId: job.id, title: job.title, companyId: job.companyId });

    // Check if user already applied for this job
    const existingApplication = await prisma.application.findFirst({
      where: {
        userId: user.id,
        jobId: jobId
      }
    });

    if (existingApplication) {
      return NextResponse.json({
        success: false,
        error: 'You have already applied for this job'
      }, { status: 409 });
    }

    // Handle resume upload if provided
    let resumeUrl = null;
    if (resume && resume.size > 0) {
      // In a real application, you would upload to a file storage service
      // For now, we'll store the filename
      resumeUrl = `resumes/${user.id}/${Date.now()}-${resume.name}`;
    }

    // Use the job's company ID
    let companyId = job.companyId;

    console.log('🔍 Creating application with data:', {
      userId: user.id,
      jobId: jobId,
      companyId: companyId,
      jobTitle: job.title
    });

    // Create application
    const application = await prisma.application.create({
      data: {
        userId: user.id,
        jobId: jobId,
        notes: coverLetter || null,
        status: 'submitted',
        appliedAt: new Date(),
        coverLetter: coverLetter || null,
        resumeId: null,
        companyId: companyId
      },
      include: {
        job: {
          select: {
            id: true,
            title: true,
            company: true,
            location: true
          }
        },
        company: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    console.log('✅ Application created successfully:', application.id);

    // Send real-time notification via Socket.io
    const socketService = getSocketService();
    if (socketService) {
      try {
        // Notify the job seeker about successful application
        await socketService.sendNotificationToUser(user.id, {
          type: 'APPLICATION_UPDATE',
          title: '🎉 Application Submitted Successfully!',
          message: `Your application for "${application.job.title}" at ${application.job.company} has been submitted successfully. You'll hear back from the employer soon!`,
          data: {
            applicationId: application.id,
            jobId: application.jobId,
            companyId: application.companyId,
            jobTitle: application.job.title,
            companyName: application.job.company
          }
        });

        // Also create a database notification for persistence
        await prisma.notification.create({
          data: {
            userId: user.id,
            type: 'APPLICATION_UPDATE',
            title: 'Application Submitted Successfully!',
            message: `Your application for "${application.job.title}" at ${application.job.company} has been submitted successfully.`,
            data: {
              applicationId: application.id,
              jobId: application.jobId,
              companyId: application.companyId
            }
          }
        });

        console.log('📤 Real-time notifications sent for new application');
      } catch (socketError) {
        console.warn('⚠️ Failed to send real-time notifications:', socketError);
        // Don't fail the application creation if socket fails
      }
    } else {
      // Fallback: Create database notification even if socket fails
      try {
        await prisma.notification.create({
          data: {
            userId: user.id,
            type: 'APPLICATION_UPDATE',
            title: 'Application Submitted Successfully!',
            message: `Your application for "${application.job.title}" at ${application.job.company} has been submitted successfully.`,
            data: {
              applicationId: application.id,
              jobId: application.jobId,
              companyId: application.companyId
            }
          }
        });
        console.log('📝 Database notification created as fallback');
      } catch (notificationError) {
        console.warn('⚠️ Failed to create database notification:', notificationError);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Application submitted successfully',
      data: {
        applicationId: application.id,
        jobTitle: application.job.title,
        company: application.job.company,
        appliedAt: application.appliedAt,
        application: application // Include full application for real-time updates
      }
    }, { status: 201 });

  } catch (error) {
    console.error('❌ Error creating application:', error);
    console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to submit application',
      details: process.env.NODE_ENV === 'development' ? error : undefined
    }, { status: 500 });
  }
}
