/**
 * Hybrid Resume AI Service - Combines OpenAI and Gemini for robust resume parsing
 * Provides redundancy, fallback, and enhanced accuracy
 */

import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { buildOpenAISectionClassificationRules } from '@/lib/resume-builder/semantic-registry';
import { isPlausibleProjectName } from '@/lib/resume-parser/import-sanitize';

export interface HybridResumeData {
  personalInformation: {
    fullName: string;
    email: string;
    phone: string;
    location: string;
    linkedin?: string;
    portfolio?: string;
    github?: string;
  };
  professionalInformation: {
    jobTitle: string;
    expectedSalary: string;
  };
  /** Professional summary / objective — extracted from the resume body. */
  summary: string;
  skills: string[];
  education: Array<{
    degree: string;
    institution: string;
    field?: string;
    year: string;
    gpa?: string;
  }>;
  /**
   * Full experience entries. We keep BOTH the human-readable `duration` and
   * the structured `startDate` / `endDate` / `current` so downstream code
   * (route mapping + form transformer) doesn't have to re-parse `duration`.
   */
  experience: Array<{
    role: string;
    company: string;
    location?: string;
    duration: string;
    startDate?: string;
    endDate?: string;
    current?: boolean;
    description?: string;
    achievements: string[];
  }>;
  projects: Array<{
    name: string;
    description?: string;
    technologies?: string[];
    url?: string;
  }>;
  certifications: string[];
  languages: Array<{ name: string; proficiency?: string }>;
  recommendedJobTitles: string[];
  atsScore: number;
  improvementTips: string[];
  confidence: number;
  aiProvider: 'openai' | 'gemini' | 'hybrid' | 'fallback';
  processingTime: number;
}

export class HybridResumeAI {
  private openai: OpenAI | null;
  private gemini: GoogleGenerativeAI | null;
  private startTime: number = 0;

  constructor() {
    // Initialize OpenAI
    const openaiKey = process.env.OPENAI_API_KEY;
    // CRITICAL FIX: Correct validation logic for OpenAI keys
    const isValidOpenAIKey = openaiKey && 
                             !openaiKey.includes('your_') && 
                             openaiKey.startsWith('sk-') && // Must start with sk-
                             openaiKey.length > 20;
    
    if (!openaiKey || !isValidOpenAIKey) {
      console.warn('⚠️ OPENAI_API_KEY not found or invalid. OpenAI features will be disabled.');
      console.warn('   - Key present:', !!openaiKey);
      console.warn('   - Key starts with:', openaiKey?.substring(0, 10) || 'none');
      console.warn('   - Key length:', openaiKey?.length || 0);
      this.openai = null;
    } else {
      try {
        this.openai = new OpenAI({
          apiKey: openaiKey,
        });
        console.log('✅ HybridResumeAI: OpenAI client initialized successfully');
        console.log('   - Using model: gpt-4o-mini');
      } catch (initError) {
        console.error('❌ OpenAI initialization failed:', initError);
        this.openai = null;
      }
    }

    // Initialize Gemini
    const geminiKey = process.env.GEMINI_API_KEY;
    const isValidGeminiKey = geminiKey && 
                            !geminiKey.includes('your_') && 
                            geminiKey.startsWith('AIzaSy') && // Gemini keys start with AIzaSy
                            geminiKey.length > 30;
    
    if (!geminiKey || !isValidGeminiKey) {
      console.warn('⚠️ GEMINI_API_KEY not found or invalid. Gemini features will be disabled.');
      console.warn('   - Key present:', !!geminiKey);
      console.warn('   - Key starts with:', geminiKey?.substring(0, 10) || 'none');
      console.warn('   - Key length:', geminiKey?.length || 0);
      this.gemini = null;
    } else {
      try {
        this.gemini = new GoogleGenerativeAI(geminiKey);
        console.log('✅ HybridResumeAI: Gemini client initialized successfully');
        console.log('   - Using model: gemini-1.5-pro');
      } catch (initError) {
        console.error('❌ Gemini initialization failed:', initError);
        this.gemini = null;
      }
    }

    if (!this.openai && !this.gemini) {
      console.error('⚠️ NO AI PROVIDERS AVAILABLE!');
      console.error('   - Please check your .env file');
      console.error('   - OPENAI_API_KEY:', !!openaiKey);
      console.error('   - GEMINI_API_KEY:', !!geminiKey);
      console.error('   - Only fallback parsing will be used');
    } else {
      console.log('✅ HybridResumeAI ready with:', this.openai ? 'OpenAI' : '', this.gemini ? 'Gemini' : '');
    }
  }

