import { NextRequest, NextResponse } from 'next/server';
import { ResumeService } from '@/lib/resume-service';
import { 
  GenerateRequestSchema,
  ResumeGenerationResponse,
  APIError 
} from '@/lib/resume-api-types';

const resumeService = new ResumeService();

/**
 * POST /api/resumes/generate
 * Generate a professional, ATS-friendly resume using AI
 */
export async function POST(request: NextRequest): Promise<NextResponse<ResumeGenerationResponse | APIError>> {
  try {
    const body = await request.json();
    
    // Validate request body
    const validationResult = GenerateRequestSchema.safeParse(body);
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

    const requestData = validationResult.data;
    
    // Determine authentication
    const authUserId = requestData.userId || request.headers.get('x-user-id') || 'anonymous';
    
    // Generate resume
    const generation = await resumeService.generateResume({
      ...requestData,
      userId: authUserId,
      preferences: {
        tone: requestData.preferences?.tone || 'professional',
        length: requestData.preferences?.length || 'detailed',
        focus: requestData.preferences?.focus || 'experience',
        ...requestData.preferences
      }
    });
    
    // Log generation for monitoring
    console.log(`Resume generation completed for user: ${authUserId}`, {
      targetRole: requestData.targetRole,
      experienceLevel: requestData.experienceLevel,
      industryType: requestData.industryType,
    });
    
    return NextResponse.json(generation, { status: 200 });

  } catch (error) {
    console.error('Resume generation error:', error);
    
    return NextResponse.json({
      success: false,
      error: {
        code: 'GENERATION_FAILED',
        message: 'Failed to generate resume',
        details: error instanceof Error ? [error.message] : ['Unknown error occurred'],
      },
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}

/**
 * GET /api/resumes/generate
 * Get generation capabilities and parameters documentation
 */
export async function GET(): Promise<NextResponse> {
  const documentation = {
    endpoint: '/api/resumes/generate',
    method: 'POST',
    description: 'Generate a professional, ATS-friendly resume using AI based on job requirements and preferences',
    authentication: {
      required: false,
      methods: ['x-user-id header', 'session authentication'],
    },
    requestBody: {
      type: 'application/json',
      required: false,
      schema: {
        jobDescription: {
          type: 'string',
          description: 'Target job description for optimization',
          required: false,
          example: 'We are looking for a Senior Software Engineer with React experience...',
        },
        industryType: {
          type: 'string',
          description: 'Industry context for resume customization',
          required: false,
          examples: ['Technology', 'Healthcare', 'Finance', 'Education'],
        },
        experienceLevel: {
          type: 'string',
          enum: ['entry', 'mid', 'senior', 'executive'],
          description: 'Career level for appropriate content generation',
          required: false,
        },
        targetRole: {
          type: 'string',
          description: 'Specific role title to optimize for',
          required: false,
          example: 'Senior Frontend Developer',
        },
        existingData: {
          type: 'object',
          description: 'Partial resume data to enhance and complete',
          required: false,
          schema: 'Partial<ResumeData>',
        },
        preferences: {
          type: 'object',
          description: 'Generation preferences and style options',
          required: false,
          properties: {
            tone: {
              type: 'string',
              enum: ['professional', 'creative', 'technical'],
              default: 'professional',
            },
            length: {
              type: 'string',
              enum: ['concise', 'detailed'],
              default: 'detailed',
            },
            focus: {
              type: 'string',
              enum: ['skills', 'experience', 'education', 'projects'],
              default: 'experience',
            },
          },
        },
        userId: {
          type: 'string',
          description: 'User identifier for personalized generation',
          required: false,
        },
      },
    },
    responses: {
      200: {
        description: 'Resume generated successfully',
        schema: {
          success: true,
          resumeData: 'ResumeData (complete generated resume)',
          suggestions: 'string[] (improvement recommendations)',
          atsOptimizations: 'string[] (ATS-specific suggestions)',
          alternativeVersions: {
            description: 'Alternative resume versions with different focus areas',
            type: 'object',
            properties: {
              skillsFocused: 'ResumeData',
              experienceFocused: 'ResumeData',
            },
          },
        },
      },
      400: {
        description: 'Validation error',
      },
      500: {
        description: 'Generation failed',
      },
    },
    examples: {
      basicGeneration: {
        targetRole: 'Software Engineer',
        experienceLevel: 'mid',
        preferences: {
          tone: 'professional',
          focus: 'experience',
        },
      },
      jobOptimizedGeneration: {
        jobDescription: 'We are seeking a React developer with 3+ years of experience in modern JavaScript frameworks...',
        targetRole: 'Frontend Developer',
        experienceLevel: 'mid',
        industryType: 'Technology',
        preferences: {
          tone: 'technical',
          length: 'detailed',
          focus: 'skills',
        },
      },
      enhanceExisting: {
        existingData: {
          fullName: 'Jane Smith',
          contact: {
            email: 'jane.smith@example.com',
          },
          skills: ['JavaScript', 'React'],
        },
        targetRole: 'Senior Frontend Developer',
        experienceLevel: 'senior',
      },
      successResponse: {
        success: true,
        resumeData: {
          fullName: 'Generated Full Name',
          contact: {
            email: 'generated@example.com',
            phone: '+1-555-123-4567',
            linkedin: 'https://linkedin.com/in/profile',
          },
          summary: 'Results-driven software engineer with 5+ years of experience...',
          skills: ['JavaScript', 'React', 'Node.js', 'TypeScript'],
          workExperience: [
            {
              jobTitle: 'Senior Software Engineer',
              company: 'Tech Company',
              startDate: '2020-01',
              endDate: 'Present',
              responsibilities: [
                'Led development of high-performance web applications',
                'Mentored junior developers and conducted code reviews',
              ],
            },
          ],
          // ... other fields
        },
        suggestions: [
          'Consider adding specific metrics to quantify achievements',
          'Include relevant industry certifications',
        ],
        atsOptimizations: [
          'Add "Agile methodology" keyword if applicable',
          'Include years of experience in skill descriptions',
        ],
        alternativeVersions: {
          skillsFocused: {
            // Skills-focused version
          },
          experienceFocused: {
            // Experience-focused version
          },
        },
      },
    },
    features: [
      'AI-powered content generation',
      'Job description optimization',
      'Industry-specific customization',
      'Experience level appropriate content',
      'Multiple resume versions (skills-focused, experience-focused)',
      'ATS optimization suggestions',
      'Integration with existing resume data',
      'Customizable tone and style preferences',
    ],
    useCases: [
      'Creating a new resume from scratch',
      'Optimizing existing resume for specific job applications',
      'Generating multiple versions for different roles',
      'Enhancing incomplete resume data',
      'ATS optimization for better screening success',
    ],
    aiCapabilities: [
      'Natural language processing for job description analysis',
      'Keyword extraction and optimization',
      'Industry-specific language and terminology',
      'Achievement quantification suggestions',
      'Professional summary generation',
      'Skills gap identification and recommendations',
    ],
  };

  return NextResponse.json(documentation, { status: 200 });
}
