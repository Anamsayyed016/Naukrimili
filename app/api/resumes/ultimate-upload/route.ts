import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/nextauth-config';
import { prisma } from '@/lib/prisma';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { uploadResume } from '@/lib/storage/resume-storage';
import { HybridResumeAI } from '@/lib/hybrid-resume-ai';
import { EnhancedResumeAI } from '@/lib/enhanced-resume-ai';
import { AffindaResumeParser } from '@/lib/affinda-resume-parser';

// Configure route for larger file uploads
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
// Allow up to 10MB file uploads and 60 seconds processing time
export const maxDuration = 60;

const ALLOWED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain'
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * POST /api/resumes/ultimate-upload
 * Enhanced resume upload with AI parsing and job recommendations
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Ultimate resume upload request received');
    
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

    if (!file) {
      console.log('❌ No file provided');
      return NextResponse.json({ 
        success: false,
        error: 'No file provided' 
      }, { status: 400 });
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      console.log('❌ File too large:', file.size, 'bytes (max:', MAX_FILE_SIZE, ')');
      return NextResponse.json({ 
        success: false, 
        error: `File size exceeds maximum limit of ${MAX_FILE_SIZE / (1024 * 1024)}MB. Your file is ${(file.size / (1024 * 1024)).toFixed(2)}MB.` 
      }, { status: 413 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      console.log('❌ Invalid file type:', file.type);
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid file type. Please upload PDF, DOC, DOCX, or TXT files.' 
      }, { status: 400 });
    }

    console.log('✅ File validation passed:', { 
      name: file.name, 
      type: file.type, 
      size: file.size 
    });

    // Convert file to buffer
    console.log('📦 Converting file to buffer...');
    const bytes = await file.arrayBuffer();
    const fileBuffer = Buffer.from(bytes);
    console.log('✅ File converted to buffer, size:', fileBuffer.length, 'bytes');

    // Upload file using the unified storage service (GCS or local)
    console.log('💾 Uploading file using storage service...');
    const uploadResult = await uploadResume(
      fileBuffer,
      file.name,
      file.type,
      file.size,
      session.user.email || undefined
    );

    if (!uploadResult.success) {
      console.log('❌ File upload failed:', uploadResult.error);
      return NextResponse.json({ 
        success: false, 
        error: uploadResult.error || 'Failed to upload file'
      }, { status: 500 });
    }

    console.log(`✅ File uploaded successfully via ${uploadResult.storage.toUpperCase()}:`, uploadResult.fileUrl);
    
    const timestamp = Date.now();
    const filename = uploadResult.fileName;

    // Extract text from file
    console.log('📄 Starting text extraction from file...');
    console.log('   - File type:', file.type);
    console.log('   - File size:', file.size, 'bytes');
    console.log('   - File name:', file.name);
    
    let extractedText: string;
    try {
      extractedText = await extractTextFromFile(file, bytes);
      console.log('✅ Text extraction successful!');
      console.log('   - Text length:', extractedText.length, 'characters');
      console.log('   - Text preview (first 500 chars):');
      console.log(extractedText.substring(0, 500));
      console.log('   - Text contains "experience"?', extractedText.toLowerCase().includes('experience'));
      console.log('   - Text contains "education"?', extractedText.toLowerCase().includes('education'));
      console.log('   - Text contains "skills"?', extractedText.toLowerCase().includes('skills'));
      console.log('   - Number of words:', extractedText.split(/\s+/).length);
      console.log('   - Number of lines:', extractedText.split('\n').length);
      
      // CRITICAL CHECK: If text is too short, extraction likely failed
      if (extractedText.length < 100) {
        console.error('⚠️ WARNING: Extracted text is very short (< 100 chars)');
        console.error('   This usually means PDF parsing failed');
        console.error('   Actual text:', extractedText);
      }
    } catch (extractError) {
      console.error('❌ Text extraction failed:', extractError);
      // Continue with minimal text to allow upload to complete
      extractedText = `Resume: ${file.name}`;
      console.warn('⚠️ Using fallback text, upload will continue');
    }

    // Parse resume data using REAL AI (Hybrid approach for best accuracy)
    console.log('🤖 Starting REAL AI resume analysis with HybridResumeAI...');
    console.log('🔑 OpenAI available:', !!process.env.OPENAI_API_KEY);
    console.log('🔑 Gemini available:', !!process.env.GEMINI_API_KEY);
    
    let parsedData: any;
    let aiSuccess = false;
    let aiProvider = 'fallback';
    
    try {
      // Try HybridResumeAI first (best accuracy)
      console.log('🚀 Attempting HybridResumeAI extraction...');
      const hybridAI = new HybridResumeAI();
      const hybridResult = await hybridAI.parseResumeText(extractedText);
      console.log('📦 HybridResumeAI returned result');

      
      console.log('📦 HybridResumeAI raw result:', JSON.stringify(hybridResult, null, 2).substring(0, 1500));
      
      if (hybridResult && hybridResult.personalInformation) {
        console.log('📊 HybridResumeAI result analysis:');
        console.log('   ✓ Has personalInformation:', !!hybridResult.personalInformation);
        console.log('   ✓ Name:', hybridResult.personalInformation.fullName || 'NOT FOUND');
        console.log('   ✓ Email:', hybridResult.personalInformation.email || 'NOT FOUND');
        console.log('   ✓ Phone:', hybridResult.personalInformation.phone || 'NOT FOUND');
        console.log('   ✓ Location:', hybridResult.personalInformation.location || 'NOT FOUND');
        console.log('   ✓ Skills count:', (hybridResult.skills || []).length);
        console.log('   ✓ Experience count:', (hybridResult.experience || []).length);
        console.log('   ✓ Education count:', (hybridResult.education || []).length);
        
        // Show actual data
        if (hybridResult.skills && hybridResult.skills.length > 0) {
          console.log('   ✓ Skills:', hybridResult.skills.slice(0, 10));
        }
        if (hybridResult.experience && hybridResult.experience.length > 0) {
          console.log('   ✓ Experience:', hybridResult.experience.map((e: any) => `${e.company} - ${e.role}`));
        }
        if (hybridResult.education && hybridResult.education.length > 0) {
          console.log('   ✓ Education:', hybridResult.education.map((e: any) => `${e.institution} - ${e.degree}`));
        }
        
        // Transform HybridResumeAI format to our format
      parsedData = {
          name: hybridResult.personalInformation.fullName || '',
          fullName: hybridResult.personalInformation.fullName || '',
          email: hybridResult.personalInformation.email || '',
          phone: hybridResult.personalInformation.phone || '',
          address: hybridResult.personalInformation.location || '',
          location: hybridResult.personalInformation.location || '',
          linkedin: '', // Will be extracted by AI
          portfolio: '', // Will be extracted by AI
          skills: hybridResult.skills || [],
          experience: (hybridResult.experience || []).map((exp: any) => ({
            company: exp.company || '',
            position: exp.role || exp.position || '',
            job_title: exp.role || exp.position || '',
            startDate: exp.duration?.split(' - ')[0]?.trim() || '',
            endDate: exp.duration?.split(' - ')[1]?.trim() || '',
            start_date: exp.duration?.split(' - ')[0]?.trim() || '',
            end_date: exp.duration?.split(' - ')[1]?.trim() || '',
            description: exp.achievements?.join('. ') || exp.description || '',
            achievements: exp.achievements || []
          })),
          education: (hybridResult.education || []).map((edu: any) => ({
            institution: edu.institution || '',
            degree: edu.degree || '',
            field: edu.field || '',
            year: edu.year || '',
            gpa: edu.gpa || ''
          })),
          projects: [], // Will be extracted if present
          certifications: Array.isArray(hybridResult.certifications) 
            ? hybridResult.certifications.map((cert: any) => 
                typeof cert === 'string' ? { name: cert } : cert
              )
            : [],
          languages: [], // Will be extracted if present
          summary: '', // Will be generated below
          confidence: hybridResult.confidence || 85
        };
        aiSuccess = true;
        aiProvider = hybridResult.aiProvider || 'hybrid';
        console.log('✅ HybridResumeAI parsing successful');
        console.log('   - AI Provider:', aiProvider);
        console.log('   - Confidence:', parsedData.confidence, '%');
        console.log('   - Extracted name:', parsedData.fullName || 'MISSING');
        console.log('   - Extracted email:', parsedData.email || 'MISSING');
        console.log('   - Extracted phone:', parsedData.phone || 'MISSING');
        console.log('   - Skills extracted:', parsedData.skills.length);
        console.log('   - Experience entries:', parsedData.experience.length);
        console.log('   - Education entries:', parsedData.education.length);
      } else {
        throw new Error('HybridResumeAI returned incomplete data');
      }
    } catch (hybridError) {
      console.warn('⚠️ HybridResumeAI failed, trying EnhancedResumeAI:', hybridError);
      
      try {
        // Fallback to EnhancedResumeAI
        console.log('🔄 Attempting EnhancedResumeAI extraction...');
        const enhancedAI = new EnhancedResumeAI();
        const enhancedResult = await enhancedAI.extractResumeData(extractedText);
        console.log('📦 EnhancedResumeAI returned result');
        
        if (enhancedResult && enhancedResult.fullName) {
          console.log('📊 EnhancedResumeAI result received:', {
            name: enhancedResult.fullName || 'NOT FOUND',
            email: enhancedResult.email || 'NOT FOUND',
            phone: enhancedResult.phone || 'NOT FOUND',
            skillsCount: (enhancedResult.skills || []).length,
            experienceCount: (enhancedResult.experience || []).length,
            educationCount: (enhancedResult.education || []).length,
          });
          
          parsedData = {
            name: enhancedResult.fullName || '',
            fullName: enhancedResult.fullName || '',
            email: enhancedResult.email || '',
            phone: enhancedResult.phone || '',
            address: enhancedResult.location || '',
            location: enhancedResult.location || '',
            linkedin: enhancedResult.linkedin || '',
            portfolio: enhancedResult.portfolio || '',
            skills: enhancedResult.skills || [],
            experience: (enhancedResult.experience || []).map((exp: any) => ({
              company: exp.company || '',
              position: exp.position || '',
              job_title: exp.position || '',
              startDate: exp.startDate || '',
              endDate: exp.endDate || '',
              start_date: exp.startDate || '',
              end_date: exp.endDate || '',
              description: exp.description || '',
              achievements: exp.achievements || [],
              current: exp.current || false
            })),
            education: (enhancedResult.education || []).map((edu: any) => ({
              institution: edu.institution || '',
              degree: edu.degree || '',
              field: edu.field || '',
              year: edu.endDate || edu.year || '',
              gpa: edu.gpa || ''
            })),
            projects: enhancedResult.projects || [],
            certifications: enhancedResult.certifications || [],
            languages: enhancedResult.languages || [],
            summary: enhancedResult.summary || '',
            confidence: enhancedResult.confidence || 80
          };
          aiSuccess = true;
          aiProvider = 'enhanced-ai';
          console.log('✅ EnhancedResumeAI parsing successful');
          console.log('   - Confidence:', parsedData.confidence, '%');
          console.log('   - Extracted name:', parsedData.fullName || 'MISSING');
          console.log('   - Skills:', parsedData.skills.length);
          console.log('   - Experience:', parsedData.experience.length);
          console.log('   - Education:', parsedData.education.length);
        } else {
          throw new Error('EnhancedResumeAI returned incomplete data');
        }
      } catch (enhancedError) {
        console.error('❌ EnhancedResumeAI failed, trying Affinda...:', enhancedError);
        
        // Try Affinda Resume Parser (Tier 3)
        try {
          console.log('🔄 Attempting Affinda Resume Parser extraction...');
          const affindaParser = new AffindaResumeParser();
          
          if (affindaParser.isAvailable()) {
            const affindaResult = await affindaParser.parseResume(fileBuffer, file.name);
            console.log('📦 Affinda returned result');
            
            if (affindaResult && affindaResult.fullName) {
              console.log('📊 Affinda result received:', {
                name: affindaResult.fullName || 'NOT FOUND',
                email: affindaResult.email || 'NOT FOUND',
                phone: affindaResult.phone || 'NOT FOUND',
                skillsCount: (affindaResult.skills || []).length,
                experienceCount: (affindaResult.experience || []).length,
                educationCount: (affindaResult.education || []).length,
              });
              
              // Transform Affinda format (already matches our standard format)
              parsedData = {
                name: affindaResult.fullName || '',
                fullName: affindaResult.fullName || '',
                email: affindaResult.email || '',
                phone: affindaResult.phone || '',
                address: affindaResult.location || '',
                location: affindaResult.location || '',
                linkedin: affindaResult.linkedin || '',
                portfolio: affindaResult.portfolio || '',
                skills: affindaResult.skills || [],
                experience: (affindaResult.experience || []).map((exp: any) => ({
                  company: exp.company || '',
                  position: exp.position || '',
                  job_title: exp.position || '',
                  startDate: exp.startDate || '',
                  endDate: exp.endDate || '',
                  start_date: exp.startDate || '',
                  end_date: exp.endDate || '',
                  description: exp.description || '',
                  achievements: exp.achievements || [],
                  current: exp.current || false
                })),
                education: (affindaResult.education || []).map((edu: any) => ({
                  institution: edu.institution || '',
                  degree: edu.degree || '',
                  field: edu.field || '',
                  year: edu.endDate || '',
                  gpa: edu.gpa || ''
                })),
                projects: affindaResult.projects || [],
                certifications: affindaResult.certifications || [],
                languages: affindaResult.languages || [],
                summary: affindaResult.summary || '',
                confidence: affindaResult.confidence || 75
              };
              aiSuccess = true;
              aiProvider = 'affinda';
              console.log('✅ Affinda parsing successful');
              console.log('   - Confidence:', parsedData.confidence, '%');
              console.log('   - Skills:', parsedData.skills.length);
              console.log('   - Experience:', parsedData.experience.length);
              console.log('   - Education:', parsedData.education.length);
            } else {
              throw new Error('Affinda returned incomplete data');
            }
          } else {
            console.log('⚠️ Affinda not available (no API key), skipping to basic extraction');
            throw new Error('Affinda not configured');
          }
        } catch (affindaError) {
          console.error('❌ Affinda also failed, using basic extraction:', affindaError);
          // Use basic extraction as last resort
          parsedData = await parseResumeBasic(extractedText, session);
          aiProvider = 'basic';
        }
      }
    }

    // Derive name from email if AI didn't extract it
    let derivedName = '';
    if (!parsedData.name && !parsedData.fullName) {
      // Extract name from email (e.g., anamsayyed180@gmail.com → Anam Sayyed)
      const emailName = (parsedData.email || session.user.email || '').split('@')[0];
      const namePart = emailName.replace(/[0-9]/g, '').replace(/[._-]/g, ' ');
      if (namePart.length > 2) {
        // Capitalize first letter of each word
        derivedName = namePart.split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join(' ');
        console.log('📧 Derived name from email:', derivedName);
      }
    }
    
    // CRITICAL FIX: Only use session.user.name if parsedData has nothing AND email derivation failed
    // This prevents using database display name like "Resume Uploaded"
    const extractedOrDerivedName = parsedData.name || parsedData.fullName || derivedName;
    const finalName = extractedOrDerivedName || (session.user.name && session.user.name.length < 30 ? session.user.name : 'User');
    
    console.log('👤 Name resolution:', {
      parsedName: parsedData.name || parsedData.fullName || 'none',
      derivedFromEmail: derivedName || 'none',
      sessionName: session.user.name || 'none',
      finalName: finalName
    });

    // Enhanced field extraction with fallback parsing for missing fields
    const enhancedData = enhanceExtractedData(parsedData, extractedText);
    
    // Convert to the format expected by the frontend with ALL fields
    const profile = {
      fullName: finalName,
      name: finalName, // Add alias
      email: parsedData.email || session.user.email || '',
      phone: parsedData.phone || '',
      location: parsedData.address || parsedData.location || '',
      linkedin: enhancedData.linkedin || parsedData.linkedin || '',
      github: enhancedData.github || parsedData.github || '',
      portfolio: enhancedData.portfolio || parsedData.portfolio || '',
      website: enhancedData.website || '',
      summary: parsedData.summary || enhancedData.summary || `Experienced professional with expertise in ${parsedData.skills?.slice(0, 3).join(', ') || 'various technologies'}.`,
      skills: parsedData.skills || [],
      experience: (parsedData.experience || []).map((exp: any) => ({
        company: exp.company || exp.organization || '',
        position: exp.job_title || exp.position || exp.title || exp.role || '',
        location: exp.location || '',
        startDate: exp.start_date || exp.startDate || '',
        endDate: exp.end_date || exp.endDate || '',
        duration: exp.duration || '',
        current: !exp.end_date && !exp.endDate,
        description: exp.description || exp.summary || '',
        achievements: Array.isArray(exp.achievements) ? exp.achievements : (exp.achievements ? [exp.achievements] : (exp.description ? [exp.description] : []))
      })),
      education: (parsedData.education || []).map((edu: any) => ({
        institution: edu.institution || edu.school || edu.university || '',
        degree: edu.degree || edu.qualification || '',
        field: edu.field || edu.major || '',
        startDate: edu.start_date || edu.startDate || '',
        endDate: edu.year || edu.end_date || edu.endDate || '',
        gpa: edu.gpa || '',
        description: edu.description || ''
      })),
      projects: (parsedData.projects || enhancedData.projects || []).map((proj: any) => ({
        name: typeof proj === 'string' ? proj : (proj.name || proj.title || 'Project'),
        description: typeof proj === 'string' ? proj : (proj.description || proj.summary || ''),
        technologies: proj.technologies || proj.tech_stack || [],
        url: proj.url || proj.link || '',
        startDate: proj.start_date || proj.startDate || '',
        endDate: proj.end_date || proj.endDate || ''
      })),
      certifications: (parsedData.certifications || []).map((cert: any) => ({
        name: typeof cert === 'string' ? cert : (cert.name || cert.title || ''),
        issuer: cert.issuer || cert.organization || '',
        date: cert.date || cert.issued_date || '',
        url: cert.url || cert.link || ''
      })),
      // Enhanced: Extract languages, achievements, hobbies
      languages: (parsedData.languages || enhancedData.languages || []).map((lang: any) => 
        typeof lang === 'string' 
          ? { name: lang, proficiency: 'Fluent' } 
          : { name: lang.name || lang.language || '', proficiency: lang.proficiency || lang.level || 'Fluent' }
      ),
      achievements: enhancedData.achievements || [],
      hobbies: enhancedData.hobbies || [],
      expectedSalary: parsedData.expected_salary || parsedData.salary_expectation || '',
      preferredJobType: parsedData.preferred_job_type || 'Full-time',
      confidence: parsedData.confidence || 85,
      rawText: extractedText,
      atsSuggestions: [
        'Resume parsed using AI for maximum accuracy',
        'Skills and experience extracted automatically',
        'Ready for job matching and recommendations'
      ],
      jobSuggestions: generateJobSuggestions(parsedData)
    };

    console.log('📊 Final profile data:', {
      fullName: profile.fullName || 'MISSING',
      email: profile.email || 'MISSING',
      phone: profile.phone || 'MISSING',
      location: profile.location || 'MISSING',
      skillsCount: profile.skills.length,
      experienceCount: profile.experience.length,
      educationCount: profile.education.length,
      hasProjects: profile.projects.length > 0,
      hasCertifications: profile.certifications.length > 0,
      aiProvider: aiProvider,
      aiSuccess: aiSuccess
    });
    
    console.log('📋 Detailed extraction results:');
    console.log('  - Skills:', profile.skills);
    console.log('  - Experience:', profile.experience.map((e: any) => `${e.company} - ${e.position}`));
    console.log('  - Education:', profile.education.map((e: any) => `${e.institution} - ${e.degree}`));

    // Get or create user
    let user = await prisma.user.findUnique({
      where: { email: session.user.email! }
    });
    
    if (!user) {
      console.log('👤 Creating new user from session data');
      user = await prisma.user.create({
        data: {
          email: session.user.email!,
          firstName: session.user.name?.split(' ')[0] || 'User',
          lastName: session.user.name?.split(' ').slice(1).join(' ') || '',
          role: 'jobseeker',
          isActive: true,
          isVerified: true
        }
      });
      console.log('✅ Created new user:', user.id);
    } else {
      console.log('👤 Found existing user:', user.id);
    }

    // Update user profile with parsed data
    await prisma.user.update({
      where: { id: user.id },
      data: {
        firstName: profile.fullName?.split(' ')[0] || user.firstName,
        lastName: profile.fullName?.split(' ').slice(1).join(' ') || user.lastName,
        phone: profile.phone || user.phone,
        location: profile.location || user.location,
        skills: JSON.stringify(profile.skills),
        bio: profile.summary || user.bio
      }
    });

    // Save resume to database with storage metadata
    const resume = await prisma.resume.create({
      data: {
        userId: user.id,
        fileName: file.name,
        fileUrl: uploadResult.fileUrl,
        fileSize: uploadResult.fileSize,
        mimeType: file.type,
        parsedData: {
          ...profile,
          storage: uploadResult.storage,
          gcsPath: uploadResult.gcsPath || undefined,
        } as any,
        atsScore: 90,
        isActive: true
      }
    });

    console.log(`✅ Ultimate resume upload completed: ${resume.id}`);

    // Fetch job recommendations based on uploaded resume
    let recommendations = [];
    try {
      console.log('🎯 Fetching job recommendations for user...');
      const jobsResponse = await prisma.job.findMany({
        where: {
          isActive: true,
          OR: profile.skills.map((skill: string) => ({
            skills: { contains: skill, mode: 'insensitive' }
          }))
        },
        take: 6,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          title: true,
          company: true,
          location: true,
          jobType: true,
          experienceLevel: true,
          salary: true,
          salaryMin: true,
          salaryMax: true,
          salaryCurrency: true,
          isRemote: true,
          isHybrid: true,
          skills: true,
          description: true,
          postedAt: true,
          createdAt: true
        }
      });

      // Calculate match scores
      recommendations = jobsResponse.map(job => {
        let score = 0;
        let reasons = [];

        // Skills match
        if (profile.skills && profile.skills.length > 0 && job.skills) {
          const jobSkills = typeof job.skills === 'string' ? JSON.parse(job.skills) : job.skills;
          const matchingSkills = profile.skills.filter((skill: string) => 
            jobSkills.some((jobSkill: string) => 
              jobSkill.toLowerCase().includes(skill.toLowerCase())
            )
          );
          if (matchingSkills.length > 0) {
            score += (matchingSkills.length / profile.skills.length) * 40;
            reasons.push(`${matchingSkills.length} skill(s) match: ${matchingSkills.join(', ')}`);
          }
        }

        // Location match
        if (profile.location && job.location) {
          if (job.location.toLowerCase().includes(profile.location.toLowerCase())) {
            score += 30;
            reasons.push('Location match');
          }
        }

        // Job type preference
        if (profile.preferredJobType && job.jobType === profile.preferredJobType) {
          score += 20;
          reasons.push('Preferred job type');
        }

        // Remote preference
        if (job.isRemote) {
          score += 10;
          reasons.push('Remote work available');
        }

        return {
          ...job,
          matchScore: Math.round(score),
          matchReasons: reasons
        };
      });

      // Sort by match score
      recommendations.sort((a, b) => b.matchScore - a.matchScore);
      console.log(`✅ Found ${recommendations.length} job recommendations`);
    } catch (recError) {
      console.error('⚠️ Failed to fetch recommendations (non-critical):', recError);
      // Don't fail the upload if recommendations fail
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Resume uploaded and parsed successfully using AI',
      resumeId: resume.id,
      profile,
      extractedData: profile, // Add extractedData alias for component compatibility
      recommendations,
      aiSuccess: aiSuccess, // Use actual AI success status
      atsScore: 90,
      confidence: profile.confidence,
      aiProvider: aiProvider, // Use actual AI provider used
      processingTime: Date.now() - timestamp,
      storage: {
        type: uploadResult.storage,
        secure: uploadResult.storage === 'gcs',
        cloud: uploadResult.storage === 'gcs',
      },
      sources: {
        ai: aiSuccess,
        textExtraction: true,
        jobMatching: true
      },
      debug: {
        extractedTextLength: extractedText?.length || 0,
        aiProvider: aiProvider,
        aiSuccess: aiSuccess
      }
    });

  } catch (error: any) {
    console.error('❌ Ultimate resume upload error:', error);
    console.error('❌ Error stack:', error?.stack);
    console.error('❌ Error name:', error?.name);
    console.error('❌ Error message:', error?.message);
    
    // Provide more detailed error information
    let errorMessage = 'Failed to upload and parse resume';
    let statusCode = 500;
    
    if (error instanceof Error) {
      errorMessage = error.message;
      
      // Handle specific error types
      if (error.message.includes('413') || error.message.includes('too large')) {
        statusCode = 413;
        errorMessage = 'File size exceeds maximum limit of 10MB';
      } else if (error.message.includes('401') || error.message.includes('auth')) {
        statusCode = 401;
        errorMessage = 'Authentication required. Please log in to upload your resume.';
      } else if (error.message.includes('400') || error.message.includes('invalid')) {
        statusCode = 400;
        errorMessage = error.message;
      }
    }
    
    return NextResponse.json({ 
      success: false,
      error: errorMessage,
      timestamp: new Date().toISOString(),
      details: process.env.NODE_ENV === 'development' ? error?.stack : undefined
    }, { status: statusCode });
  }
}

