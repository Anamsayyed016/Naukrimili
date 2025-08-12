import { NextRequest, NextResponse } from 'next/server';
import { ResumeService } from '@/lib/resume-service';
import { 
  ResumeRetrievalResponse,
  ResumeUpdateRequest,
  ResumeUpdateResponse,
  UpdateRequestSchema,
  APIError 
} from '@/lib/resume-api-types';

const resumeService = new ResumeService();

/**
 * GET /api/resumes/[id]
 * Retrieve a specific resume by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<ResumeRetrievalResponse | APIError>> {
  try {
    const { id } = params;
    const userId = request.headers.get('x-user-id') || request.nextUrl.searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'AUTHENTICATION_REQUIRED',
          message: 'User ID is required to retrieve resume',
          details: ['Provide x-user-id header or userId query parameter'],
        },
        timestamp: new Date().toISOString(),
      }, { status: 401 });
    }

    // Retrieve resume record
    const record = await resumeService['getResumeRecord'](id, userId);
    
    if (!record) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'RESUME_NOT_FOUND',
          message: 'Resume not found or access denied',
          details: [`Resume ID: ${id}`, `User ID: ${userId}`],
        },
        timestamp: new Date().toISOString(),
      }, { status: 404 });
    }

    const response: ResumeRetrievalResponse = {
      success: true,
      resume: {
        id: record.id,
        userId: record.userId,
        data: record.data,
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
        version: record.versions.length,
        metadata: {
          atsScore: record.metadata.atsScore,
          completeness: record.metadata.completeness,
          lastAnalyzed: record.metadata.lastAnalyzed,
        },
      },
    };

    // Log retrieval
    console.log(`Resume retrieved: ${id} for user: ${userId}`);

    return NextResponse.json(response, { status: 200 });

  } catch (error) {
    console.error('Resume retrieval error:', error);
    
    return NextResponse.json({
      success: false,
      error: {
        code: 'RETRIEVAL_FAILED',
        message: 'Failed to retrieve resume',
        details: error instanceof Error ? [error.message] : ['Unknown error occurred'],
      },
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}

/**
 * PUT /api/resumes/[id]
 * Update a specific resume
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<ResumeUpdateResponse | APIError>> {
  try {
    const { id } = params;
    const userId = request.headers.get('x-user-id');
    const body = await request.json();
    
    if (!userId) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'AUTHENTICATION_REQUIRED',
          message: 'User ID is required to update resume',
          details: ['Provide x-user-id header'],
        },
        timestamp: new Date().toISOString(),
      }, { status: 401 });
    }

    // Validate request body
    const validationResult = UpdateRequestSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request data',
          details: validationResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`),
        },
        timestamp: new Date().toISOString(),
      }, { status: 400 });
    }

    const { data, changeNotes, reanalyze } = validationResult.data;

    // Get current resume for comparison
    const currentRecord = await resumeService['getResumeRecord'](id, userId);
    if (!currentRecord) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'RESUME_NOT_FOUND',
          message: 'Resume not found or access denied',
        },
        timestamp: new Date().toISOString(),
      }, { status: 404 });
    }

    // Detect changes
    const fieldsModified = detectModifiedFields(currentRecord.data, data);
    const previousVersion = currentRecord.versions.length;

    // Update resume
    const updatedRecord = await resumeService.updateResume(
      id, 
      userId, 
      data, 
      changeNotes, 
      reanalyze
    );

    // Prepare analysis if requested
    let analysis;
    if (reanalyze) {
      const analysisResult = await resumeService.analyzeResume(data, userId);
      analysis = analysisResult.analysis;
    }

    const response: ResumeUpdateResponse = {
      success: true,
      resume: {
        id: updatedRecord.id,
        userId: updatedRecord.userId,
        data: updatedRecord.data,
        createdAt: updatedRecord.createdAt,
        updatedAt: updatedRecord.updatedAt,
        version: updatedRecord.versions.length,
        metadata: {
          atsScore: updatedRecord.metadata.atsScore,
          completeness: updatedRecord.metadata.completeness,
          lastAnalyzed: updatedRecord.metadata.lastAnalyzed,
        },
      },
      changes: {
        fieldsModified,
        previousVersion,
        newVersion: updatedRecord.versions.length,
      },
      analysis,
    };

    // Log update
    console.log(`Resume updated: ${id} for user: ${userId}`, {
      fieldsModified,
      reanalyzed: reanalyze,
      changeNotes,
    });

    return NextResponse.json(response, { status: 200 });

  } catch (error) {
    console.error('Resume update error:', error);
    
    return NextResponse.json({
      success: false,
      error: {
        code: 'UPDATE_FAILED',
        message: 'Failed to update resume',
        details: error instanceof Error ? [error.message] : ['Unknown error occurred'],
      },
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}

/**
 * DELETE /api/resumes/[id]
 * Delete a specific resume
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<{ success: boolean } | APIError>> {
  try {
    const { id } = params;
    const userId = request.headers.get('x-user-id');
    
    if (!userId) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'AUTHENTICATION_REQUIRED',
          message: 'User ID is required to delete resume',
        },
        timestamp: new Date().toISOString(),
      }, { status: 401 });
    }

    // Verify resume exists and belongs to user
    const record = await resumeService['getResumeRecord'](id, userId);
    if (!record) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'RESUME_NOT_FOUND',
          message: 'Resume not found or access denied',
        },
        timestamp: new Date().toISOString(),
      }, { status: 404 });
    }

    // Implement soft delete or hard delete based on your requirements
    // For now, we'll implement hard delete
    await deleteResumeRecord(id, userId);

    console.log(`Resume deleted: ${id} for user: ${userId}`);

    return NextResponse.json({ success: true }, { status: 200 });

  } catch (error) {
    console.error('Resume deletion error:', error);
    
    return NextResponse.json({
      success: false,
      error: {
        code: 'DELETION_FAILED',
        message: 'Failed to delete resume',
        details: error instanceof Error ? [error.message] : ['Unknown error occurred'],
      },
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}

// Helper functions
function detectModifiedFields(oldData: any, newData: any): string[] {
  const modified: string[] = [];
  
  function compareObjects(old: any, updated: any, prefix = ''): void {
    for (const key in updated) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      
      if (typeof updated[key] === 'object' && updated[key] !== null && !Array.isArray(updated[key])) {
        if (old[key] && typeof old[key] === 'object') {
          compareObjects(old[key], updated[key], fullKey);
        } else {
          modified.push(fullKey);
        }
      } else if (JSON.stringify(old[key]) !== JSON.stringify(updated[key])) {
        modified.push(fullKey);
      }
    }
  }
  
  compareObjects(oldData, newData);
  return modified;
}

async function deleteResumeRecord(id: string, userId: string): Promise<void> {
  // Implement database deletion
  // For demo purposes, using localStorage
  if (typeof window !== 'undefined') {
    const resumes = JSON.parse(localStorage.getItem('resumes') || '[]');
    const filtered = resumes.filter((r: any) => !(r.id === id && r.userId === userId));
    localStorage.setItem('resumes', JSON.stringify(filtered));
  }
}