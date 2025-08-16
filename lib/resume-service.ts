import { RealResumeService } from './real-resume-service';
import { ResumeData, ResumeAnalysis } from './resume-api-types';

export class ResumeService {
  private realService: RealResumeService;

  constructor() {
    this.realService = new RealResumeService();
  }

  /**
   * Analyze resume content for completeness, ATS compatibility, and improvement suggestions
   */
  async analyzeResume(
    input: ResumeData | string, 
    userId: string
  ): Promise<ResumeAnalysis> {
    try {
      let resumeData: ResumeData;
      let rawText: string;

      if (typeof input === 'string') {
        // Parse raw text
        rawText = input;
        const extracted = await this.realService.analyzeResume(input);
        resumeData = this.convertToResumeData(extracted);
      } else {
        // Use structured data
        resumeData = input;
        rawText = this.convertToText(input);
      }

      // Perform analysis
      const analysis = await this.performAnalysis(resumeData, rawText);
      
      // Generate enhanced data
      const enhancedData = this.generateEnhancedData(resumeData, analysis);

      return {
        success: true,
        analysis: {
          completeness: analysis.completeness,
          atsScore: analysis.atsScore,
          issues: analysis.issues,
          suggestions: analysis.suggestions,
          missingFields: analysis.missingFields,
          strengthAreas: analysis.strengthAreas,
          weaknessAreas: analysis.weaknessAreas,
          duplicateContent: analysis.duplicateContent,
          conflicts: analysis.conflicts,
        },
        enhancedData,
        timestamp: new Date().toISOString(),
      };

    } catch (error) {
      console.error('Resume analysis failed:', error);
      throw new Error('Failed to analyze resume');
    }
  }

  /**
   * Convert extracted data to ResumeData format
   */
  private convertToResumeData(extracted: any): ResumeData {
    return {
      fullName: extracted.fullName || '',
      contact: {
        email: extracted.email || '',
        phone: extracted.phone || '',
      },
      summary: extracted.summary || '',
      skills: extracted.skills || [],
      education: extracted.education || [],
      workExperience: extracted.experience || [],
      certifications: [],
      projects: [],
      languages: [],
      interests: [],
      socialLinks: {
        linkedin: extracted.linkedin || '',
        portfolio: extracted.portfolio || '',
      },
      preferences: {
        expectedSalary: extracted.expectedSalary || '',
        preferredJobType: extracted.preferredJobType || '',
        preferredLocation: extracted.location || '',
      },
    };
  }

  /**
   * Convert ResumeData to text for analysis
   */
  private convertToText(data: ResumeData): string {
    const parts = [
      data.fullName,
      data.contact.email,
      data.contact.phone,
      data.summary,
      data.skills.join(', '),
      data.education.join(', '),
      data.workExperience.join(', '),
      data.certifications.join(', '),
      data.projects.join(', '),
      data.languages.join(', '),
      data.interests.join(', '),
      data.socialLinks.linkedin,
      data.socialLinks.portfolio,
      data.preferences.expectedSalary,
      data.preferences.preferredJobType,
      data.preferences.preferredLocation,
    ];

    return parts.filter(Boolean).join('\n');
  }

  /**
   * Perform comprehensive resume analysis
   */
  private async performAnalysis(resumeData: ResumeData, rawText: string) {
    const analysis = {
      completeness: this.calculateCompleteness(resumeData),
      atsScore: this.calculateATSScore(resumeData, rawText),
      issues: this.identifyIssues(resumeData),
      suggestions: this.generateSuggestions(resumeData),
      missingFields: this.findMissingFields(resumeData),
      strengthAreas: this.identifyStrengths(resumeData),
      weaknessAreas: this.identifyWeaknesses(resumeData),
      duplicateContent: this.findDuplicates(resumeData),
      conflicts: this.findConflicts(resumeData),
    };

    return analysis;
  }

  /**
   * Calculate resume completeness score
   */
  private calculateCompleteness(data: ResumeData): number {
    const fields = [
      'fullName', 'contact.email', 'contact.phone', 'summary',
      'skills', 'education', 'workExperience', 'certifications',
      'projects', 'languages', 'interests', 'socialLinks.linkedin',
      'socialLinks.portfolio', 'preferences.expectedSalary',
      'preferences.preferredJobType', 'preferences.preferredLocation'
    ];

    let completed = 0;
    fields.forEach(field => {
      const value = this.getNestedValue(data, field);
      if (value && (Array.isArray(value) ? value.length > 0 : value.toString().trim() !== '')) {
        completed++;
      }
    });

    return Math.round((completed / fields.length) * 100);
  }

  /**
   * Calculate ATS compatibility score
   */
  private calculateATSScore(data: ResumeData, rawText: string): number {
    let score = 0;
    
    // Check for essential elements
    if (data.fullName) score += 10;
    if (data.contact.email) score += 10;
    if (data.contact.phone) score += 10;
    if (data.summary) score += 15;
    if (data.skills.length > 0) score += 15;
    if (data.education.length > 0) score += 15;
    if (data.workExperience.length > 0) score += 15;
    
    // Check for formatting issues
    const hasMultipleFonts = /font-family|font-size/i.test(rawText);
    const hasGraphics = /<img|graphic|image/i.test(rawText);
    const hasTables = /<table|<tr|<td/i.test(rawText);
    
    if (!hasMultipleFonts) score += 5;
    if (!hasGraphics) score += 5;
    if (!hasTables) score += 5;
    
    return Math.min(100, score);
  }

