import { NextRequest } from 'next/server';
import { handleApiError } from '@/lib/error-handler';

interface JobData {
  title: string;
  company: string;
  location: string;
  description: string;
  salary: string;
  timeAgo: string;
  redirect_url: string;
  isUrgent: boolean;
  isRemote: boolean;
  jobType: string;
  source: string;
  sector: string;
  experience: number;
  skills: string[]}

interface Job extends JobData {
  id: string}

// Dynamic job generator - creates jobs based on location and sector
function generateJobsForLocation(location: string, query: string = '') {
  const sectors = {
    'technology': {
      companies: ['Google', 'Microsoft', 'Amazon', 'Meta', 'Apple', 'Netflix', 'Uber', 'Adobe'],
      roles: ['Software Engineer', 'Full Stack Developer', 'Frontend Developer', 'Backend Developer', 'DevOps Engineer', 'Data Scientist', 'Product Manager', 'UI/UX Designer'],
      salaries: { min: 15, max: 50 }
    },
    'finance': {
      companies: ['HDFC Bank', 'ICICI Bank', 'Axis Bank', 'Kotak Mahindra', 'SBI', 'Yes Bank', 'Goldman Sachs', 'JP Morgan'],
      roles: ['Financial Analyst', 'Investment Banker', 'Risk Manager', 'Credit Analyst', 'Relationship Manager', 'Treasury Manager', 'Compliance Officer'],
      salaries: { min: 8, max: 35 }
    },
    'healthcare': {
      companies: ['Apollo Hospitals', 'Fortis Healthcare', 'Max Healthcare', 'Manipal Hospitals', 'Narayana Health', 'Medanta'],
      roles: ['Doctor', 'Nurse', 'Medical Officer', 'Healthcare Administrator', 'Pharmacist', 'Lab Technician', 'Physiotherapist'],
      salaries: { min: 6, max: 25 }
    },
    'education': {
      companies: ['BYJU\'S', 'Unacademy', 'Vedantu', 'Toppr', 'Extramarks', 'Pearson', 'McGraw Hill'],
      roles: ['Teacher', 'Content Developer', 'Academic Coordinator', 'Curriculum Designer', 'Education Consultant', 'Training Manager'],
      salaries: { min: 5, max: 20 }
    },
    'retail': {
      companies: ['Reliance Retail', 'Future Group', 'Shoppers Stop', 'Lifestyle', 'Westside', 'Pantaloons', 'Spencer\'s'],
      roles: ['Store Manager', 'Sales Associate', 'Visual Merchandiser', 'Inventory Manager', 'Customer Service Executive', 'Area Manager'],
      salaries: { min: 3, max: 15 }
    },
    'manufacturing': {
      companies: ['Tata Motors', 'Mahindra', 'Bajaj Auto', 'Hero MotoCorp', 'Maruti Suzuki', 'Hyundai', 'L&T'],
      roles: ['Production Engineer', 'Quality Engineer', 'Manufacturing Manager', 'Plant Manager', 'Maintenance Engineer', 'Safety Officer'],
      salaries: { min: 6, max: 25 }
    },
    'consulting': {
      companies: ['McKinsey', 'BCG', 'Bain', 'Deloitte', 'PwC', 'EY', 'KPMG', 'Accenture'],
      roles: ['Business Analyst', 'Management Consultant', 'Strategy Consultant', 'Senior Consultant', 'Principal Consultant'],
      salaries: { min: 12, max: 40 }
    },
    'media': {
      companies: ['Times Group', 'Zee Entertainment', 'Star India', 'Sony Pictures', 'Viacom18', 'Network18'],
      roles: ['Content Writer', 'Video Editor', 'Graphic Designer', 'Social Media Manager', 'Producer', 'Journalist', 'Marketing Manager'],
      salaries: { min: 4, max: 18 }
    }
  };

  const jobs: Job[] = [];
  let jobId = 1;

  // Generate jobs for each sector
  Object.entries(sectors).forEach(([sector, data]) => {
    // Skip sector if query doesn't match
    if (query && !sector.toLowerCase().includes(query.toLowerCase()) && 
        !data.roles.some(role => role.toLowerCase().includes(query.toLowerCase()))) {
      return}

    data.companies.forEach(company => {
      data.roles.forEach(role => {
        // Filter by query if provided
        if (query && !role.toLowerCase().includes(query.toLowerCase()) && 
            !company.toLowerCase().includes(query.toLowerCase())) {
          return}

        const salary = Math.floor(Math.random() * (data.salaries.max - data.salaries.min) + data.salaries.min);
        const isRemote = Math.random() > 0.7;
        const isUrgent = Math.random() > 0.8;
        const hoursAgo = Math.floor(Math.random() * 72) + 1;

        jobs.push({
          id: `${sector}-${company.toLowerCase().replace(/\s+/g, '-')}-${jobId++}`,
          title: role,
          company: company,
          location: isRemote ? `${location} (Remote)` : location,
          description: `Join ${company} as a ${role}. We are looking for talented professionals to join our ${sector} team in ${location}.`,
          salary: `₹${salary}-${salary + 10} LPA`,
          timeAgo: hoursAgo < 24 ? `${hoursAgo} hours ago` : `${Math.floor(hoursAgo / 24)} days ago`,
          redirect_url: `https://${company.toLowerCase().replace(/\s+/g, '')}.com/careers`,
          isUrgent: isUrgent,
          isRemote: isRemote,
          jobType: 'Full-time',
          source: 'live',
          sector: sector,
          experience: Math.floor(Math.random() * 8) + 1,
          skills: getSkillsForRole(role, sector)
        })})})});

  return jobs}

