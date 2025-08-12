import { NextRequest, NextResponse } from 'next/server';
import { ResumeService } from '@/lib/resume-service';
import { 
  ExportRequestSchema,
  ResumeExportResponse,
  APIError 
} from '@/lib/resume-api-types';

const resumeService = new ResumeService();

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

/**
 * POST /api/resumes/[id]/export
 * Export resume in various formats (PDF, JSON, DOCX, TXT)
 */
export async function POST(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<ResumeExportResponse | APIError>> {
  try {
    const { id } = await params;
    const userId = request.headers.get('x-user-id');
    const body = await request.json();
    
    if (!userId) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'AUTHENTICATION_REQUIRED',
          message: 'User ID is required to export resume',
          details: ['Provide x-user-id header'],
        },
        timestamp: new Date().toISOString(),
      }, { status: 401 });
    }

    // Validate request body
    const validationResult = ExportRequestSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid export request',
          details: validationResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`),
        },
        timestamp: new Date().toISOString(),
      }, { status: 400 });
    }

    const { format, template, customizations } = validationResult.data;

    // Export resume
    const exportResult = await resumeService.exportResumeWithTracking(id, userId, format, template);

    // Set expiration time (24 hours from now)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    const response: ResumeExportResponse = {
      success: true,
      downloadUrl: exportResult.downloadUrl,
      fileName: exportResult.filename,
      fileSize: exportResult.fileSize,
      expiresAt: expiresAt.toISOString(),
    };

    // Log export
    console.log(`Resume exported: ${id} for user: ${userId}`, {
      format,
      fileName: exportResult.filename,
      fileSize: exportResult.fileSize,
    });

    return NextResponse.json(response, { status: 200 });

  } catch (error) {
    console.error('Resume export error:', error);
    
    return NextResponse.json({
      success: false,
      error: {
        code: 'EXPORT_FAILED',
        message: 'Failed to export resume',
        details: error instanceof Error ? [error.message] : ['Unknown error occurred'],
      },
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}

/**
 * GET /api/resumes/[id]/export
 * Get export capabilities and format documentation
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  const { id } = await params;
  
  const documentation = {
    endpoint: `/api/resumes/${id}/export`,
    method: 'POST',
    description: 'Export resume in various formats with customization options',
    authentication: {
      required: true,
      methods: ['x-user-id header'],
    },
    requestBody: {
      type: 'application/json',
      required: true,
      schema: {
        format: {
          type: 'string',
          enum: ['pdf', 'json', 'docx', 'txt'],
          description: 'Export format',
          required: true,
        },
        template: {
          type: 'string',
          description: 'Template name for formatted exports (PDF, DOCX)',
          required: false,
          examples: ['modern', 'classic', 'minimal', 'creative'],
        },
        customizations: {
          type: 'object',
          description: 'Export customization options',
          required: false,
          properties: {
            theme: {
              type: 'string',
              description: 'Color theme for formatted exports',
              examples: ['blue', 'green', 'purple', 'black'],
            },
            layout: {
              type: 'string',
              description: 'Layout style',
              examples: ['single-column', 'two-column', 'sidebar'],
            },
            sections: {
              type: 'array',
              items: { type: 'string' },
              description: 'Sections to include in export',
              examples: [['summary', 'experience', 'skills', 'education']],
            },
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Export completed successfully',
        schema: {
          success: true,
          downloadUrl: 'string (temporary download URL)',
          fileName: 'string (generated filename)',
          fileSize: 'number (file size in bytes)',
          expiresAt: 'string (ISO datetime when download expires)',
        },
      },
      401: {
        description: 'Authentication required',
      },
      404: {
        description: 'Resume not found',
      },
      400: {
        description: 'Invalid export parameters',
      },
      500: {
        description: 'Export failed',
      },
    },
    supportedFormats: {
      json: {
        description: 'Structured JSON format',
        features: ['Complete data preservation', 'Machine readable', 'API compatible'],
        useCase: 'Data backup, API integration, form auto-fill',
        customizations: 'None (data format)',
      },
      pdf: {
        description: 'Professional PDF document',
        features: ['Professional formatting', 'Print-ready', 'ATS-friendly'],
        useCase: 'Job applications, printing, email attachments',
        customizations: ['Templates', 'Themes', 'Layouts', 'Section selection'],
      },
      docx: {
        description: 'Microsoft Word document',
        features: ['Editable format', 'Professional appearance', 'Wide compatibility'],
        useCase: 'Further editing, sharing with recruiters',
        customizations: ['Templates', 'Themes', 'Section selection'],
      },
      txt: {
        description: 'Plain text format',
        features: ['Universal compatibility', 'Lightweight', 'Copy-paste friendly'],
        useCase: 'Quick sharing, text-based applications',
        customizations: ['Section selection'],
      },
    },
    templates: {
      modern: {
        description: 'Clean, contemporary design with subtle colors',
        bestFor: 'Tech, startup, creative industries',
        features: ['Sans-serif fonts', 'Minimal design', 'Skills highlighting'],
      },
      classic: {
        description: 'Traditional professional format',
        bestFor: 'Corporate, finance, legal industries',
        features: ['Serif fonts', 'Conservative layout', 'Experience emphasis'],
      },
      minimal: {
        description: 'Simple, clean design with maximum content focus',
        bestFor: 'Any industry, ATS optimization',
        features: ['Maximum readability', 'ATS-friendly', 'Content-focused'],
      },
      creative: {
        description: 'Eye-catching design with visual elements',
        bestFor: 'Design, marketing, creative roles',
        features: ['Visual elements', 'Color accents', 'Unique layout'],
      },
    },
    themes: {
      blue: 'Professional blue accents',
      green: 'Growth-oriented green tones',
      purple: 'Creative purple highlights',
      black: 'Elegant monochrome design',
    },
    layouts: {
      'single-column': 'Traditional single-column layout',
      'two-column': 'Modern two-column design with sidebar',
      'sidebar': 'Sidebar layout with main content area',
    },
    examples: {
      pdfExport: {
        format: 'pdf',
        template: 'modern',
        customizations: {
          theme: 'blue',
          layout: 'two-column',
          sections: ['summary', 'experience', 'skills', 'education', 'projects'],
        },
      },
      jsonExport: {
        format: 'json',
      },
      docxExport: {
        format: 'docx',
        template: 'classic',
        customizations: {
          theme: 'black',
          sections: ['summary', 'experience', 'education', 'skills'],
        },
      },
      txtExport: {
        format: 'txt',
        customizations: {
          sections: ['summary', 'experience', 'skills'],
        },
      },
      successResponse: {
        success: true,
        downloadUrl: 'https://your-domain.com/download/resume-abc123.pdf?token=xyz789',
        fileName: 'John_Doe_Resume.pdf',
        fileSize: 245760,
        expiresAt: '2025-08-13T12:00:00Z',
      },
    },
    features: [
      'Multiple export formats',
      'Professional templates',
      'Customizable themes and layouts',
      'Selective section export',
      'ATS-optimized outputs',
      'Temporary download URLs with expiration',
      'File size reporting',
      'Format-specific optimizations',
    ],
    security: [
      'User authentication required',
      'Temporary download URLs',
      'Automatic URL expiration',
      'User-specific access control',
    ],
    limitations: [
      'PDF generation requires template engine',
      'DOCX generation requires document library',
      'Download URLs expire after 24 hours',
      'File size limits may apply based on content',
    ],
  };

  return NextResponse.json(documentation, { status: 200 });
}
