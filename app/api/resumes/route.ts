import { NextRequest, NextResponse } from 'next/server';
import { ResumeService } from '@/lib/resume-service';
import { APIError, ResumeRecord, ResumeData } from '@/lib/resume-api-types';
import { resumeDB } from '@/lib/resume-database';

const resumeService = new ResumeService();

// Helper function to get user resumes with pagination
async function getUserResumes(userId: string, options: {
  page: number;
  limit: number;
  sortBy: string;
  sortOrder: string;
}): Promise<{ data: ResumeRecord[]; total: number }> {
  try {
    // For now, return mock data structure - this should be implemented with resumeDB
    const mockResumes: ResumeRecord[] = [
      {
        id: `resume_${userId}_1`,
        userId: userId,
        title: 'Software Engineer Resume',
        data: {
          fullName: 'John Doe',
          contact: { email: 'john@example.com', phone: '+1234567890' },
          summary: 'Experienced software engineer with 5+ years of experience',
          skills: ['JavaScript', 'React', 'Node.js', 'Python'],
          education: [],
          workExperience: [],
          certifications: [],
          projects: []
        },
        createdAt: new Date(),
        updatedAt: new Date(),
        version: 1,
        status: 'active'
      }
    ];

    // Apply pagination
    const start = (options.page - 1) * options.limit;
    const end = start + options.limit;
    const paginatedResumes = mockResumes.slice(start, end);

    return {
      data: paginatedResumes,
      total: mockResumes.length
    };
  } catch (error) {
    console.error('Error fetching user resumes:', error);
    throw new Error('Failed to fetch resumes');
  }
}

// Helper function to create a new resume
async function createNewResume(userId: string, data: ResumeData): Promise<NextResponse> {
  try {
    // Create resume using resume service
    const newResume = await resumeService.createResume(userId, data);
    
    return NextResponse.json({
      success: true,
      resume: newResume,
      message: 'Resume created successfully',
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating resume:', error);
    
    return NextResponse.json({
      success: false,
      error: {
        code: 'CREATION_FAILED',
        message: 'Failed to create resume',
        details: error instanceof Error ? [error.message] : ['Unknown error occurred'],
      },
      timestamp: new Date().toISOString(),
    } as APIError, { status: 500 });
  }
}

// Helper function to duplicate a resume
async function duplicateResume(userId: string, sourceId: string, modifications?: Partial<ResumeData>): Promise<NextResponse> {
  try {
    // Get source resume
    const sourceResume = await resumeDB.getResume(sourceId, userId);
    if (!sourceResume) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Source resume not found',
        },
        timestamp: new Date().toISOString(),
      } as APIError, { status: 404 });
    }

    // Create modified data
    const duplicatedData = {
      ...sourceResume.data,
      ...modifications,
      fullName: modifications?.fullName || `${sourceResume.data.fullName} (Copy)`,
    };

    // Create new resume
    const duplicatedResume = await resumeService.createResume(userId, duplicatedData);
    
    return NextResponse.json({
      success: true,
      resume: duplicatedResume,
      sourceId: sourceId,
      message: 'Resume duplicated successfully',
    }, { status: 201 });
  } catch (error) {
    console.error('Error duplicating resume:', error);
    
    return NextResponse.json({
      success: false,
      error: {
        code: 'DUPLICATION_FAILED',
        message: 'Failed to duplicate resume',
        details: error instanceof Error ? [error.message] : ['Unknown error occurred'],
      },
      timestamp: new Date().toISOString(),
    } as APIError, { status: 500 });
  }
}

