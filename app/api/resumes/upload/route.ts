import { NextRequest } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join, dirname } from 'path';

// Mock AI resume parsing function
function parseResumeWithAI(filename: string, fileContent: string) {
  // Simulate AI parsing based on filename and content
  const mockAIData = {
    personalInfo: {
      name: 'John Doe',
      email: 'john.doe@email.com',
      phone: '+91-9876543210',
      location: 'Mumbai, Maharashtra'
    },
    experience: [
      {
        company: 'Tech Solutions Pvt Ltd',
        position: 'Software Developer',
        duration: '2021 - Present',
        description: 'Developed web applications using React and Node.js'
      },
      {
        company: 'StartupXYZ',
        position: 'Junior Developer',
        duration: '2019 - 2021',
        description: 'Built mobile applications using React Native'
      }
    ],
    education: [
      {
        degree: 'Bachelor of Technology',
        field: 'Computer Science',
        institution: 'Mumbai University',
        year: '2019'
      }
    ],
    skills: [
      'JavaScript', 'React', 'Node.js', 'Python', 'MongoDB', 'Express.js', 'HTML', 'CSS'
    ],
    summary: 'Experienced software developer with 4+ years in web development. Skilled in modern JavaScript frameworks and backend technologies.',
    certifications: [
      'AWS Certified Developer',
      'Google Cloud Professional'
    ],
    languages: ['English', 'Hindi', 'Marathi']
  };

  return mockAIData;
}

// Calculate ATS score based on resume content
function calculateATSScore(aiData: any): number {
  let score = 0;
  
  // Check for contact information
  if (aiData.personalInfo?.email) score += 15;
  if (aiData.personalInfo?.phone) score += 15;
  
  // Check for experience
  if (aiData.experience?.length > 0) score += 25;
  if (aiData.experience?.length > 1) score += 10;
  
  // Check for education
  if (aiData.education?.length > 0) score += 15;
  
  // Check for skills
  if (aiData.skills?.length >= 5) score += 20;
  
  return Math.min(score, 100);
}

import { getToken } from 'next-auth/jwt';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const token = await getToken({ req: request });
    if (!token) {
      return new Response(
        JSON.stringify({ success: false, message: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const formData = await request.formData();
    const file = formData.get('resume') as File;
    
    if (!file) {
      return NextResponse.json(
        { success: false, message: 'No file uploaded' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, message: 'Invalid file type. Please upload PDF or Word document.' },
        { status: 400 }
      );
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, message: 'File size too large. Maximum 5MB allowed.' },
        { status: 400 }
      );
    }

    // Read file content (for AI parsing simulation)
    const fileBuffer = await file.arrayBuffer();
    const fileContent = Buffer.from(fileBuffer).toString('base64');

    // Generate unique ID for resume
    const resumeId = `resume_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Parse resume with AI
    const aiData = parseResumeWithAI(file.name, fileContent);
    
    // Calculate ATS score
    const atsScore = calculateATSScore(aiData);

    // Create resume object
    const resume = {
      id: resumeId,
      filename: file.name,
      originalName: file.name,
      size: file.size,
      type: file.type,
      status: 'processed',
      atsScore: atsScore,
      aiData: aiData,
      tags: aiData.skills?.slice(0, 5) || [],
      visibility: 'private',
      uploadedAt: new Date().toISOString(),
      processedAt: new Date().toISOString(),
      fileUrl: `/uploads/resumes/${resumeId}_${file.name}`,
      userId: token.sub // Get user ID from the session token
    };

    // Save file to local uploads directory
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'resumes');
    await mkdir(uploadDir, { recursive: true });
    
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const filePath = join(uploadDir, `${resumeId}_${file.name}`);
    
    try {
      await writeFile(filePath, fileBuffer);
    } catch (writeError) {
      console.error('File write error:', writeError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Failed to save resume file' 
        }), 
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    console.log('Resume uploaded and processed:', {
      id: resume.id,
      filename: resume.filename,
      atsScore: resume.atsScore,
      aiDataKeys: Object.keys(resume.aiData),
      savedPath: filePath
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Resume uploaded and processed successfully',
        resume: resume
      }),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Resume upload error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: 'Failed to process resume upload' 
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}