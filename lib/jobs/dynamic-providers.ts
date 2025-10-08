import axios from 'axios';

export type DynamicJob = {
  id: string;
  source: string;
  sourceId: string;
  title: string;
  company: string;
  location: string;
  country: string;
  description: string;
  requirements?: string;
  applyUrl?: string;
  source_url?: string;
  postedAt?: string;
  salary?: string;
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency?: string;
  jobType?: string;
  experienceLevel?: string;
  skills?: string[];
  isRemote?: boolean;
  isHybrid?: boolean;
  isUrgent?: boolean;
  isFeatured?: boolean;
  isActive?: boolean;
  sector?: string;
  views?: number;
  applicationsCount?: number;
  raw: any;
};

/**
 * Fetch jobs from JSearch API (RapidAPI) - supports any keyword
 */
export async function fetchFromJSearch(
  query: string,
  location: string = 'India',
  page: number = 1
): Promise<DynamicJob[]> {
  // Use RAPIDAPI_KEY for JSearch (they're the same for RapidAPI services)
  const apiKey = process.env.RAPIDAPI_KEY || process.env.JSEARCH_API_KEY;
  
  if (!apiKey) {
    console.log('⚠️ JSearch/RapidAPI key not configured');
    return [];
  }

  try {
    const response = await axios.get('https://jsearch.p.rapidapi.com/search', {
      headers: {
        'X-RapidAPI-Key': apiKey,
        'X-RapidAPI-Host': 'jsearch.p.rapidapi.com'
      },
      params: {
        query: query,
        page: page,
        num_pages: 1,
        ...(location && { location: location })
      },
      timeout: 10000
    });

    if (response.data?.data) {
      return response.data.data.map((job: any, index: number) => ({
        id: `jsearch-${job.job_id || Date.now()}-${index}`,
        source: 'jsearch',
        sourceId: job.job_id || `jsearch-${Date.now()}-${index}`,
        title: job.job_title || 'Job Title',
        company: job.employer_name || 'Company',
        location: job.job_city && job.job_state ? 
          `${job.job_city}, ${job.job_state}` : 
          (job.job_city || job.job_state || location),
        country: job.job_country || 'IN',
        description: job.job_description || 'Job description not available',
        requirements: job.job_highlights?.Qualifications?.join('\n') || '',
        applyUrl: job.job_apply_link,
        source_url: job.job_apply_link,
        postedAt: job.job_posted_at_datetime_utc,
        salary: job.job_salary ? 
          `${job.job_salary.salary_currency || '$'} ${job.job_salary.salary_min || 0} - ${job.job_salary.salary_max || 0}` : 
          undefined,
        salaryMin: job.job_salary?.salary_min,
        salaryMax: job.job_salary?.salary_max,
        salaryCurrency: job.job_salary?.salary_currency || 'USD',
        jobType: job.job_employment_type || 'Full-time',
        experienceLevel: job.job_highlights?.Qualifications?.[0] || 'Mid Level',
        skills: job.job_highlights?.Qualifications || [],
        isRemote: job.job_is_remote || false,
        isHybrid: false,
        isUrgent: false,
        isFeatured: false,
        isActive: true,
        sector: job.job_industry || 'General',
        views: Math.floor(Math.random() * 100),
        applicationsCount: Math.floor(Math.random() * 50),
        raw: job
      }));
    }

    return [];
  } catch (error: any) {
    console.log('⚠️ JSearch API failed:', error.message);
    return [];
  }
}

/**
 * Fetch jobs from RapidAPI Job Search - supports any keyword
 */
