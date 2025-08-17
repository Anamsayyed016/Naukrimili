import { JOB_SECTORS, JobSector, getSectorById } from './sectors';

export interface GeneratedJob {
  title: string;
  company: string;
  companyLogo?: string;
  location: string;
  country: string;
  description: string;
  applyUrl?: string;
  postedAt: Date;
  salary: string;
  salaryMin: number;
  salaryMax: number;
  salaryCurrency: string;
  jobType: string;
  experienceLevel: string;
  skills: string[];
  isRemote: boolean;
  isHybrid: boolean;
  isUrgent: boolean;
  isFeatured: boolean;
  sector: string;
  views: number;
  applicationsCount: number;
  source: string;
  sourceId: string;
  rawJson: any;
}

export class JobGenerator {
  private static readonly JOB_TYPES = ['full-time', 'part-time', 'contract', 'internship'];
  private static readonly EXPERIENCE_LEVELS = ['entry', 'mid', 'senior', 'executive'];
  private static readonly REMOTE_OPTIONS = [
    { isRemote: false, isHybrid: false },
    { isRemote: true, isHybrid: false },
    { isRemote: false, isHybrid: true }
  ];

  static generateJobForSector(sectorId: string, index: number): GeneratedJob {
    const sector = getSectorById(sectorId);
    if (!sector) {
      throw new Error(`Sector ${sectorId} not found`);
    }

    const experienceLevel = this.EXPERIENCE_LEVELS[Math.floor(Math.random() * this.EXPERIENCE_LEVELS.length)];
    const jobType = this.JOB_TYPES[Math.floor(Math.random() * this.JOB_TYPES.length)];
    const remoteOption = this.REMOTE_OPTIONS[Math.floor(Math.random() * this.REMOTE_OPTIONS.length)];
    
    const salaryRange = sector.salaryRanges[experienceLevel as keyof typeof sector.salaryRanges];
    const salaryMin = salaryRange.min;
    const salaryMax = salaryRange.max;
    
    const title = sector.jobTitles[Math.floor(Math.random() * sector.jobTitles.length)];
    const company = sector.companies[Math.floor(Math.random() * sector.companies.length)];
    const location = sector.locations[Math.floor(Math.random() * sector.locations.length)];
    
    // Generate skills based on sector and experience level
    const skills = this.generateSkillsForSector(sector, experienceLevel);
    
    // Generate description based on title and skills
    const description = this.generateDescription(title, company, sector, experienceLevel, skills);
    
    // Generate random but realistic numbers
    const views = this.generateRandomNumber(50, 500);
    const applicationsCount = this.generateRandomNumber(5, 50);
    
    // Generate posted date (within last 30 days)
    const postedAt = this.generateRandomDate();
    
    // Generate salary string
    const salary = this.formatSalary(salaryMin, salaryMax);
    
    // Generate source ID
    const sourceId = `generated_${sectorId}_${index}_${Date.now()}`;

    return {
      title,
      company,
      companyLogo: this.generateCompanyLogo(company),
      location,
      country: 'IN',
      description,
      applyUrl: this.generateApplyUrl(company, title),
      postedAt,
      salary,
      salaryMin,
      salaryMax,
      salaryCurrency: 'INR',
      jobType,
      experienceLevel,
      skills,
      ...remoteOption,
      isUrgent: Math.random() < 0.1, // 10% chance of being urgent
      isFeatured: Math.random() < 0.05, // 5% chance of being featured
      sector: sector.name,
      views,
      applicationsCount,
      source: 'generated',
      sourceId,
      rawJson: {
        generated: true,
        sector: sectorId,
        timestamp: new Date().toISOString()
      }
    };
  }

  static generateMultipleJobsForSector(sectorId: string, count: number): GeneratedJob[] {
    const jobs: GeneratedJob[] = [];
    for (let i = 0; i < count; i++) {
      jobs.push(this.generateJobForSector(sectorId, i));
    }
    return jobs;
  }