/**
 * Extract text from uploaded file
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
        return text;
      } catch (pdfError) {
        console.error('❌ PDF parsing failed:', pdfError);
        // Fallback to basic text extraction
        const text = new TextDecoder().decode(bytes);
        const readableText = text.replace(/[^\x20-\x7E\s]/g, ' ').replace(/\s+/g, ' ').trim();
        return readableText.length > 50 ? readableText : `Resume: ${file.name}`;
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
        return text;
      } catch (wordError) {
        console.error('❌ Word document parsing failed:', wordError);
        return `Resume: ${file.name}`;
      }
    }
    
    // Fallback
    const text = new TextDecoder().decode(bytes);
    const readableText = text.replace(/[^\x20-\x7E\s]/g, ' ').replace(/\s+/g, ' ').trim();
    return readableText.length > 50 ? readableText : `Resume: ${file.name}`;
  } catch (extractError) {
    console.error('❌ Text extraction failed:', extractError);
    return `Resume: ${file.name}`;
  }
}

/**
 * Basic resume parsing (fallback when AI fails)
 * Enhanced version with better pattern matching
 */
async function parseResumeBasic(text: string, session: any): Promise<any> {
  try {
    console.log('⚠️ Using BASIC extraction (AI unavailable)');
    console.log('📄 Raw text length:', text.length);
    
    // Clean the text first - remove PDF artifacts and headers
    const cleanedText = cleanResumeText(text);
    console.log('🧹 Cleaned text preview (first 300 chars):', cleanedText.substring(0, 300));
    
    const lines = cleanedText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    console.log('📝 Total lines after cleaning:', lines.length);
    
    // Start with empty data - DO NOT use session.user.name as it may be incorrect
    const parsedData: any = {
      name: '',
      fullName: '',
      email: session.user.email || '', // Email is reliable
      phone: '',
      address: '',
      location: '',
      skills: [],
      experience: [],
      education: [],
      projects: [],
      certifications: [],
      languages: [],
      summary: '',
      confidence: 50
    };

    // Extract name using intelligent detection
    const extractedName = extractName(cleanedText, lines);
    if (extractedName) {
      parsedData.name = extractedName;
      parsedData.fullName = extractedName;
    console.log('👤 Extracted name:', parsedData.name);
    }
    
    // Extract email
    const emailMatch = cleanedText.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
    if (emailMatch) {
      parsedData.email = emailMatch[1];
      console.log('📧 Extracted email:', parsedData.email);
    }
    
    // Extract phone (improved pattern)
    const phoneMatches = cleanedText.match(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g);
    if (phoneMatches && phoneMatches.length > 0) {
      parsedData.phone = phoneMatches[0].trim();
      console.log('📞 Extracted phone:', parsedData.phone);
    }
    
    // Extract location (look for common location patterns)
    const locationMatch = cleanedText.match(/(?:address|location)[:\s]+([A-Za-z\s,]+(?:,\s*[A-Z]{2})?)/i);
    if (locationMatch) {
      parsedData.location = locationMatch[1].trim();
      parsedData.address = locationMatch[1].trim();
      console.log('📍 Extracted location:', parsedData.location);
    }
    
    // Extract skills - EXPANDED list (100+ skills)
    const skillKeywords = [
      // Programming Languages
      'JavaScript', 'Python', 'Java', 'C++', 'C#', 'PHP', 'Ruby', 'Go', 'Rust', 'Swift', 'Kotlin', 'TypeScript',
      // Web Technologies
      'React', 'Angular', 'Vue.js', 'Next.js', 'Node.js', 'Express', 'Django', 'Flask', 'Spring', 'Laravel',
      'HTML', 'HTML5', 'CSS', 'CSS3', 'SASS', 'LESS', 'Tailwind', 'Bootstrap',
      // Databases
      'SQL', 'MySQL', 'PostgreSQL', 'MongoDB', 'Redis', 'Cassandra', 'DynamoDB', 'Firebase',
      // Cloud & DevOps
      'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'Jenkins', 'GitLab CI', 'GitHub Actions',
      'Terraform', 'Ansible', 'CI/CD',
      // Tools & Platforms
      'Git', 'GitHub', 'GitLab', 'Bitbucket', 'Jira', 'Confluence', 'Slack', 'VS Code',
      // Testing
      'Jest', 'Mocha', 'Cypress', 'Selenium', 'JUnit', 'PyTest', 'Testing',
      // Methodologies
      'Agile', 'Scrum', 'Kanban', 'Waterfall', 'DevOps', 'Microservices', 'REST API', 'GraphQL',
      // Soft Skills
      'Leadership', 'Communication', 'Teamwork', 'Problem Solving', 'Project Management',
      // Data & ML
      'Machine Learning', 'Deep Learning', 'Data Analysis', 'TensorFlow', 'PyTorch', 'Pandas', 'NumPy',
      // Mobile
      'React Native', 'Flutter', 'iOS', 'Android', 'Mobile Development'
    ];
    
    parsedData.skills = skillKeywords.filter(skill => 
      cleanedText.toLowerCase().includes(skill.toLowerCase())
    );
    console.log('🛠️ Extracted skills:', parsedData.skills.length, 'skills:', parsedData.skills);
    
    // Extract experience - IMPROVED section detection
    const experienceSection = extractSection(cleanedText, ['experience', 'work history', 'employment', 'professional experience']);
    if (experienceSection) {
      console.log('💼 Found experience section, length:', experienceSection.length);
      parsedData.experience = parseExperienceSection(experienceSection);
      console.log('💼 Extracted experience entries:', parsedData.experience.length);
    }
    
    // Extract education - IMPROVED section detection
    const educationSection = extractSection(cleanedText, ['education', 'academic background', 'qualifications']);
    if (educationSection) {
      console.log('🎓 Found education section, length:', educationSection.length);
      parsedData.education = parseEducationSection(educationSection);
      console.log('🎓 Extracted education entries:', parsedData.education.length);
    }
    
    // Extract summary/objective
    const summarySection = extractSection(cleanedText, ['summary', 'professional summary', 'objective', 'career objective', 'profile']);
    if (summarySection) {
      parsedData.summary = summarySection.trim();
      console.log('📝 Extracted summary length:', parsedData.summary.length);
    } else if (parsedData.skills.length > 0) {
      parsedData.summary = `Experienced professional with expertise in ${parsedData.skills.slice(0, 3).join(', ')}. Strong background in software development and technical problem-solving.`;
    } else {
      parsedData.summary = `Professional with experience in various technical domains. Strong analytical and problem-solving skills.`;
    }
    
    console.log('✅ Basic parsing completed. Extracted:', {
      name: !!parsedData.name,
      email: !!parsedData.email,
      phone: !!parsedData.phone,
      skills: parsedData.skills.length,
      experience: parsedData.experience.length,
      education: parsedData.education.length
    });
    
    return parsedData;
    
  } catch (basicError: any) {
    console.error('❌ Basic parsing failed:', basicError);
    
    // Derive name from email as last resort
    const email = session?.user?.email || '';
    const emailName = email.split('@')[0].replace(/[0-9]/g, '').replace(/[._-]/g, ' ');
    const derivedName = emailName.split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
    
    return {
      name: derivedName || '',
      fullName: derivedName || '',
      email: email,
      phone: '',
      skills: [],
      experience: [],
      education: [],
      summary: 'Resume uploaded successfully. Please complete your profile manually.',
      confidence: 30
    };
  }
}

