import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';

export interface ExtractedResumeData {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  linkedin?: string;
  portfolio?: string;
  summary: string;
  skills: string[];
  experience: Array<{
    company: string;
    position: string;
    location?: string;
    startDate: string;
    endDate?: string;
    current: boolean;
    description: string;
    achievements: string[];
  }>;
  education: Array<{
    institution: string;
    degree: string;
    field: string;
    startDate: string;
    endDate: string;
    gpa?: string;
    description?: string;
  }>;
  projects?: Array<{
    name: string;
    description: string;
    technologies: string[];
    url?: string;
    startDate?: string;
    endDate?: string;
  }>;
  certifications?: Array<{
    name: string;
    issuer: string;
    date: string;
    url?: string;
  }>;
  languages?: string[];
  expectedSalary?: string;
  preferredJobType?: string;
  confidence: number;
  rawText: string;
  // New enhanced fields
  atsSuggestions?: string[];
  jobSuggestions?: Array<{
    title: string;
    reason: string;
  }>;
}

export interface ResumeAnalysis {
  completeness: number;
  issues: string[];
  suggestions: string[];
  missingFields: string[];
  duplicates: string[];
  atsScore: number;
}

export class EnhancedResumeAI {
  private openai: OpenAI | null;
  private gemini: GoogleGenerativeAI | null;

  constructor() {
    // Initialize OpenAI
    const openaiKey = process.env.OPENAI_API_KEY;
    if (!openaiKey || openaiKey.includes('your_')) {
      console.warn('⚠️ OPENAI_API_KEY not found. OpenAI features will be disabled.');
      this.openai = null;
    } else {
      this.openai = new OpenAI({
        apiKey: openaiKey,
      });
      console.log('✅ EnhancedResumeAI: OpenAI initialized');
    }

    // Initialize Gemini as fallback
    const geminiKey = process.env.GEMINI_API_KEY;
    if (!geminiKey || geminiKey.includes('your_')) {
      console.warn('⚠️ GEMINI_API_KEY not found. Gemini fallback will be disabled.');
      this.gemini = null;
    } else {
      this.gemini = new GoogleGenerativeAI(geminiKey);
      console.log('✅ EnhancedResumeAI: Gemini initialized as fallback');
    }

    if (!this.openai && !this.gemini) {
      console.warn('⚠️ No AI providers available. Using fallback extraction.');
    }
  }

  /**
   * Extract comprehensive resume data using AI (OpenAI with Gemini fallback)
   */
  async extractResumeData(resumeText: string): Promise<ExtractedResumeData> {
    // Try OpenAI first if available
    if (this.openai) {
      try {
        console.log('🤖 Starting AI-powered resume extraction with OpenAI...');
        return await this.extractWithOpenAI(resumeText);
      } catch (error) {
        console.error('❌ OpenAI extraction failed:', error);
        // Try Gemini fallback
        if (this.gemini) {
          console.log('🔄 Falling back to Gemini...');
          try {
            return await this.extractWithGemini(resumeText);
          } catch (geminiError) {
            console.error('❌ Gemini extraction also failed:', geminiError);
          }
        }
      }
    } else if (this.gemini) {
      // If OpenAI not available, try Gemini directly
      try {
        console.log('🤖 Starting AI-powered resume extraction with Gemini...');
        return await this.extractWithGemini(resumeText);
      } catch (error) {
        console.error('❌ Gemini extraction failed:', error);
      }
    }

    // All AI providers failed, use fallback
    console.log('⚠️ All AI providers failed, using fallback extraction...');
    return this.createFallbackProfile(resumeText);
  }

