import { NextRequest, NextResponse } from 'next/server';

// Mock storage for applications
let applications: any[] = [];
let applicationId = 1;

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '10');
    const page = parseInt(searchParams.get('page') || '1');
    const offset = (page - 1) * limit;

    let filteredApplications = applications;
    if (status) {
      filteredApplications = applications.filter(app => app.status === status);
    }

    const paginatedApplications = filteredApplications.slice(offset, offset + limit);
    const total = filteredApplications.length;

    return NextResponse.json({
      success: true,
      applications: paginatedApplications,
      pagination: {
        current_page: page,
        total_pages: Math.ceil(total / limit),
        total_results: total,
        per_page: limit,
        has_next: page < Math.ceil(total / limit),
        has_prev: page > 1,
      },
      timestamp: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error('Applications GET error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch applications',
      applications: [],
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const contentType = request.headers.get('content-type') || '';
    let payload: Record<string, unknown> = {};

    if (contentType.includes('multipart/form-data')) {
      const form = await request.formData();
      const name = form.get('name')?.toString() || '';
      const email = form.get('email')?.toString() || '';
      const jobId = parseInt(form.get('jobId')?.toString() || '0');
      const coverLetter = form.get('coverLetter')?.toString() || '';
      const file = form.get('file');
      
      payload = { 
        userId: email, // Use email as userId for now
        jobId, 
        coverLetter: coverLetter || `Application from ${name} (${email})`,
        notes: `Applied via form with file: ${file ? (file as File).name : 'No file'}`,
        name,
        email,
        fileName: file ? (file as File).name : undefined
      };
    } else {
      payload = await request.json();
    }

    // Basic validation
    if (!payload.jobId || !payload.userId) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: jobId and userId',
      }, { status: 400 });
    }

    // Check if already applied
    const existingApplication = applications.find(
      app => app.userId === payload.userId && app.jobId === payload.jobId
    );

    if (existingApplication) {
      return NextResponse.json({
        success: false,
        error: 'Already applied',
        message: 'You have already applied for this job',
      }, { status: 409 });
    }

    // Create application
    const application = {
      id: applicationId++,
      userId: payload.userId,
      jobId: payload.jobId,
      resumeId: payload.resumeId,
      coverLetter: payload.coverLetter,
      notes: payload.notes,
      status: 'submitted',
      appliedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      name: payload.name,
      email: payload.email,
      fileName: payload.fileName
    };

    applications.push(application);

    return NextResponse.json({
      success: true,
      message: 'Application submitted successfully',
      application: {
        id: application.id,
        jobId: application.jobId,
        status: application.status,
        appliedAt: application.appliedAt,
      },
    }, { status: 201 });

  } catch (error: any) {
    console.error('Applications POST error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to create application',
      message: error.message,
    }, { status: 500 });
  }
}


