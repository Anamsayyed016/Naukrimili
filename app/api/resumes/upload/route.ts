import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

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
    console.log('📤 Resume upload request received');
    
    // Get user session for authentication
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      console.log('❌ No authenticated user found');
      return NextResponse.json({ 
        success: false, 
        error: 'Authentication required. Please log in to upload your resume.' 
      }, { status: 401 });
    }

    console.log('👤 Authenticated user:', session.user.email);
    
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const targetRole = formData.get('targetRole') as string;
    const experienceLevel = formData.get('experienceLevel') as string;
    const industryType = formData.get('industryType') as string;

    if (!file) {
      console.log('❌ No file provided');
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      console.log('❌ Invalid file type:', file.type);
      return NextResponse.json({ success: false, error: 'Invalid file type' }, { status: 400 });
    }

    console.log('✅ File validation passed:', { 
      name: file.name, 
      type: file.type, 
      size: file.size 
    });

    // Create uploads directory
    const uploadsDir = path.join(process.cwd(), 'uploads', 'resumes');
    await mkdir(uploadsDir, { recursive: true }).catch(() => {});

    // Generate unique filename
    const timestamp = Date.now();
    const originalName = file.name;
    const safeName = originalName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filename = `${timestamp}_${safeName}`;
    const filepath = path.join(uploadsDir, filename);

    console.log('💾 Saving file to:', filepath);

    // Save file
    const bytes = await file.arrayBuffer();
    await writeFile(filepath, Buffer.from(bytes));
    console.log('✅ File saved successfully');

    // Get or create user based on session
    let user = await prisma.user.findUnique({
      where: { email: session.user.email! }
    });
    
    if (!user) {
      console.log('👤 Creating new user from session data');
      user = await prisma.user.create({
        data: {
          email: session.user.email!,
          name: session.user.name || 'Unknown User',
          role: 'jobseeker',
          isActive: true,
          isVerified: true
        }
      });
      console.log('✅ Created new user:', user.id);
    } else {
      console.log('👤 Found existing user:', user.id);
    }

    console.log('👤 Using user ID:', user.id);

    // Create resume record in database
    const resume = await prisma.resume.create({
      data: {
        fileName: file.name,
        fileUrl: `/uploads/resumes/${filename}`,
        fileSize: file.size,
        mimeType: file.type,
        userId: user.id,
        isActive: true,
        parsedData: {
          targetRole,
          experienceLevel,
          industryType,
          uploadedAt: new Date().toISOString(),
          originalFileName: file.name,
          filePath: `/uploads/resumes/${filename}`,
          userEmail: user.email,
          userName: user.name
        }
      }
    });

    console.log(`✅ Resume uploaded successfully: ${resume.id}`);

    return NextResponse.json({ 
      success: true, 
      message: 'Resume uploaded successfully',
      resumeId: resume.id,
      filePath: `/uploads/resumes/${filename}`,
      userId: user.id,
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
    console.error('❌ POST resume upload error:', error);
    
    // Provide more detailed error information
    let errorMessage = 'Internal server error';
    let errorDetails = 'Unknown error';
    
    if (error instanceof Error) {
      errorMessage = error.message;
      errorDetails = error.stack || 'No stack trace available';
    }
    
    // Log detailed error for debugging
    console.error('Error details:', {
      message: errorMessage,
      stack: errorDetails,
      timestamp: new Date().toISOString()
    });
    
    return NextResponse.json({ 
      success: false,
      error: errorMessage,
      details: errorDetails
    }, { status: 500 });
  }
}