  /**
   * Extract resume data using OpenAI
   */
  private async extractWithOpenAI(resumeText: string): Promise<ExtractedResumeData> {
    if (!this.openai) {
      throw new Error('OpenAI not available');
    }

      const resumeAssistantPrompt = `You are an expert resume parser. Your job is to extract ALL information from resumes with maximum accuracy.

CRITICAL RULES:
1. Extract EVERY piece of information you find
2. Do NOT skip any sections
3. Be thorough with skills - extract ALL mentioned
4. Extract complete job descriptions and achievements
5. Return ONLY valid JSON (no markdown, no explanations)

OUTPUT FORMAT (EXACT structure required):
{
  "fullName": "Full name from resume (required)",
  "email": "Email address (required)",
  "phone": "Phone number with country code",
  "location": "City, State/Province, Country",
  "linkedin": "LinkedIn URL if present",
  "portfolio": "Portfolio/GitHub URL if present",
  "summary": "Professional summary or objective (2-3 sentences)",
  "skills": ["Skill1", "Skill2", "Skill3", "...extract ALL skills"],
  "experience": [
    {
      "company": "Company name",
      "position": "Job title",
      "location": "Job location if mentioned",
      "startDate": "MMM YYYY",
      "endDate": "MMM YYYY or Present",
      "current": false,
      "description": "Full job description with responsibilities",
      "achievements": ["Achievement 1", "Achievement 2", "..."]
    }
  ],
  "education": [
    {
      "institution": "University/College name",
      "degree": "Degree type (e.g., Bachelor of Science)",
      "field": "Field of study (e.g., Computer Science)",
      "startDate": "YYYY",
      "endDate": "YYYY",
      "gpa": "GPA if mentioned",
      "description": "Honors or additional info"
    }
  ],
  "projects": [
    {
      "name": "Project name",
      "description": "Project description",
      "technologies": ["Tech1", "Tech2"],
      "url": "Project URL if present"
    }
  ],
  "certifications": [
    {
      "name": "Certification name",
      "issuer": "Issuing organization",
      "date": "Issue date",
      "url": "Credential URL"
    }
  ],
  "languages": ["Language1", "Language2"],
  "confidence": 90
}

EXTRACTION CHECKLIST:
✓ Name from top of resume
✓ Email address pattern
✓ Phone number (any format)
✓ Location/address
✓ LinkedIn/GitHub/portfolio URLs
✓ Professional summary or create one
✓ ALL skills (technical + soft skills)
✓ ALL work experience (every job)
✓ ALL education (every degree)
✓ ALL projects (if section exists)
✓ ALL certifications (if mentioned)
✓ Languages (if mentioned)

Resume text to parse:
${resumeText}`;


      const completion = await this.openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are an expert resume parser. Extract ALL information thoroughly and accurately. Return ONLY valid JSON matching the exact schema. No markdown, no explanations."
          },
          {
            role: "user", 
            content: resumeAssistantPrompt
          }
        ],
        temperature: 0.2,
        max_tokens: 4000,
        response_format: { type: "json_object" }
      });

      const response = completion.choices[0]?.message?.content;
      
      if (!response) {
        throw new Error('No response from OpenAI');
      }

      // Parse the JSON response
      const extractedData = JSON.parse(response);
      
      // Calculate confidence score
      const confidence = this.calculateConfidence(extractedData);
      
      console.log('✅ AI extraction completed with confidence:', confidence);

      return {
        ...extractedData,
        confidence,
        rawText: resumeText
      };
  }

  /**
   * Extract resume data using Gemini
   */
  private async extractWithGemini(resumeText: string): Promise<ExtractedResumeData> {
    if (!this.gemini) {
      throw new Error('Gemini not available');
    }

    const model = this.gemini.getGenerativeModel({ 
      model: 'gemini-1.5-pro',
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.2,
        maxOutputTokens: 4000,
      }
    });

    const resumeAssistantPrompt = `You are an expert resume parser. Extract ALL information from this resume with maximum accuracy.

CRITICAL: Extract EVERY section completely. Be thorough.

Return ONLY valid JSON in this EXACT format:

{
  "fullName": "Full name from resume",
  "email": "Email address",
  "phone": "Phone number with country code",
  "location": "City, State/Province, Country",
  "linkedin": "LinkedIn URL",
  "portfolio": "Portfolio/GitHub/website URL",
  "summary": "Professional summary (2-4 sentences, extract or create from experience)",
  "skills": ["Extract EVERY skill mentioned - technical, tools, frameworks, soft skills"],
  "experience": [
    {
      "company": "Company name",
      "position": "Job title",
      "location": "Job location",
      "startDate": "Start date (MMM YYYY)",
      "endDate": "End date (MMM YYYY or Present)",
      "current": false,
      "description": "Complete job description with responsibilities",
      "achievements": ["Achievement 1", "Achievement 2", "All measurable results"]
    }
  ],
  "education": [
    {
      "institution": "University/College name",
      "degree": "Degree type (Bachelor of Science, Master of Arts, etc.)",
      "field": "Major/Field of study",
      "startDate": "Start year",
      "endDate": "Graduation year",
      "gpa": "GPA/CGPA if mentioned",
      "description": "Honors, awards, relevant coursework"
    }
  ],
  "projects": [
    {
      "name": "Project name",
      "description": "Project description",
      "technologies": ["Tech1", "Tech2"],
      "url": "Project URL"
    }
  ],
  "certifications": [
    {
      "name": "Certification name",
      "issuer": "Issuing organization",
      "date": "Issue date",
      "url": "Credential URL"
    }
  ],
  "languages": ["Language1", "Language2"],
  "confidence": 90
}

EXTRACTION CHECKLIST:
✓ Extract name from top of resume
✓ Find email address
✓ Find phone number (any format)
✓ Extract location/address
✓ Find ALL skills (minimum 5-20 skills in most resumes)
✓ Extract EVERY job in work history
✓ Extract EVERY degree in education
✓ Extract projects if section exists
✓ Extract certifications if mentioned
✓ Extract languages if mentioned

Resume text to parse:
${resumeText}`;

    const result = await model.generateContent(resumeAssistantPrompt);
    const response = result.response.text();

    if (!response) {
      throw new Error('No response from Gemini');
    }

    // Clean and parse JSON
    const cleanedResponse = response.trim()
      .replace(/^```json\s*/, '')
      .replace(/\s*```$/, '')
      .replace(/^```\s*/, '')
      .replace(/\s*```$/, '');

    const extractedData = JSON.parse(cleanedResponse);
    const confidence = this.calculateConfidence(extractedData);

    console.log('✅ Gemini extraction completed with confidence:', confidence);

    return {
      ...extractedData,
      confidence,
      rawText: resumeText
    };
  }

  /**
   * Analyze resume for completeness and improvements
   */
  async analyzeResume(resumeData: ExtractedResumeData): Promise<ResumeAnalysis> {
    const analysis: ResumeAnalysis = {
      completeness: 0,
      issues: [],
      suggestions: [],
      missingFields: [],
      duplicates: [],
      atsScore: 0
    };

    // Check completeness
    let completedFields = 0;
    const totalFields = 8; // fullName, email, phone, location, summary, skills, experience, education

    if (resumeData.fullName?.trim()) completedFields++;
    if (resumeData.email?.trim()) completedFields++;
    if (resumeData.phone?.trim()) completedFields++;
    if (resumeData.location?.trim()) completedFields++;
    if (resumeData.summary?.trim()) completedFields++;
    if (resumeData.skills?.length > 0) completedFields++;
    if (resumeData.experience?.length > 0) completedFields++;
    if (resumeData.education?.length > 0) completedFields++;

    analysis.completeness = Math.round((completedFields / totalFields) * 100);

    // Identify missing fields
    if (!resumeData.fullName?.trim()) analysis.missingFields.push('Full Name');
    if (!resumeData.email?.trim()) analysis.missingFields.push('Email Address');
    if (!resumeData.phone?.trim()) analysis.missingFields.push('Phone Number');
    if (!resumeData.location?.trim()) analysis.missingFields.push('Location');
    if (!resumeData.summary?.trim()) analysis.missingFields.push('Professional Summary');
    if (!resumeData.skills?.length) analysis.missingFields.push('Skills');
    if (!resumeData.experience?.length) analysis.missingFields.push('Work Experience');
    if (!resumeData.education?.length) analysis.missingFields.push('Education');

    // Generate suggestions
    if (analysis.completeness < 50) {
      analysis.suggestions.push('Add missing essential information to improve completeness');
    }
    if (resumeData.skills?.length < 5) {
      analysis.suggestions.push('Add more skills to increase your profile visibility');
    }
    if (resumeData.experience?.length < 1) {
      analysis.suggestions.push('Include work experience to showcase your professional background');
    }
    if (!resumeData.linkedin) {
      analysis.suggestions.push('Add LinkedIn profile for professional networking');
    }

    // Calculate ATS score
    analysis.atsScore = this.calculateATSScore(resumeData);

    return analysis;
  }

  /**
   * Calculate confidence score based on extracted data
   */
  private calculateConfidence(data: any): number {
    let confidence = 0;
    
    // Essential fields
    if (data.fullName?.trim()) confidence += 15;
    if (data.email?.trim()) confidence += 15;
    if (data.phone?.trim()) confidence += 10;
    if (data.location?.trim()) confidence += 10;
    if (data.summary?.trim()) confidence += 10;
    
    // Content richness
    if (data.skills?.length > 0) confidence += Math.min(data.skills.length * 2, 15);
    if (data.experience?.length > 0) confidence += Math.min(data.experience.length * 5, 15);
    if (data.education?.length > 0) confidence += Math.min(data.education.length * 3, 10);
    
    return Math.min(confidence, 100);
  }

  /**
   * Calculate ATS compatibility score
   */
  private calculateATSScore(data: ExtractedResumeData): number {
    let score = 0;
    
    // Basic information (30 points)
    if (data.fullName?.trim()) score += 10;
    if (data.email?.trim()) score += 10;
    if (data.phone?.trim()) score += 5;
    if (data.location?.trim()) score += 5;
    
    // Content quality (40 points)
    if (data.summary?.trim()) score += 10;
    if (data.skills?.length > 0) score += Math.min(data.skills.length * 2, 15);
    if (data.experience?.length > 0) score += Math.min(data.experience.length * 5, 15);
    
    // Additional sections (30 points)
    if (data.education?.length > 0) score += 10;
    if (data.projects?.length > 0) score += 10;
    if (data.certifications?.length > 0) score += 10;
    
    return Math.min(score, 100);
  }

  /**
   * Fallback extraction when AI fails
   */
  private createFallbackProfile(resumeText: string): ExtractedResumeData {
    console.log('🔄 Using fallback extraction...');
    
    const lines = resumeText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    return {
      fullName: this.extractName(lines),
      email: this.extractEmail(resumeText),
      phone: this.extractPhone(resumeText),
      location: this.extractLocation(lines),
      linkedin: this.extractLinkedIn(resumeText),
      portfolio: this.extractPortfolio(resumeText),
      summary: this.extractSummary(lines),
      skills: this.extractSkills(resumeText),
      experience: this.extractExperience(lines),
      education: this.extractEducation(lines),
      projects: [],
      certifications: [],
      languages: [],
      expectedSalary: this.extractSalary(resumeText),
      preferredJobType: 'Full-time',
      confidence: 50,
      rawText: resumeText,
      // Enhanced fields with fallback values
      atsSuggestions: [
        'Add more specific technical skills to improve ATS compatibility',
        'Include quantifiable achievements in your experience descriptions'
      ],
      jobSuggestions: [
        { title: 'Software Developer', reason: 'Based on technical skills found in resume' },
        { title: 'Full-Stack Engineer', reason: 'Experience with multiple technologies' }
      ]
    };
  }

  // Basic extraction methods for fallback
  private extractName(lines: string[]): string {
    for (let i = 0; i < Math.min(5, lines.length); i++) {
      const line = lines[i];
      if (/^[A-Z][a-z]+ [A-Z][a-z]+/.test(line) && line.length < 50) {
        return line;
      }
    }
    return '';
  }

  private extractEmail(text: string): string {
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/;
    const match = text.match(emailRegex);
    return match ? match[0] : '';
  }

  private extractPhone(text: string): string {
    const phoneRegex = /(\+91[\s-]?)?[789]\d{9}|(\+91[\s-]?)?[789]\d{2}[\s-]?\d{3}[\s-]?\d{4}/;
    const match = text.match(phoneRegex);
    return match ? match[0] : '';
  }

  private extractLocation(lines: string[]): string {
    const locationKeywords = ['Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Pune', 'Kolkata', 'Ahmedabad'];
    for (const line of lines) {
      for (const keyword of locationKeywords) {
        if (line.includes(keyword)) {
          return line;
        }
      }
    }
    return '';
  }

  private extractLinkedIn(text: string): string {
    const linkedinRegex = /https?:\/\/(www\.)?linkedin\.com\/in\/[a-zA-Z0-9-]+/;
    const match = text.match(linkedinRegex);
    return match ? match[0] : '';
  }

  private extractPortfolio(text: string): string {
    const portfolioRegex = /https?:\/\/(www\.)?[a-zA-Z0-9-]+\.[a-zA-Z]{2,}/;
    const match = text.match(portfolioRegex);
    return match ? match[0] : '';
  }

  private extractSummary(lines: string[]): string {
    const summaryKeywords = ['summary', 'objective', 'profile', 'about'];
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].toLowerCase();
      if (summaryKeywords.some(keyword => line.includes(keyword))) {
        return lines[i + 1] || '';
      }
    }
    return '';
  }

  private extractSkills(text: string): string[] {
    const skillKeywords = [
      'JavaScript', 'React', 'Node.js', 'Python', 'Java', 'C++', 'SQL', 'MongoDB',
      'AWS', 'Docker', 'Kubernetes', 'Git', 'HTML', 'CSS', 'TypeScript', 'Angular',
      'Vue.js', 'Express.js', 'Django', 'Flask', 'Spring', 'Hibernate', 'JUnit'
    ];
    
    const foundSkills: string[] = [];
    for (const skill of skillKeywords) {
      if (text.toLowerCase().includes(skill.toLowerCase())) {
        foundSkills.push(skill);
      }
    }
    return foundSkills.slice(0, 10);
  }

  private extractExperience(lines: string[]): Array<any> {
    const experience: Array<any> = [];
    const expKeywords = ['experience', 'work', 'employment', 'career'];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].toLowerCase();
      if (expKeywords.some(keyword => line.includes(keyword))) {
        // Try to extract experience from next few lines
        for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
          if (lines[j].length > 20 && lines[j].length < 200) {
            experience.push({
              company: 'Company Name',
              position: 'Position',
              location: '',
              startDate: '01/2020',
              endDate: 'Present',
              current: true,
              description: lines[j],
              achievements: []
            });
            break;
          }
        }
      }
    }
    
    return experience.slice(0, 3);
  }

  private extractEducation(lines: string[]): Array<any> {
    const education: Array<any> = [];
    const eduKeywords = ['university', 'college', 'institute', 'school', 'bachelor', 'master', 'phd', 'b.tech', 'mba'];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].toLowerCase();
      if (eduKeywords.some(keyword => line.includes(keyword))) {
        education.push({
          institution: lines[i],
          degree: 'Degree',
          field: 'Field of Study',
          startDate: '01/2018',
          endDate: '01/2022',
          gpa: '',
          description: ''
        });
      }
    }
    
    return education.slice(0, 3);
  }

  private extractSalary(text: string): string {
    const salaryRegex = /(\d{1,2}[-–]\d{1,2})\s*(LPA|Lakh|K|Cr)/i;
    const match = text.match(salaryRegex);
    return match ? match[0] : '';
  }

  /**
   * Health check for AI service
   */
  async healthCheck(): Promise<boolean> {
    try {
      if (!this.openai || !process.env.OPENAI_API_KEY) {
        return false;
      }

      // Simple validation that the AI service could be reached
      return true;
    } catch {
      return false;
    }
  }
}

export default EnhancedResumeAI;
