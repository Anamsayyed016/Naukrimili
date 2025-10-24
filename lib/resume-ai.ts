/**
 * AI Resume Analysis and Generation Service
 * Handles resume parsing, analysis, and intelligent generation
 */

export interface ResumeAnalysis {
  completeness: number; // 0-100%
  issues: string[];
  suggestions: string[];
  missingFields: string[];
  duplicates: string[];
}

export interface ResumeData {
  fullName: string;
  contact: {
    email: string;
    phone: string;
  };
  summary: string;
  skills: string[];
  education: Array<{
    degree: string;
    institution: string;
    year: string;
    details: string;
  }>;
  workExperience: Array<{
    jobTitle: string;
    company: string;
    startDate: string;
    endDate: string;
    responsibilities: string[];
  }>;
  certifications: string[];
  projects: Array<{
    name: string;
    description: string;
    technologies: string[];
  }>;
}

export class ResumeAI {
  /**
   * Analyze existing resume content for issues and completeness
   */
  static analyzeResume(resumeData: Partial<ResumeData> | string): ResumeAnalysis {
    const analysis: ResumeAnalysis = {
      completeness: 0,
      issues: [],
      suggestions: [],
      missingFields: [],
      duplicates: []
    };

    // Parse string content if provided
    let data: Partial<ResumeData>;
    if (typeof resumeData === 'string') {
      data = this.parseResumeText(resumeData);
    } else {
      data = resumeData;
    }

    // Check completeness
    const requiredFields = ['fullName', 'contact.email', 'summary', 'skills'];
    const optionalFields = ['education', 'workExperience', 'certifications', 'projects'];
    
    let completedRequired = 0;
    let completedOptional = 0;

    // Check required fields
    if (data.fullName?.trim()) completedRequired++;
    if (data.contact?.email?.trim()) completedRequired++;
    if (data.summary?.trim()) completedRequired++;
    if (data.skills?.length) completedRequired++;

    // Check optional fields
    if (data.education?.length) completedOptional++;
    if (data.workExperience?.length) completedOptional++;
    if (data.certifications?.length) completedOptional++;
    if (data.projects?.length) completedOptional++;

    analysis.completeness = Math.round(
      ((completedRequired / requiredFields.length) * 70) + 
      ((completedOptional / optionalFields.length) * 30)
    );

    // Identify missing fields
    if (!data.fullName?.trim()) analysis.missingFields.push('Full Name');
    if (!data.contact?.email?.trim()) analysis.missingFields.push('Email Address');
    if (!data.summary?.trim()) analysis.missingFields.push('Professional Summary');
    if (!data.skills?.length) analysis.missingFields.push('Skills');

    // Generate suggestions
    if (analysis.completeness < 70) {
      analysis.suggestions.push('Consider adding work experience to strengthen your profile');
    }
    if (!data.education?.length) {
      analysis.suggestions.push('Add education background for better ATS compatibility');
    }
    if (data.summary && data.summary.length < 100) {
      analysis.suggestions.push('Expand professional summary for better impact (aim for 2-3 sentences)');
    }
    if (data.skills && data.skills.length < 5) {
      analysis.suggestions.push('Add more relevant skills to match job requirements');
    }

    // Check for duplicates in skills
    if (data.skills) {
      const uniqueSkills = [...new Set(data.skills.map(s => s.toLowerCase()))];
      if (uniqueSkills.length < data.skills.length) {
        analysis.duplicates.push('Duplicate skills detected');
      }
    }

    return analysis;
  }

  /**
   * Generate professional resume content using AI principles
   */
  static generateResume(input: Partial<ResumeData> | string): ResumeData {
    // Parse input if it's a string
    let baseData: Partial<ResumeData>;
    if (typeof input === 'string') {
      baseData = this.parseResumeText(input);
    } else {
      baseData = input;
    }

    // Generate enhanced resume with AI improvements
    const enhanced: ResumeData = {
      fullName: baseData.fullName || 'Professional Name',
      contact: {
        email: baseData.contact?.email || 'professional@email.com',
        phone: baseData.contact?.phone || 'N/A'
      },
      summary: this.generateSummary(baseData),
      skills: this.enhanceSkills(baseData.skills || []),
      education: this.generateEducation(baseData.education || []),
      workExperience: this.enhanceWorkExperience(baseData.workExperience || []),
      certifications: baseData.certifications || [],
      projects: this.enhanceProjects(baseData.projects || [])
    };

    return enhanced;
  }

  /**
   * Parse resume text content into structured data
   */
  private static parseResumeText(text: string): Partial<ResumeData> {
    const data: Partial<ResumeData> = {};
    
    // Basic email extraction
    const emailMatch = text.match(/[\w.-]+@[\w.-]+\.\w+/);
    if (emailMatch) {
      data.contact = { email: emailMatch[0], phone: 'N/A' };
    }

    // Extract skills (look for common skill keywords)
    const skillKeywords = [
      'React', 'TypeScript', 'JavaScript', 'Node.js', 'Python', 'Java',
      'Angular', 'Vue', 'Next.js', 'Express', 'MongoDB', 'PostgreSQL',
      'AWS', 'Docker', 'Kubernetes', 'Git', 'HTML', 'CSS', 'Tailwind'
    ];
    
    const foundSkills = skillKeywords.filter(skill => 
      text.toLowerCase().includes(skill.toLowerCase())
    );
    
    if (foundSkills.length > 0) {
      data.skills = foundSkills;
    }

    return data;
  }

