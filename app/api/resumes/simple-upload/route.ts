import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/nextauth-config';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/resumes/simple-upload
 * Simple resume upload for debugging
 */
export async function POST(request: NextRequest) {
  try {
    console.log('📤 Simple resume upload request received');
    
    // Get user session for authentication
    const session = await auth();
    
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
    const resumeText = formData.get('resumeText') as string;

    if (!file && !resumeText) {
      console.log('❌ No file or text provided');
      return NextResponse.json({ error: 'No file or resume text provided' }, { status: 400 });
    }

    console.log('📄 Processing input:', { 
      hasFile: !!file, 
      hasText: !!resumeText,
      fileName: file?.name,
      textLength: resumeText?.length 
    });

    // Get or create user
    let user;
    try {
      user = await prisma.user.findUnique({
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
    } catch (dbError) {
      console.error('❌ Database user operation failed:', dbError);
      return NextResponse.json({
        success: false,
        error: 'Database user operation failed',
        details: dbError instanceof Error ? dbError.message : 'Unknown error'
      }, { status: 500 });
    }

    // Create simple resume record
    let resume;
    try {
      const resumeData = {
        userId: user.id,
        fileName: file ? file.name : 'text-resume.txt',
        fileUrl: '',
        fileSize: file ? file.size : resumeText?.length || 0,
        mimeType: file ? file.type : 'text/plain',
        parsedData: {
          fullName: 'Test User',
          email: user.email,
          phone: '+91 98765 43210',
          location: 'Bangalore, India',
          summary: 'Test resume data',
          skills: ['JavaScript', 'React', 'Node.js'],
          experience: [],
          education: [],
          projects: [],
          certifications: [],
          languages: [],
          expectedSalary: '15-25 LPA',
          preferredJobType: 'Full-time',
          confidence: 50,
          rawText: resumeText || 'Test resume text',
          atsSuggestions: ['Add more skills'],
          jobSuggestions: [{ title: 'Software Engineer', reason: 'Based on skills' }]
        },
        atsScore: 50,
        isActive: true,
        isBuilder: false
      };

      resume = await prisma.resume.create({
        data: resumeData
      });

      console.log('✅ Resume created successfully:', resume.id);
    } catch (dbError) {
      console.error('❌ Database resume creation failed:', dbError);
      return NextResponse.json({
        success: false,
        error: 'Database resume creation failed',
        details: dbError instanceof Error ? dbError.message : 'Unknown error'
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Simple resume upload successful',
      resumeId: resume.id,
      userId: user.id,
      profile: resumeData.parsedData
    });

  } catch (error) {
    console.error('❌ Simple resume upload error:', error);
    
    return NextResponse.json({ 
      success: false,
      error: error instanceof Error ? error.message : 'Failed to upload resume',
      details: error
    }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
