import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/nextauth-config';
import { prisma } from '@/lib/prisma';
import { HybridResumeAI } from '@/lib/hybrid-resume-ai';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

const hybridResumeAI = new HybridResumeAI();

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
    console.log('🔑 OPENAI_API_KEY exists:', !!process.env.OPENAI_API_KEY);
    console.log('🔑 GEMINI_API_KEY exists:', !!process.env.GEMINI_API_KEY);
    
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
    let timestamp = Date.now();
    let safeName = '';

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

      const originalName = file.name;
      safeName = originalName.replace(/[^a-zA-Z0-9.-]/g, '_');
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

    // Parse resume using hybrid AI (OpenAI + Gemini)
    let parsedData;
    let aiSuccess = false;
    let confidence = 0;
    let aiProvider = 'fallback';

    try {
      console.error('🤖 Starting AI parsing with extracted text length:', extractedText.length);
      console.error('🤖 Extracted text preview:', extractedText.substring(0, 200) + '...');
      parsedData = await hybridResumeAI.parseResumeText(extractedText);
      aiSuccess = true;
      confidence = parsedData.confidence;
      aiProvider = parsedData.aiProvider;
      console.error(`✅ Hybrid AI parsing successful with ${aiProvider}, confidence: ${confidence}%, ATS score: ${parsedData.atsScore}%`);
    } catch (aiError) {
      console.error('❌ Hybrid AI parsing failed:', aiError);
      
      // Fallback to basic parsing
      parsedData = createFallbackData(extractedText);
      aiSuccess = false;
      confidence = 30;
      aiProvider = 'fallback';
    }

    // Convert to the format expected by the frontend
    const profile = {
      fullName: parsedData.name || parsedData.personalInformation?.fullName || '',
      email: parsedData.email || parsedData.personalInformation?.email || '',
      phone: parsedData.phone || parsedData.personalInformation?.phone || '',
      location: parsedData.personalInformation?.location || '',
      linkedin: parsedData.linkedin || '',
      github: parsedData.github || '',
      summary: `Experienced ${parsedData.professionalInformation?.jobTitle || 'professional'} with expertise in ${(parsedData.skills || []).slice(0, 3).join(', ')}.`,
      skills: parsedData.skills || [],
      experience: (parsedData.experience || []).map((exp: any) => ({
        company: exp.company || '',
        position: exp.role || '',
        location: '',
        startDate: exp.start_date || '',
        endDate: exp.end_date || '',
        current: !exp.end_date,
        description: exp.description || '',
        achievements: exp.description ? [exp.description] : []
      })),
      education: (parsedData.education || []).map((edu: any) => ({
        institution: edu.institute || edu.institution || '',
        degree: edu.degree || '',
        field: '',
        startDate: edu.start_year || '',
        endDate: edu.end_year || '',
        gpa: '',
        description: ''
      })),
      projects: (parsedData.projects || []).map((proj: any) => ({
        name: proj.title || '',
        description: proj.description || '',
        technologies: proj.technologies || [],
        url: '',
        startDate: '',
        endDate: ''
      })),
      certifications: (parsedData.certifications || []).map((cert: any) => ({
        name: typeof cert === 'string' ? cert : cert.name || '',
        issuer: '',
        date: '',
        url: ''
      })),
      languages: [],
      expectedSalary: parsedData.professionalInformation?.expectedSalary || '',
      preferredJobType: 'Full-time',
      confidence: confidence,
      rawText: extractedText,
      atsSuggestions: parsedData.improvementTips || [],
      jobSuggestions: (parsedData.recommendedJobTitles || []).map((title: string) => ({
        title: title,
        reason: `Based on skills and experience`
      }))
    };

      console.error('🤖 Raw AI parsed data:', JSON.stringify(parsedData, null, 2));
      console.error('📊 Final profile data being sent to frontend:', JSON.stringify(profile, null, 2));
      console.error('🔍 Profile keys:', Object.keys(profile));
      console.error('📧 Email in profile:', profile.email);
      console.error('👤 FullName in profile:', profile.fullName);
      console.error('📱 Phone in profile:', profile.phone);
      console.error('🏢 Location in profile:', profile.location);
      console.error('🔗 LinkedIn in profile:', profile.linkedin);
      console.error('💻 GitHub in profile:', profile.github);

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
      atsScore: parsedData.atsScore,
      recommendedJobTitles: parsedData.recommendedJobTitles,
      improvementTips: parsedData.improvementTips,
      confidence: confidence,
      aiProvider: aiProvider,
      processingTime: parsedData.processingTime || 0
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
 * Extract text from uploaded file using proper parsing libraries
 */