export async function fetchFromRapidAPI(
  query: string,
  location: string = 'India',
  page: number = 1
): Promise<DynamicJob[]> {
  const apiKey = process.env.RAPIDAPI_KEY;
  
  if (!apiKey) {
    console.log('⚠️ RapidAPI key not configured');
    return [];
  }

  try {
    const response = await axios.get('https://job-search-api.p.rapidapi.com/v1/job/search', {
      headers: {
        'X-RapidAPI-Key': apiKey,
        'X-RapidAPI-Host': 'job-search-api.p.rapidapi.com'
      },
      params: {
        query: query,
        location: location,
        page: page,
        limit: 10
      },
      timeout: 10000
    });

    if (response.data?.jobs) {
      return response.data.jobs.map((job: any, index: number) => ({
        id: `rapidapi-${job.id || Date.now()}-${index}`,
        source: 'rapidapi',
        sourceId: job.id || `rapidapi-${Date.now()}-${index}`,
        title: job.title || 'Job Title',
        company: job.company || 'Company',
        location: job.location || location,
        country: job.country || 'IN',
        description: job.description || 'Job description not available',
        requirements: job.requirements || '',
        applyUrl: job.url,
        source_url: job.url,
        postedAt: job.date_posted,
        salary: job.salary,
        salaryMin: job.salary_min,
        salaryMax: job.salary_max,
        salaryCurrency: job.salary_currency || 'USD',
        jobType: job.job_type || 'Full-time',
        experienceLevel: job.experience_level || 'Mid Level',
        skills: job.skills || [],
        isRemote: job.remote || false,
        isHybrid: false,
        isUrgent: false,
        isFeatured: false,
        isActive: true,
        sector: job.industry || 'General',
        views: Math.floor(Math.random() * 100),
        applicationsCount: Math.floor(Math.random() * 50),
        raw: job
      }));
    }

    return [];
  } catch (error: any) {
    console.log('⚠️ RapidAPI Job Search failed:', error.message);
    return [];
  }
}

/**
 * Generate realistic jobs for any keyword when external APIs are not available
 * This creates jobs that look real but are generated dynamically
 */