  /**
   * Identify potential issues
   */
  private identifyIssues(data: ResumeData): string[] {
    const issues = [];
    
    if (!data.fullName) issues.push('Missing full name');
    if (!data.contact.email) issues.push('Missing email address');
    if (!data.contact.phone) issues.push('Missing phone number');
    if (!data.summary) issues.push('Missing professional summary');
    if (data.skills.length === 0) issues.push('No skills listed');
    if (data.education.length === 0) issues.push('No education history');
    if (data.workExperience.length === 0) issues.push('No work experience');
    if (data.summary && data.summary.length < 50) issues.push('Professional summary is too short');
    if (data.summary && data.summary.length > 500) issues.push('Professional summary is too long');
    
    return issues;
  }

  /**
   * Generate improvement suggestions
   */
  private generateSuggestions(data: ResumeData): string[] {
    const suggestions = [];
    
    if (data.skills.length < 5) suggestions.push('Add more relevant skills');
    if (data.education.length < 1) suggestions.push('Include your educational background');
    if (data.workExperience.length < 1) suggestions.push('Add your work experience');
    if (!data.socialLinks.linkedin) suggestions.push('Add your LinkedIn profile');
    if (!data.preferences.expectedSalary) suggestions.push('Specify your expected salary range');
    if (!data.preferences.preferredJobType) suggestions.push('Specify your preferred job type');
    
    return suggestions;
  }

  /**
   * Find missing fields
   */
  private findMissingFields(data: ResumeData): string[] {
    const missing = [];
    
    if (!data.fullName) missing.push('fullName');
    if (!data.contact.email) missing.push('email');
    if (!data.contact.phone) missing.push('phone');
    if (!data.summary) missing.push('summary');
    if (data.skills.length === 0) missing.push('skills');
    if (data.education.length === 0) missing.push('education');
    if (data.workExperience.length === 0) missing.push('workExperience');
    
    return missing;
  }

  /**
   * Identify strengths
   */
  private identifyStrengths(data: ResumeData): string[] {
    const strengths = [];
    
    if (data.skills.length >= 5) strengths.push('Strong skill set');
    if (data.education.length >= 1) strengths.push('Good educational background');
    if (data.workExperience.length >= 1) strengths.push('Relevant work experience');
    if (data.summary && data.summary.length >= 100) strengths.push('Comprehensive professional summary');
    if (data.certifications.length > 0) strengths.push('Professional certifications');
    if (data.projects.length > 0) strengths.push('Project portfolio');
    
    return strengths;
  }

  /**
   * Identify weaknesses
   */
  private identifyWeaknesses(data: ResumeData): string[] {
    const weaknesses = [];
    
    if (data.skills.length < 3) weaknesses.push('Limited skill set');
    if (data.education.length === 0) weaknesses.push('No education information');
    if (data.workExperience.length === 0) weaknesses.push('No work experience');
    if (!data.summary) weaknesses.push('Missing professional summary');
    if (data.certifications.length === 0) weaknesses.push('No professional certifications');
    if (data.projects.length === 0) weaknesses.push('No project examples');
    
    return weaknesses;
  }

  /**
   * Find duplicate content
   */
  private findDuplicates(data: ResumeData): string[] {
    const duplicates = [];
    
    // Check for duplicate skills
    const skillCounts = new Map<string, number>();
    data.skills.forEach(skill => {
      skillCounts.set(skill, (skillCounts.get(skill) || 0) + 1);
    });
    
    skillCounts.forEach((count, skill) => {
      if (count > 1) duplicates.push(`Duplicate skill: ${skill}`);
    });
    
    return duplicates;
  }

  /**
   * Find conflicts in data
   */
  private findConflicts(data: ResumeData): string[] {
    const conflicts = [];
    
    // Check for conflicting job preferences
    if (data.preferences.preferredJobType && data.preferences.preferredJobType.includes('remote') && 
        data.preferences.preferredLocation && data.preferences.preferredLocation !== 'Remote') {
      conflicts.push('Remote job preference conflicts with specific location preference');
    }
    
    return conflicts;
  }

  /**
   * Generate enhanced resume data
   */
  private generateEnhancedData(data: ResumeData, analysis: any): ResumeData {
    const enhanced = { ...data };
    
    // Enhance summary if it's too short
    if (!enhanced.summary || enhanced.summary.length < 100) {
      enhanced.summary = this.generateSummary(data);
    }
    
    // Add missing skills if none exist
    if (enhanced.skills.length === 0) {
      enhanced.skills = this.suggestSkills(data);
    }
    
    return enhanced;
  }

  /**
   * Generate a professional summary
   */
  private generateSummary(data: ResumeData): string {
    const experience = data.workExperience.length;
    const skills = data.skills.length;
    
    let summary = `Experienced professional with ${experience} years of experience in `;
    
    if (skills > 0) {
      summary += `${data.skills.slice(0, 3).join(', ')}. `;
    } else {
      summary += 'various domains. ';
    }
    
    summary += 'Passionate about delivering high-quality results and continuous learning. ';
    summary += 'Seeking opportunities to contribute to innovative projects and grow professionally.';
    
    return summary;
  }

  /**
   * Suggest relevant skills
   */
  private suggestSkills(data: ResumeData): string[] {
    const commonSkills = [
      'Communication', 'Problem Solving', 'Teamwork', 'Leadership',
      'Project Management', 'Analytical Thinking', 'Adaptability',
      'Time Management', 'Critical Thinking', 'Creativity'
    ];
    
    return commonSkills.slice(0, 5);
  }

  /**
   * Get nested object value
   */
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }
}