/**
 * Clean resume text by removing PDF artifacts and headers
 */
function cleanResumeText(text: string): string {
  // Remove PDF headers and artifacts
  let cleaned = text
    .replace(/^%PDF.*$/gm, '') // Remove PDF headers
    .replace(/^%[0-9]+.*$/gm, '') // Remove PDF object references
    .replace(/^<<.*$/gm, '') // Remove PDF dictionary markers
    .replace(/^>>.*$/gm, '') // Remove PDF dictionary closers
    .replace(/^[0-9]+\s+[0-9]+\s+obj.*$/gm, '') // Remove PDF object definitions
    .replace(/^endobj.*$/gm, '') // Remove PDF object endings
    .replace(/^stream.*$/gm, '') // Remove PDF stream markers
    .replace(/^endstream.*$/gm, '') // Remove PDF stream endings
    .replace(/^xref.*$/gm, '') // Remove PDF cross-reference tables
    .replace(/^trailer.*$/gm, '') // Remove PDF trailer
    .replace(/^startxref.*$/gm, '') // Remove PDF startxref
    .replace(/^%%EOF.*$/gm, '') // Remove PDF EOF
    .replace(/[^\x20-\x7E\s]/g, ' ') // Remove non-printable characters
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
  
  return cleaned;
}

/**
 * Extract name from resume text using intelligent detection
 */