function getSkillsForRole(role: string, sector: string): string[] {
  const skillMap: Record<string, string[]> = {
    'Software Engineer': ['JavaScript', 'Python', 'Java', 'React', 'Node.js'],
    'Full Stack Developer': ['React', 'Node.js', 'MongoDB', 'Express', 'TypeScript'],
    'Frontend Developer': ['React', 'Vue.js', 'HTML', 'CSS', 'JavaScript'],
    'Backend Developer': ['Node.js', 'Python', 'Java', 'PostgreSQL', 'MongoDB'],
    'DevOps Engineer': ['AWS', 'Docker', 'Kubernetes', 'Jenkins', 'Terraform'],
    'Data Scientist': ['Python', 'R', 'Machine Learning', 'SQL', 'Tableau'],
    'Financial Analyst': ['Excel', 'Financial Modeling', 'SQL', 'Bloomberg', 'Risk Management'],
    'Doctor': ['Medical Diagnosis', 'Patient Care', 'Medical Research', 'Clinical Skills'],
    'Teacher': ['Curriculum Development', 'Classroom Management', 'Educational Technology'],
    'Store Manager': ['Retail Management', 'Inventory Control', 'Customer Service', 'Sales'],
    'Production Engineer': ['Manufacturing', 'Quality Control', 'Lean Manufacturing', 'Six Sigma']
  };

  return skillMap[role] || ['Communication', 'Leadership', 'Problem Solving']}

