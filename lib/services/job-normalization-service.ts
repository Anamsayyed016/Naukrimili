/**
 * Job Normalization Service
 * Converts 3rd-party API jobs into unified schema with duplicate detection
 */

import { prisma } from '@/lib/prisma';
import { getCurrencySymbol } from '@/lib/currency-utils';

export interface NormalizedJobData {
  id: string;
  title: string;
  company: string;
  location: string;
  type: string;
  salary: {
    min?: number;
    max?: number;
    currency: string;
    display: string;
  };
  category: string;
  posted_date: Date;
  source: string;
  source_id: string;
  description: string;
  requirements?: string;
  apply_url?: string;
  source_url?: string;
  is_remote: boolean;
  is_hybrid: boolean;
  experience_level: string;
  skills: string[];
  sector: string;
  is_featured: boolean;
  is_urgent: boolean;
  country: string;
  raw_data: Record<string, unknown>;
}

export interface DuplicateDetectionResult {
  isDuplicate: boolean;
  existingJobId?: string;
  similarityScore: number;
}

export class JobNormalizationService {
  private static instance: JobNormalizationService;
  
  public static getInstance(): JobNormalizationService {
    if (!JobNormalizationService.instance) {
      JobNormalizationService.instance = new JobNormalizationService();
    }
    return JobNormalizationService.instance;
  }

  /**
   * Normalize a job from any external API into unified schema
   */
  async normalizeJob(rawJob: Record<string, unknown>, source: string): Promise<NormalizedJobData> {
    const normalized: NormalizedJobData = {
      id: this.generateJobId(rawJob, source),
      title: this.normalizeTitle(this.getStringValue(rawJob, 'title', 'job_title')),
      company: this.normalizeCompany(this.getStringValue(rawJob, 'company', 'employer_name', 'employer')),
      location: this.normalizeLocation(this.getStringValue(rawJob, 'location', 'job_city')),
      type: this.normalizeJobType(this.getStringValue(rawJob, 'jobType', 'job_type', 'employment_type')),
      salary: this.normalizeSalary(rawJob),
      category: 'General', // Will be set by categorizer
      posted_date: this.normalizePostedDate(rawJob.postedAt || rawJob.job_posted_at || rawJob.created || rawJob.created_at),
      source: source,
      source_id: this.getStringValue(rawJob, 'id', 'job_id', 'sourceId') || this.generateSourceId(rawJob),
      description: this.normalizeDescription(this.getStringValue(rawJob, 'description', 'job_description')),
      requirements: this.extractRequirements(this.getStringValue(rawJob, 'description', 'job_description')),
      apply_url: this.getStringValue(rawJob, 'applyUrl', 'apply_url') || null,
      source_url: this.getStringValue(rawJob, 'source_url', 'job_apply_link', 'redirect_url', 'url') || null,
      is_remote: this.detectRemoteWork(rawJob),
      is_hybrid: this.detectHybridWork(rawJob),
      experience_level: this.normalizeExperienceLevel(this.getStringValue(rawJob, 'experienceLevel', 'experience_level')),
      skills: this.extractSkills(rawJob),
      sector: this.detectSector(rawJob),
      is_featured: typeof rawJob.isFeatured === 'boolean' ? rawJob.isFeatured : (typeof rawJob.featured === 'boolean' ? rawJob.featured : false),
      is_urgent: typeof rawJob.isUrgent === 'boolean' ? rawJob.isUrgent : (typeof rawJob.urgent === 'boolean' ? rawJob.urgent : false),
      country: this.normalizeCountry(this.getStringValue(rawJob, 'country', 'job_country')),
      raw_data: rawJob
    };

    return normalized;
  }

  /**
   * Detect and remove duplicates using fuzzy matching
   */
  async detectDuplicates(normalizedJob: NormalizedJobData): Promise<DuplicateDetectionResult> {
    try {
      // Search for potential duplicates in the last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const potentialDuplicates = await prisma.job.findMany({
        where: {
          AND: [
            { isActive: true },
            { createdAt: { gte: thirtyDaysAgo } },
            {
              OR: [
                { source: normalizedJob.source },
                { company: { contains: normalizedJob.company, mode: 'insensitive' } }
              ]
            }
          ]
        },
        select: {
          id: true,
          title: true,
          company: true,
          location: true,
          source: true,
          sourceId: true
        }
      });