function extractName(text: string, lines: string[]): string {
  // Look for common name patterns
  const namePatterns = [
    /^[A-Z][a-z]+ [A-Z][a-z]+$/, // First Last
    /^[A-Z][a-z]+ [A-Z]\. [A-Z][a-z]+$/, // First M. Last
    /^[A-Z][a-z]+ [A-Z][a-z]+ [A-Z][a-z]+$/ // First Middle Last
  ];
  
  // Check first 10 lines for name patterns
  for (let i = 0; i < Math.min(10, lines.length); i++) {
    const line = lines[i].trim();
    
    // Skip lines that are clearly not names
    if (line.length < 3 || line.length > 50) continue;
    if (line.includes('@') || line.includes('+') || line.includes('http')) continue;
    if (line.includes('PDF') || line.includes('%') || line.includes('<')) continue;
    if (line.toLowerCase().includes('resume') || line.toLowerCase().includes('cv')) continue;
    if (line.toLowerCase().includes('experience') || line.toLowerCase().includes('education')) continue;
    
    // Check if line matches name patterns
    for (const pattern of namePatterns) {
      if (pattern.test(line)) {
        console.log('✅ Found name pattern match:', line);
        return line;
      }
    }
    
    // Check for simple two-word names (most common)
    const words = line.split(' ');
    if (words.length === 2 && 
        words[0].length > 1 && words[1].length > 1 &&
        /^[A-Z][a-z]+$/.test(words[0]) && 
        /^[A-Z][a-z]+$/.test(words[1])) {
      console.log('✅ Found simple name pattern:', line);
      return line;
    }
  }
  
  // Fallback: return first reasonable line
  for (let i = 0; i < Math.min(5, lines.length); i++) {
    const line = lines[i].trim();
    if (line.length > 3 && line.length < 50 && 
        !line.includes('@') && !line.includes('+') && 
        !line.includes('PDF') && !line.includes('%')) {
      console.log('🔄 Using fallback name:', line);
      return line;
    }
  }
  
  console.log('❌ No name found, using empty string');
  return '';
}

