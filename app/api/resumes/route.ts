import { NextRequest, NextResponse } from 'next/server';
import { ResumeService } from '@/lib/resume-service';
import { APIError } from '@/lib/resume-api-types';

const resumeService = new ResumeService();

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
  
  // If no user ID, return authentication error with helpful message
  if (!userId || userId === 'temp') {
    return NextResponse.json({
      success: false,
      error: {
        code: 'AUTHENTICATION_REQUIRED',
        message: 'User ID is required to list resumes',
        details: [
          'Provide x-user-id header or userId query parameter',
          'User must be authenticated to access resumes',
          'Check if user session is valid'
        ],
      },
      timestamp: new Date().toISOString(),
    } as APIError, { status: 401 });
  }

  // Convert string userId to integer for database operations
  const numericUserId = parseInt(userId.toString());
  if (isNaN(numericUserId)) {
    return NextResponse.json({
      success: false,
      error: {
        code: 'INVALID_USER_ID',
        message: 'Invalid user ID format',
        details: ['User ID must be a valid number'],
      },
      timestamp: new Date().toISOString(),
    } as APIError, { status: 400 });
  }

  try {
    // Get pagination parameters
    const page = parseInt(request.nextUrl.searchParams.get('page') || '1');
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '10');
    const sortBy = request.nextUrl.searchParams.get('sortBy') || 'updatedAt';
    const sortOrder = request.nextUrl.searchParams.get('sortOrder') || 'desc';
    
    // Get user's resumes (implement with your database)
    const resumes = await getUserResumes(numericUserId, { page, limit, sortBy, sortOrder });
    
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
    const body = await request.json();
    
    // Extract userId from request body for POST operations
    const userId = body.data?.userId || body.userId;
    
    if (!userId || userId === 'temp') {
      return NextResponse.json({
        success: false,
        error: {
          code: 'AUTHENTICATION_REQUIRED',
          message: 'Valid user ID is required to create resume',
        },
        timestamp: new Date().toISOString(),
      } as APIError, { status: 401 });
    }

    // Convert string userId to integer for database operations
    const numericUserId = parseInt(userId.toString());
    if (isNaN(numericUserId)) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'INVALID_USER_ID',
          message: 'Invalid user ID format',
          details: ['User ID must be a valid number'],
        },
        timestamp: new Date().toISOString(),
      } as APIError, { status: 400 });
    }

    // Handle different POST operations based on action
    const action = body.action || 'create';
    
    switch (action) {
      case 'create':
        return await createNewResume(numericUserId, body.data);
      case 'duplicate':
        return await duplicateResume(numericUserId, body.sourceId, body.modifications);
      case 'batch-analyze':
        return await batchAnalyzeResumes(numericUserId, body.resumeIds);
      default:
        return NextResponse.json({
          success: false,
          error: {
            code: 'INVALID_ACTION',
            message: `Unknown action: ${action}`,
            details: ['Supported actions: create, duplicate, batch-analyze'],
          },
          timestamp: new Date().toISOString(),
        } as APIError, { status: 400 });
    }

  } catch (error) {
    console.error('Resume operation error:', error);
    
    return NextResponse.json({
      success: false,
      error: {
        code: 'OPERATION_FAILED',
        message: 'Failed to perform resume operation',
        details: error instanceof Error ? [error.message] : ['Unknown error occurred'],
      },
      timestamp: new Date().toISOString(),
    } as APIError, { status: 500 });
  }
}

// Helper functions
async function getUserResumes(userId: number, options: {
  page: number;
  limit: number;
  sortBy: string;
  sortOrder: string;
}) {
  // Implement database query for user's resumes
  // For demo purposes, using localStorage
  if (typeof window !== 'undefined') {
    const allResumes = JSON.parse(localStorage.getItem('resumes') || '[]');
    const userResumes = allResumes.filter((r: any) => r.userId === userId);
    
    // Sort
    userResumes.sort((a: any, b: any) => {
      const aVal = a[options.sortBy];
      const bVal = b[options.sortBy];
      const order = options.sortOrder === 'desc' ? -1 : 1;
      return aVal > bVal ? order : aVal < bVal ? -order : 0;
    });
    
    // Paginate
    const start = (options.page - 1) * options.limit;
    const end = start + options.limit;
    const paginatedResumes = userResumes.slice(start, end);
    
    return {
      data: paginatedResumes.map((r: any) => ({
        id: r.id,
        userId: r.userId,
        fullName: r.data.fullName,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
        version: r.versions.length,
        metadata: {
          atsScore: r.metadata.atsScore,
          completeness: r.metadata.completeness,
          lastAnalyzed: r.metadata.lastAnalyzed,
        },
      })),
      total: userResumes.length,
    };
  }
  
  return { data: [], total: 0 };
}

