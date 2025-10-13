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
  raw_data: any;
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
  async normalizeJob(rawJob: any, source: string): Promise<NormalizedJobData> {
    const normalized: NormalizedJobData = {
      id: this.generateJobId(rawJob, source),
      title: this.normalizeTitle(rawJob.title || rawJob.job_title || ''),
      company: this.normalizeCompany(rawJob.company || rawJob.employer_name || rawJob.employer || ''),
      location: this.normalizeLocation(rawJob.location || rawJob.job_city || ''),
      type: this.normalizeJobType(rawJob.jobType || rawJob.job_type || rawJob.employment_type || ''),
      salary: this.normalizeSalary(rawJob),
      category: 'General', // Will be set by categorizer
      posted_date: this.normalizePostedDate(rawJob.postedAt || rawJob.job_posted_at || rawJob.created || rawJob.created_at),
      source: source,
      source_id: rawJob.id || rawJob.job_id || rawJob.sourceId || this.generateSourceId(rawJob),
      description: this.normalizeDescription(rawJob.description || rawJob.job_description || ''),
      requirements: this.extractRequirements(rawJob.description || rawJob.job_description || ''),
      apply_url: rawJob.applyUrl || rawJob.apply_url || null,
      source_url: rawJob.source_url || rawJob.job_apply_link || rawJob.redirect_url || rawJob.url,
      is_remote: this.detectRemoteWork(rawJob),
      is_hybrid: this.detectHybridWork(rawJob),
      experience_level: this.normalizeExperienceLevel(rawJob.experienceLevel || rawJob.experience_level || ''),
      skills: this.extractSkills(rawJob),
      sector: this.detectSector(rawJob),
      is_featured: rawJob.isFeatured || rawJob.featured || false,
      is_urgent: rawJob.isUrgent || rawJob.urgent || false,
      country: this.normalizeCountry(rawJob.country || rawJob.job_country || ''),
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
  private calculateSimilarity(job1: NormalizedJobData, job2: any): number {
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
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));

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
  private generateJobId(rawJob: any, source: string): string {
    const title = (rawJob.title || rawJob.job_title || '').replace(/\s+/g, '-').toLowerCase();
    const company = (rawJob.company || rawJob.employer_name || '').replace(/\s+/g, '-').toLowerCase();
    const timestamp = Date.now();
    return `${source}-${company}-${title}-${timestamp}`.substring(0, 100);
  }

  private generateSourceId(rawJob: any): string {
    return rawJob.id || rawJob.job_id || rawJob.sourceId || `ext-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
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

  private normalizeSalary(rawJob: any): { min?: number; max?: number; currency: string; display: string } {
    let min = rawJob.salaryMin || rawJob.salary_min;
    let max = rawJob.salaryMax || rawJob.salary_max;
    let currency = rawJob.salaryCurrency || rawJob.currency || 'INR';
    let display = rawJob.salary || '';

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

  private normalizePostedDate(dateInput: any): Date {
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

  private detectRemoteWork(rawJob: any): boolean {
    const text = `${rawJob.title || ''} ${rawJob.description || ''} ${rawJob.location || ''}`.toLowerCase();
    const remoteKeywords = ['remote', 'work from home', 'wfh', 'telecommute', 'virtual', 'distributed'];
    return remoteKeywords.some(keyword => text.includes(keyword));
  }

  private detectHybridWork(rawJob: any): boolean {
    const text = `${rawJob.title || ''} ${rawJob.description || ''}`.toLowerCase();
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

  private extractSkills(rawJob: any): string[] {
    const text = `${rawJob.title || ''} ${rawJob.description || ''} ${rawJob.skills || ''}`.toLowerCase();
    
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
    if (rawJob.skills && Array.isArray(rawJob.skills)) {
      foundSkills.push(...rawJob.skills.map((s: string) => s.toLowerCase()));
    }

    return [...new Set(foundSkills)]; // Remove duplicates
  }

  private detectSector(rawJob: any): string {
    const text = `${rawJob.title || ''} ${rawJob.description || ''} ${rawJob.company || ''}`.toLowerCase();
    
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
