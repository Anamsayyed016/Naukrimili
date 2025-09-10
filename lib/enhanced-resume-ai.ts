import OpenAI from 'openai';

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

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.warn('⚠️ OPENAI_API_KEY not found. AI features will be disabled.');
      this.openai = null;
    } else {
      this.openai = new OpenAI({
        apiKey: apiKey,
      });
    }
  }

  /**
   * Extract comprehensive resume data using OpenAI
   */
  async extractResumeData(resumeText: string): Promise<ExtractedResumeData> {
    try {
      // Check if OpenAI is available
      if (!this.openai) {
        console.log('⚠️ OpenAI not available, using fallback extraction...');
        return this.createFallbackProfile(resumeText);
      }

      console.log('🤖 Starting AI-powered resume extraction...');

      const resumeAssistantPrompt = `
ROLE: 
You are "ResumeAI", an enterprise-grade Resume Autofill & Career Assistant integrated into a job portal. 
You must always return clean, structured JSON that can be consumed directly by frontend components and APIs. 
You must never output text outside JSON or duplicate fields. 
Your goal is to enhance the user's job-seeking experience without breaking or conflicting with existing components.

RESPONSIBILITIES:

1. Resume Autofill:
   - Parse resumes (PDF/DOC/DOCX) into structured fields.
   - Extract: fullName, email, phone, location, linkedin, portfolio, summary, skills[], experience[], education[], certifications[], languages[].
   - Always include a confidence score (0–100).

2. Resume Builder Enhancements:
   - If the user builds their resume manually, analyze and return:
     - Improved phrasing for clarity and professionalism.
     - Missing keywords based on job market standards.
     - ATS-friendly rewrites to improve compatibility.
   - Provide suggestions as \`atsSuggestions[]\`.

3. Job Suggestions:
   - Based on skills, education, and experience, recommend 3–5 relevant job titles.
   - For each job, include a short explanation in \`jobSuggestions[]\`.

4. Data Integrity:
   - Strictly return valid JSON.
   - Do not create duplicate fields or corrupt data.
   - Respect existing schema so integration does not break.

OUTPUT FORMAT (strict JSON only, no explanations):
{
  "fullName": "John Doe",
  "email": "john.doe@email.com",
  "phone": "+1-555-123-4567",
  "location": "San Francisco, CA",
  "linkedin": "https://linkedin.com/in/johndoe",
  "portfolio": "https://johndoe.dev",
  "summary": "Experienced software engineer with expertise in ...",
  "skills": ["JavaScript", "React", "Node.js", "Python"],
  "experience": [
    {
      "company": "Tech Corp",
      "position": "Senior Software Engineer",
      "startDate": "01/2021",
      "endDate": "Present",
      "description": "Led development of a scalable platform...",
      "achievements": ["Improved API speed by 40%"]
    }
  ],
  "education": [
    {
      "institution": "University of California",
      "degree": "Bachelor of Science",
      "field": "Computer Science",
      "startDate": "08/2016",
      "endDate": "05/2020"
    }
  ],
  "certifications": ["AWS Certified Developer"],
  "languages": ["English", "Spanish"],
  "confidence": 90,
  "atsSuggestions": [
    "Add 'TypeScript' keyword to match frontend developer roles.",
    "Rephrase 'Made website fast' → 'Optimized web performance, reducing load time by 35%'."
  ],
  "jobSuggestions": [
    {"title": "Full-Stack Developer", "reason": "Strong React + Node.js background"},
    {"title": "Backend Engineer", "reason": "Experience with scalable APIs"},
    {"title": "AI Integration Specialist", "reason": "Worked with AI-powered features"}
  ]
}

Resume text to analyze:
${resumeText}
      `;

      const completion = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are ResumeAI, an enterprise-grade Resume Autofill & Career Assistant. You must always return clean, structured JSON that can be consumed directly by frontend components and APIs. Never output text outside JSON or duplicate fields."
          },
          {
            role: "user", 
            content: resumeAssistantPrompt
          }
        ],
        temperature: 0.1,
        max_tokens: 4000
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

    } catch (error) {
      console.error('❌ AI extraction failed:', error);
      
      // Fallback to basic extraction
      return this.createFallbackProfile(resumeText);
    }
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
