<<<<<<< HEAD
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
=======
import type { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/nextauth-config';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's resumes
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { resumes: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ resumes: user.resumes });
  } catch (error) {
    console.error('GET resumes error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const targetRole = formData.get('targetRole') as string;
    const experienceLevel = formData.get('experienceLevel') as string;
    const industryType = formData.get('industryType') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Create resume record
    const resume = await prisma.resume.create({
      data: {
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        userId: user.id,
        isActive: true,
        parsedData: {
          targetRole,
          experienceLevel,
          industryType,
          uploadedAt: new Date().toISOString()
        }
      }
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Resume uploaded successfully',
      resumeId: resume.id
    });

  } catch (error) {
    console.error('POST resume upload error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
>>>>>>> dfd1fb5935e75ed85dc548dd2e3126dfdb644ef3
}