/**
 * Enhance extracted data with missing fields using pattern matching
 * Extracts: languages, achievements, hobbies, URLs (LinkedIn, GitHub, Portfolio)
 */
function enhanceExtractedData(parsedData: any, rawText: string): any {
  const enhanced: any = {
    languages: [],
    achievements: [],
    hobbies: [],
    linkedin: '',
    github: '',
    portfolio: '',
    website: '',
    summary: '',
    projects: []
  };
  
  if (!rawText) return enhanced;
  
  const lowerText = rawText.toLowerCase();
  const lines = rawText.split('\n').filter(line => line.trim());
  
  // Extract LinkedIn URL
  const linkedinMatch = rawText.match(/linkedin\.com\/in\/([a-zA-Z0-9-]+)/i);
  if (linkedinMatch) {
    enhanced.linkedin = `https://linkedin.com/in/${linkedinMatch[1]}`;
  }
  
  // Extract GitHub URL
  const githubMatch = rawText.match(/github\.com\/([a-zA-Z0-9-]+)/i);
  if (githubMatch) {
    enhanced.github = `https://github.com/${githubMatch[1]}`;
  }
  
  // Extract Portfolio/Website URL
  const websiteMatch = rawText.match(/(https?:\/\/[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(?:\/[^\s]*)?)/);
  if (websiteMatch && !websiteMatch[0].includes('linkedin') && !websiteMatch[0].includes('github')) {
    enhanced.portfolio = websiteMatch[0];
    enhanced.website = websiteMatch[0];
  }
  
  // Extract Languages Section
  const languagesSectionIndex = lines.findIndex(line => 
    /^(languages?|language skills?):?\s*$/i.test(line.trim())
  );
  
  if (languagesSectionIndex !== -1) {
    // Get next 5 lines after "Languages" heading
    const languageLines = lines.slice(languagesSectionIndex + 1, languagesSectionIndex + 6);
    const commonLanguages = [
      'English', 'Spanish', 'French', 'German', 'Chinese', 'Japanese', 'Korean', 
      'Hindi', 'Arabic', 'Portuguese', 'Russian', 'Italian', 'Dutch', 'Turkish',
      'Polish', 'Swedish', 'Norwegian', 'Danish', 'Finnish', 'Greek', 'Hebrew',
      'Thai', 'Vietnamese', 'Indonesian', 'Malay', 'Filipino', 'Bengali', 'Urdu',
      'Marathi', 'Telugu', 'Tamil', 'Gujarati', 'Kannada', 'Malayalam', 'Punjabi'
    ];
    
    languageLines.forEach(line => {
      const lineText = line.trim();
      // Stop if we hit another section heading
      if (/^[A-Z][A-Za-z\s]+:?\s*$/.test(lineText) && lineText.length < 30) return;
      
      // Check for language matches
      commonLanguages.forEach(lang => {
        if (lineText.toLowerCase().includes(lang.toLowerCase())) {
          // Extract proficiency level if present
          let proficiency = 'Fluent';
          if (/native|mother\s*tongue/i.test(lineText)) proficiency = 'Native';
          else if (/fluent|proficient|advanced/i.test(lineText)) proficiency = 'Fluent';
          else if (/intermediate|conversational/i.test(lineText)) proficiency = 'Intermediate';
          else if (/basic|beginner/i.test(lineText)) proficiency = 'Basic';
          
          // Only add if not already added
          if (!enhanced.languages.find((l: any) => l.name === lang)) {
            enhanced.languages.push({ name: lang, proficiency });
          }
        }
      });
    });
  }
  
  // Extract Achievements Section (as separate from experience)
  const achievementsSectionIndex = lines.findIndex(line => 
    /^(achievements?|accomplishments?|awards?|honors?):?\s*$/i.test(line.trim())
  );
  
  if (achievementsSectionIndex !== -1) {
    // Get lines until next section
    const achievementLines = lines.slice(achievementsSectionIndex + 1, achievementsSectionIndex + 10);
    achievementLines.forEach(line => {
      const lineText = line.trim();
      // Stop at next section
      if (/^[A-Z][A-Za-z\s]+:?\s*$/.test(lineText) && lineText.length < 30) return;
      
      // Add non-empty lines that look like achievements
      if (lineText.length > 10 && !lineText.startsWith('•') && !lineText.startsWith('-')) {
        enhanced.achievements.push(lineText);
      } else if ((lineText.startsWith('•') || lineText.startsWith('-')) && lineText.length > 10) {
        enhanced.achievements.push(lineText.substring(1).trim());
      }
    });
  }
  
  // Extract Hobbies/Interests Section
  const hobbiesSectionIndex = lines.findIndex(line => 
    /^(hobbies?|interests?|personal interests?):?\s*$/i.test(line.trim())
  );
  
  if (hobbiesSectionIndex !== -1) {
    // Get lines until next section
    const hobbyLines = lines.slice(hobbiesSectionIndex + 1, hobbiesSectionIndex + 5);
    hobbyLines.forEach(line => {
      const lineText = line.trim();
      // Stop at next section
      if (/^[A-Z][A-Za-z\s]+:?\s*$/.test(lineText) && lineText.length < 30) return;
      
      // Split on commas or bullets
      const hobbies = lineText.split(/[,•\-]/).map(h => h.trim()).filter(h => h.length > 2 && h.length < 50);
      enhanced.hobbies.push(...hobbies);
    });
  }
  
  console.log('✨ Enhanced extraction results:');
  console.log('   - LinkedIn:', enhanced.linkedin || 'not found');
  console.log('   - GitHub:', enhanced.github || 'not found');
  console.log('   - Portfolio:', enhanced.portfolio || 'not found');
  console.log('   - Languages:', enhanced.languages.length);
  console.log('   - Achievements:', enhanced.achievements.length);
  console.log('   - Hobbies:', enhanced.hobbies.length);
  
  return enhanced;
}

/**
 * Generate job suggestions based on parsed resume data
 */
function generateJobSuggestions(parsedData: any): any[] {
  const suggestions = [];
  
  if (parsedData.skills && parsedData.skills.length > 0) {
    // Generate job suggestions based on skills
    if (parsedData.skills.some((skill: string) => ['JavaScript', 'React', 'Node.js'].includes(skill))) {
      suggestions.push({
        title: 'Frontend Developer',
        reason: 'Based on your JavaScript and React skills'
      });
    }
    
    if (parsedData.skills.some((skill: string) => ['Python', 'Java', 'C++'].includes(skill))) {
      suggestions.push({
        title: 'Backend Developer',
        reason: 'Based on your programming language expertise'
      });
    }
    
    if (parsedData.skills.some((skill: string) => ['AWS', 'Docker', 'Linux'].includes(skill))) {
      suggestions.push({
        title: 'DevOps Engineer',
        reason: 'Based on your cloud and infrastructure skills'
      });
    }
  }
  
  // Default suggestions
  if (suggestions.length === 0) {
    suggestions.push(
      { title: 'Software Engineer', reason: 'General software development role' },
      { title: 'Technical Specialist', reason: 'Based on your technical background' }
    );
  }
  
  return suggestions;
}

/**
 * Extract a specific section from resume text
 */
function extractSection(text: string, sectionNames: string[]): string | null {
  const lowerText = text.toLowerCase();
  
  for (const sectionName of sectionNames) {
    const sectionRegex = new RegExp(`(${sectionName})[\s:-]*([\\s\\S]*?)(?=\\n\\s*(?:education|experience|skills|projects|certifications|references|$))`, 'i');
    const match = lowerText.match(sectionRegex);
    
    if (match && match[2]) {
      // Get the actual text (not lowercase)
      const startIndex = text.toLowerCase().indexOf(match[0]);
      if (startIndex !== -1) {
        const sectionText = text.substr(startIndex + match[1].length, match[2].length).trim();
        if (sectionText.length > 20) { // Ensure it's not just a header
          return sectionText;
        }
      }
    }
  }
  
  return null;
}

/**
 * Parse experience section into structured data
 */
function parseExperienceSection(sectionText: string): any[] {
  const experiences = [];
  const lines = sectionText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  
  let currentExp: any = null;
  
  for (const line of lines) {
    // Check if this line might be a job title (contains common title keywords or is title-cased)
    if (line.match(/^[A-Z][a-zA-Z\s]+(Engineer|Developer|Manager|Analyst|Designer|Consultant|Specialist|Lead|Director|Coordinator|Associate|Executive)/i)) {
      if (currentExp) experiences.push(currentExp);
      currentExp = {
        position: line,
        company: '',
        description: '',
        startDate: '',
        endDate: ''
      };
    }
    // Check for company name (often follows job title or is in ALL CAPS)
    else if (currentExp && !currentExp.company && (line.match(/^[A-Z][a-zA-Z\s&,Inc.Ltd]+$/) || line.includes('Inc') || line.includes('Ltd') || line.includes('Corp'))) {
      currentExp.company = line;
    }
    // Check for dates
    else if (currentExp && line.match(/\d{4}|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec/i)) {
      if (!currentExp.startDate) {
        currentExp.startDate = line;
      }
    }
    // Everything else is description
    else if (currentExp && line.length > 10) {
      currentExp.description += (currentExp.description ? ' ' : '') + line;
    }
  }
  
  if (currentExp) experiences.push(currentExp);
  
  console.log('💼 Parsed', experiences.length, 'experience entries');
  return experiences;
}

/**
 * Parse education section into structured data
 */
function parseEducationSection(sectionText: string): any[] {
  const education = [];
  const lines = sectionText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  
  let currentEdu: any = null;
  
  for (const line of lines) {
    // Check for degree (contains degree keywords)
    if (line.match(/bachelor|master|phd|b\.?s\.?|m\.?s\.?|b\.?tech|m\.?tech|diploma|associate/i)) {
      if (currentEdu) education.push(currentEdu);
      currentEdu = {
        degree: line,
        institution: '',
        field: '',
        year: ''
      };
    }
    // Check for institution name
    else if (currentEdu && !currentEdu.institution && (line.match(/university|college|institute|school/i) || line.length > 10)) {
      currentEdu.institution = line;
    }
    // Check for year
    else if (currentEdu && line.match(/\d{4}/)) {
      currentEdu.year = line.match(/\d{4}/)[0];
    }
  }
  
  if (currentEdu) education.push(currentEdu);
  
  console.log('🎓 Parsed', education.length, 'education entries');
  return education;
}