  /**
   * Generate professional summary based on available data
   */
  private static generateSummary(data: Partial<ResumeData>): string {
    const skills = data.skills || [];
    const hasExperience = data.workExperience && data.workExperience.length > 0;
    const hasProjects = data.projects && data.projects.length > 0;

    if (skills.includes('React') || skills.includes('TypeScript')) {
      return hasExperience 
        ? `Experienced full-stack developer specializing in ${skills.slice(0, 3).join(', ')} with proven track record in building scalable web applications. Passionate about clean code architecture, performance optimization, and delivering exceptional user experiences.`
        : `Motivated developer skilled in ${skills.slice(0, 3).join(', ')} with strong foundation in modern web development. Eager to contribute to innovative projects and grow expertise in full-stack development.`;
    }

    if (skills.length > 0) {
      return `Professional with expertise in ${skills.slice(0, 3).join(', ')} and passion for technology innovation. Committed to continuous learning and delivering high-quality solutions that drive business objectives.`;
    }

    return 'Dedicated professional with strong technical background and passion for innovation. Committed to continuous learning and contributing to team success through collaboration and excellence.';
  }

  /**
   * Enhance and expand skills list
   */
  private static enhanceSkills(skills: string[]): string[] {
    const enhanced = [...new Set(skills)]; // Remove duplicates
    
    // Add complementary skills based on existing ones
    if (skills.includes('React') && !skills.includes('JavaScript')) {
      enhanced.push('JavaScript');
    }
    if (skills.includes('TypeScript') && !skills.includes('React')) {
      enhanced.push('React');
    }
    if (skills.includes('Next.js') && !skills.includes('Node.js')) {
      enhanced.push('Node.js');
    }

    return enhanced.slice(0, 12); // Limit to most relevant skills
  }

  /**
   * Generate or enhance education section
   */
  private static generateEducation(education: any[]): ResumeData['education'] {
    if (education.length > 0) {
      return education.map(edu => ({
        degree: edu.degree || 'Bachelor\'s Degree',
        institution: edu.institution || 'University',
        year: edu.year || '2023',
        details: edu.details || 'Relevant coursework in software development and computer science fundamentals.'
      }));
    }

    return [{
      degree: 'Bachelor of Computer Science',
      institution: 'University',
      year: '2023',
      details: 'Coursework in software engineering, data structures, algorithms, and web development.'
    }];
  }

  /**
   * Enhance work experience with better formatting
   */
  private static enhanceWorkExperience(experience: any[]): ResumeData['workExperience'] {
    return experience.map(exp => ({
      jobTitle: exp.jobTitle || 'Software Developer',
      company: exp.company || 'Technology Company',
      startDate: exp.startDate || '2023-01',
      endDate: exp.endDate || 'Present',
      responsibilities: exp.responsibilities?.length > 0 
        ? exp.responsibilities 
        : [
            'Developed and maintained web applications using modern frameworks',
            'Collaborated with cross-functional teams to deliver high-quality software solutions',
            'Participated in code reviews and implemented best practices for code quality'
          ]
    }));
  }

  /**
   * Enhance projects section
   */
  private static enhanceProjects(projects: any[]): ResumeData['projects'] {
    return projects.map(project => ({
      name: project.name || 'Web Application Project',
      description: project.description || 'Full-stack web application with modern UI/UX design and robust backend functionality.',
      technologies: project.technologies?.length > 0 
        ? project.technologies 
        : ['React', 'TypeScript', 'Node.js']
    }));
  }

  /**
   * Validate resume data for completeness and format
   */
  static validateResume(data: ResumeData): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.fullName?.trim()) errors.push('Full name is required');
    if (!data.contact?.email?.trim()) errors.push('Email is required');
    if (!data.contact?.email?.includes('@')) errors.push('Valid email format required');
    if (!data.summary?.trim()) errors.push('Professional summary is required');
    if (!data.skills?.length) errors.push('At least one skill is required');

    // Date format validation for work experience
    data.workExperience?.forEach((exp, index) => {
      if (exp.startDate && !/^\d{4}-\d{2}$/.test(exp.startDate) && exp.startDate !== 'Present') {
        errors.push(`Work experience ${index + 1}: Invalid start date format (use YYYY-MM)`);
      }
      if (exp.endDate && !/^\d{4}-\d{2}$/.test(exp.endDate) && exp.endDate !== 'Present') {
        errors.push(`Work experience ${index + 1}: Invalid end date format (use YYYY-MM or "Present")`);
      }
    });

    // Year format validation for education
    data.education?.forEach((edu, index) => {
      if (edu.year && !/^\d{4}$/.test(edu.year)) {
        errors.push(`Education ${index + 1}: Invalid year format (use YYYY)`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Health check for AI service availability
   */
  static async healthCheck(): Promise<boolean> {
    try {
      // Check if AI service configuration is available
      const openaiKey = process.env.OPENAI_API_KEY;
      const anthropicKey = process.env.ANTHROPIC_API_KEY;
      
      if (!openaiKey && !anthropicKey) {
        return false;
      }

      // Simple validation that the AI service could be reached
      // In a real implementation, this would make a simple API call
      return true;
    } catch {
      return false;
    }
  }
}