async function extractTextFromFile(file: File, bytes: ArrayBuffer): Promise<string> {
  try {
    console.log('📄 Extracting text from file:', file.name, 'Type:', file.type);
    
    if (file.type === 'text/plain') {
      const text = new TextDecoder().decode(bytes);
      console.log('✅ Plain text extracted, length:', text.length);
      return text;
    }
    
    if (file.type === 'application/pdf') {
      console.log('📄 Processing PDF file...');
      try {
        const pdf = await import('pdf-parse');
        const pdfData = await pdf.default(Buffer.from(bytes));
        const text = pdfData.text;
        console.log('✅ PDF text extracted, length:', text.length);
        console.log('📄 PDF preview:', text.substring(0, 200) + '...');
        return text;
      } catch (pdfError) {
        console.error('❌ PDF parsing failed:', pdfError);
        // Fallback to basic text extraction for PDF
        const text = new TextDecoder().decode(bytes);
        const readableText = text.replace(/[^\x20-\x7E\s]/g, ' ').replace(/\s+/g, ' ').trim();
        if (readableText.length > 50) {
          console.log('✅ Basic PDF text extraction successful, length:', readableText.length);
          return readableText;
        }
        throw pdfError;
      }
    }
    
    if (file.type === 'application/msword' || 
        file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      console.log('📄 Processing Word document...');
      try {
        const mammoth = await import('mammoth');
        const result = await mammoth.extractRawText({ buffer: Buffer.from(bytes) });
        const text = result.value;
        console.log('✅ Word document text extracted, length:', text.length);
        console.log('📄 Word preview:', text.substring(0, 200) + '...');
        return text;
      } catch (wordError) {
        console.error('❌ Word document parsing failed:', wordError);
        throw wordError;
      }
    }
    
    // Fallback for unknown file types
    console.log('⚠️ Unknown file type, attempting basic text extraction...');
    const text = new TextDecoder().decode(bytes);
    const readableText = text.replace(/[^\x20-\x7E\s]/g, ' ').replace(/\s+/g, ' ').trim();
    
    if (readableText.length > 50) {
      console.log('✅ Basic text extraction successful, length:', readableText.length);
      return readableText;
    }
    
    // Final fallback: return filename as text
    console.log('⚠️ Text extraction failed, using filename as fallback');
    return `Resume: ${file.name}`;
  } catch (error) {
    console.error('❌ Text extraction failed:', error);
    return `Resume: ${file.name}`;
  }
}

/**
 * Create intelligent fallback data when AI parsing fails
 */
function createFallbackData(resumeText: string) {
  console.log('🔄 Creating intelligent fallback data from resume text...');
  
  // Extract basic information from resume text using regex patterns
  const extractEmail = (text: string) => {
    const emailMatch = text.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/);
    return emailMatch ? emailMatch[0] : '';
  };
  
  const extractPhone = (text: string) => {
    const phoneMatch = text.match(/(\+?91[\s-]?)?[6-9]\d{9}/);
    return phoneMatch ? phoneMatch[0] : '';
  };
  
  const extractName = (text: string) => {
    // Look for common name patterns at the beginning of the resume
    const lines = text.split('\n').slice(0, 10); // Check first 10 lines
    for (const line of lines) {
      const cleanLine = line.trim();
      if (cleanLine.length > 2 && cleanLine.length < 50 && 
          !cleanLine.includes('@') && !cleanLine.includes('+') && 
          !cleanLine.includes('http') && !cleanLine.includes('www')) {
        return cleanLine;
      }
    }
    return '';
  };
  
  const extractSkills = (text: string) => {
    const commonSkills = [
      'JavaScript', 'Python', 'Java', 'React', 'Node.js', 'Angular', 'Vue.js',
      'HTML', 'CSS', 'SQL', 'MongoDB', 'PostgreSQL', 'AWS', 'Docker',
      'Git', 'Linux', 'Agile', 'Scrum', 'Machine Learning', 'Data Analysis'
    ];
    
    const foundSkills = commonSkills.filter(skill => 
      text.toLowerCase().includes(skill.toLowerCase())
    );
    
    return foundSkills.length > 0 ? foundSkills : ['JavaScript', 'React', 'Node.js'];
  };
  
  const extractJobTitle = (text: string) => {
    const commonTitles = [
      'Software Engineer', 'Developer', 'Programmer', 'Analyst', 'Manager',
      'Designer', 'Consultant', 'Specialist', 'Lead', 'Senior', 'Junior'
    ];
    
    for (const title of commonTitles) {
      if (text.toLowerCase().includes(title.toLowerCase())) {
        return title;
      }
    }
    return 'Software Developer';
  };
  
  // Extract information
  const email = extractEmail(resumeText);
  const phone = extractPhone(resumeText);
  const name = extractName(resumeText);
  const skills = extractSkills(resumeText);
  const jobTitle = extractJobTitle(resumeText);
  
  console.log('📊 Extracted fallback data:', { email, phone, name, skills: skills.length, jobTitle });
  
  return {
    personalInformation: {
      fullName: name || 'Resume Uploaded',
      email: email || '',
      phone: phone || '',
      location: 'Location not specified'
    },
    professionalInformation: {
      jobTitle: jobTitle,
      expectedSalary: 'Salary not specified'
    },
    summary: 'Professional summary not extracted. Please review and update.',
    skills: skills,
    education: [
      {
        degree: 'Education details not extracted',
        institution: 'Institution not specified',
        year: 'Year not specified'
      }
    ],
    experience: [
      {
        role: 'Experience details not extracted',
        company: 'Company not specified',
        duration: 'Duration not specified',
        achievements: ['Please review and update your experience details']
      }
    ],
    projects: [
      {
        name: 'Project details not extracted',
        description: 'Please review and update your project details',
        technologies: ['Technology not specified'],
        url: '',
        startDate: 'Start date not specified',
        endDate: 'End date not specified'
      }
    ],
    certifications: [
      {
        name: 'Certification details not extracted',
        issuer: 'Issuer not specified',
        date: 'Date not specified',
        url: ''
      }
    ],
    languages: ['English'],
    linkedin: '',
    portfolio: '',
    preferredJobType: 'Full-time',
    confidence: 25,
    rawText: resumeText,
    atsSuggestions: [
      'AI parsing was unavailable. Please review and update your information manually.',
      'Add more specific technical skills',
      'Include quantifiable achievements',
      'Optimize keywords for ATS systems'
    ],
    jobSuggestions: [
      { title: jobTitle, reason: 'Based on your technical skills' },
      { title: 'Software Engineer', reason: 'Common role for your skills' },
      { title: 'Developer', reason: 'General development role' }
    ]
  };
}

export const dynamic = 'force-dynamic';
