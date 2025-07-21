import { NextRequest, NextResponse } from 'next/server';

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

console.log('🚀 Jobs API route loaded');
console.log('Environment check:', {
  SERPAPI_KEY: process.env.SERPAPI_KEY ? 'SET' : 'NOT SET',
  ADZUNA_APP_ID: process.env.ADZUNA_APP_ID ? 'SET' : 'NOT SET',
  ADZUNA_API_KEY: process.env.ADZUNA_API_KEY ? 'SET' : 'NOT SET',
  REED_API_KEY: process.env.REED_API_KEY ? 'SET' : 'NOT SET'
});

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
  private readonly APIs = {
    reed: process.env.REED_API_KEY,
    adzuna: {
      id: process.env.ADZUNA_APP_ID,
      key: process.env.ADZUNA_API_KEY
    },
    serpapi: process.env.SERPAPI_KEY
  };

  async fetchReedJobs(query: string, location: string = 'UK'): Promise<JobData[]> {
    if (!this.APIs.reed) return [];
    
    try {
      const response = await fetch(`https://www.reed.co.uk/api/1.0/search?keywords=${encodeURIComponent(query)}&location=${encodeURIComponent(location)}&resultsToTake=20`, {
        headers: {
          'Authorization': `Basic ${Buffer.from(this.APIs.reed + ':').toString('base64')}`,
          'User-Agent': 'JobPortal/1.0'
        }
      });

      if (!response.ok) return [];
      
      const data = await response.json();
      return data.results?.map((job: any) => ({
        id: `reed_${job.jobId}`,
        title: job.jobTitle,
        company: job.employerName,
        location: job.locationName,
        salary: job.minimumSalary && job.maximumSalary ? `£${job.minimumSalary} - £${job.maximumSalary}` : job.minimumSalary ? `£${job.minimumSalary}+` : null,
        description: job.jobDescription,
        sector: this.determineSector(job.jobTitle),
        datePosted: job.date,
        jobType: job.jobType || 'Full-time',
        experienceLevel: this.determineExperienceLevel(job.jobTitle, job.jobDescription),
        source: 'Reed',
        applyUrl: job.jobUrl,
        logoUrl: job.employerProfileUrl
      })) || [];
    } catch (error) {
      console.error('Reed API Error:', error);
      return [];
    }
  }

  async fetchAdzunaJobs(query: string, location: string = 'uk'): Promise<JobData[]> {
    if (!this.APIs.adzuna.id || !this.APIs.adzuna.key) return [];
    
    try {
      const response = await fetch(
        `https://api.adzuna.com/v1/api/jobs/${location}/search/1?app_id=${this.APIs.adzuna.id}&app_key=${this.APIs.adzuna.key}&what=${encodeURIComponent(query)}&results_per_page=20&content-type=application/json`
      );

      if (!response.ok) return [];
      
      const data = await response.json();
      return data.results?.map((job: any) => ({
        id: `adzuna_${job.id}`,
        title: job.title,
        company: job.company.display_name,
        location: job.location.display_name,
        salary: job.salary_min && job.salary_max ? `£${job.salary_min} - £${job.salary_max}` : job.salary_min ? `£${job.salary_min}+` : null,
        description: job.description,
        sector: this.determineSector(job.title),
        datePosted: job.created,
        jobType: job.contract_type || 'Full-time',
        experienceLevel: this.determineExperienceLevel(job.title, job.description),
        source: 'Adzuna',
        applyUrl: job.redirect_url,
        logoUrl: job.company?.logo_urls?.['90x90']
      })) || [];
    } catch (error) {
      console.error('Adzuna API Error:', error);
      return [];
    }
  }

  async fetchSerpApiJobs(query: string, location: string = 'United Kingdom'): Promise<JobData[]> {
    if (!this.APIs.serpapi) return [];
    
    try {
      const response = await fetch(
        `https://serpapi.com/search.json?engine=google_jobs&q=${encodeURIComponent(query)}&location=${encodeURIComponent(location)}&api_key=${this.APIs.serpapi}&num=20`
      );

      if (!response.ok) return [];
      
      const data = await response.json();
      return data.jobs_results?.map((job: any, index: number) => ({
        id: `serp_${Date.now()}_${index}`,
        title: job.title,
        company: job.company_name,
        location: job.location,
        salary: job.salary || null,
        description: job.description || job.snippet || '',
        sector: this.determineSector(job.title),
        datePosted: job.posted_at || new Date().toISOString(),
        jobType: job.schedule_type || 'Full-time',
        experienceLevel: this.determineExperienceLevel(job.title, job.description || ''),
        source: 'Google Jobs',
        applyUrl: job.share_link || job.link,
        logoUrl: job.thumbnail
      })) || [];
    } catch (error) {
      console.error('SerpAPI Error:', error);
      return [];
    }
  }

  async fetchLinkedInJobs(query: string): Promise<JobData[]> {
    // Using RapidAPI or similar service for LinkedIn jobs
    try {
      const response = await fetch(`https://linkedin-jobs-search.p.rapidapi.com/search?keywords=${encodeURIComponent(query)}&location=United%20Kingdom&pageNum=1`, {
        headers: {
          'X-RapidAPI-Key': process.env.RAPIDAPI_KEY || '',
          'X-RapidAPI-Host': 'linkedin-jobs-search.p.rapidapi.com'
        }
      });

      if (!response.ok) return [];
      
      const data = await response.json();
      return data.data?.map((job: any, index: number) => ({
        id: `linkedin_${Date.now()}_${index}`,
        title: job.title,
        company: job.company,
        location: job.location,
        salary: job.salary || null,
        description: job.description || '',
        sector: this.determineSector(job.title),
        datePosted: job.postedDate || new Date().toISOString(),
        jobType: job.workType || 'Full-time',
        experienceLevel: this.determineExperienceLevel(job.title, job.description || ''),
        source: 'LinkedIn',
        applyUrl: job.jobUrl,
        logoUrl: job.companyLogo
      })) || [];
    } catch (error) {
      console.error('LinkedIn API Error:', error);
      return [];
    }
  }

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
    const searchQuery = sector && JOB_SECTORS[sector] 
      ? JOB_SECTORS[sector][0] 
      : query || 'jobs';

    console.log(`🔍 Searching for "${searchQuery}" in ${location || 'any location'}`);

    // Parallel API calls for faster response
    const [reedJobs, adzunaJobs, serpJobs, linkedinJobs] = await Promise.allSettled([
      this.fetchReedJobs(searchQuery, location),
      this.fetchAdzunaJobs(searchQuery, location?.toLowerCase()),
      this.fetchSerpApiJobs(searchQuery, location),
      this.fetchLinkedInJobs(searchQuery)
    ]);

    const allJobs: JobData[] = [];
    
    // Collect results from successful API calls
    if (reedJobs.status === 'fulfilled') {
      console.log(`✅ Reed: ${reedJobs.value.length} jobs`);
      allJobs.push(...reedJobs.value);
    } else {
      console.log(`❌ Reed: Failed`);
    }
    
    if (adzunaJobs.status === 'fulfilled') {
      console.log(`✅ Adzuna: ${adzunaJobs.value.length} jobs`);
      allJobs.push(...adzunaJobs.value);
    } else {
      console.log(`❌ Adzuna: Failed`);
    }
    
    if (serpJobs.status === 'fulfilled') {
      console.log(`✅ SerpAPI: ${serpJobs.value.length} jobs`);
      allJobs.push(...serpJobs.value);
    } else {
      console.log(`❌ SerpAPI: Failed`);
    }
    
    if (linkedinJobs.status === 'fulfilled') {
      console.log(`✅ LinkedIn: ${linkedinJobs.value.length} jobs`);
      allJobs.push(...linkedinJobs.value);
    } else {
      console.log(`❌ LinkedIn: Failed`);
    }

    // If no jobs found from APIs, provide mock data
    if (allJobs.length === 0) {
      console.log('🔄 No API results, providing mock data...');
      return this.getMockJobs(searchQuery, location || 'United Kingdom');
    }

    // Remove duplicates based on title and company
    const uniqueJobs = allJobs.filter((job, index, arr) => 
      index === arr.findIndex(j => 
        j.title.toLowerCase() === job.title.toLowerCase() && 
        j.company.toLowerCase() === job.company.toLowerCase()
      )
    );

    console.log(`🎆 Found ${uniqueJobs.length} unique jobs total`);

    // Sort by date (newest first)
    return uniqueJobs.sort((a, b) => new Date(b.datePosted).getTime() - new Date(a.datePosted).getTime());
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
    console.error('Jobs API Error:', error);
    
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
