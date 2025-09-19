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
    if (!openaiKey) {
      console.warn('⚠️ OPENAI_API_KEY not found. OpenAI features will be disabled.');
      this.openai = null;
    } else {
      this.openai = new OpenAI({
        apiKey: openaiKey,
      });
      console.log('✅ OpenAI client initialized');
    }

    // Initialize Gemini
    const geminiKey = process.env.GEMINI_API_KEY;
    if (!geminiKey) {
      console.warn('⚠️ GEMINI_API_KEY not found. Gemini features will be disabled.');
      this.gemini = null;
    } else {
      this.gemini = new GoogleGenerativeAI(geminiKey);
      console.log('✅ Gemini client initialized');
    }

    if (!this.openai && !this.gemini) {
      console.warn('⚠️ No AI providers available. Only fallback parsing will be used.');
    }
  }

  /**
   * Parse resume text using hybrid AI approach
   */
  async parseResumeText(resumeText: string): Promise<HybridResumeData> {
    this.startTime = Date.now();
    console.log('🚀 Starting hybrid resume parsing...');

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
      const results = await Promise.allSettled(promises);
      
      const successfulResults: HybridResumeData[] = [];
      const errors: string[] = [];

      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          successfulResults.push(result.value);
          console.log(`✅ AI provider ${index + 1} completed successfully`);
        } else {
          errors.push(result.reason?.message || 'Unknown error');
          console.error(`❌ AI provider ${index + 1} failed:`, result.reason);
        }
      });

      if (successfulResults.length === 0) {
        console.log('⚠️ All AI providers failed, using fallback');
        return this.createFallbackData(resumeText);
      }

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

    const prompt = `You are an intelligent assistant that extracts all relevant information from a resume to automatically autofill a web form.

Instructions:

1. Extract all data from the resume text and map it exactly to these form fields:

{
  "name": "",            // Full Name
  "email": "",           // Email Address
  "phone": "",           // Phone Number
  "linkedin": "",        // LinkedIn Profile URL
  "github": "",          // GitHub Profile URL
  "skills": [],          // List of skills (programming languages, tools, frameworks)
  "experience": [        // Work experience
    {
      "company": "",
      "role": "",
      "start_date": "",  // Format YYYY-MM
      "end_date": "",    // Format YYYY-MM
      "description": ""
    }
  ],
  "education": [         // Education details
    {
      "degree": "",
      "institute": "",
      "start_year": "",   // Format YYYY
      "end_year": ""      // Format YYYY
    }
  ],
  "certifications": [],   // List of certifications
  "projects": [           // List of projects
    {
      "title": "",
      "description": "",
      "technologies": []  // Technologies used in project
    }
  ]
}

2. Output must be **strict JSON only**. Do NOT add any explanation or extra text.  
3. If any field is missing in the resume, return an empty string "" or empty array [].  
4. Skills must be separated as individual items in an array, e.g., ["Python", "React", "Node.js"].  
5. Dates in experience should be in YYYY-MM format; education years in YYYY.  
6. Preserve all information accurately; if multiple experiences, projects, or degrees exist, include all as array items.  

Resume Text:
${resumeText}`;

    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an expert resume parser. Return only valid JSON matching the exact schema provided. Do not include any explanations or extra text.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.1,
      max_tokens: 3000,
    });

    const responseText = completion.choices[0]?.message?.content;
    
    if (!responseText) {
      throw new Error('No response from OpenAI');
    }

    // Parse and validate the response
    const parsedData = this.parseAIResponse(responseText);
    
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

    const model = this.gemini.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `You are an intelligent assistant that extracts all relevant information from a resume to automatically autofill a web form.

Instructions:

1. Extract all data from the resume text and map it exactly to these form fields:

{
  "name": "",            // Full Name
  "email": "",           // Email Address
  "phone": "",           // Phone Number
  "linkedin": "",        // LinkedIn Profile URL
  "github": "",          // GitHub Profile URL
  "skills": [],          // List of skills (programming languages, tools, frameworks)
  "experience": [        // Work experience
    {
      "company": "",
      "role": "",
      "start_date": "",  // Format YYYY-MM
      "end_date": "",    // Format YYYY-MM
      "description": ""
    }
  ],
  "education": [         // Education details
    {
      "degree": "",
      "institute": "",
      "start_year": "",   // Format YYYY
      "end_year": ""      // Format YYYY
    }
  ],
  "certifications": [],   // List of certifications
  "projects": [           // List of projects
    {
      "title": "",
      "description": "",
      "technologies": []  // Technologies used in project
    }
  ]
}

2. Output must be **strict JSON only**. Do NOT add any explanation or extra text.  
3. If any field is missing in the resume, return an empty string "" or empty array [].  
4. Skills must be separated as individual items in an array, e.g., ["Python", "React", "Node.js"].  
5. Dates in experience should be in YYYY-MM format; education years in YYYY.  
6. Preserve all information accurately; if multiple experiences, projects, or degrees exist, include all as array items.  

Resume Text:
${resumeText}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const responseText = response.text();
    
    if (!responseText) {
      throw new Error('No response from Gemini');
    }

    // Parse and validate the response
    const parsedData = this.parseAIResponse(responseText);
    
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

      const parsedData = JSON.parse(cleanedResponse);
      
      // Validate and enhance the parsed data
      return this.validateAndEnhanceData(parsedData);
    } catch (parseError) {
      console.error('❌ JSON parsing failed:', parseError);
      console.log('Raw response that failed to parse:', responseText.substring(0, 500));
      throw new Error('Failed to parse AI response as JSON');
    }
  }

  /**
   * Validate and enhance the parsed resume data
   */
  private validateAndEnhanceData(data: any): Omit<HybridResumeData, 'confidence' | 'aiProvider' | 'processingTime'> {
    // Handle new JSON format from the updated prompt
    const personalInfo = data.personalInformation || {};
    const professionalInfo = data.professionalInformation || {};
    
    return {
      personalInformation: {
        fullName: data.name || personalInfo.fullName || '',
        email: data.email || personalInfo.email || '',
        phone: data.phone || personalInfo.phone || '',
        location: personalInfo.location || ''
      },
      professionalInformation: {
        jobTitle: professionalInfo.jobTitle || '',
        expectedSalary: professionalInfo.expectedSalary || ''
      },
      skills: Array.isArray(data.skills) ? data.skills.filter((s: any) => typeof s === 'string') : [],
      education: Array.isArray(data.education) ? data.education.map((edu: any) => ({
        degree: edu.degree || '',
        institution: edu.institute || edu.institution || '',
        year: edu.end_year || edu.year || ''
      })) : [],
      experience: Array.isArray(data.experience) ? data.experience.map((exp: any) => ({
        role: exp.role || '',
        company: exp.company || '',
        duration: exp.start_date && exp.end_date ? `${exp.start_date} - ${exp.end_date}` : exp.duration || '',
        achievements: Array.isArray(exp.achievements) ? exp.achievements.filter((a: any) => typeof a === 'string') : 
                     exp.description ? [exp.description] : []
      })) : [],
      certifications: Array.isArray(data.certifications) ? data.certifications.filter((c: any) => typeof c === 'string') : [],
      recommendedJobTitles: Array.isArray(data.recommendedJobTitles) ? data.recommendedJobTitles.filter((t: any) => typeof t === 'string') : [],
      atsScore: typeof data.atsScore === 'number' ? Math.max(0, Math.min(100, data.atsScore)) : 50,
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
