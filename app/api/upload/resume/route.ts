import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { RealResumeService } from '@/lib/real-resume-service';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
];

// Timeout wrapper for async operations
const withTimeout = <T>(promise: Promise<T>, timeoutMs: number): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => 
      setTimeout(() => reject(new Error('Operation timed out')), timeoutMs)
    )
  ]);
};

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('resume') as File;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file uploaded' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: 'Invalid file type. Only PDF, DOC, and DOCX files are allowed.' },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: 'File size too large. Maximum size is 10MB.' },
        { status: 400 }
      );
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), 'uploads', 'resumes');
    try {
      await mkdir(uploadsDir, { recursive: true });
    } catch (error) {
      // Directory might already exist, ignore error
    }

    // Generate unique filename
    const timestamp = Date.now();
    const originalName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filename = `${timestamp}_${originalName}`;
    const filepath = path.join(uploadsDir, filename);

    // Save file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filepath, buffer);

    // Extract text from the uploaded file with timeout
    let extractedText = '';
    let parsedData = null;
    
    try {
      const resumeService = new RealResumeService();
      
      // Determine file type for text extraction
      let fileType = 'application/pdf';
      if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        fileType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      } else if (file.type === 'application/msword') {
        fileType = 'application/msword';
      }
      
      // Extract text from file with 30 second timeout
      extractedText = await withTimeout(
        resumeService.extractTextFromFile(filepath, fileType),
        30000
      );
      
      // Analyze the extracted text with 15 second timeout
      parsedData = await withTimeout(
        resumeService.analyzeResume(extractedText),
        15000
      );
      
    } catch (analysisError) {
      console.warn('Resume analysis failed or timed out, continuing with basic upload:', analysisError);
      // Continue with basic upload even if analysis fails
      extractedText = 'Resume content could not be extracted. Please fill in the form manually.';
      parsedData = {
        fullName: '',
        email: '',
        phone: '',
        location: '',
        jobTitle: '',
        skills: [],
        education: [],
        experience: [],
        linkedin: '',
        portfolio: '',
        expectedSalary: '',
        preferredJobType: '',
        confidence: 0,
        rawText: extractedText
      };
    }

    // Create resume data object
    const resumeData = {
      id: timestamp.toString(),
      filename: originalName,
      filepath: `/uploads/resumes/${filename}`,
      size: file.size,
      type: file.type,
      uploadedAt: new Date().toISOString(),
      extractedText,
      parsedData
    };

    // Update user profile with resume data (if available) - don't block on this
    try {
      const profileResponse = await withTimeout(
        fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/user/profile`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'uploadResume',
            data: resumeData
          })
        }),
        5000 // 5 second timeout for profile update
      );
      
      if (!profileResponse.ok) {
        console.warn('Failed to update user profile with resume data');
      }
    } catch (profileError) {
      console.warn('Failed to update user profile:', profileError);
      // Don't fail the upload if profile update fails
    }

    return NextResponse.json({
      success: true,
      message: 'Resume uploaded and analyzed successfully',
      resume: resumeData,
      parsedData: parsedData
    });

  } catch (error) {
    console.error('Resume upload error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to upload resume' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Resume upload endpoint',
    allowedTypes: ALLOWED_TYPES,
    maxSize: MAX_FILE_SIZE
  });
}
