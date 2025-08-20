import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

const ALLOWED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',   
];

export async function GET(request: NextRequest) {
  try {
    // For testing - no auth required
    return NextResponse.json({ 
      success: true, 
      message: 'Resume upload endpoint accessible',
      test: true
    });
  } catch (error) {
    console.error('GET resumes error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // For testing - no auth required
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const targetRole = formData.get('targetRole') as string;
    const experienceLevel = formData.get('experienceLevel') as string;
    const industryType = formData.get('industryType') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
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

    // Create resume record in database (with mock user ID for testing)
    const resume = await prisma.resume.create({
      data: {
        fileName: file.name,
        fileUrl: `/uploads/resumes/${filename}`,
        fileSize: file.size,
        mimeType: file.type,
        userId: 1, // Mock user ID for testing
        isActive: true,
        parsedData: {
          targetRole,
          experienceLevel,
          industryType,
          uploadedAt: new Date().toISOString(),
          originalFileName: file.name,
          filePath: `/uploads/resumes/${filename}`
        }
      }
    });

    console.log(`✅ Resume uploaded successfully: ${resume.id}`);

    return NextResponse.json({ 
      success: true, 
      message: 'Resume uploaded successfully',
      resumeId: resume.id,
      filePath: `/uploads/resumes/${filename}`,
      resume: {
        id: resume.id,
        fileName: resume.fileName,
        fileUrl: resume.fileUrl,
        fileSize: resume.fileSize,
        mimeType: resume.mimeType,
        parsedData: resume.parsedData
      }
    });

  } catch (error) {
    console.error('POST resume upload error:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}