  /**
   * Parse resume text using hybrid AI approach
   */
  async parseResumeText(resumeText: string): Promise<HybridResumeData> {
    this.startTime = Date.now();
    console.log('═══════════════════════════════════════════════════════');
    console.log('🚀 HybridResumeAI: Starting resume parsing...');
    console.log('═══════════════════════════════════════════════════════');
    console.log('📊 Input stats:');
    console.log('  - Text length:', resumeText.length, 'characters');
    console.log('  - Word count:', (resumeText.match(/[a-zA-Z]{3,}/g) || []).length);
    console.log('  - Line count:', resumeText.split('\n').length);
    console.log('');
    console.log('🔑 AI Provider Status:');
    console.log('  - OpenAI initialized:', !!this.openai);
    console.log('  - Gemini initialized:', !!this.gemini);
    console.log('  - OpenAI key present:', !!process.env.OPENAI_API_KEY);
    console.log('  - Gemini key present:', !!process.env.GEMINI_API_KEY);
    
    if (!this.openai && !this.gemini) {
      console.error('');
      console.error('🚨 CRITICAL: NO AI PROVIDERS INITIALIZED!');
      console.error('  Check your environment variables:');
      console.error('  - OPENAI_API_KEY should start with "sk-"');
      console.error('  - GEMINI_API_KEY should start with "AIzaSy"');
      console.error('  - Current OpenAI key starts with:', process.env.OPENAI_API_KEY?.substring(0, 10) || 'MISSING');
      console.error('  - Current Gemini key starts with:', process.env.GEMINI_API_KEY?.substring(0, 10) || 'MISSING');
      console.error('');
    }
    console.log('═══════════════════════════════════════════════════════');

    // Try multiple approaches in parallel for best results
    const promises: Promise<HybridResumeData>[] = [];

    // Add OpenAI parsing if available
    if (this.openai) {
      console.log('✅ Adding OpenAI to processing queue...');
      promises.push(this.parseWithOpenAI(resumeText));
    } else {
      console.warn('⚠️ OpenAI not available - skipping');
    }

    // Add Gemini parsing if available
    if (this.gemini) {
      console.log('✅ Adding Gemini to processing queue...');
      promises.push(this.parseWithGemini(resumeText));
    } else {
      console.warn('⚠️ Gemini not available - skipping');
    }

    // If no AI providers available, use fallback
    if (promises.length === 0) {
      console.error('❌ NO AI PROVIDERS AVAILABLE - Using fallback extraction');
      console.error('   This will result in limited data extraction (no experience/education)');
      return this.createFallbackData(resumeText);
    }
    
    console.log(`📡 Calling ${promises.length} AI provider(s)...`);

    try {
      // Use Promise.allSettled to get results from all providers
      console.log(`📡 Calling ${promises.length} AI provider(s) in parallel...`);
      const results = await Promise.allSettled(promises);
      
      const successfulResults: HybridResumeData[] = [];
      const errors: string[] = [];

      results.forEach((result, index) => {
        const providerName = index === 0 ? 'OpenAI' : 'Gemini';
        if (result.status === 'fulfilled') {
          successfulResults.push(result.value);
          console.log(`✅ ${providerName} completed successfully`);
          console.log(`   - Skills extracted: ${result.value.skills?.length || 0}`);
          console.log(`   - Experience entries: ${result.value.experience?.length || 0}`);
          console.log(`   - Education entries: ${result.value.education?.length || 0}`);
        } else {
          errors.push(result.reason?.message || 'Unknown error');
          console.error(`❌ ${providerName} failed:`, result.reason?.message || result.reason);
          console.error(`   Full error:`, result.reason);
        }
      });

      if (successfulResults.length === 0) {
        console.error('⚠️ ALL AI providers failed. Errors:', errors);
        console.error('⚠️ Using fallback extraction');
        return this.createFallbackData(resumeText);
      }
      
      console.log(`✅ ${successfulResults.length} AI provider(s) succeeded`);

      // If we have multiple successful results, combine them for better accuracy
      if (successfulResults.length > 1) {
        console.log('🔄 Combining results from multiple AI providers...');
        return this.combineResults(successfulResults);
      }

      // Return the single successful result
      const result = successfulResults[0];
      result.processingTime = Date.now() - this.startTime;
      console.log(`✅ Hybrid parsing completed in ${result.processingTime}ms using ${result.aiProvider}`);
      return result;

    } catch (error) {
      console.error('❌ Hybrid parsing failed:', error);
      return this.createFallbackData(resumeText);
    }
  }

