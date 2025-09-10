import OpenAI from 'openai';

export interface DynamicResumeData {
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
}

export class DynamicResumeAI {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  /**
   * Extract structured data from resume text using OpenAI
   */
  async parseResumeText(resumeText: string): Promise<DynamicResumeData> {
    try {
      console.log('🤖 Starting dynamic resume parsing with OpenAI...');

      const prompt = `
You are an AI Resume Parser and ATS Optimization Assistant.

Your task: Extract structured data from resume text and return valid JSON that exactly matches the schema.

Rules:
- Do not invent or guess information. Leave fields blank ("") or empty arrays [] if missing.
- Use only the defined schema. No extra fields, no duplicates, no nesting beyond schema.
- Keep output clean, valid JSON only (no extra text).
- Calculate ATS score based on completeness and keyword optimization.
- Suggest 3-5 relevant job titles based on skills and experience.

Schema to follow:
{
  "personalInformation": {
    "fullName": "",
    "email": "",
    "phone": "",
    "location": ""
  },
  "professionalInformation": {
    "jobTitle": "",
    "expectedSalary": ""
  },
  "skills": [],
  "education": [
    {
      "degree": "",
      "institution": "",
      "year": ""
    }
  ],
  "experience": [
    {
      "role": "",
      "company": "",
      "duration": "",
      "achievements": []
    }
  ],
  "certifications": [],
  "recommendedJobTitles": [],
  "atsScore": 0,
  "improvementTips": []
}

Resume text to analyze:
${resumeText}

Return only the JSON response:`;

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

      console.log('🤖 Raw AI response received, length:', responseText.length);

      // Parse the JSON response
      let parsedData: DynamicResumeData;
      try {
        // Clean the response to ensure it's valid JSON
        const cleanedResponse = responseText.trim()
          .replace(/^```json\s*/, '')
          .replace(/\s*```$/, '')
          .replace(/^```\s*/, '')
          .replace(/\s*```$/, '');
        
        parsedData = JSON.parse(cleanedResponse);
      } catch (parseError) {
        console.error('❌ JSON parsing failed:', parseError);
        console.log('Raw response that failed to parse:', responseText.substring(0, 500));
        throw new Error('Failed to parse AI response as JSON');
      }

      // Validate and enhance the parsed data
      const validatedData = this.validateAndEnhanceData(parsedData);
      
      console.log('✅ Dynamic resume parsing completed with ATS score:', validatedData.atsScore);
      return validatedData;

    } catch (error) {
      console.error('❌ Dynamic resume parsing failed:', error);
      throw error;
    }
  }

  /**
   * Validate and enhance the parsed resume data
   */
  private validateAndEnhanceData(data: DynamicResumeData): DynamicResumeData {
    // Ensure all required fields exist
    const enhanced: DynamicResumeData = {
      personalInformation: {
        fullName: data.personalInformation?.fullName || '',
        email: data.personalInformation?.email || '',
        phone: data.personalInformation?.phone || '',
        location: data.personalInformation?.location || '',
      },
      professionalInformation: {
        jobTitle: data.professionalInformation?.jobTitle || '',
        expectedSalary: data.professionalInformation?.expectedSalary || '',
      },
      skills: Array.isArray(data.skills) ? data.skills : [],
      education: Array.isArray(data.education) ? data.education : [],
      experience: Array.isArray(data.experience) ? data.experience : [],
      certifications: Array.isArray(data.certifications) ? data.certifications : [],
      recommendedJobTitles: Array.isArray(data.recommendedJobTitles) ? data.recommendedJobTitles : [],
      atsScore: typeof data.atsScore === 'number' ? Math.max(0, Math.min(100, data.atsScore)) : 0,
      improvementTips: Array.isArray(data.improvementTips) ? data.improvementTips : [],
    };

    // Calculate ATS score if not provided or seems incorrect
    if (enhanced.atsScore === 0 || enhanced.atsScore < 20) {
      enhanced.atsScore = this.calculateATSScore(enhanced);
    }

    // Generate improvement tips if not provided
    if (enhanced.improvementTips.length === 0) {
      enhanced.improvementTips = this.generateImprovementTips(enhanced);
    }

    // Generate job title suggestions if not provided
    if (enhanced.recommendedJobTitles.length === 0) {
      enhanced.recommendedJobTitles = this.generateJobTitleSuggestions(enhanced);
    }

    return enhanced;
  }

