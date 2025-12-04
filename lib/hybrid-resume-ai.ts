/**
 * Hybrid Resume AI Service - Combines OpenAI and Gemini for robust resume parsing
 * Provides redundancy, fallback, and enhanced accuracy
 */

import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';

export interface HybridResumeData {
  personalInformation: {
    fullName: string;
    email: string;
    phone: string;
    location: string;
  };
  professionalInformation: {
    jobTitle: string;
    expectedSalary: string;
  };
  skills: string[];
  education: Array<{
    degree: string;
    institution: string;
    year: string;
  }>;
  experience: Array<{
    role: string;
    company: string;
    duration: string;
    achievements: string[];
  }>;
  certifications: string[];
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
    console.error('🚀 Starting hybrid resume parsing...');

    // Try multiple approaches in parallel for best results
    const promises: Promise<HybridResumeData>[] = [];

    // Add OpenAI parsing if available
    if (this.openai) {
      promises.push(this.parseWithOpenAI(resumeText));
    }

    // Add Gemini parsing if available
    if (this.gemini) {
      promises.push(this.parseWithGemini(resumeText));
    }

    // If no AI providers available, use fallback
    if (promises.length === 0) {
      return this.createFallbackData(resumeText);
    }

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
   * Parse resume using OpenAI
   */
  private async parseWithOpenAI(resumeText: string): Promise<HybridResumeData> {
    if (!this.openai) {
      throw new Error('OpenAI not available');
    }

    console.log('🤖 Parsing with OpenAI...');

    const prompt = `You are an expert resume parser. Extract ALL information from this resume.

CRITICAL: Extract EVERY section thoroughly. Do NOT skip anything.

Return ONLY valid JSON in this EXACT nested format:

{
  "personalInformation": {
    "fullName": "Extract full name from resume",
    "email": "Extract email address",
    "phone": "Extract phone number with country code",
    "location": "Extract location (City, State, Country)"
  },
  "professionalInformation": {
    "jobTitle": "Current job title or most recent position",
    "expectedSalary": "Salary if mentioned"
  },
  "skills": ["Extract EVERY skill mentioned - be thorough"],
  "experience": [
    {
      "role": "Job title/position",
      "company": "Company name",
      "duration": "MMM YYYY - MMM YYYY or Present",
      "achievements": ["Extract ALL responsibilities and achievements as separate items"]
    }
  ],
  "education": [
    {
      "degree": "Degree type and name",
      "institution": "University/College name",
      "year": "Graduation year (YYYY)"
    }
  ],
  "certifications": ["List ALL certifications mentioned"],
  "recommendedJobTitles": ["Suggest job titles based on experience"],
  "atsScore": 85,
  "improvementTips": ["Provide improvement suggestions"]
}

EXTRACTION INSTRUCTIONS:
1. fullName: Extract from top of resume (usually largest text or first line)
2. email: Find email address pattern
3. phone: Find phone number (include country code if present)
4. location: Extract city, state/province, country
5. skills: Extract EVERY skill, technology, tool, framework, soft skill mentioned
6. experience: Extract ALL jobs with company, role, dates, full descriptions
7. education: Extract ALL degrees with institution, degree type, field, year
8. Be thorough - extract everything, not just summaries

Resume Text to Parse:
${resumeText}`;

    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an expert resume parser. Extract ALL information thoroughly. Return ONLY valid JSON in the exact nested format specified. No markdown, no explanations.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.2,
      max_tokens: 4000,
      response_format: { type: "json_object" }
    });

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
      model: 'gemini-1.5-pro',
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.2,
        maxOutputTokens: 4000,
      }
    });

    const prompt = `You are an expert resume parser. Extract ALL information from this resume.

CRITICAL: Extract EVERY section thoroughly. Do NOT skip anything.

Return ONLY valid JSON in this EXACT nested format:

{
  "personalInformation": {
    "fullName": "Extract full name from resume",
    "email": "Extract email address",
    "phone": "Extract phone number with country code",
    "location": "Extract location (City, State, Country)"
  },
  "professionalInformation": {
    "jobTitle": "Current job title or most recent position",
    "expectedSalary": "Salary if mentioned"
  },
  "skills": ["Extract EVERY skill mentioned - be thorough"],
  "experience": [
    {
      "role": "Job title/position",
      "company": "Company name",
      "duration": "MMM YYYY - MMM YYYY or Present",
      "achievements": ["Extract ALL responsibilities and achievements as separate items"]
    }
  ],
  "education": [
    {
      "degree": "Degree type and name",
      "institution": "University/College name",
      "year": "Graduation year (YYYY)"
    }
  ],
  "certifications": ["List ALL certifications mentioned"],
  "recommendedJobTitles": ["Suggest job titles based on experience"],
  "atsScore": 85,
  "improvementTips": ["Provide improvement suggestions"]
}

EXTRACTION INSTRUCTIONS:
1. fullName: Extract from top of resume (usually largest text or first line)
2. email: Find email address pattern
3. phone: Find phone number (include country code if present)
4. location: Extract city, state/province, country
5. skills: Extract EVERY skill, technology, tool, framework, soft skill mentioned
6. experience: Extract ALL jobs with company, role, dates, full descriptions
7. education: Extract ALL degrees with institution, degree type, field, year
8. certifications: Extract ALL certifications, licenses, awards
9. Be thorough - extract everything you can find

Resume Text to Parse:
${resumeText}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const responseText = response.text();
    
    console.log('📥 Gemini response received');
    console.log('   - Response length:', responseText?.length || 0);
    
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
    
    return {
      personalInformation: {
        fullName: personalInfo.fullName || data.name || data.fullName || '',
        email: personalInfo.email || data.email || '',
        phone: personalInfo.phone || data.phone || '',
        location: personalInfo.location || data.location || ''
      },
      professionalInformation: {
        jobTitle: professionalInfo.jobTitle || data.jobTitle || '',
        expectedSalary: professionalInfo.expectedSalary || data.expectedSalary || ''
      },
      skills: Array.isArray(data.skills) ? data.skills.filter((s: any) => typeof s === 'string' && s.trim().length > 0) : [],
      education: Array.isArray(data.education) ? data.education.map((edu: any) => ({
        degree: edu.degree || '',
        institution: edu.institute || edu.institution || '',
        year: edu.end_year || edu.year || edu.endYear || ''
      })) : [],
      experience: Array.isArray(data.experience) ? data.experience.map((exp: any) => ({
        role: exp.role || exp.position || exp.title || '',
        company: exp.company || '',
        duration: exp.duration || (exp.start_date && exp.end_date ? `${exp.start_date} - ${exp.end_date}` : '') || '',
        achievements: Array.isArray(exp.achievements) ? exp.achievements.filter((a: any) => typeof a === 'string' && a.trim().length > 0) : 
                     exp.description ? [exp.description] : []
      })) : [],
      certifications: Array.isArray(data.certifications) ? data.certifications.filter((c: any) => typeof c === 'string' && c.trim().length > 0) : [],
      recommendedJobTitles: Array.isArray(data.recommendedJobTitles) ? data.recommendedJobTitles.filter((t: any) => typeof t === 'string') : [],
      atsScore: typeof data.atsScore === 'number' ? Math.max(0, Math.min(100, data.atsScore)) : 75,
      improvementTips: Array.isArray(data.improvementTips) ? data.improvementTips.filter((t: any) => typeof t === 'string') : []
    };
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
   * Create intelligent fallback data when AI parsing fails
   */
  private createFallbackData(resumeText: string): HybridResumeData {
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
            !cleanLine.includes('http') && !cleanLine.includes('www') &&
            !cleanLine.includes('PDF') && !cleanLine.includes('%')) {
          return cleanLine;
        }
      }
      return '';
    };
    
    const extractSkills = (text: string) => {
      const commonSkills = [
        'JavaScript', 'Python', 'Java', 'React', 'Node.js', 'Angular', 'Vue.js',
        'HTML', 'CSS', 'SQL', 'MongoDB', 'PostgreSQL', 'AWS', 'Docker',
        'Git', 'Linux', 'Agile', 'Scrum', 'Machine Learning', 'Data Analysis',
        'TypeScript', 'Express', 'Next.js', 'GraphQL', 'Redis', 'Kubernetes'
      ];
      
      const foundSkills = commonSkills.filter(skill => 
        text.toLowerCase().includes(skill.toLowerCase())
      );
      
      return foundSkills.length > 0 ? foundSkills : ['JavaScript', 'React', 'Node.js'];
    };
    
    const extractJobTitle = (text: string) => {
      const commonTitles = [
        'Software Engineer', 'Developer', 'Programmer', 'Analyst', 'Manager',
        'Designer', 'Consultant', 'Specialist', 'Lead', 'Senior', 'Junior',
        'Full Stack', 'Frontend', 'Backend', 'DevOps', 'Data Scientist'
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
      certifications: [],
      recommendedJobTitles: [jobTitle, 'Software Engineer', 'Developer'],
      atsScore: 30, // Lower score for fallback data
      improvementTips: [
        'AI parsing was unavailable. Please review and update your information manually.',
        'Add more specific technical skills',
        'Include quantifiable achievements',
        'Optimize keywords for ATS systems'
      ],
      confidence: 30,
      aiProvider: 'fallback',
      processingTime: Date.now() - this.startTime
    };
  }
}