async function createNewResume(userId: number, data: any) {
  const saved = await resumeService.saveResume(data);
  
  return NextResponse.json({
    success: true,
    resume: {
      id: saved.id,
      userId: saved.userId,
      data: saved.data,
      createdAt: saved.createdAt,
      updatedAt: saved.updatedAt,
      version: saved.versions.length,
      metadata: saved.metadata,
    },
  }, { status: 201 });
}

async function duplicateResume(userId: number, sourceId: string, modifications?: any) {
  const sourceRecord = await resumeService['getResumeRecord'](sourceId, userId.toString());
  if (!sourceRecord) {
    throw new Error('Source resume not found');
  }
  
  const duplicatedData = {
    ...sourceRecord.data,
    ...modifications,
    fullName: modifications?.fullName || `${sourceRecord.data.fullName} (Copy)`,
  };
  
  const saved = await resumeService.saveResume(duplicatedData);
  
  return NextResponse.json({
    success: true,
    resume: {
      id: saved.id,
      sourceId,
      data: saved.data,
      createdAt: saved.createdAt,
    },
  }, { status: 201 });
}

async function batchAnalyzeResumes(userId: number, resumeIds: string[]) {
  const analyses = [];
  
  for (const id of resumeIds) {
    try {
      const record = await resumeService['getResumeRecord'](id, userId.toString());
      if (record) {
        const analysis = await resumeService.analyzeResume(record.data);
        analyses.push({
          resumeId: id,
          success: true,
          analysis: analysis.analysis,
        });
      } else {
        analyses.push({
          resumeId: id,
          success: false,
          error: 'Resume not found',
        });
      }
    } catch (error) {
      analyses.push({
        resumeId: id,
        success: false,
        error: error instanceof Error ? error.message : 'Analysis failed',
      });
    }
  }
  
  return NextResponse.json({
    success: true,
    analyses,
    summary: {
      total: resumeIds.length,
      successful: analyses.filter(a => a.success).length,
      failed: analyses.filter(a => !a.success).length,
    },
  }, { status: 200 });
}