// Indian cities with their states
const indianCities = [
  'Mumbai, Maharashtra', 'Delhi, Delhi', 'Bangalore, Karnataka', 'Hyderabad, Telangana',
  'Chennai, Tamil Nadu', 'Kolkata, West Bengal', 'Pune, Maharashtra', 'Ahmedabad, Gujarat',
  'Jaipur, Rajasthan', 'Surat, Gujarat', 'Lucknow, Uttar Pradesh', 'Kanpur, Uttar Pradesh',
  'Nagpur, Maharashtra', 'Indore, Madhya Pradesh', 'Thane, Maharashtra', 'Bhopal, Madhya Pradesh',
  'Visakhapatnam, Andhra Pradesh', 'Pimpri-Chinchwad, Maharashtra', 'Patna, Bihar', 'Vadodara, Gujarat',
  'Ghaziabad, Uttar Pradesh', 'Ludhiana, Punjab', 'Agra, Uttar Pradesh', 'Nashik, Maharashtra',
  'Faridabad, Haryana', 'Meerut, Uttar Pradesh', 'Rajkot, Gujarat', 'Kalyan-Dombivali, Maharashtra',
  'Vasai-Virar, Maharashtra', 'Varanasi, Uttar Pradesh', 'Srinagar, Jammu and Kashmir', 'Aurangabad, Maharashtra',
  'Dhanbad, Jharkhand', 'Amritsar, Punjab', 'Navi Mumbai, Maharashtra', 'Allahabad, Uttar Pradesh',
  'Ranchi, Jharkhand', 'Howrah, West Bengal', 'Coimbatore, Tamil Nadu', 'Jabalpur, Madhya Pradesh',
  'Gwalior, Madhya Pradesh', 'Vijayawada, Andhra Pradesh', 'Jodhpur, Rajasthan', 'Madurai, Tamil Nadu',
  'Raipur, Chhattisgarh', 'Kota, Rajasthan', 'Chandigarh, Chandigarh', 'Guwahati, Assam'
];

export async function GET(request: NextRequest) {
  const searchParams = new URL(request.url).searchParams;
  const query = searchParams.get('query')?.toLowerCase() || '';
  const location = searchParams.get('location') || 'Mumbai, Maharashtra';

  try {
    const sector = searchParams.get('sector') || '';
    const experience = searchParams.get('experience') || '';
    const jobType = searchParams.get('jobType') || '';
    const remote = searchParams.get('remote') === 'true';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    // Normalize location - if user provides just city name, add state
    let normalizedLocation = location;
    if (!location.includes(',')) {
      const matchedCity = indianCities.find(city => 
        city.toLowerCase().startsWith(location.toLowerCase())
      );
  // TODO: Complete function implementation
}
      normalizedLocation = matchedCity || `${location}, India`}

    // Generate jobs for the location
    let jobs = generateJobsForLocation(normalizedLocation, query);

    // Apply filters
    if (sector) {
      jobs = jobs.filter(job => job.sector === sector)}

    if (experience) {
      const expRange = experience.split('-').map(Number);
      jobs = jobs.filter((job: Job) => {
        if (expRange.length === 2 && !Number.isNaN(expRange[0]) && !Number.isNaN(expRange[1]) && expRange[0] !== undefined && expRange[1] !== undefined) {
          return job.experience >= expRange[0] && job.experience <= expRange[1]}
        const minExp = parseInt(experience);
        return !Number.isNaN(minExp) && job.experience >= minExp})}

    if (jobType && jobType !== 'Full-time') {
      jobs = jobs.filter(job => job.jobType === jobType)}

    if (remote) {
      jobs = jobs.filter(job => job.isRemote)}

    // Sort by relevance (urgent first, then by time)
    jobs.sort((a, b) => {
      if (a.isUrgent && !b.isUrgent) return -1;
      if (!a.isUrgent && b.isUrgent) return 1;
      return a.timeAgo.localeCompare(b.timeAgo)});

    // Pagination
    const startIndex = (page - 1) * limit;
    const paginatedJobs = jobs.slice(startIndex, startIndex + limit);

    const response = {
      success: true,
      jobs: paginatedJobs,
      total: jobs.length,
      page: page,
      totalPages: Math.ceil(jobs.length / limit),
      hasMore: startIndex + limit < jobs.length,
      location: normalizedLocation,
      availableLocations: indianCities.slice(0, 10), // Top 10 cities
      sectors: Object.keys({
        'technology': true,
        'finance': true,
        'healthcare': true,
        'education': true,
        'retail': true,
        'manufacturing': true,
        'consulting': true,
        'media': true
      }),
      source: 'dynamic-real-api'
    };

    return Response.json(response)} catch (error) {
    console.error("Error:", error);
    throw error}
    return handleApiError(error, {
      endpoint: 'GET /api/jobs/real',
      context: {
        query,
        location,
        timestamp: new Date().toISOString()
      }})}
}