/**
 * GET /api/resumes
 * List all resumes for a user or get API documentation
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const userId = request.headers.get('x-user-id') || request.nextUrl.searchParams.get('userId');
  const documentation = request.nextUrl.searchParams.get('docs');
  
  // If docs parameter is present, return API documentation
  if (documentation !== null) {
    return getAPIDocumentation();
  }
  
  // If no user ID, return authentication error
  if (!userId) {
    return NextResponse.json({
      success: false,
      error: {
        code: 'AUTHENTICATION_REQUIRED',
        message: 'User ID is required to list resumes',
        details: ['Provide x-user-id header or userId query parameter'],
      },
      timestamp: new Date().toISOString(),
    } as APIError, { status: 401 });
  }

  try {
    // Get pagination parameters
    const page = parseInt(request.nextUrl.searchParams.get('page') || '1');
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '10');
    const sortBy = request.nextUrl.searchParams.get('sortBy') || 'updatedAt';
    const sortOrder = request.nextUrl.searchParams.get('sortOrder') || 'desc';
    
    // Get user's resumes
    const resumes = await getUserResumes(userId, { page, limit, sortBy, sortOrder });
    
    return NextResponse.json({
      success: true,
      resumes: resumes.data,
      pagination: {
        page,
        limit,
        total: resumes.total,
        totalPages: Math.ceil(resumes.total / limit),
      },
      meta: {
        sortBy,
        sortOrder,
      },
    }, { status: 200 });

  } catch (error) {
    console.error('Resume listing error:', error);
    
    return NextResponse.json({
      success: false,
      error: {
        code: 'LISTING_FAILED',
        message: 'Failed to retrieve resumes',
        details: error instanceof Error ? [error.message] : ['Unknown error occurred'],
      },
      timestamp: new Date().toISOString(),
    } as APIError, { status: 500 });
  }
}

/**
 * POST /api/resumes
 * Create a new resume or perform bulk operations
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const userId = request.headers.get('x-user-id');
    const body = await request.json();
    
    if (!userId) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'AUTHENTICATION_REQUIRED',
          message: 'User ID is required to create resume',
        },
        timestamp: new Date().toISOString(),
      } as APIError, { status: 401 });
    }

    // Handle different POST operations based on action
    const action = body.action || 'create';
    
    switch (action) {
      case 'create':
        return await createNewResume(userId, body.data);
      case 'duplicate':
        return await duplicateResume(userId, body.sourceId, body.modifications);
      case 'bulk_create':
        return await handleBulkCreate(userId, body.resumes);
      case 'bulk_update':
        return await handleBulkUpdate(userId, body.updates);
      case 'bulk_delete':
        return await handleBulkDelete(userId, body.resumeIds);
      default:
        return NextResponse.json({
          success: false,
          error: {
            code: 'INVALID_ACTION',
            message: `Unsupported action: ${action}`,
            details: ['Supported actions: create, duplicate, bulk_create, bulk_update, bulk_delete'],
          },
          timestamp: new Date().toISOString(),
        } as APIError, { status: 400 });
    }

  } catch (error) {
    console.error('Resume creation error:', error);
    
    return NextResponse.json({
      success: false,
      error: {
        code: 'OPERATION_FAILED',
        message: 'Failed to process resume operation',
        details: error instanceof Error ? [error.message] : ['Unknown error occurred'],
      },
      timestamp: new Date().toISOString(),
    } as APIError, { status: 500 });
  }
}

// Bulk operation handlers
async function handleBulkCreate(userId: string, resumes: ResumeData[]): Promise<NextResponse> {
  try {
    const createdResumes = [];
    const errors = [];

    for (const [index, resumeData] of resumes.entries()) {
      try {
        const newResume = await resumeService.createResume(userId, resumeData);
        createdResumes.push(newResume);
      } catch (error) {
        errors.push({
          index,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return NextResponse.json({
      success: true,
      created: createdResumes,
      errors: errors,
      message: `Successfully created ${createdResumes.length} out of ${resumes.length} resumes`,
    }, { status: 201 });
  } catch (error) {
    throw error;
  }
}

async function handleBulkUpdate(userId: string, updates: Array<{ id: string; data: Partial<ResumeData> }>): Promise<NextResponse> {
  try {
    const updatedResumes = [];
    const errors = [];

    for (const update of updates) {
      try {
        const updatedResume = await resumeService.updateResume(update.id, userId, update.data);
        updatedResumes.push(updatedResume);
      } catch (error) {
        errors.push({
          id: update.id,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return NextResponse.json({
      success: true,
      updated: updatedResumes,
      errors: errors,
      message: `Successfully updated ${updatedResumes.length} out of ${updates.length} resumes`,
    });
  } catch (error) {
    throw error;
  }
}

async function handleBulkDelete(userId: string, resumeIds: string[]): Promise<NextResponse> {
  try {
    const deletedIds = [];
    const errors = [];

    for (const resumeId of resumeIds) {
      try {
        await resumeService.deleteResume(resumeId, userId);
        deletedIds.push(resumeId);
      } catch (error) {
        errors.push({
          id: resumeId,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return NextResponse.json({
      success: true,
      deleted: deletedIds,
      errors: errors,
      message: `Successfully deleted ${deletedIds.length} out of ${resumeIds.length} resumes`,
    });
  } catch (error) {
    throw error;
  }
}

// API Documentation
function getAPIDocumentation(): NextResponse {
  const documentation = {
    title: 'Resume Management API',
    version: '1.0.0',
    description: 'Comprehensive API for managing resumes with AI-powered features',
    endpoints: {
      'GET /api/resumes': {
        description: 'List all resumes for authenticated user',
        parameters: {
          userId: 'User ID (header: x-user-id or query param)',
          page: 'Page number (default: 1)',
          limit: 'Items per page (default: 10)',
          sortBy: 'Sort field (default: updatedAt)',
          sortOrder: 'Sort order: asc|desc (default: desc)',
          docs: 'Return this documentation if present'
        },
        response: 'Paginated list of resume records'
      },
      'POST /api/resumes': {
        description: 'Create new resume or perform bulk operations',
        actions: {
          create: 'Create single resume',
          duplicate: 'Duplicate existing resume',
          bulk_create: 'Create multiple resumes',
          bulk_update: 'Update multiple resumes',
          bulk_delete: 'Delete multiple resumes'
        }
      }
    },
    authentication: 'Required: x-user-id header',
    dataTypes: 'Real database integration with PostgreSQL'
  };

  return NextResponse.json(documentation);
}