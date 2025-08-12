import { NextRequest, NextResponse } from 'next/server';
import { ResumeService } from '@/lib/resume-service';
import { 
  ResumeUploadResponse,
  APIError 
} from '@/lib/resume-api-types';

const resumeService = new ResumeService();

/**
 * GET /api/resumes/upload
 * Get upload capabilities and requirements documentation
 */
export async function GET(): Promise<NextResponse> {
  const documentation = {
    endpoint: '/api/resumes/upload',
    method: 'POST',
    description: 'Upload and process resume files with automatic text extraction and data parsing',
    authentication: {
      required: false,
      methods: ['x-user-id header', 'userId form field', 'session authentication'],
    },
    requestBody: {
      type: 'multipart/form-data',
      required: true,
      fields: {
        file: {
          type: 'File',
          description: 'Resume file to upload and process',
          required: true,
          formats: ['PDF', 'DOCX', 'TXT'],
          maxSize: '10MB',
        },
        userId: {
          type: 'string',
          description: 'User identifier for resume ownership',
          required: false,
        },
      },
    },
    responses: {
      200: {
        description: 'File uploaded and processed successfully',
        schema: {
          success: true,
          extractedText: 'string (raw text content)',
          parsedData: 'ResumeData (structured resume data)',
          confidence: 'number (0-100, parsing confidence score)',
          issues: 'string[] (parsing issues and warnings)',
          resumeId: 'string (unique identifier for saved resume)',
        },
      },
      400: {
        description: 'Invalid file or request',
        examples: {
          noFile: {
            success: false,
            error: {
              code: 'NO_FILE',
              message: 'No file uploaded',
            },
          },
          unsupportedType: {
            success: false,
            error: {
              code: 'UNSUPPORTED_FILE_TYPE',
              message: 'Unsupported file type. Please upload PDF, DOCX, or TXT files.',
              details: ['Received: jpg', 'Supported: pdf, docx, txt'],
            },
          },
          fileTooLarge: {
            success: false,
            error: {
              code: 'FILE_TOO_LARGE',
              message: 'File size exceeds 10MB limit',
              details: ['File size: 15MB'],
            },
          },
        },
      },
      500: {
        description: 'Processing failed',
      },
    },
    supportedFormats: {
      PDF: {
        description: 'Portable Document Format',
        extraction: 'Text extraction using PDF parsing libraries',
        accuracy: 'High for text-based PDFs, lower for image-based PDFs',
        limitations: ['OCR not supported for scanned documents', 'Complex layouts may affect parsing'],
      },
      DOCX: {
        description: 'Microsoft Word Document',
        extraction: 'Native text extraction from document structure',
        accuracy: 'Very high',
        limitations: ['Some formatting may be lost', 'Embedded objects ignored'],
      },
      TXT: {
        description: 'Plain text file',
        extraction: 'Direct text reading',
        accuracy: 'High',
        limitations: ['No formatting information', 'Structure detection based on patterns'],
      },
    },
    processingSteps: [
      '1. File validation (type, size, format)',
      '2. Text extraction based on file type',
      '3. AI-powered text parsing into structured data',
      '4. Data validation and confidence scoring',
      '5. Resume storage and indexing',
    ],
    examples: {
      curl: 'curl -X POST /api/resumes/upload -F "file=@resume.pdf" -F "userId=123"',
      javascript: `
        const formData = new FormData();
        formData.append('file', fileInput.files[0]);
        formData.append('userId', '123');
        
        fetch('/api/resumes/upload', {
          method: 'POST',
          body: formData
        });
      `,
    },
  };

  return NextResponse.json(documentation);
}

/**
 * POST /api/resumes/upload
 * Upload and process resume files (PDF, DOCX, TXT)
 */
export async function POST(request: NextRequest): Promise<NextResponse<ResumeUploadResponse | APIError>> {
  try {
    const body = await request.json();
    const userId = body.userId || request.headers.get('x-user-id') || 'anonymous';

    if (!body.file) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'NO_FILE',
          message: 'No file uploaded',
        },
        timestamp: new Date().toISOString(),
      }, { status: 400 });
    }

    const file = body.file;
    // Validate file type
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    const supportedTypes = ['pdf', 'docx', 'txt'];
    
    if (!fileExtension || !supportedTypes.includes(fileExtension)) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'UNSUPPORTED_FILE_TYPE',
          message: 'Unsupported file type. Please upload PDF, DOCX, or TXT files.',
          details: [`Received: ${fileExtension}`, `Supported: ${supportedTypes.join(', ')}`],
        },
        timestamp: new Date().toISOString(),
      }, { status: 400 });
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'FILE_TOO_LARGE',
          message: 'File size exceeds 10MB limit',
          details: [`File size: ${Math.round(file.size / 1024 / 1024)}MB`],
        },
        timestamp: new Date().toISOString(),
      }, { status: 400 });
    }

    // Process the uploaded file
    const processing = await resumeService.processUploadedFile(file, fileExtension);
    
    // Save the processed resume
    const savedResume = await resumeService.saveResume(userId, processing.parsedData, {
      uploadedFileName: file.name,
      fileSize: file.size,
      fileType: fileExtension,
      processingConfidence: processing.confidence,
    });

    const response: ResumeUploadResponse = {
      success: true,
      extractedText: processing.extractedText,
      parsedData: processing.parsedData,
      confidence: processing.confidence,
      issues: processing.issues,
      resumeId: savedResume.id,
    };

    // Log successful upload
    console.log(`Resume uploaded and processed for user: ${userId}`, {
      fileName: file.name,
      fileSize: file.size,
      fileType: fileExtension,
      confidence: processing.confidence,
      resumeId: savedResume.id,
    });

    return NextResponse.json(response, { status: 200 });

  } catch (error) {
    console.error('Resume upload error:', error);
    
    return NextResponse.json({
      success: false,
      error: {
        code: 'UPLOAD_FAILED',
        message: 'Failed to process uploaded file',
        details: error instanceof Error ? [error.message] : ['Unknown error occurred'],
      },
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}