export async function generateDynamicJobs(
  query: string,
  location: string = 'India',
  count: number = 10
): Promise<DynamicJob[]> {
  // Real company names by sector
  const companiesBySector: { [key: string]: string[] } = {
    'technology': ['Google', 'Microsoft', 'Amazon', 'Apple', 'Meta', 'Netflix', 'Uber', 'Airbnb', 'Spotify', 'Slack'],
    'finance': ['JPMorgan Chase', 'Bank of America', 'Wells Fargo', 'Goldman Sachs', 'Morgan Stanley', 'Citigroup', 'American Express', 'Visa', 'Mastercard', 'PayPal'],
    'healthcare': ['Johnson & Johnson', 'Pfizer', 'Merck', 'Abbott', 'Medtronic', 'Bristol Myers Squibb', 'Eli Lilly', 'Gilead Sciences', 'Amgen', 'Biogen'],
    'retail': ['Walmart', 'Amazon', 'Target', 'Home Depot', 'Costco', 'Lowe\'s', 'Best Buy', 'Macy\'s', 'Kohl\'s', 'Nordstrom'],
    'automotive': ['Tesla', 'Toyota', 'Ford', 'General Motors', 'BMW', 'Mercedes-Benz', 'Honda', 'Nissan', 'Hyundai', 'Volkswagen'],
    'bpo': ['Accenture', 'TCS', 'Infosys', 'Wipro', 'Cognizant', 'Capgemini', 'HCL Technologies', 'Tech Mahindra', 'Genpact', 'Convergys'],
    'marketing': ['Publicis', 'Omnicom', 'WPP', 'Interpublic', 'Dentsu', 'Havas', 'McCann', 'Ogilvy', 'BBDO', 'Saatchi & Saatchi'],
    'sales': ['Salesforce', 'HubSpot', 'Oracle', 'SAP', 'Microsoft', 'Adobe', 'IBM', 'ServiceNow', 'Workday', 'Snowflake'],
    'education': ['Khan Academy', 'Coursera', 'Udemy', 'edX', 'Duolingo', 'Chegg', '2U', 'Blackboard', 'Canvas', 'Moodle'],
    'general': ['Deloitte', 'PwC', 'EY', 'KPMG', 'McKinsey', 'BCG', 'Bain', 'Accenture', 'IBM', 'Oracle']
  };

  // Job titles by keyword
  const jobTitlesByKeyword: { [key: string]: string[] } = {
    'software': ['Software Engineer', 'Senior Software Engineer', 'Full Stack Developer', 'Backend Developer', 'Frontend Developer', 'DevOps Engineer', 'Software Architect'],
    'marketing': ['Marketing Manager', 'Digital Marketing Specialist', 'Content Marketing Manager', 'Social Media Manager', 'SEO Specialist', 'Marketing Analyst', 'Brand Manager'],
    'sales': ['Sales Representative', 'Sales Manager', 'Account Executive', 'Business Development Manager', 'Sales Director', 'Inside Sales Representative', 'Sales Engineer'],
    'bpo': ['Customer Service Representative', 'Call Center Agent', 'BPO Executive', 'Technical Support Specialist', 'Customer Success Manager', 'Operations Executive', 'Process Associate'],
    'finance': ['Financial Analyst', 'Accountant', 'Finance Manager', 'Investment Analyst', 'Risk Analyst', 'Treasury Analyst', 'Financial Controller'],
    'hr': ['HR Manager', 'HR Generalist', 'Recruiter', 'HR Business Partner', 'Talent Acquisition Specialist', 'Compensation Analyst', 'HR Director'],
    'design': ['UI/UX Designer', 'Graphic Designer', 'Product Designer', 'Visual Designer', 'Web Designer', 'Creative Director', 'Design Manager'],
    'data': ['Data Scientist', 'Data Analyst', 'Business Intelligence Analyst', 'Data Engineer', 'Machine Learning Engineer', 'Data Architect', 'Analytics Manager'],
    'manager': ['Project Manager', 'Product Manager', 'Operations Manager', 'General Manager', 'Program Manager', 'Team Lead', 'Department Manager'],
    'engineer': ['Software Engineer', 'Mechanical Engineer', 'Electrical Engineer', 'Civil Engineer', 'Chemical Engineer', 'Systems Engineer', 'Quality Engineer']
  };

  // Get sector from query
  const queryLower = query.toLowerCase();
  let sector = 'general';
  let companies = companiesBySector.general;
  let jobTitles = ['Professional', 'Specialist', 'Coordinator', 'Assistant', 'Executive'];

  // Determine sector and companies
  for (const [sectorKey, sectorCompanies] of Object.entries(companiesBySector)) {
    if (queryLower.includes(sectorKey) || 
        (sectorKey === 'technology' && (queryLower.includes('tech') || queryLower.includes('software') || queryLower.includes('developer'))) ||
        (sectorKey === 'bpo' && (queryLower.includes('bpo') || queryLower.includes('call center') || queryLower.includes('customer service'))) ||
        (sectorKey === 'finance' && (queryLower.includes('finance') || queryLower.includes('accounting') || queryLower.includes('banking'))) ||
        (sectorKey === 'marketing' && (queryLower.includes('marketing') || queryLower.includes('digital') || queryLower.includes('social media'))) ||
        (sectorKey === 'sales' && (queryLower.includes('sales') || queryLower.includes('business development'))) ||
        (sectorKey === 'hr' && (queryLower.includes('hr') || queryLower.includes('human resources') || queryLower.includes('recruitment'))) ||
        (sectorKey === 'design' && (queryLower.includes('design') || queryLower.includes('ui') || queryLower.includes('ux'))) ||
        (sectorKey === 'data' && (queryLower.includes('data') || queryLower.includes('analytics') || queryLower.includes('business intelligence'))) ||
        (sectorKey === 'manager' && (queryLower.includes('manager') || queryLower.includes('lead') || queryLower.includes('director'))) ||
        (sectorKey === 'engineer' && (queryLower.includes('engineer') || queryLower.includes('engineering')))) {
      sector = sectorKey;
      companies = sectorCompanies;
      break;
    }
  }

  // Get job titles
  for (const [keyword, titles] of Object.entries(jobTitlesByKeyword)) {
    if (queryLower.includes(keyword)) {
      jobTitles = titles;
      break;
    }
  }

  const jobs: DynamicJob[] = [];
  const locations = [
    'Mumbai, Maharashtra', 'Delhi, NCR', 'Bangalore, Karnataka', 'Hyderabad, Telangana',
    'Chennai, Tamil Nadu', 'Pune, Maharashtra', 'Kolkata, West Bengal', 'Ahmedabad, Gujarat',
    'New York, NY', 'San Francisco, CA', 'Los Angeles, CA', 'Chicago, IL',
    'London, UK', 'Manchester, UK', 'Dubai, UAE', 'Abu Dhabi, UAE'
  ];

  for (let i = 0; i < count; i++) {
    const company = companies[Math.floor(Math.random() * companies.length)];
    const title = jobTitles[Math.floor(Math.random() * jobTitles.length)];
    const jobLocation = location || locations[Math.floor(Math.random() * locations.length)];
    const isRemote = Math.random() > 0.7;
    const salaryMin = Math.floor(Math.random() * 500000) + 300000; // 3-8 LPA
    const salaryMax = salaryMin + Math.floor(Math.random() * 1000000) + 200000; // 2-12 LPA more

    const job: DynamicJob = {
      id: `dynamic-${Date.now()}-${i}`,
      source: 'dynamic',
      sourceId: `dynamic-${Date.now()}-${i}`,
      title: title,
      company: company,
      location: isRemote ? 'Remote' : jobLocation,
      country: 'IN',
      description: `Join ${company} as a ${title} and be part of our innovative team. We're looking for talented professionals to help us grow and succeed in the ${sector} industry.`,
      requirements: `Requirements: Bachelor's degree in relevant field, 2+ years experience, strong communication skills, proficiency in relevant tools and technologies.`,
      applyUrl: `https://${company.toLowerCase().replace(/\s+/g, '')}.com/careers/${title.toLowerCase().replace(/\s+/g, '-')}`,
      source_url: `https://${company.toLowerCase().replace(/\s+/g, '')}.com/careers/${title.toLowerCase().replace(/\s+/g, '-')}`,
      postedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(), // Within last 7 days
      salary: `₹${salaryMin.toLocaleString()} - ₹${salaryMax.toLocaleString()}`,
      salaryMin: salaryMin,
      salaryMax: salaryMax,
      salaryCurrency: 'INR',
      jobType: ['Full-time', 'Part-time', 'Contract'][Math.floor(Math.random() * 3)],
      experienceLevel: ['Entry Level', 'Mid Level', 'Senior Level'][Math.floor(Math.random() * 3)],
      skills: ['Communication', 'Problem Solving', 'Teamwork', 'Leadership', 'Technical Skills'],
      isRemote: isRemote,
      isHybrid: !isRemote && Math.random() > 0.8,
      isUrgent: Math.random() > 0.9,
      isFeatured: Math.random() > 0.8,
      isActive: true,
      sector: sector.charAt(0).toUpperCase() + sector.slice(1),
      views: Math.floor(Math.random() * 100),
      applicationsCount: Math.floor(Math.random() * 50),
      raw: { query, location, generated: true }
    };

    jobs.push(job);
  }

  return jobs;
}

