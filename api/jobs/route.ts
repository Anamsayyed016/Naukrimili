import { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

// Job sectors configuration
const JOB_SECTORS = {
  'technology': ['software developer', 'web developer', 'data scientist', 'devops engineer', 'cybersecurity', 'AI engineer'],
  'healthcare': ['nurse', 'doctor', 'pharmacist', 'medical assistant', 'healthcare administrator', 'therapist'],
  'finance': ['accountant', 'financial analyst', 'investment banker', 'insurance agent', 'tax advisor', 'auditor'],
  'education': ['teacher', 'professor', 'tutor', 'education coordinator', 'school administrator', 'librarian'],
  'engineering': ['mechanical engineer', 'civil engineer', 'electrical engineer', 'chemical engineer', 'aerospace engineer'],
  'marketing': ['digital marketer', 'content creator', 'SEO specialist', 'brand manager', 'social media manager'],
  'sales': ['sales representative', 'account manager', 'business development', 'sales director', 'retail associate'],
  'construction': ['construction worker', 'project manager', 'architect', 'carpenter', 'electrician', 'plumber'],
  'hospitality': ['hotel manager', 'chef', 'waiter', 'event coordinator', 'travel agent', 'housekeeper'],
  'logistics': ['supply chain manager', 'warehouse worker', 'delivery driver', 'logistics coordinator', 'freight forwarder'],
  'legal': ['lawyer', 'paralegal', 'legal assistant', 'compliance officer', 'contract manager'],
  'design': ['graphic designer', 'UX designer', 'interior designer', 'fashion designer', 'web designer'],
  'manufacturing': ['production manager', 'quality control', 'machine operator', 'maintenance technician'],
  'retail': ['store manager', 'cashier', 'inventory specialist', 'customer service', 'visual merchandiser'],
  'government': ['civil servant', 'policy analyst', 'public administrator', 'social worker', 'urban planner'],
  'media': ['journalist', 'video editor', 'photographer', 'content writer', 'broadcaster'],
  'automotive': ['automotive technician', 'car salesperson', 'parts specialist', 'service advisor'],
  'agriculture': ['farmer', 'agricultural scientist', 'veterinarian', 'farm manager', 'food inspector'],
  'real-estate': ['real estate agent', 'property manager', 'appraiser', 'mortgage broker'],
  'telecommunications': ['network engineer', 'telecom technician', 'call center agent', 'field technician']
};

// Environment check removed for production build

interface JobData {
  id: string;
  title: string;
  company: string;
  location: string;
  salary?: string;
  description: string;
  sector: string;
  datePosted: string;
  jobType: string;
  experienceLevel: string;
  source: string;
  applyUrl?: string;
  logoUrl?: string;
}

class JobAggregator {
  // Remove APIs object and all fetchReedJobs, fetchAdzunaJobs, fetchSerpApiJobs, fetchLinkedInJobs methods
  // Only keep internal/backend DB logic and getMockJobs fallback

  private determineSector(jobTitle: string): string {
    const title = jobTitle.toLowerCase();
    
    for (const [sector, keywords] of Object.entries(JOB_SECTORS)) {
      if (keywords.some(keyword => title.includes(keyword.toLowerCase()))) {
        return sector;
      }
    }
    
    // Additional keyword matching
    if (title.includes('manager') || title.includes('director')) return 'management';
    if (title.includes('analyst') || title.includes('research')) return 'research';
    if (title.includes('support') || title.includes('help')) return 'customer-service';
    
    return 'general';
  }

  private determineExperienceLevel(title: string, description: string): string {
    const text = `${title} ${description}`.toLowerCase();
    
    if (text.includes('senior') || text.includes('lead') || text.includes('principal') || text.includes('5+ years') || text.includes('experienced')) {
      return 'Senior';
    }
    if (text.includes('junior') || text.includes('entry') || text.includes('graduate') || text.includes('trainee') || text.includes('intern')) {
      return 'Entry Level';
    }
    if (text.includes('mid') || text.includes('2-4 years') || text.includes('3+ years')) {
      return 'Mid Level';
    }
    
    return 'Mid Level';
  }

  async aggregateJobs(query: string, location?: string, sector?: string): Promise<JobData[]> {
    const searchQuery = sector && JOB_SECTORS[sector as keyof typeof JOB_SECTORS] 
      ? JOB_SECTORS[sector as keyof typeof JOB_SECTORS][0] 
      : query || 'jobs';

    // Only use internal/backend DB logic here
    // If no jobs found, provide mock data
    return this.getMockJobs(searchQuery, location || 'United Kingdom');
  }

  private getMockJobs(query: string, location: string): JobData[] {
    const mockJobs = [
      {
        id: 'mock_1',
        title: `Senior ${query} Developer`,
        company: 'TechCorp Solutions',
        location: location,
        salary: '£50,000 - £70,000',
        description: `We are looking for an experienced ${query} professional to join our growing team. You will work on cutting-edge projects and collaborate with talented developers.`,
        sector: this.determineSector(`${query} Developer`),
        datePosted: new Date().toISOString(),
        jobType: 'Full-time',
        experienceLevel: 'Senior',
        source: 'Demo Data',
        applyUrl: '#',
        logoUrl: undefined
      },
      {
        id: 'mock_2',
        title: `${query} Specialist`,
        company: 'Innovation Labs',
        location: location,
        salary: '£35,000 - £55,000',
        description: `Join our dynamic team as a ${query} specialist. We offer excellent career progression and work-life balance.`,
        sector: this.determineSector(`${query} Specialist`),
        datePosted: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        jobType: 'Full-time',
        experienceLevel: 'Mid Level',
        source: 'Demo Data',
        applyUrl: '#',
        logoUrl: undefined
      },
      {
        id: 'mock_3',
        title: `Junior ${query} Role`,
        company: 'StartUp Central',
        location: location,
        salary: '£25,000 - £35,000',
        description: `Perfect entry-level position for someone passionate about ${query}. Full training provided with mentorship opportunities.`,
        sector: this.determineSector(`${query} Role`),
        datePosted: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        jobType: 'Full-time',
        experienceLevel: 'Entry Level',
        source: 'Demo Data',
        applyUrl: '#',
        logoUrl: undefined
      },
      {
        id: 'mock_4',
        title: `Lead ${query} Manager`,
        company: 'Enterprise Solutions',
        location: location,
        salary: '£65,000 - £85,000',
        description: `Lead a team of ${query} professionals in this senior management role. Experience with team leadership required.`,
        sector: this.determineSector(`${query} Manager`),
        datePosted: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        jobType: 'Full-time',
        experienceLevel: 'Senior',
        source: 'Demo Data',
        applyUrl: '#',
        logoUrl: undefined
      },
      {
        id: 'mock_5',
        title: `Freelance ${query} Consultant`,
        company: 'Consultancy Group',
        location: `Remote / ${location}`,
        salary: '£300 - £500 per day',
        description: `Flexible freelance opportunity for experienced ${query} professionals. Work with various clients on exciting projects.`,
        sector: this.determineSector(`${query} Consultant`),
        datePosted: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        jobType: 'Contract',
        experienceLevel: 'Senior',
        source: 'Demo Data',
        applyUrl: '#',
        logoUrl: undefined
      }
    ];

    return mockJobs;
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || searchParams.get('query') || '';
    const location = searchParams.get('location') || 'United Kingdom';
    const sector = searchParams.get('sector') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const aggregator = new JobAggregator();
    const jobs = await aggregator.aggregateJobs(query, location, sector);

    // If no jobs found, provide Google search fallback URL
    if (jobs.length === 0) {
      const googleSearchUrl = `https://www.google.com/search?q=${encodeURIComponent(`${query} jobs ${location}`)}&ibp=htl;jobs`;
      
      return NextResponse.json({
        success: true,
        jobs: [],
        totalCount: 0,
        page,
        hasNextPage: false,
        googleFallback: {
          message: "No jobs found in our database. Search on Google instead?",
          url: googleSearchUrl
        },
        sectors: Object.keys(JOB_SECTORS)
      });
    }

    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedJobs = jobs.slice(startIndex, endIndex);

    return NextResponse.json({
      success: true,
      jobs: paginatedJobs,
      totalCount: jobs.length,
      page,
      hasNextPage: endIndex < jobs.length,
      sectors: Object.keys(JOB_SECTORS),
      availableSectors: [...new Set(jobs.map(job => job.sector))]
    });

  } catch (error) {
    // Fallback to Google search if API fails
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || searchParams.get('query') || 'jobs';
    const location = searchParams.get('location') || 'United Kingdom';
    const googleSearchUrl = `https://www.google.com/search?q=${encodeURIComponent(`${query} jobs ${location}`)}&ibp=htl;jobs`;

    return NextResponse.json({
      success: false,
      error: 'Failed to fetch jobs',
      jobs: [],
      googleFallback: {
        message: "Our job search is temporarily unavailable. Search on Google instead?",
        url: googleSearchUrl
      },
      sectors: Object.keys(JOB_SECTORS)
    }, { status: 500 });
  }
}
