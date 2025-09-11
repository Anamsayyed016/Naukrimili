/**
 * AI-POWERED RESUME COACH SERVICE
 * Lead Engineer & Code Guardian - Professional Resume Guidance
 * 
 * Provides intelligent suggestions, ATS optimization, and step-by-step coaching
 * for users building their resumes.
 */

import { HybridFormSuggestions } from './hybrid-form-suggestions';
import { UnifiedResumeData, Skill, WorkExperience, Education, Project } from '@/types/unified-resume';

export interface ResumeSuggestion {
  id: string;
  type: 'ats_optimization' | 'content_improvement' | 'structure_guidance' | 'keyword_suggestion' | 'achievement_enhancement';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  suggestion: string;
  example?: string;
  category: string;
  isImplemented: boolean;
}

export interface ATSAnalysis {
  score: number;
  strengths: string[];
  weaknesses: string[];
  missingKeywords: string[];
  suggestedKeywords: string[];
  formattingIssues: string[];
  improvements: ResumeSuggestion[];
}

export interface ProfessionalCoaching {
  step: number;
  title: string;
  description: string;
  isCompleted: boolean;
  suggestions: ResumeSuggestion[];
  tips: string[];
}

export class AIResumeCoach {
  private hybridAI: HybridFormSuggestions;

  constructor() {
    this.hybridAI = new HybridFormSuggestions();
  }

