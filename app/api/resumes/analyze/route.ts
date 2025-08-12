import { NextRequest, NextResponse } from 'next/server';
import { ResumeService } from '@/lib/resume-service';
import { 
  AnalyzeRequestSchema,
  ResumeAnalysisResponse,
  APIError 
} from '@/lib/resume-api-types';
import { z } from 'zod';

const resumeService = new ResumeService();

/**
 * POST /api/resumes/analyze
 * Analyze resume content for completeness, ATS compatibility, and improvement suggestions
 */
export async function POST(request: NextRequest): Promise<NextResponse<ResumeAnalysisResponse | APIError>> {
  try {
    const body = await request.json();
    
    // Validate request body
    const validationResult = AnalyzeRequestSchema.safeParse(body);
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

    const { resumeData, resumeText, userId } = validationResult.data;
    
    // Determine authentication from headers or session
    const authUserId = userId || request.headers.get('x-user-id') || 'anonymous';
    
    // Perform analysis
    const analysisData = resumeData || resumeText;
    if (!analysisData) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'MISSING_DATA',
          message: 'Either resumeData or resumeText must be provided',
        },
        timestamp: new Date().toISOString(),
      }, { status: 400 });
    }

    const analysis = await resumeService.analyzeResume(analysisData, authUserId);
    
    // Log analysis for monitoring
    console.log(`Resume analysis completed for user: ${authUserId}`);
    
    return NextResponse.json(analysis, { status: 200 });

  } catch (error) {
    console.error('Resume analysis error:', error);
    
    return NextResponse.json({
      success: false,
      error: {
        code: 'ANALYSIS_FAILED',
        message: 'Failed to analyze resume',
        details: error instanceof Error ? [error.message] : ['Unknown error occurred'],
      },
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}

/**
 * GET /api/resumes/analyze
 * Get analysis capabilities and requirements documentation
 */
export async function GET(): Promise<NextResponse> {
  const documentation = {
    endpoint: '/api/resumes/analyze',
    method: 'POST',
    description: 'Analyze resume content for completeness, ATS compatibility, and improvement suggestions',
    authentication: {
      required: false,
      methods: ['x-user-id header', 'session authentication'],
    },
    requestBody: {
      type: 'application/json',
      required: true,
      schema: {
        resumeData: {
          type: 'object',
          description: 'Structured resume data conforming to ResumeData schema',
          required: false,
        },
        resumeText: {
          type: 'string',
          description: 'Raw resume text for parsing and analysis',
          required: false,
        },
        userId: {
          type: 'string',
          description: 'User identifier for personalized analysis',
          required: false,
        },
      },
      validation: 'Either resumeData or resumeText must be provided',
    },
    responses: {
      200: {
        description: 'Analysis completed successfully',
        schema: {
          success: true,
          analysis: {
            completeness: 'number (0-100)',
            atsScore: 'number (0-100)',
            issues: 'string[]',
            suggestions: 'string[]',
            missingFields: 'string[]',
            strengthAreas: 'string[]',
            weaknessAreas: 'string[]',
            duplicateContent: 'string[]',
            conflicts: 'string[]',
          },
          enhancedData: 'ResumeData (optional enhanced version)',
        },
      },
      400: {
        description: 'Validation error or missing required data',
        schema: {
          success: false,
          error: {
            code: 'string',
            message: 'string',
            details: 'string[]',
          },
        },
      },
      500: {
        description: 'Internal server error',
      },
    },
    examples: {
      requestWithStructuredData: {
        resumeData: {
          fullName: 'John Doe',
          contact: {
            email: 'john.doe@example.com',
            phone: '+1-555-123-4567',
          },
          summary: 'Experienced software developer...',
          skills: ['JavaScript', 'React', 'Node.js'],
          // ... other fields
        },
        userId: 'user-123',
      },
      requestWithRawText: {
        resumeText: 'John Doe\nSoftware Developer\nemail: john.doe@example.com...',
        userId: 'user-123',
      },
      successResponse: {
        success: true,
        analysis: {
          completeness: 85,
          atsScore: 78,
          issues: ['Missing LinkedIn profile'],
          suggestions: ['Add more quantified achievements', 'Include relevant keywords'],
          missingFields: ['linkedin'],
          strengthAreas: ['Technical skills', 'Work experience'],
          weaknessAreas: ['Professional summary length'],
          duplicateContent: [],
          conflicts: [],
        },
        enhancedData: {
          // Enhanced version of the resume data
        },
      },
    },
    features: [
      'Completeness scoring (0-100%)',
      'ATS (Applicant Tracking System) compatibility scoring',
      'Duplicate content detection',
      'Date conflict detection in work history',
      'Missing field identification',
      'Personalized improvement suggestions',
      'Enhanced data generation with AI improvements',
      'Support for both structured data and raw text input',
    ],
    limitations: [
      'Analysis quality depends on input data completeness',
      'AI suggestions are recommendations, not requirements',
      'Text parsing accuracy may vary based on format',
    ],
  };

  return NextResponse.json(documentation, { status: 200 });
}
