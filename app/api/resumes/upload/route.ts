import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { env } from "@/lib/env";
import { handleApiError, ValidationError, AuthenticationError } from "@/lib/error-handler";
import { fileUploadSchema, sanitizeFileName } from "@/lib/validation";
import crypto from "crypto";

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
];

// Enhanced virus scanning with MIME validation
function scanFileForViruses(buffer: ArrayBuffer, mimeType: string): boolean {
  const view = new Uint8Array(buffer);
  
  // Check file signatures match MIME type
  const signatures: Record<string, number[][]> = {
    'application/pdf': [[0x25, 0x50, 0x44, 0x46]], // %PDF
    'application/msword': [[0xD0, 0xCF, 0x11, 0xE0]], // DOC
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': [
      [0x50, 0x4B, 0x03, 0x04], // ZIP (DOCX)
      [0x50, 0x4B, 0x05, 0x06],
      [0x50, 0x4B, 0x07, 0x08]
    ]
  };
  
  const expectedSignatures = signatures[mimeType];
  if (expectedSignatures) {
    const hasValidSignature = expectedSignatures.some(signature =>
      signature.every((byte, index) => view[index] === byte)
    );
    if (!hasValidSignature) return false;
  }
  
  // Check for malicious patterns
  const maliciousPatterns = [
    [0x4D, 0x5A], // PE executable
    [0x7F, 0x45, 0x4C, 0x46], // ELF
    [0x3C, 0x73, 0x63, 0x72, 0x69, 0x70, 0x74], // <script
    [0x6A, 0x61, 0x76, 0x61, 0x73, 0x63, 0x72, 0x69, 0x70, 0x74, 0x3A], // javascript:
  ];
  
  for (const pattern of maliciousPatterns) {
    for (let i = 0; i <= view.length - pattern.length; i++) {
      if (pattern.every((byte, index) => view[i + index] === byte)) {
        return false;
      }
    }
  }
  
  return true;
}

// Generate secure file hash
function generateFileHash(buffer: ArrayBuffer): string {
  const hash = crypto.createHash('sha256');
  hash.update(new Uint8Array(buffer));
  return hash.digest('hex');
}

export async function POST(req: NextRequest) {
  try {
    // Authentication check
    const token = await getToken({ req, secret: env.NEXTAUTH_SECRET });
    if (!token) {
      throw new AuthenticationError('Authentication required for file upload');
    }

    const formData = await req.formData();
    const file = formData.get("resume") as File;
    const userId = formData.get("userId") as string || token.sub;
    const jobId = formData.get("jobId") as string;

    if (!file) {
      throw new ValidationError('No file uploaded', ['File is required']);
    }

    // Validate file properties
    const fileValidation = fileUploadSchema.safeParse({
      name: file.name,
      size: file.size,
      type: file.type
    });

    if (!fileValidation.success) {
      const errors = fileValidation.error.errors.map(err => err.message);
      throw new ValidationError('File validation failed', errors);
    }

    // Additional security checks
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      throw new ValidationError('Invalid file type', [
        'Only PDF, DOC, and DOCX files are allowed'
      ]);
    }

    if (file.size > MAX_FILE_SIZE) {
      throw new ValidationError('File too large', [
        `File size must be less than ${MAX_FILE_SIZE / (1024 * 1024)}MB`
      ]);
    }

    // Read file buffer for security scanning
    const buffer = await file.arrayBuffer();
    
    // Enhanced security scan
    if (!scanFileForViruses(buffer, file.type)) {
      throw new ValidationError('File security check failed', [
        'File contains suspicious content or invalid format'
      ]);
    }
    
    // Check for path traversal in filename
    if (file.name.includes('..') || file.name.includes('/') || file.name.includes('\\')) {
      throw new ValidationError('Invalid filename', [
        'Filename contains invalid characters'
      ]);
    }

    // Generate file hash for deduplication
    const fileHash = generateFileHash(buffer);
    
    // Sanitize filename
    const sanitizedFileName = sanitizeFileName(file.name);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const uniqueFileName = `${timestamp}-${sanitizedFileName}`;

    // In production, upload to cloud storage (S3, etc.)
    // For now, simulate successful upload
    const uploadResult = {
      fileId: crypto.randomUUID(),
      fileName: file.name,
      sanitizedFileName: uniqueFileName,
      fileSize: file.size,
      fileType: file.type,
      fileHash,
      uploadedBy: userId,
      jobId: jobId || null,
      uploadedAt: new Date().toISOString(),
      filePath: `/uploads/resumes/${uniqueFileName}`,
      status: 'uploaded'
    };

    // Log successful upload
    console.log('File uploaded successfully:', {
      fileId: uploadResult.fileId,
      fileName: uploadResult.fileName,
      userId,
      fileSize: file.size
    });

    return NextResponse.json({
      success: true,
      data: uploadResult,
      message: 'File uploaded successfully'
    });

  } catch (error) {
    return handleApiError(error, {
      endpoint: '/api/resumes/upload',
      method: 'POST'
    });
  }
}

// Handle OPTIONS for CORS
export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