      let bestMatch: { jobId: string; score: number } | null = null;

      for (const existingJob of potentialDuplicates) {
        const similarityScore = this.calculateSimilarity(normalizedJob, existingJob);
        
        if (similarityScore > 0.8) { // 80% similarity threshold
          if (!bestMatch || similarityScore > bestMatch.score) {
            bestMatch = {
              jobId: existingJob.id.toString(),
              score: similarityScore
            };
          }
        }
      }

      return {
        isDuplicate: bestMatch !== null,
        existingJobId: bestMatch?.jobId,
        similarityScore: bestMatch?.score || 0
      };

    } catch (error) {
      console.error('❌ Duplicate detection failed:', error);
      return { isDuplicate: false, similarityScore: 0 };
    }
  }

  /**
   * Calculate similarity score between two jobs using multiple factors
   */
  private calculateSimilarity(job1: NormalizedJobData, job2: { title: string; company: string; location: string; source: string; sourceId: string }): number {
    const titleSimilarity = this.calculateStringSimilarity(
      job1.title.toLowerCase(),
      job2.title.toLowerCase()
    );

    const companySimilarity = this.calculateStringSimilarity(
      job1.company.toLowerCase(),
      job2.company.toLowerCase()
    );

    const locationSimilarity = this.calculateStringSimilarity(
      job1.location.toLowerCase(),
      job2.location.toLowerCase()
    );

    const sourceSimilarity = job1.source === job2.source ? 1.0 : 0.0;
    const sourceIdSimilarity = job1.source_id === job2.sourceId ? 1.0 : 0.0;

    // Weighted average
    const weights = {
      title: 0.4,
      company: 0.3,
      location: 0.15,
      source: 0.1,
      sourceId: 0.05
    };

    return (
      titleSimilarity * weights.title +
      companySimilarity * weights.company +
      locationSimilarity * weights.location +
      sourceSimilarity * weights.source +
      sourceIdSimilarity * weights.sourceId
    );
  }

  /**
   * Calculate string similarity using Levenshtein distance
   */
  private calculateStringSimilarity(str1: string, str2: string): number {
    if (str1 === str2) return 1.0;
    if (str1.length === 0 || str2.length === 0) return 0.0;

    const maxLength = Math.max(str1.length, str2.length);
    const distance = this.levenshteinDistance(str1, str2);
    
    return 1 - (distance / maxLength);
  }

  /**
   * Calculate Levenshtein distance between two strings
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = Array(str2.length + 1).fill(null).map(() => Array<number>(str1.length + 1).fill(0));

    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;

    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,     // deletion
          matrix[j - 1][i] + 1,     // insertion
          matrix[j - 1][i - 1] + cost // substitution
        );
      }
    }

    return matrix[str2.length][str1.length];
  }

  // Normalization helper methods
  private getStringValue(rawJob: Record<string, unknown>, ...keys: string[]): string {
    for (const key of keys) {
      const value = rawJob[key];
      if (typeof value === 'string') return value;
    }
    return '';
  }

  private generateJobId(rawJob: Record<string, unknown>, source: string): string {
    const title = this.getStringValue(rawJob, 'title', 'job_title').replace(/\s+/g, '-').toLowerCase();
    const company = this.getStringValue(rawJob, 'company', 'employer_name', 'employer').replace(/\s+/g, '-').toLowerCase();
    const timestamp = Date.now();
    return `${source}-${company}-${title}-${timestamp}`.substring(0, 100);
  }

  private generateSourceId(rawJob: Record<string, unknown>): string {
    const id = this.getStringValue(rawJob, 'id', 'job_id', 'sourceId');
    return id || `ext-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private normalizeTitle(title: string): string {
    return title.trim().replace(/\s+/g, ' ');
  }

  private normalizeCompany(company: string): string {
    return company.trim().replace(/\s+/g, ' ');
  }

  private normalizeLocation(location: string): string {
    return location.trim().replace(/\s+/g, ' ');
  }

  private normalizeJobType(jobType: string): string {
    const type = jobType.toLowerCase().trim();
    
    const typeMapping: { [key: string]: string } = {
      'full-time': 'Full-time',
      'fulltime': 'Full-time',
      'full time': 'Full-time',
      'part-time': 'Part-time',
      'parttime': 'Part-time',
      'part time': 'Part-time',
      'contract': 'Contract',
      'contractor': 'Contract',
      'temporary': 'Contract',
      'intern': 'Internship',
      'internship': 'Internship',
      'freelance': 'Freelance',
      'remote': 'Remote',
      'hybrid': 'Hybrid'
    };

    return typeMapping[type] || 'Full-time';
  }

  private normalizeSalary(rawJob: Record<string, unknown>): { min?: number; max?: number; currency: string; display: string } {
    let min: number | undefined = typeof rawJob.salaryMin === 'number' ? rawJob.salaryMin : (typeof rawJob.salary_min === 'number' ? rawJob.salary_min : undefined);
    let max: number | undefined = typeof rawJob.salaryMax === 'number' ? rawJob.salaryMax : (typeof rawJob.salary_max === 'number' ? rawJob.salary_max : undefined);
    let currency: string = typeof rawJob.salaryCurrency === 'string' ? rawJob.salaryCurrency : (typeof rawJob.currency === 'string' ? rawJob.currency : 'INR');
    let display: string = typeof rawJob.salary === 'string' ? rawJob.salary : '';

    // Extract salary from display string if min/max not available
    if (!min && !max && display) {
      const salaryMatch = display.match(/(\d+(?:,\d+)*(?:\.\d+)?)\s*-\s*(\d+(?:,\d+)*(?:\.\d+)?)/);
      if (salaryMatch) {
        min = parseInt(salaryMatch[1].replace(/,/g, ''));
        max = parseInt(salaryMatch[2].replace(/,/g, ''));
      } else {
        const singleMatch = display.match(/(\d+(?:,\d+)*(?:\.\d+)?)/);
        if (singleMatch) {
          min = parseInt(singleMatch[1].replace(/,/g, ''));
        }
      }
    }

    // Generate display string if not available
    if (!display && (min || max)) {
      if (min && max) {
        const symbol = getCurrencySymbol(currency);
        display = `${symbol} ${min.toLocaleString()} - ${symbol} ${max.toLocaleString()}`;
      } else if (min) {
        const symbol = getCurrencySymbol(currency);
        display = `${symbol} ${min.toLocaleString()}+`;
      } else if (max) {
        const symbol = getCurrencySymbol(currency);
        display = `Up to ${symbol} ${max.toLocaleString()}`;
      }
    }

    return {
      min: min || undefined,
      max: max || undefined,
      currency: currency.toUpperCase(),
      display: display || 'Salary not specified'
    };
  }

  private normalizePostedDate(dateInput: unknown): Date {
    if (!dateInput) return new Date();
    
    if (dateInput instanceof Date) return dateInput;
    
    const date = new Date(dateInput);
    return isNaN(date.getTime()) ? new Date() : date;
  }

  private normalizeDescription(description: string): string {
    return description.trim().replace(/\s+/g, ' ');
  }

  private extractRequirements(description: string): string {
    // Simple extraction - look for common requirement patterns
    const requirementPatterns = [
      /requirements?:\s*([^.]*)/i,
      /qualifications?:\s*([^.]*)/i,
      /must have:\s*([^.]*)/i,
      /required:\s*([^.]*)/i
    ];

    for (const pattern of requirementPatterns) {
      const match = description.match(pattern);
      if (match) {
        return match[1].trim();
      }
    }

    return '';
  }

  private detectRemoteWork(rawJob: Record<string, unknown>): boolean {
    const text = `${this.getStringValue(rawJob, 'title')} ${this.getStringValue(rawJob, 'description')} ${this.getStringValue(rawJob, 'location')}`.toLowerCase();
    const remoteKeywords = ['remote', 'work from home', 'wfh', 'telecommute', 'virtual', 'distributed'];
    return remoteKeywords.some(keyword => text.includes(keyword));
  }

  private detectHybridWork(rawJob: Record<string, unknown>): boolean {
    const text = `${this.getStringValue(rawJob, 'title')} ${this.getStringValue(rawJob, 'description')}`.toLowerCase();
    const hybridKeywords = ['hybrid', 'flexible', 'part remote', 'part-time remote'];
    return hybridKeywords.some(keyword => text.includes(keyword));
  }

  private normalizeExperienceLevel(level: string): string {
    const expLevel = level.toLowerCase().trim();
    
    const levelMapping: { [key: string]: string } = {
      'entry': 'Entry Level',
      'entry level': 'Entry Level',
      'junior': 'Entry Level',
      'associate': 'Entry Level',
      'mid': 'Mid Level',
      'mid level': 'Mid Level',
      'intermediate': 'Mid Level',
      'senior': 'Senior Level',
      'senior level': 'Senior Level',
      'lead': 'Lead',
      'principal': 'Lead',
      'staff': 'Lead',
      'executive': 'Executive',
      'director': 'Executive',
      'vp': 'Executive',
      'vice president': 'Executive'
    };

    return levelMapping[expLevel] || 'Mid Level';
  }

  private extractSkills(rawJob: Record<string, unknown>): string[] {
    const text = `${this.getStringValue(rawJob, 'title')} ${this.getStringValue(rawJob, 'description')} ${this.getStringValue(rawJob, 'skills')}`.toLowerCase();
    
    // Common technical skills
    const skillKeywords = [
      'javascript', 'python', 'java', 'react', 'node.js', 'angular', 'vue', 'typescript',
      'sql', 'mongodb', 'postgresql', 'mysql', 'aws', 'azure', 'docker', 'kubernetes',
      'git', 'agile', 'scrum', 'api', 'rest', 'graphql', 'microservices', 'devops',
      'machine learning', 'ai', 'data science', 'analytics', 'tableau', 'power bi',
      'salesforce', 'marketing', 'seo', 'sem', 'content management', 'project management'
    ];

    const foundSkills = skillKeywords.filter(skill => text.includes(skill));
    
    // Add skills from raw data if available
    const skillsValue = rawJob.skills;
    if (Array.isArray(skillsValue)) {
      foundSkills.push(...skillsValue.filter((s): s is string => typeof s === 'string').map(s => s.toLowerCase()));
    }

    return [...new Set(foundSkills)]; // Remove duplicates
  }

  private detectSector(rawJob: Record<string, unknown>): string {
    const text = `${this.getStringValue(rawJob, 'title')} ${this.getStringValue(rawJob, 'description')} ${this.getStringValue(rawJob, 'company', 'employer_name', 'employer')}`.toLowerCase();
    
    const sectorKeywords = {
      'Technology': ['software', 'tech', 'developer', 'programmer', 'engineer', 'it', 'computer'],
      'Healthcare': ['health', 'medical', 'doctor', 'nurse', 'pharmacy', 'hospital', 'clinic'],
      'Finance': ['finance', 'banking', 'investment', 'accounting', 'financial', 'trading'],
      'Education': ['education', 'teacher', 'professor', 'academic', 'school', 'university'],
      'Marketing': ['marketing', 'advertising', 'brand', 'digital marketing', 'seo', 'social media'],
      'Sales': ['sales', 'business development', 'account manager', 'sales representative'],
      'HR': ['human resources', 'hr', 'recruitment', 'talent', 'people operations'],
      'Operations': ['operations', 'logistics', 'supply chain', 'manufacturing', 'production'],
      'Customer Service': ['customer service', 'support', 'call center', 'bpo', 'customer care'],
      'Design': ['design', 'ui', 'ux', 'graphic', 'creative', 'visual', 'art']
    };

    for (const [sector, keywords] of Object.entries(sectorKeywords)) {
      if (keywords.some(keyword => text.includes(keyword))) {
        return sector;
      }
    }

    return 'General';
  }

  private normalizeCountry(country: string): string {
    const countryCode = country.toUpperCase().trim();
    
    const countryMapping: { [key: string]: string } = {
      'IN': 'IN',
      'INDIA': 'IN',
      'US': 'US',
      'USA': 'US',
      'UNITED STATES': 'US',
      'GB': 'GB',
      'UK': 'GB',
      'UNITED KINGDOM': 'GB',
      'AE': 'AE',
      'UAE': 'AE',
      'UNITED ARAB EMIRATES': 'AE',
      'CA': 'CA',
      'CANADA': 'CA',
      'AU': 'AU',
      'AUSTRALIA': 'AU',
      'DE': 'DE',
      'GERMANY': 'DE',
      'FR': 'FR',
      'FRANCE': 'FR',
      'SG': 'SG',
      'SINGAPORE': 'SG'
    };

    return countryMapping[countryCode] || 'IN';
  }
}