  static generateJobsForAllSectors(jobsPerSector: number = 20): GeneratedJob[] {
    const allJobs: GeneratedJob[] = [];
    
    for (const sector of JOB_SECTORS) {
      const sectorJobs = this.generateMultipleJobsForSector(sector.id, jobsPerSector);
      allJobs.push(...sectorJobs);
    }
    
    return allJobs;
  }

  private static generateSkillsForSector(sector: JobSector, experienceLevel: string): string[] {
    const baseSkills = [...sector.skills];
    const skillCount = experienceLevel === 'entry' ? 3 : experienceLevel === 'mid' ? 5 : experienceLevel === 'senior' ? 7 : 8;
    
    // Shuffle and take required number of skills
    const shuffledSkills = baseSkills.sort(() => Math.random() - 0.5);
    return shuffledSkills.slice(0, Math.min(skillCount, baseSkills.length));
  }

  private static generateDescription(title: string, company: string, sector: JobSector, experienceLevel: string, skills: string[]): string {
    const experienceYears = experienceLevel === 'entry' ? '0-2' : experienceLevel === 'mid' ? '3-5' : experienceLevel === 'senior' ? '6-10' : '10+';
    
    return `${company} is seeking a talented ${title} to join our dynamic team. 

Key Responsibilities:
• Develop and maintain high-quality solutions in the ${sector.name.toLowerCase()} sector
• Collaborate with cross-functional teams to deliver exceptional results
• Contribute to technical architecture and design decisions
• Mentor junior team members and share best practices

Requirements:
• ${experienceYears} years of experience in ${sector.name.toLowerCase()}
• Strong proficiency in ${skills.slice(0, 3).join(', ')}
• Excellent problem-solving and communication skills
• Bachelor's degree in related field or equivalent experience

What We Offer:
• Competitive salary and benefits package
• Professional development opportunities
• Collaborative and innovative work environment
• Growth potential within the organization

Join us in shaping the future of ${sector.name.toLowerCase()} and make a meaningful impact in our industry.`;
  }

  private static generateCompanyLogo(company: string): string {
    const initials = company.split(' ').map(word => word[0]).join('').slice(0, 2);
    const colors = ['3B82F6', '10B981', 'F59E0B', 'EF4444', '8B5CF6', '06B6D4'];
    const color = colors[Math.floor(Math.random() * colors.length)];
    
    return `https://via.placeholder.com/150x150/${color}/FFFFFF?text=${initials}`;
  }

  private static generateApplyUrl(company: string, title: string): string {
    const companySlug = company.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const titleSlug = title.toLowerCase().replace(/[^a-z0-9]/g, '-');
    return `https://${companySlug}.com/careers/${titleSlug}`;
  }

  private static generateRandomNumber(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  private static generateRandomDate(): Date {
    const now = new Date();
    const daysAgo = Math.floor(Math.random() * 30);
    const randomDate = new Date(now);
    randomDate.setDate(now.getDate() - daysAgo);
    return randomDate;
  }

  private static formatSalary(min: number, max: number): string {
    const formatLakhs = (amount: number) => {
      if (amount >= 100000) {
        return `${(amount / 100000).toFixed(1)} LPA`;
      }
      return `₹${amount.toLocaleString()}`;
    };
    
    return `${formatLakhs(min)} - ${formatLakhs(max)}`;
  }

  static getSectorStats(): { sector: string; jobCount: number; avgSalary: number }[] {
    return JOB_SECTORS.map(sector => {
      const entrySalary = (sector.salaryRanges.entry.min + sector.salaryRanges.entry.max) / 2;
      const midSalary = (sector.salaryRanges.mid.min + sector.salaryRanges.mid.max) / 2;
      const seniorSalary = (sector.salaryRanges.senior.min + sector.salaryRanges.senior.max) / 2;
      const executiveSalary = (sector.salaryRanges.executive.min + sector.salaryRanges.executive.max) / 2;
      
      const avgSalary = (entrySalary + midSalary + seniorSalary + executiveSalary) / 4;
      
      return {
        sector: sector.name,
        jobCount: 20, // Default jobs per sector
        avgSalary: Math.round(avgSalary)
      };
    });
  }
}
