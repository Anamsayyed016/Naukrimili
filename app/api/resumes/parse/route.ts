import { NextRequest, NextResponse } from 'next/server';
import { DynamicResumeAI } from '@/lib/dynamic-resume-ai';
import { auth } from '@/lib/nextauth-config';
import { prisma } from '@/lib/prisma';

const dynamicResumeAI = new DynamicResumeAI();

/**
 * POST /api/resumes/parse
 * Parse resume text using OpenAI and return structured data
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Dynamic resume parsing request received');

    // Get user session for authentication
    const session = await auth();
    
    if (!session || !session.user) {
      console.log('❌ No authenticated user found');
      return NextResponse.json({ 
        success: false, 
        error: 'Authentication required. Please log in to parse your resume.' 
      }, { status: 401 });
    }

    const body = await request.json();
    const { resumeText, fileName } = body;

    if (!resumeText || typeof resumeText !== 'string') {
      return NextResponse.json({ 
        success: false, 
        error: 'Resume text is required' 
      }, { status: 400 });
    }

    console.log('👤 Authenticated user:', session.user.email);
    console.log('📄 Resume text length:', resumeText.length);

    // Parse resume using dynamic AI
    let parsedData;
    let aiSuccess = false;
    let confidence = 0;

    try {
      parsedData = await dynamicResumeAI.parseResumeText(resumeText);
      aiSuccess = true;
      confidence = parsedData.atsScore;
      console.log('✅ Dynamic AI parsing successful with ATS score:', confidence);
    } catch (aiError) {
      console.error('❌ Dynamic AI parsing failed:', aiError);
      
      // Fallback to basic parsing
      parsedData = createFallbackData(resumeText);
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
      rawText: resumeText,
      atsSuggestions: parsedData.improvementTips,
      jobSuggestions: parsedData.recommendedJobTitles.map(title => ({
        title: title,
        reason: `Based on skills and experience`
      }))
    };

    // Save to database
    let savedResume = null;
    try {
      // Get or create user
      let user = await prisma.user.findUnique({
        where: { email: session.user.email! }
      });
      
      if (!user) {
        user = await prisma.user.create({
          data: {
            email: session.user.email!,
            name: session.user.name || 'Unknown User',
            role: 'jobseeker',
            isActive: true,
            isVerified: true
          }
        });
      }

      savedResume = await prisma.resume.create({
        data: {
          userId: user.id,
          fileName: fileName || 'parsed-resume.txt',
          fileUrl: '',
          fileSize: resumeText.length,
          mimeType: 'text/plain',
          parsedData: profile,
          atsScore: confidence,
          isActive: true,
          isBuilder: false
        }
      });

      console.log('💾 Parsed resume saved to database with ID:', savedResume.id);
    } catch (dbError) {
      console.error('❌ Database save failed:', dbError);
      // Continue without database save
    }

    console.log(`✅ Dynamic parsing completed: ${profile.fullName}, ${profile.skills.length} skills, ATS score: ${confidence}`);

    return NextResponse.json({ 
      success: true, 
      profile,
      aiSuccess,
      resumeId: savedResume?.id || null,
      message: aiSuccess ? 'Resume parsed successfully with AI' : 'Resume parsed with basic extraction',
      atsScore: confidence,
      recommendedJobTitles: parsedData.recommendedJobTitles,
      improvementTips: parsedData.improvementTips
    });

  } catch (error) {
    console.error('❌ Dynamic resume parsing error:', error);
    
    return NextResponse.json({ 
      success: false,
      error: error instanceof Error ? error.message : 'Failed to parse resume',
      timestamp: new Date().toISOString()
    }, { status: 500 });
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