  /**
   * Calculate ATS compatibility score
   */
  private calculateATSScore(data: DynamicResumeData): number {
    let score = 0;
    const maxScore = 100;

    // Personal information (20 points)
    if (data.personalInformation.fullName) score += 5;
    if (data.personalInformation.email) score += 5;
    if (data.personalInformation.phone) score += 5;
    if (data.personalInformation.location) score += 5;

    // Professional information (20 points)
    if (data.professionalInformation.jobTitle) score += 10;
    if (data.professionalInformation.expectedSalary) score += 10;

    // Skills (20 points)
    if (data.skills.length > 0) {
      score += Math.min(20, data.skills.length * 2);
    }

    // Education (15 points)
    if (data.education.length > 0) {
      score += Math.min(15, data.education.length * 5);
    }

    // Experience (20 points)
    if (data.experience.length > 0) {
      score += Math.min(20, data.experience.length * 4);
    }

    // Certifications (5 points)
    if (data.certifications.length > 0) {
      score += Math.min(5, data.certifications.length * 2);
    }

    return Math.round(score);
  }

  /**
   * Generate improvement tips based on resume data
   */
  private generateImprovementTips(data: DynamicResumeData): string[] {
    const tips: string[] = [];

    if (!data.personalInformation.email) {
      tips.push('Add a professional email address');
    }

    if (data.skills.length < 5) {
      tips.push('Include more relevant technical skills');
    }

    if (data.experience.length === 0) {
      tips.push('Add work experience with quantifiable achievements');
    }

    if (data.education.length === 0) {
      tips.push('Include educational background');
    }

    if (data.certifications.length === 0) {
      tips.push('Consider adding relevant certifications');
    }

    if (tips.length === 0) {
      tips.push('Resume looks comprehensive! Consider adding more specific achievements with metrics');
    }

    return tips;
  }

  /**
   * Generate job title suggestions based on skills and experience
   */
  private generateJobTitleSuggestions(data: DynamicResumeData): string[] {
    const suggestions: string[] = [];
    const skills = data.skills.map(s => s.toLowerCase());
    const experience = data.experience.map(e => e.role.toLowerCase());

    // Technical roles
    if (skills.some(s => ['javascript', 'react', 'node.js', 'python', 'java'].includes(s))) {
      suggestions.push('Software Engineer');
    }

    if (skills.some(s => ['react', 'angular', 'vue', 'frontend'].includes(s))) {
      suggestions.push('Frontend Developer');
    }

    if (skills.some(s => ['node.js', 'python', 'java', 'backend'].includes(s))) {
      suggestions.push('Backend Developer');
    }

    if (skills.some(s => ['javascript', 'react', 'node.js'].includes(s))) {
      suggestions.push('Full-Stack Developer');
    }

    if (skills.some(s => ['data', 'analytics', 'sql', 'python'].includes(s))) {
      suggestions.push('Data Analyst');
    }

    // If no specific suggestions, add generic ones
    if (suggestions.length === 0) {
      suggestions.push('Software Developer', 'Technical Specialist', 'IT Professional');
    }

    return suggestions.slice(0, 5); // Return max 5 suggestions
  }

  /**
   * Health check for AI service
   */
  async healthCheck(): Promise<boolean> {
    try {
      if (!process.env.OPENAI_API_KEY) {
        return false;
      }

      // Make a simple test call
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: 'Test' }],
        max_tokens: 1,
      });

      return completion.choices[0]?.message?.content !== undefined;
    } catch (error) {
      console.error('AI health check failed:', error);
      return false;
    }
  }
}