  /**
   * Build the canonical prompt sent to BOTH providers. Single source of truth
   * so OpenAI / Gemini receive identical instructions and produce consistent
   * shapes — that's what makes `combineResults` safe.
   *
   * The schema mirrors `HybridResumeData` so `validateAndEnhanceData` is a
   * passthrough for AI-compliant responses.
   */
  private buildResumePrompt(resumeText: string): string {
    return `You are an expert universal resume parser. Extract EVERY piece of information from this resume — across ALL pages, ALL columns, ALL sections.

CRITICAL RULES:
- Do NOT invent, summarize, or guess. If a field is genuinely missing, return an empty string / empty array.
- Do NOT truncate. Long summaries, long bullet lists, multi-page experience — all of it must be returned.
- Preserve the original wording for descriptions; only normalize whitespace.
- Multi-page PDFs / two-column layouts: scan the WHOLE text, not just the first page.

Return ONLY valid JSON in this EXACT shape (no markdown, no commentary):

{
  "personalInformation": {
    "fullName": "Largest name at the top of the resume",
    "email": "",
    "phone": "Include country code if present",
    "location": "City, State, Country",
    "linkedin": "Full URL or empty",
    "portfolio": "Personal site URL or empty",
    "github": "GitHub profile URL or empty"
  },
  "professionalInformation": {
    "jobTitle": "Current / most recent profession (e.g. Full Stack Developer, Makeup Artist, Data Analyst)",
    "expectedSalary": ""
  },
  "summary": "FULL professional summary / objective / profile paragraph — do NOT truncate. Empty string if missing.",
  "skills": ["Every technical AND soft skill mentioned, deduplicated"],
  "experience": [
    {
      "role": "Job title",
      "company": "Company name",
      "location": "Job location or empty",
      "duration": "MMM YYYY - MMM YYYY or 'MMM YYYY - Present'",
      "startDate": "YYYY-MM or YYYY",
      "endDate": "YYYY-MM or YYYY or empty if current",
      "current": false,
      "description": "Multi-line job duties / responsibilities as written, preserving newlines if any",
      "achievements": ["Job duties and responsibilities ONLY — action bullets like Managed, Led, Coordinated, Implemented. Do NOT put measurable awards here unless they are part of this role's bullet list"]
    }
  ],
  "achievements": ["ONLY measurable-impact outcomes: e.g. Increased sales by 30%, Reduced cost by 15%, Managed team of 50, Award winner. Empty array if none exist — do NOT duplicate job duties here"],
  "projects": [
    {
      "name": "Project name",
      "description": "What it does and your contribution",
      "technologies": ["React", "Node.js", "..."],
      "url": ""
    }
  ],
  "education": [
    {
      "degree": "Degree type (e.g. Bachelor of Science)",
      "field": "Field of study (e.g. Computer Science)",
      "institution": "University / College / School name",
      "year": "Graduation year (YYYY)",
      "gpa": "GPA / CGPA or empty"
    }
  ],
  "certifications": ["Full certification names, one string each"],
  "languages": [
    { "name": "English", "proficiency": "Native / Fluent / Professional / Intermediate / Basic" }
  ],
  "recommendedJobTitles": ["3-5 job titles that match this person's profile"],
  "atsScore": 85,
  "improvementTips": ["3-5 actionable tips"]
}

SECTION-DETECTION HINTS (treat as the same section regardless of heading text):
- Summary aliases:     Summary | Profile | About Me | Professional Summary | Career Objective | Objective | Introduction | Bio
- Experience aliases:  Experience | Work History | Employment | Professional Experience | Career History | Professional Journey | Employment Record | Positions Held
- Skills aliases:      Skills | Technical Skills | Expertise | Core Competencies | Technologies | Tools | Proficiencies
- Languages aliases:   Languages | Spoken Languages | Language Proficiency | Languages Known
- Projects aliases:    Projects | Portfolio | Case Studies | Assignments | Key Engagements | Work Samples | Featured Projects | Open Source
- Certifications:      Certifications | Certificates | Licenses | Training | Courses | Professional Development

COVER LETTER RULE: If the document starts with "Dear Hiring Manager", a subject line, or an application letter, IGNORE that page and extract ONLY from the resume/CV section (Experience, Education, Skills, etc.).

SEPARATION RULES:
- "Languages" means spoken/written languages (English, Hindi, Spanish, ASL, ...). NEVER put React, Python, SQL there.
- Split compound language lines: "Hindi & English" → two entries: English and Hindi.
- "Skills" includes programming languages, frameworks, soft skills, domain skills (Makeup Techniques, Airbrushing, Leadership, etc.).
- "Certifications" / "Professional Qualifications" (IATA, PMP, AWS, diploma courses, licenses) — NEVER in education or achievements.
- "Education" is university/college degrees only (Bachelor, Master, MBA, B.Tech, etc.) — NEVER in experience.
- experience[].achievements = job RESPONSIBILITIES (Managed, Handled, Led, Coordinated, Implemented, Supervised, etc.).
- Top-level achievements[] = ONLY measurable outcomes (percentages, revenue, team size, awards). If a bullet has no measurable impact, keep it under experience responsibilities — NOT achievements.
- Professional Highlights / Career Highlights → separate extended section (NOT summary); include as achievements[] only when they are measurable outcomes, otherwise note in summary only if no highlights section exists.
- Professional Qualifications (IATA, PMP, CA, licenses) → certifications[] — NOT education degrees.
- Strengths → skills[] with soft-skill prefix OR leave for downstream extended routing — do NOT mix with technical tools.
${buildOpenAISectionClassificationRules()}
- Preserve employment chronology exactly as written — do not reorder jobs.

Resume Text:
${resumeText}`;
  }

