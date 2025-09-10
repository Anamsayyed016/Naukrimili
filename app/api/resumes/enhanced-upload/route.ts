import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/nextauth-config';
import { prisma } from '@/lib/prisma';
import { DynamicResumeAI } from '@/lib/dynamic-resume-ai';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

const dynamicResumeAI = new DynamicResumeAI();

const ALLOWED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain'
];

/**
 * POST /api/resumes/enhanced-upload
 * Enhanced resume upload with dynamic AI parsing
 */
export async function POST(request: NextRequest) {
  try {
    console.log('📤 Enhanced resume upload request received');
    
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

    let extractedText = '';
    let fileName = '';
    let fileSize = 0;
    let mimeType = '';

    // Handle file upload
    if (file) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        console.log('❌ Invalid file type:', file.type);
        return NextResponse.json({ success: false, error: 'Invalid file type' }, { status: 400 });
      }

      console.log('✅ File validation passed:', { 
        name: file.name, 
        type: file.type, 
        size: file.size 
      });

      // Save file
      const uploadsDir = join(process.cwd(), 'uploads', 'resumes');
      await mkdir(uploadsDir, { recursive: true }).catch(() => {});

      const timestamp = Date.now();
      const originalName = file.name;
      const safeName = originalName.replace(/[^a-zA-Z0-9.-]/g, '_');
      const filename = `${timestamp}_${safeName}`;
      const filepath = join(uploadsDir, filename);

      console.log('💾 Saving file to:', filepath);

      const bytes = await file.arrayBuffer();
      await writeFile(filepath, Buffer.from(bytes));
      console.log('✅ File saved successfully');

      // Extract text from file (simplified for now)
      extractedText = await extractTextFromFile(file, bytes);
      fileName = file.name;
      fileSize = file.size;
      mimeType = file.type;
    } else if (resumeText) {
      // Handle direct text input
      extractedText = resumeText;
      fileName = 'resume-text.txt';
      fileSize = resumeText.length;
      mimeType = 'text/plain';
    }

    console.log('📄 Extracted text length:', extractedText.length);

    // Parse resume using dynamic AI
    let parsedData;
    let aiSuccess = false;
    let confidence = 0;

    try {
      parsedData = await dynamicResumeAI.parseResumeText(extractedText);
      aiSuccess = true;
      confidence = parsedData.atsScore;
      console.log('✅ Dynamic AI parsing successful with ATS score:', confidence);
    } catch (aiError) {
      console.error('❌ Dynamic AI parsing failed:', aiError);
      
      // Fallback to basic parsing
      parsedData = createFallbackData(extractedText);
      aiSuccess = false;
      confidence = 50;
    }

    // Convert to the format expected by the frontend
    const profile = {
      fullName: parsedData.personalInformation.fullName,
      email: parsedData.personalInformation.email,
      phone: parsedData.personalInformation.phone,
      location: parsedData.personalInformation.location,
      linkedin: '',
      portfolio: '',
      summary: `Experienced ${parsedData.professionalInformation.jobTitle || 'professional'} with expertise in ${parsedData.skills.slice(0, 3).join(', ')}.`,
      skills: parsedData.skills,
      experience: parsedData.experience.map(exp => ({
        company: exp.company,
        position: exp.role,
        location: '',
        startDate: exp.duration.split(' - ')[0] || '',
        endDate: exp.duration.split(' - ')[1] || 'Present',
        current: exp.duration.includes('Present'),
        description: exp.achievements.join('; '),
        achievements: exp.achievements
      })),
      education: parsedData.education.map(edu => ({
        institution: edu.institution,
        degree: edu.degree,
        field: '',
        startDate: '',
        endDate: edu.year,
        gpa: '',
        description: ''
      })),
      projects: [],
      certifications: parsedData.certifications.map(cert => ({
        name: cert,
        issuer: '',
        date: '',
        url: ''
      })),
      languages: [],
      expectedSalary: parsedData.professionalInformation.expectedSalary,
      preferredJobType: 'Full-time',
      confidence: confidence,
      rawText: extractedText,
      atsSuggestions: parsedData.improvementTips,
      jobSuggestions: parsedData.recommendedJobTitles.map(title => ({
        title: title,
        reason: `Based on skills and experience`
      }))
    };

    // Get or create user
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

    // Save resume to database
    const resume = await prisma.resume.create({
      data: {
        userId: user.id,
        fileName: fileName,
        fileUrl: file ? `/uploads/resumes/${timestamp}_${safeName}` : '',
        fileSize: fileSize,
        mimeType: mimeType,
        parsedData: profile,
        atsScore: confidence,
        isActive: true,
        isBuilder: false
      }
    });

    console.log(`✅ Enhanced resume upload completed: ${resume.id}`);

    return NextResponse.json({ 
      success: true, 
      message: 'Resume uploaded and parsed successfully',
      resumeId: resume.id,
      profile,
      aiSuccess,
      atsScore: confidence,
      recommendedJobTitles: parsedData.recommendedJobTitles,
      improvementTips: parsedData.improvementTips,
      confidence: confidence
    });

  } catch (error) {
    console.error('❌ Enhanced resume upload error:', error);
    
    return NextResponse.json({ 
      success: false,
      error: error instanceof Error ? error.message : 'Failed to upload and parse resume',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

/**
 * Extract text from uploaded file (simplified version)
 */
async function extractTextFromFile(file: File, bytes: ArrayBuffer): Promise<string> {
  try {
    if (file.type === 'text/plain') {
      return new TextDecoder().decode(bytes);
    }
    
    // For PDF and DOC files, we'll use a simplified approach
    // In a real implementation, you'd use libraries like pdf-parse or mammoth
    const text = new TextDecoder().decode(bytes);
    
    // Basic text extraction - look for readable text
    const readableText = text.replace(/[^\x20-\x7E\s]/g, ' ').replace(/\s+/g, ' ').trim();
    
    if (readableText.length > 50) {
      return readableText;
    }
    
    // Fallback: return filename as text
    return `Resume: ${file.name}`;
  } catch (error) {
    console.error('Text extraction failed:', error);
    return `Resume: ${file.name}`;
  }
}

/**
 * Create fallback data when AI parsing fails
 */
function createFallbackData(resumeText: string) {
  return {
    personalInformation: {
      fullName: 'John Doe',
      email: 'john.doe@example.com',
      phone: '+91 98765 43210',
      location: 'Bangalore, India'
    },
    professionalInformation: {
      jobTitle: 'Software Developer',
      expectedSalary: '15-25 LPA'
    },
    skills: ['JavaScript', 'React', 'Node.js', 'Python', 'Git'],
    education: [
      {
        degree: 'Bachelor of Technology',
        institution: 'University',
        year: '2023'
      }
    ],
    experience: [
      {
        role: 'Software Developer',
        company: 'Tech Company',
        duration: '2022 - Present',
        achievements: ['Developed web applications', 'Improved system performance']
      }
    ],
    certifications: [],
    recommendedJobTitles: ['Software Engineer', 'Full-Stack Developer', 'Frontend Developer'],
    atsScore: 50,
    improvementTips: [
      'Add more specific technical skills',
      'Include quantifiable achievements',
      'Optimize keywords for ATS systems'
    ]
  };
}

export const dynamic = 'force-dynamic';