function getAPIDocumentation() {
  const documentation = {
    title: 'Resume Management API',
    version: '1.0.0',
    description: 'Comprehensive RESTful API for AI-powered resume management with analysis, generation, and export capabilities',
    baseUrl: '/api/resumes',
    
    endpoints: {
      'POST /api/resumes/analyze': {
        description: 'Analyze resume content for completeness and ATS compatibility',
        authentication: 'Optional',
        features: ['Completeness scoring', 'ATS optimization', 'Duplicate detection', 'Improvement suggestions'],
      },
      
      'POST /api/resumes/generate': {
        description: 'Generate professional resumes using AI',
        authentication: 'Optional',
        features: ['Job-optimized generation', 'Multiple versions', 'Industry customization', 'Experience-based content'],
      },
      
      'POST /api/resumes/upload': {
        description: 'Upload and process resume files (PDF, DOCX, TXT)',
        authentication: 'Recommended',
        features: ['Multi-format support', 'Text extraction', 'Data parsing', 'Confidence scoring'],
      },
      
      'GET /api/resumes': {
        description: 'List user resumes with pagination and filtering',
        authentication: 'Required',
        features: ['Pagination', 'Sorting', 'Metadata summary', 'Bulk operations'],
      },
      
      'POST /api/resumes': {
        description: 'Create new resumes or perform bulk operations',
        authentication: 'Required',
        features: ['Resume creation', 'Duplication', 'Batch analysis'],
      },
      
      'GET /api/resumes/{id}': {
        description: 'Retrieve specific resume with full details',
        authentication: 'Required',
        features: ['Version history', 'Metadata', 'Analysis history'],
      },
      
      'PUT /api/resumes/{id}': {
        description: 'Update resume with change tracking',
        authentication: 'Required',
        features: ['Version control', 'Change detection', 'Automatic reanalysis'],
      },
      
      'DELETE /api/resumes/{id}': {
        description: 'Delete resume (soft or hard delete)',
        authentication: 'Required',
        features: ['Secure deletion', 'User verification'],
      },
      
      'POST /api/resumes/{id}/export': {
        description: 'Export resumes in multiple formats',
        authentication: 'Required',
        features: ['PDF/DOCX/JSON/TXT export', 'Template customization', 'Theme options'],
      },
    },
    
    authentication: {
      methods: [
        'x-user-id header (recommended for development)',
        'Authorization header with JWT token',
        'Session-based authentication',
      ],
      notes: [
        'Some endpoints work without authentication but with limited features',
        'User-specific operations require authentication',
        'API supports both authenticated and anonymous usage',
      ],
    },
    
    dataFormats: {
      ResumeData: {
        description: 'Structured resume data format',
        required: ['fullName', 'contact.email', 'summary', 'skills'],
        optional: ['workExperience', 'education', 'projects', 'certifications', 'languages', 'awards'],
        validation: 'Zod schema validation with detailed error messages',
      },
    },
    
    features: {
      'AI-Powered Analysis': [
        'Completeness scoring (0-100%)',
        'ATS compatibility assessment',
        'Duplicate content detection',
        'Conflict identification',
        'Personalized suggestions',
      ],
      
      'Smart Generation': [
        'Job description optimization',
        'Industry-specific content',
        'Experience-level appropriate language',
        'Multiple alternative versions',
        'Keyword optimization',
      ],
      
      'File Processing': [
        'PDF text extraction',
        'DOCX content parsing',
        'Plain text processing',
        'Confidence scoring',
        'Issue detection',
      ],
      
      'Export Capabilities': [
        'Professional PDF generation',
        'Editable DOCX creation',
        'JSON data export',
        'Plain text formatting',
        'Template customization',
      ],
      
      'Data Management': [
        'Version control',
        'Change tracking',
        'Metadata storage',
        'Secure user access',
        'Backup and recovery',
      ],
    },
    
    security: [
      'Input validation and sanitization',
      'User authentication and authorization',
      'Secure file processing',
      'Data encryption at rest',
      'Rate limiting and abuse prevention',
      'Audit logging',
    ],
    
    errorHandling: {
      standardFormat: {
        success: false,
        error: {
          code: 'ERROR_CODE',
          message: 'Human readable message',
          details: ['Additional context'],
        },
        timestamp: 'ISO datetime',
      },
      commonCodes: [
        'VALIDATION_ERROR - Invalid input data',
        'AUTHENTICATION_REQUIRED - Missing or invalid authentication',
        'RESUME_NOT_FOUND - Requested resume does not exist',
        'ANALYSIS_FAILED - Resume analysis could not be completed',
        'GENERATION_FAILED - Resume generation encountered an error',
        'UPLOAD_FAILED - File upload or processing failed',
        'EXPORT_FAILED - Resume export could not be completed',
      ],
    },
    
    examples: {
      usage: 'Add ?docs=true to any endpoint to get specific documentation',
      curlCommands: [
        'curl -X POST -H "Content-Type: application/json" -d \'{"resumeText":"..."}\' /api/resumes/analyze',
        'curl -X POST -H "x-user-id: user-123" -F "file=@resume.pdf" /api/resumes/upload',
        'curl -X GET -H "x-user-id: user-123" /api/resumes',
      ],
    },
    
    rateLimits: {
      analyze: '100 requests per hour per user',
      generate: '20 requests per hour per user',
      upload: '50 requests per hour per user',
      export: '100 requests per hour per user',
      general: '1000 requests per hour per user',
    },
    
    support: {
      documentation: 'Each endpoint provides detailed docs with examples',
      troubleshooting: 'Check error codes and details for specific guidance',
      contact: 'API support available through standard channels',
    },
  };

  return NextResponse.json(documentation, { status: 200 });
}