  /**
   * Parse resume using OpenAI
   */
  private async parseWithOpenAI(resumeText: string): Promise<HybridResumeData> {
    if (!this.openai) {
      throw new Error('OpenAI not available');
    }

    console.log('🤖 Parsing with OpenAI...');

    const prompt = this.buildResumePrompt(resumeText);

    console.log('🤖 Calling OpenAI API...');
    console.log('  - Model: gpt-4o-mini');
    console.log('  - Max tokens: 6000');
    console.log('  - Temperature: 0.1');
    console.log('  - Prompt length:', prompt.length, 'characters');
    
    let completion;
    try {
      completion = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an expert resume parser. Extract ALL information thoroughly and completely. Return ONLY valid JSON in the exact nested format specified. No markdown, no explanations. Extract EVERY experience entry and education entry with ALL details.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.1, // Lower temperature for more consistent output
        max_tokens: 6000, // Increased from 4000 to handle longer resumes
        response_format: { type: "json_object" }
      });
      console.log('✅ OpenAI API call successful');
    } catch (apiError) {
      console.error('❌ OpenAI API call FAILED:');
      console.error('  - Error type:', apiError instanceof Error ? apiError.constructor.name : typeof apiError);
      console.error('  - Error message:', apiError instanceof Error ? apiError.message : String(apiError));
      console.error('  - Error code:', (apiError as any)?.code || 'none');
      console.error('  - Error status:', (apiError as any)?.status || 'none');
      console.error('  - Full error:', apiError);
      throw apiError;
    }

    const responseText = completion.choices[0]?.message?.content;
    
    if (!responseText) {
      throw new Error('No response from OpenAI');
    }

    console.log('📥 OpenAI response received, length:', responseText.length);
    console.log('📄 Response preview:', responseText.substring(0, 300));

    // Parse and validate the response
    const parsedData = this.parseAIResponse(responseText);
    
    console.log('✅ OpenAI parsed data:', {
      hasPersonalInfo: !!parsedData.personalInformation,
      skillsCount: parsedData.skills?.length || 0,
      experienceCount: parsedData.experience?.length || 0,
      educationCount: parsedData.education?.length || 0
    });
    
    return {
      ...parsedData,
      confidence: this.calculateConfidence(parsedData),
      aiProvider: 'openai',
      processingTime: Date.now() - this.startTime
    };
  }

  /**
   * Parse resume using Gemini
   */
  private async parseWithGemini(resumeText: string): Promise<HybridResumeData> {
    if (!this.gemini) {
      throw new Error('Gemini not available');
    }

    console.log('🔮 Parsing with Gemini...');

    const model = this.gemini.getGenerativeModel({ 
      model: 'gemini-1.5-flash', // Faster model for better performance
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.1, // Lower for more consistent output
        maxOutputTokens: 8000, // Increased from 4000 to handle longer resumes
      }
    });

    const prompt = this.buildResumePrompt(resumeText);

    console.log('🔮 Calling Gemini API...');
    console.log('  - Model: gemini-1.5-flash');
    console.log('  - Max tokens: 8000');
    console.log('  - Temperature: 0.1');
    console.log('  - Prompt length:', prompt.length, 'characters');
    
    let result, response, responseText;
    try {
      result = await model.generateContent(prompt);
      response = await result.response;
      responseText = response.text();
      console.log('✅ Gemini API call successful');
      console.log('   - Response length:', responseText?.length || 0);
    } catch (apiError) {
      console.error('❌ Gemini API call FAILED:');
      console.error('  - Error type:', apiError instanceof Error ? apiError.constructor.name : typeof apiError);
      console.error('  - Error message:', apiError instanceof Error ? apiError.message : String(apiError));
      console.error('  - Error code:', (apiError as any)?.code || 'none');
      console.error('  - Error status:', (apiError as any)?.status || 'none');
      console.error('  - Full error:', apiError);
      throw apiError;
    }
    
    if (!responseText) {
      throw new Error('No response from Gemini');
    }

    console.log('📄 Response preview (first 400 chars):', responseText.substring(0, 400));

    // Parse and validate the response
    const parsedData = this.parseAIResponse(responseText);
    
    console.log('✅ Gemini parsed data:', {
      hasPersonalInfo: !!parsedData.personalInformation,
      skillsCount: parsedData.skills?.length || 0,
      experienceCount: parsedData.experience?.length || 0,
      educationCount: parsedData.education?.length || 0
    });
    
    return {
      ...parsedData,
      confidence: this.calculateConfidence(parsedData),
      aiProvider: 'gemini',
      processingTime: Date.now() - this.startTime
    };
  }

  /**
   * Combine results from multiple AI providers for better accuracy
   */
  private combineResults(results: HybridResumeData[]): HybridResumeData {
    console.log('🔄 Combining results from multiple AI providers...');

    // Use the result with highest confidence as base
    const baseResult = results.reduce((best, current) => 
      current.confidence > best.confidence ? current : best
    );

    // Enhance with data from other providers
    const combinedResult: HybridResumeData = {
      ...baseResult,
      aiProvider: 'hybrid',
      processingTime: Date.now() - this.startTime
    };

    // Combine skills from all providers
    const allSkills = new Set<string>();
    results.forEach(result => {
      result.skills.forEach(skill => allSkills.add(skill));
    });
    combinedResult.skills = Array.from(allSkills);

    // Combine job titles from all providers
    const allJobTitles = new Set<string>();
    results.forEach(result => {
      result.recommendedJobTitles.forEach(title => allJobTitles.add(title));
    });
    combinedResult.recommendedJobTitles = Array.from(allJobTitles);

    // Use highest ATS score
    combinedResult.atsScore = Math.max(...results.map(r => r.atsScore));

    // Combine improvement tips
    const allTips = new Set<string>();
    results.forEach(result => {
      result.improvementTips.forEach(tip => allTips.add(tip));
    });
    combinedResult.improvementTips = Array.from(allTips);

    // Recalculate confidence based on combined data
    combinedResult.confidence = this.calculateConfidence(combinedResult);

    console.log(`✅ Combined results: ${results.length} providers, confidence: ${combinedResult.confidence}%`);
    return combinedResult;
  }

  /**
   * Parse AI response and handle common formatting issues
   */
  private parseAIResponse(responseText: string): Omit<HybridResumeData, 'confidence' | 'aiProvider' | 'processingTime'> {
    try {
      // Clean the response to ensure it's valid JSON
      const cleanedResponse = responseText.trim()
        .replace(/^```json\s*/, '')
        .replace(/\s*```$/, '')
        .replace(/^```\s*/, '')
        .replace(/\s*```$/, '')
        .replace(/^`\s*/, '')
        .replace(/\s*`$/, '');

      console.log('🧹 Cleaned AI response (first 500 chars):', cleanedResponse.substring(0, 500));
      
      const parsedData = JSON.parse(cleanedResponse);
      
      console.log('📦 Parsed JSON structure:', {
        hasPersonalInfo: !!parsedData.personalInformation,
        hasName: !!(parsedData.name || parsedData.personalInformation?.fullName),
        hasSkills: Array.isArray(parsedData.skills),
        skillsCount: parsedData.skills?.length || 0,
        hasExperience: Array.isArray(parsedData.experience),
        experienceCount: parsedData.experience?.length || 0,
        hasEducation: Array.isArray(parsedData.education),
        educationCount: parsedData.education?.length || 0
      });
      
      // Validate and enhance the parsed data
      return this.validateAndEnhanceData(parsedData);
    } catch (parseError) {
      console.error('❌ JSON parsing failed:', parseError);
      console.log('Raw response that failed to parse (first 800 chars):', responseText.substring(0, 800));
      throw new Error('Failed to parse AI response as JSON');
    }
  }

  /**
   * Validate and enhance the parsed resume data
   */
  private validateAndEnhanceData(data: any): Omit<HybridResumeData, 'confidence' | 'aiProvider' | 'processingTime'> {
    // Handle both nested (new) and flat (old) JSON formats
    const personalInfo = data.personalInformation || {};
    const professionalInfo = data.professionalInformation || {};
    
    // Log what we received for debugging
    console.log('📊 Validating AI data:', {
      hasPersonalInfo: !!data.personalInformation,
      hasName: !!(data.name || personalInfo.fullName),
      hasEmail: !!(data.email || personalInfo.email),
      skillsCount: Array.isArray(data.skills) ? data.skills.length : 0,
      experienceCount: Array.isArray(data.experience) ? data.experience.length : 0,
      educationCount: Array.isArray(data.education) ? data.education.length : 0
    });
    
    const toStringArray = (v: any): string[] =>
      Array.isArray(v) ? v.filter((s: any) => typeof s === 'string' && s.trim().length > 0) : [];

    const toBoolean = (v: any): boolean | undefined => {
      if (typeof v === 'boolean') return v;
      if (typeof v === 'string') return /^(true|yes|y|1)$/i.test(v.trim());
      return undefined;
    };

    // Normalize certifications (AI sometimes returns objects)
    const certifications: string[] = Array.isArray(data.certifications)
      ? data.certifications
          .map((c: any) => {
            if (typeof c === 'string') return c.trim();
            if (c && typeof c === 'object') {
              const name = (c.name || c.title || c.certification || '').toString().trim();
              const issuer = (c.issuer || c.organization || '').toString().trim();
              const date = (c.date || c.year || '').toString().trim();
              return [name, issuer, date].filter(Boolean).join(' — ');
            }
            return '';
          })
          .filter(Boolean)
      : [];

    return {
      personalInformation: {
        fullName: personalInfo.fullName || data.name || data.fullName || '',
        email: personalInfo.email || data.email || '',
        phone: personalInfo.phone || data.phone || '',
        location: personalInfo.location || data.location || '',
        linkedin: personalInfo.linkedin || data.linkedin || '',
        portfolio: personalInfo.portfolio || personalInfo.website || data.portfolio || data.website || '',
        github: personalInfo.github || data.github || '',
      },
      professionalInformation: {
        jobTitle: professionalInfo.jobTitle || data.jobTitle || '',
        expectedSalary: professionalInfo.expectedSalary || data.expectedSalary || '',
      },
      summary: (data.summary || data.profile || data.objective || '').toString().trim(),
      skills: toStringArray(data.skills),
      experience: Array.isArray(data.experience) && data.experience.length > 0
        ? data.experience.map((exp: any) => {
            const startDate = exp.startDate || exp.start_date || '';
            const endDate = exp.endDate || exp.end_date || '';
            const current = toBoolean(exp.current) ?? /present|current|now|ongoing/i.test(`${endDate} ${exp.duration || ''}`);
            return {
              role: exp.role || exp.position || exp.title || '',
              company: exp.company || exp.organization || exp.employer || '',
              location: exp.location || '',
              duration: exp.duration || this.formatDuration(startDate, endDate) || '',
              startDate,
              endDate: current ? '' : endDate,
              current,
              description: (exp.description || exp.summary || '').toString(),
              achievements: Array.isArray(exp.achievements)
                ? exp.achievements.filter((a: any) => typeof a === 'string' && a.trim().length > 0)
                : exp.description
                  ? [exp.description]
                  : [],
            };
          })
        : [],
      projects: Array.isArray(data.projects) && data.projects.length > 0
        ? data.projects
            .map((p: any) => {
              const description = (p.description || p.summary || '').toString().trim();
              const technologies = Array.isArray(p.technologies)
                ? p.technologies.filter((t: any) => typeof t === 'string' && t.trim().length > 0)
                : typeof p.technologies === 'string'
                  ? p.technologies.split(/[,;|]/).map((t: string) => t.trim()).filter(Boolean)
                  : [];
              let name = (
                p.name ||
                p.title ||
                p.projectName ||
                p.project_title ||
                p.ProjectName ||
                p.ProjectTitle ||
                ''
              )
                .toString()
                .trim();
              // Do not fabricate "Software Project" / "Project N" — drop until a real title exists.
              if (!name || !isPlausibleProjectName(name)) {
                return { name: '', description, technologies, url: (p.url || p.link || '').toString().trim() };
              }
              return {
                name,
                description,
                technologies,
                url: (p.url || p.link || '').toString().trim(),
              };
            })
            .filter((p: any) => p.name)
        : [],
      education: Array.isArray(data.education) && data.education.length > 0
        ? data.education.map((edu: any) => ({
            degree: edu.degree || edu.qualification || '',
            institution: edu.institution || edu.institute || edu.school || edu.university || '',
            year: edu.year || edu.graduationYear || edu.endDate || edu.end_year || edu.endYear || '',
            field: edu.field || edu.major || '',
            gpa: edu.gpa || edu.cgpa || '',
          }))
        : [],
      certifications,
      languages: Array.isArray(data.languages)
        ? data.languages.map((l: any) => {
            if (typeof l === 'string') return { name: l.trim(), proficiency: '' };
            if (l && typeof l === 'object') {
              return {
                name: (l.name || l.language || '').toString().trim(),
                proficiency: (l.proficiency || l.level || l.fluency || '').toString().trim(),
              };
            }
            return { name: '', proficiency: '' };
          }).filter((l: any) => l.name)
        : [],
      recommendedJobTitles: toStringArray(data.recommendedJobTitles),
      atsScore: typeof data.atsScore === 'number' ? Math.max(0, Math.min(100, data.atsScore)) : 75,
      improvementTips: toStringArray(data.improvementTips),
    };
  }

  /**
   * Format duration from start and end dates
   */
  private formatDuration(startDate: string | undefined, endDate: string | undefined): string {
    if (!startDate) return '';
    if (!endDate || endDate.toLowerCase() === 'present' || endDate.toLowerCase() === 'current') {
      return `${startDate} - Present`;
    }
    return `${startDate} - ${endDate}`;
  }

  /**
   * Calculate confidence score based on data completeness
   */
  private calculateConfidence(data: Omit<HybridResumeData, 'confidence' | 'aiProvider' | 'processingTime'>): number {
    let score = 0;
    let totalChecks = 0;

    // Personal information (40% weight)
    if (data.personalInformation.fullName) { score += 10; }
    if (data.personalInformation.email) { score += 10; }
    if (data.personalInformation.phone) { score += 10; }
    if (data.personalInformation.location) { score += 10; }
    totalChecks += 40;

    // Professional information (20% weight)
    if (data.professionalInformation.jobTitle) { score += 10; }
    if (data.professionalInformation.expectedSalary) { score += 10; }
    totalChecks += 20;

    // Skills (20% weight)
    if (data.skills.length > 0) { score += 20; }
    totalChecks += 20;

    // Experience (20% weight)
    if (data.experience.length > 0) { score += 20; }
    totalChecks += 20;

    return Math.round((score / totalChecks) * 100);
  }

  /**
   * Fallback when AI parsing is unavailable. Delegates to the section-aware
   * text extractor so we emit REAL data from the resume — never hardcoded
   * skill lists, never fake "Experience details not extracted" placeholders.
   * If the extractor finds nothing, arrays stay empty (truth > fake data).
   */
  private createFallbackData(resumeText: string): HybridResumeData {
    console.log('🔄 Fallback: delegating to text-based resume extractor (no hardcoded data)');

    // Lazy require to avoid bundling concerns in tests
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { extractResumeFromText } = require('@/lib/resume-parser/text-recovery') as {
      extractResumeFromText: (text: string) => import('./enhanced-resume-ai').ExtractedResumeData;
    };

    const r = extractResumeFromText(resumeText || '');

    return {
      personalInformation: {
        fullName: r.fullName || '',
        email: r.email || '',
        phone: r.phone || '',
        location: r.location || '',
        linkedin: r.linkedin || '',
        portfolio: r.portfolio || '',
        github: '',
      },
      professionalInformation: {
        jobTitle: '',
        expectedSalary: '',
      },
      summary: r.summary || '',
      skills: r.skills || [],
      education: (r.education || []).map((edu) => ({
        degree: edu.degree || '',
        institution: edu.institution || '',
        field: edu.field || '',
        year: edu.endDate || '',
        gpa: edu.gpa || '',
      })),
      experience: (r.experience || []).map((exp) => ({
        role: exp.position || '',
        company: exp.company || '',
        location: exp.location || '',
        duration:
          exp.startDate && (exp.endDate || exp.current)
            ? `${exp.startDate} - ${exp.current ? 'Present' : exp.endDate}`
            : exp.startDate || '',
        startDate: exp.startDate || '',
        endDate: exp.current ? '' : (exp.endDate || ''),
        current: !!exp.current,
        description: exp.description || '',
        achievements: Array.isArray(exp.achievements) ? exp.achievements : [],
      })),
      projects: (r.projects || []).map((p) => ({
        name: p.name || '',
        description: p.description || '',
        technologies: Array.isArray(p.technologies) ? p.technologies : [],
        url: p.url || '',
      })),
      certifications: (r.certifications || []).map((c) => c.name).filter(Boolean),
      languages: (r.languages || []).map((l) =>
        typeof l === 'string'
          ? { name: l, proficiency: '' }
          : { name: l?.name || '', proficiency: l?.proficiency || '' }
      ).filter((l) => l.name),
      recommendedJobTitles: [],
      atsScore: Math.max(30, r.confidence || 0),
      improvementTips: [
        'AI parsing was unavailable; sections were extracted directly from the document.',
        'Review every section and fill gaps where needed.',
      ],
      confidence: r.confidence || 30,
      aiProvider: 'fallback',
      processingTime: Date.now() - this.startTime,
    };
  }
}
