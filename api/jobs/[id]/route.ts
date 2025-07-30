import { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

interface JobDetails {
  id: string;
  title: string;
  company: string;
  location: string;
  salary?: string;
  description: string;
  requirements: string[];
  benefits: string[];
  sector: string;
  datePosted: string;
  jobType: string;
  experienceLevel: string;
  source: string;
  applyUrl?: string;
  logoUrl?: string;
  companySize?: string;
  workMode?: string; // Remote, Hybrid, On-site
  skills: string[];
  similarJobs?: any[];
}

class JobDetailsService {
  // Remove APIs object and all fetchReedJobDetails, fetchAdzunaJobDetails, fetchSerpApiJobDetails methods
  // Only keep internal/backend DB logic and fetchGenericJobDetails fallback

  async fetchJobDetails(jobId: string): Promise<JobDetails | null> {
    // Only use internal/backend DB logic here
    return await this.fetchGenericJobDetails(jobId);
  }

  private async fetchGenericJobDetails(jobId: string): Promise<JobDetails | null> {
    // For jobs that don't have detailed APIs, return basic structure
    // This could be enhanced with web scraping or other methods
    return null;
  }

  private async getCompanySize(companyId: string, source: string): Promise<string | undefined> {
    // Implementation would depend on available company APIs
    return undefined;
  }

  private extractRequirements(description: string): string[] {
    const requirements: string[] = [];
    const text = description.toLowerCase();

    // Common requirement patterns
    const patterns = [
      /(?:require[sd]?|must have|essential|mandatory)[:\s-]*([^\.]+)/gi,
      /(?:experience in|knowledge of|proficient in)[:\s-]*([^\.]+)/gi,
      /(?:\d+\+?\s*years?)[^\.]+/gi,
      /(?:degree|qualification|certification)[^\.]+/gi
    ];

    patterns.forEach(pattern => {
      const matches = description.match(pattern);
      if (matches) {
        requirements.push(...matches.slice(0, 5)); // Limit to 5 per pattern
      }
    });

    return [...new Set(requirements)].slice(0, 10); // Remove duplicates, limit to 10
  }

  private extractBenefits(description: string): string[] {
    const benefits: string[] = [];
    const text = description.toLowerCase();

    // Common benefit keywords
    const benefitKeywords = [
      'health insurance', 'dental', 'vision', 'retirement', '401k', 'pension',
      'flexible hours', 'remote work', 'work from home', 'vacation', 'pto',
      'training', 'development', 'career growth', 'bonus', 'overtime',
      'gym membership', 'free lunch', 'coffee', 'parking'
    ];

    benefitKeywords.forEach(keyword => {
      if (text.includes(keyword)) {
        benefits.push(keyword.charAt(0).toUpperCase() + keyword.slice(1));
      }
    });

    return [...new Set(benefits)];
  }

  private extractSkills(description: string): string[] {
    const skills: string[] = [];
    const text = description.toLowerCase();

    // Technical skills
    const techSkills = [
      'javascript', 'python', 'java', 'c++', 'react', 'angular', 'vue',
      'node.js', 'sql', 'mongodb', 'postgresql', 'aws', 'azure', 'docker',
      'kubernetes', 'git', 'agile', 'scrum', 'html', 'css', 'typescript',
      'machine learning', 'ai', 'data science', 'analytics'
    ];

    // Soft skills
    const softSkills = [
      'communication', 'leadership', 'teamwork', 'problem solving',
      'analytical', 'creative', 'detail oriented', 'time management'
    ];

    [...techSkills, ...softSkills].forEach(skill => {
      if (text.includes(skill)) {
        skills.push(skill.charAt(0).toUpperCase() + skill.slice(1));
      }
    });

    return [...new Set(skills)];
  }

  private determineWorkMode(description: string): string {
    const text = description.toLowerCase();
    
    if (text.includes('remote') || text.includes('work from home')) return 'Remote';
    if (text.includes('hybrid')) return 'Hybrid';
    if (text.includes('on-site') || text.includes('office')) return 'On-site';
    
    return 'On-site'; // Default
  }

  private determineSector(jobTitle: string): string {
    // Same logic as in the main jobs API
    const title = jobTitle.toLowerCase();
    
    const sectors = {
      'technology': ['developer', 'engineer', 'programmer', 'software', 'tech', 'IT'],
      'healthcare': ['nurse', 'doctor', 'medical', 'health', 'care'],
      'finance': ['finance', 'accounting', 'bank', 'investment'],
      'education': ['teacher', 'professor', 'education', 'school'],
      'sales': ['sales', 'account manager', 'business development'],
      'marketing': ['marketing', 'brand', 'social media', 'seo'],
    };
    
    for (const [sector, keywords] of Object.entries(sectors)) {
      if (keywords.some(keyword => title.includes(keyword))) {
        return sector;
      }
    }
    
    return 'general';
  }

  private determineExperienceLevel(title: string, description: string): string {
    const text = `${title} ${description}`.toLowerCase();
    
    if (text.includes('senior') || text.includes('lead') || text.includes('5+ years')) {
      return 'Senior';
    }
    if (text.includes('junior') || text.includes('entry') || text.includes('graduate')) {
      return 'Entry Level';
    }
    
    return 'Mid Level';
  }

  async getSimilarJobs(jobId: string, title: string, sector: string): Promise<any[]> {
    // Implementation would query the main jobs API with similar parameters
    try {
      const searchQuery = title.split(' ').slice(0, 2).join(' '); // Use first 2 words of title
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/jobs?q=${encodeURIComponent(searchQuery)}&sector=${sector}&limit=5`);
      
      if (!response.ok) return [];
      
      const data = await response.json();
      return data.jobs.filter((job: any) => job.id !== jobId).slice(0, 3);
    } catch {
      return [];
    }
  }
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const jobId = params.id;
    
    if (!jobId) {
      return NextResponse.json({
        success: false,
        error: 'Job ID is required'
      }, { status: 400 });
    }

    const jobService = new JobDetailsService();
    const jobDetails = await jobService.fetchJobDetails(jobId);

    if (!jobDetails) {
      // If job not found, provide Google search fallback
      const googleSearchUrl = `https://www.google.com/search?q=${encodeURIComponent(`job ${jobId}`)}&ibp=htl;jobs`;
      
      return NextResponse.json({
        success: false,
        error: 'Job not found',
        googleFallback: {
          message: "Job details not available. Search for similar jobs on Google?",
          url: googleSearchUrl
        }
      }, { status: 404 });
    }

    // Get similar jobs
    const similarJobs = await jobService.getSimilarJobs(jobId, jobDetails.title, jobDetails.sector);
    jobDetails.similarJobs = similarJobs;

    return NextResponse.json({
      success: true,
      job: jobDetails
    });

  } catch (error) {
    console.error('Job Details API Error:', error);
    
    const googleSearchUrl = `https://www.google.com/search?q=jobs&ibp=htl;jobs`;
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch job details',
      googleFallback: {
        message: "Our job service is temporarily unavailable. Search on Google instead?",
        url: googleSearchUrl
      }
    }, { status: 500 });
  }
}
