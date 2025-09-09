import { JOB_SECTORS } from '@/lib/jobs/sectors';

export interface ExtractedSkill {
  skill: string;
  confidence: number;
  category: 'technical' | 'soft' | 'industry' | 'tool' | 'language';
}

export class SkillsExtractionService {
  private static readonly TECHNICAL_KEYWORDS = [
    'javascript', 'python', 'java', 'react', 'node.js', 'angular', 'vue.js', 'typescript',
    'aws', 'azure', 'docker', 'kubernetes', 'git', 'sql', 'mongodb', 'redis',
    'html', 'css', 'php', 'ruby', 'go', 'rust', 'swift', 'kotlin',
    'machine learning', 'artificial intelligence', 'data science', 'blockchain',
    'cybersecurity', 'devops', 'microservices', 'api', 'rest', 'graphql'
  ];

  private static readonly SOFT_SKILLS = [
    'leadership', 'communication', 'teamwork', 'problem solving', 'critical thinking',
    'time management', 'adaptability', 'creativity', 'analytical', 'collaboration',
    'project management', 'mentoring', 'presentation', 'negotiation', 'decision making'
  ];

  private static readonly INDUSTRY_KEYWORDS = [
    'fintech', 'healthcare', 'e-commerce', 'saas', 'edtech', 'fintech',
    'retail', 'manufacturing', 'logistics', 'real estate', 'entertainment',
    'gaming', 'media', 'advertising', 'consulting', 'banking', 'insurance'
  ];

  private static readonly TOOL_KEYWORDS = [
    'jira', 'confluence', 'slack', 'trello', 'asana', 'notion', 'figma',
    'sketch', 'photoshop', 'illustrator', 'excel', 'powerpoint', 'word',
    'salesforce', 'hubspot', 'zendesk', 'tableau', 'power bi', 'looker'
  ];

  private static readonly LANGUAGE_KEYWORDS = [
    'english', 'spanish', 'french', 'german', 'italian', 'portuguese',
    'chinese', 'japanese', 'korean', 'arabic', 'hindi', 'russian'
  ];

  /**
   * Extract skills from job description using AI-powered analysis
   */
  static extractSkills(description: string, title: string = '', company: string = ''): ExtractedSkill[] {
    if (!description) return [];

    const text = `${title} ${company} ${description}`.toLowerCase();
    const extractedSkills = new Map<string, ExtractedSkill>();

    // Extract technical skills
    this.TECHNICAL_KEYWORDS.forEach(skill => {
      const confidence = this.calculateConfidence(text, skill);
      if (confidence > 0.3) {
        extractedSkills.set(skill, {
          skill: this.formatSkillName(skill),
          confidence,
          category: 'technical'
        });
      }
    });

    // Extract soft skills
    this.SOFT_SKILLS.forEach(skill => {
      const confidence = this.calculateConfidence(text, skill);
      if (confidence > 0.4) {
        extractedSkills.set(skill, {
          skill: this.formatSkillName(skill),
          confidence,
          category: 'soft'
        });
      }
    });

    // Extract industry keywords
    this.INDUSTRY_KEYWORDS.forEach(skill => {
      const confidence = this.calculateConfidence(text, skill);
      if (confidence > 0.5) {
        extractedSkills.set(skill, {
          skill: this.formatSkillName(skill),
          confidence,
          category: 'industry'
        });
      }
    });

    // Extract tools
    this.TOOL_KEYWORDS.forEach(skill => {
      const confidence = this.calculateConfidence(text, skill);
      if (confidence > 0.4) {
        extractedSkills.set(skill, {
          skill: this.formatSkillName(skill),
          confidence,
          category: 'tool'
        });
      }
    });

    // Extract languages
    this.LANGUAGE_KEYWORDS.forEach(skill => {
      const confidence = this.calculateConfidence(text, skill);
      if (confidence > 0.6) {
        extractedSkills.set(skill, {
          skill: this.formatSkillName(skill),
          confidence,
          category: 'language'
        });
      }
    });

    // Extract skills from job sectors
    JOB_SECTORS.forEach(sector => {
      sector.skills.forEach(skill => {
        const confidence = this.calculateConfidence(text, skill.toLowerCase());
        if (confidence > 0.3) {
          extractedSkills.set(skill.toLowerCase(), {
            skill: skill,
            confidence,
            category: 'technical'
          });
        }
      });
    });

    // Extract skills from job titles and keywords
    const titleSkills = this.extractSkillsFromTitle(title);
    titleSkills.forEach(skill => {
      const confidence = this.calculateConfidence(text, skill.toLowerCase());
      if (confidence > 0.2) {
        extractedSkills.set(skill.toLowerCase(), {
          skill: skill,
          confidence,
          category: 'technical'
        });
      }
    });

    // Return sorted by confidence
    return Array.from(extractedSkills.values())
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 20); // Top 20 skills
  }

  /**
   * Calculate confidence score for skill extraction
   */
  private static calculateConfidence(text: string, skill: string): number {
    const skillWords = skill.split(' ');
    let confidence = 0;

    // Exact match
    if (text.includes(skill)) {
      confidence += 0.8;
    }

    // Partial match
    skillWords.forEach(word => {
      if (text.includes(word)) {
        confidence += 0.3;
      }
    });

    // Context analysis
    const contextWords = ['required', 'preferred', 'experience', 'knowledge', 'skills', 'proficiency'];
    const hasContext = contextWords.some(word => {
      const index = text.indexOf(skill);
      return index > -1 && 
        (text.substring(Math.max(0, index - 50), index).includes(word) ||
         text.substring(index, Math.min(text.length, index + 50)).includes(word));
    });

    if (hasContext) {
      confidence += 0.2;
    }

    return Math.min(confidence, 1.0);
  }

  /**
   * Extract skills from job title
   */
  private static extractSkillsFromTitle(title: string): string[] {
    const skills: string[] = [];
    const titleLower = title.toLowerCase();

    // Common job title patterns
    const patterns = [
      /(?:senior|lead|principal)\s+(\w+)\s+(?:developer|engineer|architect)/i,
      /(\w+)\s+(?:developer|engineer|specialist|analyst|manager)/i,
      /(?:full\s+stack|frontend|backend|mobile|web)\s+(\w+)/i,
      /(\w+)\s+(?:expert|professional|consultant)/i
    ];

    patterns.forEach(pattern => {
      const match = title.match(pattern);
      if (match && match[1]) {
        skills.push(match[1]);
      }
    });

    return skills;
  }

  /**
   * Format skill name for display
   */
  private static formatSkillName(skill: string): string {
    if (!skill) return '';
    return skill.split(' ')
      .map(word => word ? word.charAt(0).toUpperCase() + word.slice(1) : '')
      .join(' ');
  }

  /**
   * Get skills by category
   */
  static getSkillsByCategory(skills: ExtractedSkill[], category: ExtractedSkill['category']): ExtractedSkill[] {
    return skills.filter(skill => skill.category === category);
  }

  /**
   * Get top skills by confidence
   */
  static getTopSkills(skills: ExtractedSkill[], limit: number = 10): ExtractedSkill[] {
    return skills
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, limit);
  }
}
