import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

const ALLOWED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('resume') as File;
    
    if (!file) {
      return NextResponse.json({ success: false, error: 'No file uploaded' }, { status: 400 });
    }
    
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ success: false, error: 'Invalid file type' }, { status: 400 });
    }

    // Create uploads directory
    const uploadsDir = path.join(process.cwd(), 'uploads', 'resumes');
    await mkdir(uploadsDir, { recursive: true }).catch(() => {});
    
    // Generate unique filename
    const timestamp = Date.now();
    const originalName = file.name;
    const safeName = originalName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filename = `${timestamp}_${safeName}`;
    const filepath = path.join(uploadsDir, filename);

    // Save file
    const bytes = await file.arrayBuffer();
    await writeFile(filepath, Buffer.from(bytes));

    // Create resume data object
    const resumeData = {
      id: timestamp.toString(),
      filename: originalName,
      filepath: `/uploads/resumes/${filename}`,
      size: file.size,
      type: file.type,
      uploadedAt: new Date().toISOString(),
      extractedText: 'Resume content will be analyzed separately',
      parsedData: {
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
        rawText: 'Resume content will be analyzed separately'
      }
    };

    return NextResponse.json({ 
      success: true, 
      resume: resumeData,
      message: 'Resume uploaded successfully'
    });

  } catch (error: any) {
    console.error('Resume upload error:', error?.message || error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to upload resume' 
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ 
    success: true, 
    message: 'Resume upload endpoint is working' 
  });
}