  private createSuggestion(overrides: Partial<ResumeSuggestion>): ResumeSuggestion {
    return {
      id: `suggestion-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'content_improvement',
      priority: 'medium',
      title: '',
      description: '',
      suggestion: '',
      category: 'general',
      isImplemented: false,
      ...overrides
    };
  }

  /**
   * Analyze resume for ATS optimization
   */
  async analyzeATS(resumeData: UnifiedResumeData): Promise<ATSAnalysis> {
    try {
      const analysis = await this.performATSAnalysis(resumeData);
      return analysis;
    } catch (error) {
      console.error('ATS Analysis failed:', error);
      return this.getFallbackATSAnalysis(resumeData);
    }
  }

  /**
   * Get professional coaching steps
   */
  async getCoachingSteps(resumeData: UnifiedResumeData): Promise<ProfessionalCoaching[]> {
    const steps: ProfessionalCoaching[] = [
      {
        step: 1,
        title: "Personal Information & Contact",
        description: "Ensure your contact information is complete and professional",
        isCompleted: this.isPersonalInfoComplete(resumeData),
        suggestions: await this.getPersonalInfoSuggestions(resumeData),
        tips: [
          "Use a professional email address",
          "Include your LinkedIn profile",
          "Add a compelling professional summary"
        ]
      },
      {
        step: 2,
        title: "Professional Summary",
        description: "Craft a compelling summary that highlights your value proposition",
        isCompleted: this.isSummaryComplete(resumeData),
        suggestions: await this.getSummarySuggestions(resumeData),
        tips: [
          "Keep it 3-4 sentences long",
          "Include key achievements and skills",
          "Use action verbs and quantifiable results"
        ]
      },
      {
        step: 3,
        title: "Work Experience",
        description: "Detail your professional experience with quantifiable achievements",
        isCompleted: this.isExperienceComplete(resumeData),
        suggestions: await this.getExperienceSuggestions(resumeData),
        tips: [
          "Use bullet points for responsibilities",
          "Quantify your achievements with numbers",
          "Use action verbs (led, managed, increased, etc.)"
        ]
      },
      {
        step: 4,
        title: "Skills & Technologies",
        description: "List relevant skills that match job requirements",
        isCompleted: this.isSkillsComplete(resumeData),
        suggestions: await this.getSkillsSuggestions(resumeData),
        tips: [
          "Include both technical and soft skills",
          "Match skills to job descriptions",
          "Use industry-standard terminology"
        ]
      },
      {
        step: 5,
        title: "Education & Certifications",
        description: "Highlight your educational background and professional certifications",
        isCompleted: this.isEducationComplete(resumeData),
        suggestions: await this.getEducationSuggestions(resumeData),
        tips: [
          "Include relevant coursework",
          "Add professional certifications",
          "Highlight academic achievements"
        ]
      },
      {
        step: 6,
        title: "Projects & Achievements",
        description: "Showcase your projects and notable achievements",
        isCompleted: this.isProjectsComplete(resumeData),
        suggestions: await this.getProjectsSuggestions(resumeData),
        tips: [
          "Include project URLs when possible",
          "Describe your role and impact",
          "Highlight technologies used"
        ]
      }
    ];

    return steps;
  }

  /**
   * Get ATS-friendly suggestions for specific sections
   */
  async getATSSuggestions(resumeData: UnifiedResumeData, section: string): Promise<ResumeSuggestion[]> {
    const suggestions: ResumeSuggestion[] = [];

    switch (section) {
      case 'summary':
        suggestions.push(...await this.getSummaryATSSuggestions(resumeData));
        break;
      case 'experience':
        suggestions.push(...await this.getExperienceATSSuggestions(resumeData));
        break;
      case 'skills':
        suggestions.push(...await this.getSkillsATSSuggestions(resumeData));
        break;
      case 'education':
        suggestions.push(...await this.getEducationATSSuggestions(resumeData));
        break;
    }

    return suggestions;
  }

  /**
   * Suggest professional keywords for ATS optimization
   */
  async suggestKeywords(jobTitle: string, industry: string): Promise<string[]> {
    try {
      const prompt = `Suggest 20 professional keywords for a ${jobTitle} position in the ${industry} industry. 
      Focus on technical skills, soft skills, and industry-specific terms that ATS systems commonly look for.
      Return only the keywords, separated by commas.`;

      const result = await this.hybridAI.generateSuggestions('keywordSuggestion', prompt, {
        jobTitle,
        industry
      });

      if (result.suggestions && result.suggestions.length > 0) {
        return result.suggestions[0].split(',').map(k => k.trim()).filter(k => k.length > 0);
      }
    } catch (error) {
      console.error('Keyword suggestion failed:', error);
    }

    // Fallback keywords
    return this.getFallbackKeywords(jobTitle, industry);
  }

  /**
   * Generate ATS-friendly achievement suggestions
   */
  async generateAchievementSuggestions(role: string, company: string): Promise<string[]> {
    try {
      const prompt = `Generate 5 ATS-friendly achievement statements for a ${role} at ${company}. 
      Each achievement should be quantifiable, use action verbs, and demonstrate impact.
      Format: "Action verb + specific achievement + quantifiable result"
      Example: "Increased team productivity by 25% through implementation of agile methodologies"`;

      const result = await this.hybridAI.generateSuggestions('achievementSuggestion', prompt, {
        role,
        company
      });

      if (result.suggestions && result.suggestions.length > 0) {
        return result.suggestions;
      }
    } catch (error) {
      console.error('Achievement suggestion failed:', error);
    }

    // Fallback achievements
    return this.getFallbackAchievements(role);
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  private async performATSAnalysis(resumeData: UnifiedResumeData): Promise<ATSAnalysis> {
    const strengths: string[] = [];
    const weaknesses: string[] = [];
    const missingKeywords: string[] = [];
    const suggestedKeywords: string[] = [];
    const formattingIssues: string[] = [];
    const improvements: ResumeSuggestion[] = [];

    // Check personal information
    if (!resumeData.personalInfo.fullName) {
      weaknesses.push('Missing full name');
        improvements.push({
          id: 'missing-name',
          type: 'content_improvement',
          priority: 'high',
          title: 'Add Full Name',
          description: 'Your full name is required for ATS parsing',
          suggestion: 'Include your full legal name at the top of your resume',
          category: 'personal_info',
          isImplemented: false
        });
    } else {
      strengths.push('Complete personal information');
    }

    // Check email
    if (!resumeData.personalInfo.email) {
      weaknesses.push('Missing email address');
    } else {
      strengths.push('Professional email included');
    }

    // Check summary
    if (!resumeData.personalInfo.summary || resumeData.personalInfo.summary.length < 50) {
      weaknesses.push('Incomplete or missing professional summary');
      improvements.push({
        id: 'improve-summary',
        type: 'content_improvement',
        priority: 'high',
        title: 'Enhance Professional Summary',
        description: 'A strong summary helps ATS systems understand your value',
        suggestion: 'Write a 3-4 sentence summary highlighting your key skills and achievements',
        example: 'Experienced software engineer with 5+ years developing scalable web applications using React, Node.js, and cloud technologies. Led cross-functional teams to deliver projects 20% ahead of schedule.',
        category: 'summary',
        isImplemented: false
      });
    } else {
      strengths.push('Professional summary included');
    }

    // Check experience
    if (resumeData.experience.length === 0) {
      weaknesses.push('No work experience listed');
    } else {
      strengths.push(`${resumeData.experience.length} work experience entries`);
      
      // Check for quantifiable achievements
      const hasQuantifiedAchievements = resumeData.experience.some(exp => 
        exp.achievements.some(achievement => /\d+%|\$\d+|\d+\+/.test(achievement))
      );
      
      if (!hasQuantifiedAchievements) {
        improvements.push(this.createSuggestion({
          id: 'add-quantified-achievements',
          type: 'achievement_enhancement',
          priority: 'medium',
          title: 'Add Quantified Achievements',
          description: 'Numbers and metrics make your achievements more compelling',
          suggestion: 'Include specific numbers, percentages, or dollar amounts in your achievements',
          example: 'Increased sales by 25% or Managed team of 8 developers',
          category: 'experience'
        }));
      }
    }

    // Check skills
    if (resumeData.skills.length === 0) {
      weaknesses.push('No skills listed');
    } else {
      strengths.push(`${resumeData.skills.length} skills listed`);
    }

    // Calculate ATS score
    let score = 0;
    if (resumeData.personalInfo.fullName) score += 15;
    if (resumeData.personalInfo.email) score += 15;
    if (resumeData.personalInfo.phone) score += 10;
    if (resumeData.personalInfo.summary && resumeData.personalInfo.summary.length >= 50) score += 20;
    if (resumeData.experience.length > 0) score += 20;
    if (resumeData.skills.length > 0) score += 10;
    if (resumeData.education.length > 0) score += 10;

    return {
      score: Math.min(score, 100),
      strengths,
      weaknesses,
      missingKeywords,
      suggestedKeywords,
      formattingIssues,
      improvements
    };
  }

  private getFallbackATSAnalysis(resumeData: UnifiedResumeData): ATSAnalysis {
    return {
      score: 50,
      strengths: ['Basic structure present'],
      weaknesses: ['Needs improvement'],
      missingKeywords: [],
      suggestedKeywords: [],
      formattingIssues: [],
      improvements: []
    };
  }

  private isPersonalInfoComplete(resumeData: UnifiedResumeData): boolean {
    return !!(
      resumeData.personalInfo.fullName &&
      resumeData.personalInfo.email &&
      resumeData.personalInfo.phone &&
      resumeData.personalInfo.summary
    );
  }

  private isSummaryComplete(resumeData: UnifiedResumeData): boolean {
    return !!(resumeData.personalInfo.summary && resumeData.personalInfo.summary.length >= 50);
  }

  private isExperienceComplete(resumeData: UnifiedResumeData): boolean {
    return resumeData.experience.length > 0 && 
           resumeData.experience.every(exp => exp.company && exp.position && exp.description);
  }

  private isSkillsComplete(resumeData: UnifiedResumeData): boolean {
    return resumeData.skills.length >= 5;
  }

  private isEducationComplete(resumeData: UnifiedResumeData): boolean {
    return resumeData.education.length > 0;
  }

  private isProjectsComplete(resumeData: UnifiedResumeData): boolean {
    return resumeData.projects.length > 0;
  }

  private async getPersonalInfoSuggestions(resumeData: UnifiedResumeData): Promise<ResumeSuggestion[]> {
    const suggestions: ResumeSuggestion[] = [];

    if (!resumeData.personalInfo.linkedin) {
      suggestions.push(this.createSuggestion({
        id: 'add-linkedin',
        type: 'content_improvement',
        priority: 'medium',
        title: 'Add LinkedIn Profile',
        description: 'LinkedIn profiles are highly valued by recruiters',
        suggestion: 'Include your LinkedIn profile URL in your contact information',
        category: 'personal_info'
      }));
    }

    if (!resumeData.personalInfo.portfolio) {
      suggestions.push(this.createSuggestion({
        id: 'add-portfolio',
        type: 'content_improvement',
        priority: 'low',
        title: 'Add Portfolio Link',
        description: 'A portfolio showcases your work and skills',
        suggestion: 'Include your portfolio or GitHub profile if you have one',
        category: 'personal_info'
      }));
    }

    return suggestions;
  }

  private async getSummarySuggestions(resumeData: UnifiedResumeData): Promise<ResumeSuggestion[]> {
    const suggestions: ResumeSuggestion[] = [];

    if (!resumeData.personalInfo.summary) {
      suggestions.push(this.createSuggestion({
        id: 'add-summary',
        type: 'content_improvement',
        priority: 'high',
        title: 'Add Professional Summary',
        description: 'A summary helps recruiters quickly understand your value',
        suggestion: 'Write a compelling 3-4 sentence summary highlighting your key skills and achievements',
        example: 'Experienced software engineer with 5+ years developing scalable web applications. Led cross-functional teams and delivered projects 20% ahead of schedule.',
        category: 'summary'
      }));
    } else if (resumeData.personalInfo.summary.length < 50) {
      suggestions.push(this.createSuggestion({
        id: 'expand-summary',
        type: 'content_improvement',
        priority: 'medium',
        title: 'Expand Professional Summary',
        description: 'Your summary is too short to be effective',
        suggestion: 'Expand your summary to 3-4 sentences with specific achievements and skills',
        category: 'summary'
      }));
    }

    return suggestions;
  }

  private async getExperienceSuggestions(resumeData: UnifiedResumeData): Promise<ResumeSuggestion[]> {
    const suggestions: ResumeSuggestion[] = [];

    if (resumeData.experience.length === 0) {
      suggestions.push(this.createSuggestion({
        id: 'add-experience',
        type: 'content_improvement',
        priority: 'high',
        title: 'Add Work Experience',
        description: 'Work experience is crucial for most positions',
        suggestion: 'Add your relevant work experience with detailed descriptions',
        category: 'experience'
      }));
    } else {
      // Check for missing descriptions
      const incompleteExperience = resumeData.experience.filter(exp => !exp.description);
      if (incompleteExperience.length > 0) {
        suggestions.push(this.createSuggestion({
          id: 'add-experience-descriptions',
          type: 'content_improvement',
          priority: 'medium',
          title: 'Add Experience Descriptions',
          description: 'Some work experiences are missing descriptions',
          suggestion: 'Add detailed descriptions for each work experience',
          category: 'experience'
        }));
      }

      // Check for missing achievements
      const noAchievements = resumeData.experience.filter(exp => exp.achievements.length === 0);
      if (noAchievements.length > 0) {
        suggestions.push(this.createSuggestion({
          id: 'add-achievements',
          type: 'achievement_enhancement',
          priority: 'medium',
          title: 'Add Achievements',
          description: 'Achievements make your experience more compelling',
          suggestion: 'Add specific achievements with quantifiable results for each role',
          example: 'Increased team productivity by 25% through process improvements',
          category: 'experience'
        }));
      }
    }

    return suggestions;
  }

  private async getSkillsSuggestions(resumeData: UnifiedResumeData): Promise<ResumeSuggestion[]> {
    const suggestions: ResumeSuggestion[] = [];

    if (resumeData.skills.length === 0) {
      suggestions.push(this.createSuggestion({
        id: 'add-skills',
        type: 'content_improvement',
        priority: 'high',
        title: 'Add Skills',
        description: 'Skills help ATS systems match you to job requirements',
        suggestion: 'Add relevant technical and soft skills',
        category: 'skills'
      }));
    } else if (resumeData.skills.length < 5) {
      suggestions.push(this.createSuggestion({
        id: 'add-more-skills',
        type: 'content_improvement',
        priority: 'medium',
        title: 'Add More Skills',
        description: 'More skills increase your chances of matching job requirements',
        suggestion: 'Add more relevant skills to improve ATS matching',
        category: 'skills'
      }));
    }

    return suggestions;
  }

  private async getEducationSuggestions(resumeData: UnifiedResumeData): Promise<ResumeSuggestion[]> {
    const suggestions: ResumeSuggestion[] = [];

    if (resumeData.education.length === 0) {
      suggestions.push(this.createSuggestion({
        id: 'add-education',
        type: 'content_improvement',
        priority: 'medium',
        title: 'Add Education',
        description: 'Education background is important for most positions',
        suggestion: 'Add your educational background including degrees and institutions',
        category: 'education'
      }));
    }

    if (resumeData.certifications.length === 0) {
      suggestions.push(this.createSuggestion({
        id: 'add-certifications',
        type: 'content_improvement',
        priority: 'low',
        title: 'Add Certifications',
        description: 'Professional certifications demonstrate expertise',
        suggestion: 'Add relevant professional certifications if you have any',
        category: 'education'
      }));
    }

    return suggestions;
  }

  private async getProjectsSuggestions(resumeData: UnifiedResumeData): Promise<ResumeSuggestion[]> {
    const suggestions: ResumeSuggestion[] = [];

    if (resumeData.projects.length === 0) {
      suggestions.push(this.createSuggestion({
        id: 'add-projects',
        type: 'content_improvement',
        priority: 'medium',
        title: 'Add Projects',
        description: 'Projects showcase your practical skills and experience',
        suggestion: 'Add relevant projects that demonstrate your capabilities',
        category: 'projects'
      }));
    }

    return suggestions;
  }

  private async getSummaryATSSuggestions(resumeData: UnifiedResumeData): Promise<ResumeSuggestion[]> {
    return [
      this.createSuggestion({
        id: 'summary-keywords',
        type: 'keyword_suggestion',
        priority: 'high',
        title: 'Include Industry Keywords',
        description: 'ATS systems look for specific keywords in summaries',
        suggestion: 'Include relevant industry keywords and technical terms',
        category: 'summary'
      })
    ];
  }

  private async getExperienceATSSuggestions(resumeData: UnifiedResumeData): Promise<ResumeSuggestion[]> {
    return [
      this.createSuggestion({
        id: 'experience-keywords',
        type: 'keyword_suggestion',
        priority: 'high',
        title: 'Use Action Verbs',
        description: 'Action verbs make your experience more compelling',
        suggestion: 'Start each bullet point with strong action verbs',
        example: 'Led, Managed, Developed, Implemented, Increased, Optimized',
        category: 'experience'
      })
    ];
  }

  private async getSkillsATSSuggestions(resumeData: UnifiedResumeData): Promise<ResumeSuggestion[]> {
    return [
      this.createSuggestion({
        id: 'skills-keywords',
        type: 'keyword_suggestion',
        priority: 'medium',
        title: 'Match Job Requirements',
        description: 'Skills should match the job description',
        suggestion: 'Include skills that match the job requirements',
        category: 'skills'
      })
    ];
  }

  private async getEducationATSSuggestions(resumeData: UnifiedResumeData): Promise<ResumeSuggestion[]> {
    return [
      this.createSuggestion({
        id: 'education-keywords',
        type: 'keyword_suggestion',
        priority: 'low',
        title: 'Include Relevant Coursework',
        description: 'Relevant coursework can help with ATS matching',
        suggestion: 'Include relevant coursework or academic achievements',
        category: 'education'
      })
    ];
  }

  private getFallbackKeywords(jobTitle: string, industry: string): string[] {
    const commonKeywords = [
      'problem solving', 'communication', 'leadership', 'teamwork',
      'project management', 'analytical thinking', 'adaptability',
      'time management', 'critical thinking', 'creativity'
    ];

    const techKeywords = [
      'JavaScript', 'Python', 'React', 'Node.js', 'SQL', 'Git',
      'Agile', 'Scrum', 'API', 'Database', 'Cloud Computing'
    ];

    return [...commonKeywords, ...techKeywords].slice(0, 20);
  }

  private getFallbackAchievements(role: string): string[] {
    return [
      `Improved team efficiency by 20% through process optimization`,
      `Led cross-functional team of 5+ members to deliver projects on time`,
      `Reduced costs by 15% through strategic implementation`,
      `Increased customer satisfaction scores by 25%`,
      `Mentored 3 junior team members and improved their performance`
    ];
  }
}