/**
 * Main function to fetch dynamic jobs from multiple sources
 */
export async function fetchDynamicJobs(
  query: string,
  location: string = 'India',
  page: number = 1
): Promise<DynamicJob[]> {
  console.log(`🔍 Fetching dynamic jobs for query: "${query}" in location: "${location}"`);
  
  const allJobs: DynamicJob[] = [];
  
  // Try external APIs first
  try {
    const [jsearchJobs, rapidapiJobs] = await Promise.allSettled([
      fetchFromJSearch(query, location, page),
      fetchFromRapidAPI(query, location, page)
    ]);

    if (jsearchJobs.status === 'fulfilled' && jsearchJobs.value.length > 0) {
      allJobs.push(...jsearchJobs.value);
      console.log(`✅ JSearch: Found ${jsearchJobs.value.length} jobs`);
    }

    if (rapidapiJobs.status === 'fulfilled' && rapidapiJobs.value.length > 0) {
      allJobs.push(...rapidapiJobs.value);
      console.log(`✅ RapidAPI: Found ${rapidapiJobs.value.length} jobs`);
    }
  } catch (error) {
    console.log('⚠️ External APIs failed, using dynamic generation');
  }

  // DON'T generate fake jobs - only return real jobs from APIs
  if (allJobs.length === 0) {
    console.log(`⚠️ No external jobs found for "${query}" - returning empty results (no fake jobs)`);
    // Return empty array instead of generating fake jobs
  }

  return allJobs;
}
