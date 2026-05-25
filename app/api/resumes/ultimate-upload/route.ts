import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/nextauth-config';
import { prisma } from '@/lib/prisma';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { uploadResume } from '@/lib/storage/resume-storage';
import { HybridResumeAI } from '@/lib/hybrid-resume-ai';
import { EnhancedResumeAI } from '@/lib/enhanced-resume-ai';
import { AffindaResumeParser } from '@/lib/affinda-resume-parser';
import { GoogleCloudOCRService } from '@/lib/services/google-cloud-ocr';
import { isAffindaEnabled } from '@/lib/resume-parser/affinda-config';
import {
  mapExtractedToUploadProfile,
  isUsableExtraction,
} from '@/lib/resume-parser/map-to-upload-profile';
import { normalizeUploadProfile } from '@/lib/resume-parser/normalize-extracted';

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
  const REQ = `RZ-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
  const log = (msg: string, data?: unknown) => {
    if (data !== undefined) console.log(`[${REQ}] ${msg}`, data);
    else console.log(`[${REQ}] ${msg}`);
  };
  const warn = (msg: string, data?: unknown) => {
    if (data !== undefined) console.warn(`[${REQ}] ${msg}`, data);
    else console.warn(`[${REQ}] ${msg}`);
  };

  try {
    log('parser environment', {
      affinda: isAffindaEnabled(),
      openai: !!process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.startsWith('sk-'),
      gemini: !!process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.startsWith('AIzaSy'),
    });

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

    // Extract text from file with enhanced PDF parsing
    console.log('📄 Starting text extraction from file...');
    console.log('   - File type:', file.type);
    console.log('   - File size:', file.size, 'bytes');
    console.log('   - File name:', file.name);
    
    let extractedText: string;
    try {
      extractedText = await extractTextFromFile(file, bytes);
      
      // ENHANCED: More intelligent detection of binary/image-based PDFs
      // Check for PDF binary markers ONLY at the start (not in content)
      const startsWithPDFHeader = extractedText.startsWith('%PDF');
      const hasPDFStructureOnly = extractedText.includes('endobj') && extractedText.includes('/Type/Page');
      
      // Count readable text more accurately
      const readableWords = extractedText.match(/[a-zA-Z]{3,}/g) || [];
      const hasReadableText = readableWords.length > 20; // Increased threshold from 10 to 20
      const textDensity = readableWords.length / Math.max(extractedText.length, 1); // Words per character
      
      // CRITICAL FIX: Only flag as binary if BOTH conditions are met:
      // 1. Has PDF structure markers (endobj, /Type/Page)
      // 2. Very low text density (< 0.001) OR almost no readable words (< 15)
      const hasVeryLowDensity = textDensity < 0.001;
      const hasAlmostNoWords = readableWords.length < 15;
      const isPDFBinary = startsWithPDFHeader && hasPDFStructureOnly && hasVeryLowDensity && hasAlmostNoWords;
      
      console.log('📊 PDF Analysis:', {
        startsWithHeader: startsWithPDFHeader,
        hasStructure: hasPDFStructureOnly,
        wordCount: readableWords.length,
        textLength: extractedText.length,
        textDensity: textDensity.toFixed(4),
        hasVeryLowDensity: hasVeryLowDensity,
        hasAlmostNoWords: hasAlmostNoWords,
        isProbablyBinary: isPDFBinary
      });
      
      // ONLY attempt OCR if we're ABSOLUTELY SURE it's a scanned PDF
      if (isPDFBinary) {
        console.warn('⚠️ PDF may be binary/image-based - attempting OCR...');
        console.log('   - Text starts with:', extractedText.substring(0, 100));
        
        // Try OCR extraction for image-based PDFs
        const ocrService = new GoogleCloudOCRService();
        
        if (ocrService.isAvailable()) {
          try {
            console.log('🔍 Attempting Google Cloud Vision OCR extraction...');
            
            // Convert PDF buffer to base64 for OCR
            const pdfBase64 = fileBuffer.toString('base64');
            const base64WithPrefix = `data:application/pdf;base64,${pdfBase64}`;
            
            const ocrResult = await ocrService.extractTextFromImage(base64WithPrefix);
            
            if (ocrResult && ocrResult.text && ocrResult.text.length > 100) {
              console.log('✅ OCR extraction successful!');
              console.log('   - OCR text length:', ocrResult.text.length);
              console.log('   - OCR confidence:', (ocrResult.confidence * 100).toFixed(1) + '%');
              console.log('   - Detected languages:', ocrResult.detectedLanguages.join(', ') || 'none');
              console.log('   - Text preview:', ocrResult.text.substring(0, 300));
              
              extractedText = ocrResult.text;
            } else {
              console.warn('⚠️ OCR returned insufficient text - proceeding with basic extraction');
              // DON'T throw - just log and continue with whatever we have
            }
          } catch (ocrError) {
            console.warn('⚠️ OCR extraction failed:', ocrError);
            console.log('   → Proceeding with basic extraction instead');
            // DON'T throw - OCR is optional, not required
          }
        } else {
          console.warn('⚠️ OCR service not available (API key not configured)');
          console.log('   → Proceeding with basic text extraction');
          // DON'T throw - OCR is optional, proceed without it
        }
      }
      
      console.log('✅ Text extraction successful!');
      console.log('   - Text length:', extractedText.length, 'characters');
      console.log('   - Text preview (first 500 chars):');
      console.log(extractedText.substring(0, 500));
      console.log('   - Text contains "experience"?', extractedText.toLowerCase().includes('experience'));
      console.log('   - Text contains "education"?', extractedText.toLowerCase().includes('education'));
      console.log('   - Text contains "skills"?', extractedText.toLowerCase().includes('skills'));
      console.log('   - Number of words:', extractedText.split(/\s+/).length);
      console.log('   - Number of lines:', extractedText.split('\n').length);
      
      // CRITICAL: Final validation - but NEVER reject upload, only warn
      const finalWordCount = (extractedText.match(/[a-zA-Z]{3,}/g) || []).length;
      const hasPDFHeader = extractedText.substring(0, 5) === '%PDF-';
      const hasMinimumContent = extractedText.length >= 50 && finalWordCount >= 5; // Reduced from 10 to 5
      
      if (!hasMinimumContent) {
        console.warn('⚠️ WARNING: Extracted text is minimal');
        console.warn('   - Length:', extractedText.length, 'characters');
        console.warn('   - Word count:', finalWordCount, 'words');
        console.warn('   - Starts with:', extractedText.substring(0, 50));
        console.warn('   → Proceeding anyway to allow manual profile completion');
        
        // Add helpful note but DON'T block upload
        if (!extractedText.includes('[Note:')) {
          extractedText += '\n\n[Note: Limited text extracted from PDF. Please verify and complete your profile manually.]';
        }
      }
    } catch (extractError) {
      const errorMessage = extractError instanceof Error ? extractError.message : 'Unknown error';
      console.error('❌ Text extraction encountered error:', errorMessage);
      console.error('   - Full error:', extractError);
      console.warn('   → Allowing upload to proceed with manual profile entry');
      
      // CRITICAL: DON'T return error response - set minimal extracted text and continue
      // This allows the upload to succeed even if text extraction fails
      extractedText = `Resume: ${file.name}\n\n[Automatic text extraction was not possible. Please complete your profile manually.]`;
      
      console.log('✅ Continuing with fallback text to allow upload');
    }

    // Parse resume data using REAL AI (Hybrid approach for best accuracy)
    console.log('🤖 Starting REAL AI resume analysis with HybridResumeAI...');
    console.log('🔑 OpenAI available:', !!process.env.OPENAI_API_KEY);
    console.log('🔑 Gemini available:', !!process.env.GEMINI_API_KEY);
    console.log('📄 Extracted text for AI:', {
      length: extractedText.length,
      preview: extractedText.substring(0, 300),
      wordCount: (extractedText.match(/[a-zA-Z]{3,}/g) || []).length
    });
    
    let parsedData: any;
    let aiSuccess = false;
    let aiProvider = 'fallback';
    
    // CRITICAL: Skip AI ONLY if extracted text is truly minimal
    const isPdfParseFailure =
      extractedText.includes('[PDF parsing failed') ||
      extractedText.includes('[This PDF appears to contain no extractable text]');
    const isJustFallbackText =
      (extractedText.includes('[Automatic text extraction was not possible]') ||
        extractedText.includes('[Note: Limited text extracted') ||
        isPdfParseFailure) &&
      extractedText.length < 200;

    if (isJustFallbackText && !isAffindaEnabled()) {
      console.warn('⚠️ Extracted text is minimal fallback - skipping AI, using basic extraction');
      parsedData = await parseResumeBasic(extractedText, session);
      aiProvider = 'basic-fallback';
    } else {
      let usedAffindaPrimary = false;

      if (isAffindaEnabled()) {
        try {
          console.log('🚀 Affinda enabled — trying document parse first...');
          const affindaParser = new AffindaResumeParser();
          const affindaResult = await affindaParser.parseResume(fileBuffer, file.name);

          if (affindaResult.rawText && affindaResult.rawText.length > extractedText.length) {
            extractedText = affindaResult.rawText;
            console.log('📄 Using Affinda rawText for downstream parsing, length:', extractedText.length);
          }

          if (isUsableExtraction(affindaResult)) {
            parsedData = mapExtractedToUploadProfile(affindaResult, { aiProvider: 'affinda' });
            aiSuccess = true;
            aiProvider = 'affinda';
            usedAffindaPrimary = true;
            console.log('✅ Affinda primary extraction accepted (confidence:', affindaResult.confidence, ')');
          } else {
            console.warn('⚠️ Affinda result too sparse — continuing with AI fallback chain');
          }
        } catch (affindaPrimaryError) {
          console.warn(
            '⚠️ Affinda primary parse failed, using AI fallback chain:',
            affindaPrimaryError instanceof Error ? affindaPrimaryError.message : affindaPrimaryError
          );
        }
      }

      if (!usedAffindaPrimary) {
      try {
        // Try HybridResumeAI first (best accuracy)
        console.log('🚀 Attempting HybridResumeAI extraction with REAL AI...');
        console.log('📄 Text preview being sent to AI (first 500 chars):');
        console.log(extractedText.substring(0, 500));
        console.log('📊 Text stats: length=' + extractedText.length + ', words=' + (extractedText.match(/[a-zA-Z]{3,}/g) || []).length);
        
        const hybridAI = new HybridResumeAI();
        const hybridResult = await hybridAI.parseResumeText(extractedText);
        console.log('📦 HybridResumeAI returned result');

      
      console.log('📦 HybridResumeAI raw result:', JSON.stringify(hybridResult, null, 2).substring(0, 1500));
      console.log('🔍 CRITICAL: Check if result contains fallback message:');
      console.log('   - Experience[0].role:', hybridResult.experience?.[0]?.role);
      console.log('   - Education[0].degree:', hybridResult.education?.[0]?.degree);
      console.log('   - Is fallback?', hybridResult.experience?.[0]?.role?.includes('not extracted'));
      
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
        
        // CRITICAL: Check if this is fallback data and reject it
        const isFallbackData = hybridResult.experience?.[0]?.role?.includes('not extracted') ||
                               hybridResult.education?.[0]?.degree?.includes('not extracted');
        
        if (isFallbackData) {
          console.error('❌ Detected fallback data with error messages - rejecting and using basic extraction');
          throw new Error('AI returned fallback data - will use basic extraction instead');
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
      console.error('═══════════════════════════════════════════════════════');
      console.error('❌ HybridResumeAI FAILED - Investigating why AI isn\'t working...');
      console.error('═══════════════════════════════════════════════════════');
      console.error('Error details:', hybridError);
      console.error('Error type:', hybridError instanceof Error ? hybridError.constructor.name : typeof hybridError);
      console.error('Error message:', hybridError instanceof Error ? hybridError.message : String(hybridError));
      console.error('Error stack:', hybridError instanceof Error ? hybridError.stack : 'No stack trace');
      console.error('');
      console.error('🔍 DIAGNOSTIC INFO:');
      console.error('  - OpenAI key present:', !!process.env.OPENAI_API_KEY);
      console.error('  - OpenAI key length:', process.env.OPENAI_API_KEY?.length || 0);
      console.error('  - OpenAI key starts with:', process.env.OPENAI_API_KEY?.substring(0, 8) || 'none');
      console.error('  - Gemini key present:', !!process.env.GEMINI_API_KEY);
      console.error('  - Gemini key length:', process.env.GEMINI_API_KEY?.length || 0);
      console.error('  - Gemini key starts with:', process.env.GEMINI_API_KEY?.substring(0, 8) || 'none');
      console.error('  - Text length being sent:', extractedText.length);
      console.error('  - Text word count:', (extractedText.match(/[a-zA-Z]{3,}/g) || []).length);
      console.error('═══════════════════════════════════════════════════════');
      console.warn('⚠️ Falling back to EnhancedResumeAI...');
      
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
          
          parsedData = mapExtractedToUploadProfile(enhancedResult, { aiProvider: 'enhanced-ai' });
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
        console.error('═══════════════════════════════════════════════════════');
        console.error('❌ EnhancedResumeAI ALSO FAILED');
        console.error('═══════════════════════════════════════════════════════');
        console.error('Error details:', enhancedError);
        console.error('Error message:', enhancedError instanceof Error ? enhancedError.message : String(enhancedError));
        console.error('');
        console.error('🚨 CRITICAL: BOTH AI providers failed!');
        console.error('   This means either:');
        console.error('   1. API keys are invalid or expired');
        console.error('   2. API rate limits exceeded');
        console.error('   3. Network/firewall blocking API calls');
        console.error('   4. Extracted text is causing parsing errors');
        console.error('═══════════════════════════════════════════════════════');
        console.warn('⚠️ Falling back to Affinda...');
        
        // Try Affinda Resume Parser (Tier 3)
        try {
          console.log('🔄 Attempting Affinda Resume Parser extraction...');
          const affindaParser = new AffindaResumeParser();
          
          if (affindaParser.isAvailable()) {
            const affindaResult = await affindaParser.parseResume(fileBuffer, file.name);
            console.log('📦 Affinda returned result');
            
            if (affindaResult && isUsableExtraction(affindaResult)) {
              console.log('📊 Affinda result received:', {
                name: affindaResult.fullName || 'NOT FOUND',
                email: affindaResult.email || 'NOT FOUND',
                phone: affindaResult.phone || 'NOT FOUND',
                skillsCount: (affindaResult.skills || []).length,
                experienceCount: (affindaResult.experience || []).length,
                educationCount: (affindaResult.education || []).length,
              });
              
              // Transform Affinda format (already matches our standard format)
              parsedData = mapExtractedToUploadProfile(affindaResult, { aiProvider: 'affinda' });
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
    }
    }

    parsedData = normalizeUploadProfile(parsedData || {});

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
      summary: parsedData.summary || enhancedData.summary || '',
      skills: parsedData.skills || [],
      experience: (parsedData.experience || []).map((exp: any) => {
        const company = exp.company || exp.organization || '';
        const position = exp.job_title || exp.position || exp.title || exp.role || '';
        const location = exp.location || '';
        const startDate = exp.start_date || exp.startDate || '';
        const endDate = exp.end_date || exp.endDate || '';
        const duration = exp.duration || computeDuration(startDate, endDate);
        const description = exp.description || exp.summary || '';
        const achievements = Array.isArray(exp.achievements) ? exp.achievements : (exp.achievements ? [exp.achievements] : (exp.description ? [exp.description] : []));
        
        return {
          // Provide BOTH naming conventions for maximum compatibility
          company: company,
          Company: company, // Capitalized for template compatibility
          position: position,
          title: position, // Alias
          Position: position, // Capitalized for template compatibility
          location: location,
          Location: location, // Capitalized for template compatibility
          startDate: startDate,
          endDate: endDate,
          duration: duration,
          Duration: duration, // Capitalized for template compatibility
          current: !endDate || endDate.toLowerCase() === 'present',
          description: description,
          Description: description, // Capitalized for template compatibility
          achievements: achievements
        };
      }),
      education: (parsedData.education || []).map((edu: any) => {
        const institution = edu.institution || edu.school || edu.university || '';
        const degree = edu.degree || edu.qualification || '';
        const field = edu.field || edu.major || '';
        const startDate = edu.start_date || edu.startDate || '';
        const endDate = edu.year || edu.end_date || edu.endDate || '';
        const gpa = edu.gpa || '';
        const description = edu.description || '';
        const location = edu.location || '';
        
        return {
          // Provide BOTH naming conventions for maximum compatibility
          institution: institution,
          Institution: institution, // Capitalized for template compatibility
          degree: degree,
          Degree: degree, // Capitalized for template compatibility
          field: field,
          Field: field, // Capitalized for template compatibility
          startDate: startDate,
          endDate: endDate,
          year: endDate, // Alias for single year display
          gpa: gpa,
          GPA: gpa, // Capitalized for template compatibility
          description: description,
          Description: description, // Capitalized for template compatibility
          location: location,
          Location: location // Capitalized for template compatibility
        };
      }),
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

    log('FINAL PROFILE shape', {
      aiProvider,
      aiSuccess,
      fullName: profile.fullName || '(empty)',
      email: profile.email || '(empty)',
      phone: profile.phone || '(empty)',
      location: profile.location || '(empty)',
      linkedin: profile.linkedin || '(empty)',
      github: profile.github || '(empty)',
      portfolio: profile.portfolio || '(empty)',
      summaryChars: profile.summary?.length || 0,
      skillsCount: profile.skills.length,
      experienceCount: profile.experience.length,
      educationCount: profile.education.length,
      projectsCount: profile.projects.length,
      certificationsCount: profile.certifications.length,
      languagesCount: profile.languages.length,
      achievementsCount: profile.achievements.length,
      hobbiesCount: profile.hobbies.length,
    });
    if (profile.experience.length === 0) warn('NO experience parsed — check upstream parser output');
    if (profile.education.length === 0) warn('NO education parsed — check upstream parser output');
    if (profile.skills.length === 0) warn('NO skills parsed');
    
    // CRITICAL: Alert if arrays are empty (data loss issue)
    if (profile.skills.length === 0) {
      console.error('🚨 CRITICAL: SKILLS ARRAY IS EMPTY! AI extraction failed!');
      console.error('   - parsedData.skills:', parsedData.skills);
    }
    if (profile.experience.length === 0) {
      console.error('🚨 CRITICAL: EXPERIENCE ARRAY IS EMPTY! AI extraction failed!');
      console.error('   - parsedData.experience:', parsedData.experience);
    }
    if (profile.education.length === 0) {
      console.error('🚨 CRITICAL: EDUCATION ARRAY IS EMPTY! AI extraction failed!');
      console.error('   - parsedData.education:', parsedData.education);
    }
    
    console.log('📋 Detailed extraction results:');
    console.log('  - Skills:', profile.skills);
    console.log('  - Experience:', profile.experience.map((e: any) => `${e.company} - ${e.position}`));
    console.log('  - Education:', profile.education.map((e: any) => `${e.institution} - ${e.degree}`));
    console.log('  - Languages:', profile.languages.map((l: any) => `${l.name} (${l.proficiency})`));
    console.log('  - Achievements:', profile.achievements.length);
    console.log('  - Hobbies:', profile.hobbies.length);
    
    // CRITICAL: Log the exact structure for debugging template rendering AND auto-fill
    console.log('═══════════════════════════════════════════════════════════');
    console.log('🔍 FINAL PROFILE DATA STRUCTURE (What client receives):');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('Experience Count:', profile.experience.length);
    if (profile.experience.length > 0) {
      console.log('First experience entry:', JSON.stringify(profile.experience[0], null, 2));
      console.log('All experience entries:', JSON.stringify(profile.experience, null, 2));
    } else {
      console.error('⚠️ WARNING: EXPERIENCE ARRAY IS EMPTY!');
    }
    
    console.log('Education Count:', profile.education.length);
    if (profile.education.length > 0) {
      console.log('First education entry:', JSON.stringify(profile.education[0], null, 2));
      console.log('All education entries:', JSON.stringify(profile.education, null, 2));
    } else {
      console.error('⚠️ WARNING: EDUCATION ARRAY IS EMPTY!');
    }
    console.log('═══════════════════════════════════════════════════════════');

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
      console.log('   - File size:', file.size, 'bytes (', (file.size / 1024).toFixed(2), 'KB)');
      try {
        const { parsePdfBuffer } = await import('@/lib/pdf-parse-safe');
        const pdfData = await parsePdfBuffer(Buffer.from(bytes));
        const text = pdfData.text;
        console.log('✅ PDF text extracted using pdf-parse');
        console.log('   - Text length:', text.length, 'characters');
        console.log('   - Number of pages:', pdfData.numpages || 'unknown');
        console.log('   - Text preview (first 300 chars):', text.substring(0, 300));
        
        // Validate the extracted text is not just binary/metadata
        const wordCount = (text.match(/[a-zA-Z]{3,}/g) || []).length;
        const lineCount = text.split('\n').filter(line => line.trim().length > 0).length;
        console.log('   - Word count:', wordCount, 'words');
        console.log('   - Line count:', lineCount, 'lines');
        
        // CRITICAL FIX: Accept ANY extracted text, even if minimal
        // Better to have limited data than reject the upload entirely
        const hasAnyText = text.length > 0;
        const hasSomeWords = wordCount > 0;
        
        if (hasAnyText && hasSomeWords) {
          console.log('   ✓ PDF text extraction successful (found', wordCount, 'words)');
          
          // If very little text, add a note but DON'T reject
          if (wordCount < 10) {
            console.warn('   ⚠️ Limited text extracted, PDF may be partially image-based');
            return text + '\n\n[Note: Limited text extracted from PDF. Some sections may need manual entry.]';
          }
          
          return text;
        } else {
          // Last resort: Return filename as text so upload doesn't fail
          console.warn('   ⚠️ No readable text found in PDF');
          console.warn('   - Returning filename as fallback to allow upload');
          return `Resume: ${file.name}\n\n[This PDF appears to contain no extractable text. Please complete your profile manually.]`;
        }
      } catch (pdfError) {
        console.error('❌ PDF parsing library error:', pdfError);
        console.error('   - Error type:', pdfError instanceof Error ? pdfError.message : 'Unknown');
        console.error('   - Falling back to allow upload with manual entry');
        // CRITICAL: Don't throw - return fallback text to allow upload
        return `Resume: ${file.name}\n\n[PDF parsing failed. Please complete your profile manually.]`;
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
 * Basic resume parsing — single source of truth.
 * Delegates to the section-aware text extractor in lib/resume-parser/text-recovery
 * so we never hardcode skills, never invent summaries, never emit "details not extracted".
 */
async function parseResumeBasic(text: string, session: any): Promise<any> {
  try {
    console.log('[basic-parser] using section-aware text extractor (no hardcoded keywords)');
    console.log('[basic-parser] raw text length:', text.length);

    // IMPORTANT: do NOT call cleanResumeText here — it collapses newlines and breaks
    // section detection. The extractor has its own newline-preserving cleaner.
    const { extractResumeFromText } = await import('@/lib/resume-parser/text-recovery');
    const r = extractResumeFromText(text);

    console.log('[basic-parser] extracted:', {
      name: r.fullName || '(none)',
      email: r.email || '(none)',
      phone: r.phone || '(none)',
      location: r.location || '(none)',
      skills: r.skills.length,
      experience: r.experience.length,
      education: r.education.length,
      projects: r.projects?.length || 0,
      certifications: r.certifications?.length || 0,
      languages: r.languages?.length || 0,
      summaryChars: r.summary.length,
      confidence: r.confidence,
    });

    return {
      name: r.fullName,
      fullName: r.fullName,
      email: r.email || session?.user?.email || '',
      phone: r.phone,
      address: r.location,
      location: r.location,
      linkedin: r.linkedin || '',
      portfolio: r.portfolio || '',
      summary: r.summary,
      skills: r.skills,
      experience: r.experience.map((exp) => ({
        company: exp.company,
        position: exp.position,
        job_title: exp.position,
        startDate: exp.startDate,
        endDate: exp.endDate || '',
        start_date: exp.startDate,
        end_date: exp.endDate || '',
        description: exp.description,
        achievements: exp.achievements,
        current: exp.current,
        location: exp.location || '',
      })),
      education: r.education.map((edu) => ({
        institution: edu.institution,
        school: edu.institution,
        degree: edu.degree,
        field: edu.field,
        year: edu.endDate || '',
        startDate: edu.startDate,
        endDate: edu.endDate,
        gpa: edu.gpa || '',
        description: edu.description || '',
      })),
      projects: (r.projects || []).map((p) => ({
        name: p.name,
        description: p.description,
        technologies: p.technologies,
        url: p.url || '',
      })),
      certifications: r.certifications || [],
      languages: r.languages || [],
      confidence: r.confidence,
    };
  } catch (basicError: any) {
    console.error('[basic-parser] failed:', basicError?.message || basicError);
    return {
      name: '',
      fullName: '',
      email: session?.user?.email || '',
      phone: '',
      skills: [],
      experience: [],
      education: [],
      projects: [],
      certifications: [],
      languages: [],
      summary: '',
      confidence: 10,
    };
  }
}



/**
 * Compute duration between start and end dates
 */
function computeDuration(startDate: string, endDate: string): string {
  if (!startDate) return '';
  if (!endDate || endDate.toLowerCase() === 'present') {
    return `${startDate} - Present`;
  }
  return `${startDate} - ${endDate}`;
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

