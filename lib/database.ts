/**
 * Unified Database Service with Real PostgreSQL + Mock Data Fallback
 * Automatically switches from mock data to PostgreSQL in production
 * Uses available Prisma client for real database operations
 */

// Mock data for development/fallback
const mockJobs = [
  {
    id: 1,
    title: 'Senior Software Engineer',
    company: 'TechCorp India',
    location: 'Bangalore, Karnataka',
    description: 'We are looking for a Senior Software Engineer to join our team...',
    category: 'Technology',
    jobType: 'Full-time',
    experience: '5-8 years',
    salary: '₹25-45 LPA',
    isActive: true,
    isFeatured: true,
    views: 150,
    applicationCount: 12,
    postedBy: 1,
    status: 'published',
    applicationDeadline: new Date('2024-12-31'),
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15')
  },
  {
    id: 2,
    title: 'Product Manager',
    company: 'InnovateTech Solutions',
    location: 'Mumbai, Maharashtra',
    description: 'Lead product strategy and development for our flagship product...',
    category: 'Product Management',
    jobType: 'Full-time',
    experience: '3-6 years',
    salary: '₹20-35 LPA',
    isActive: true,
    isFeatured: false,
    views: 89,
    applicationCount: 8,
    postedBy: 2,
    status: 'published',
    applicationDeadline: new Date('2024-12-31'),
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-10')
  },
  {
    id: 3,
    title: 'Data Scientist',
    company: 'AnalyticsPro',
    location: 'Hyderabad, Telangana',
    description: 'Join our data science team to build ML models and analytics solutions...',
    category: 'Data Science',
    jobType: 'Full-time',
    experience: '2-5 years',
    salary: '₹18-30 LPA',
    isActive: true,
    isFeatured: true,
    views: 120,
    applicationCount: 15,
    postedBy: 3,
    status: 'published',
    applicationDeadline: new Date('2024-12-31'),
    createdAt: new Date('2024-01-08'),
    updatedAt: new Date('2024-01-08')
  }
];

const mockCompanies = [
  {
    id: 1,
    name: 'TechCorp India',
    description: 'Leading technology company providing innovative AI and cloud solutions to global enterprises. Specializing in artificial intelligence, cloud computing, and enterprise software development.',
    industry: 'Technology',
    size: '1000-5000 employees',
    location: 'Bangalore, Karnataka',
    website: 'https://techcorp.in',
    logo: 'https://images.unsplash.com/photo-1549923746-c502d488b3ea?w=100&h=100&fit=crop&crop=center',
    founded: 2010,
    isVerified: true,
    jobCount: 45,
    specialties: ['Artificial Intelligence', 'Cloud Computing', 'Enterprise Software', 'Data Analytics'],
    benefits: ['Health Insurance', 'Flexible Hours', 'Remote Work', 'Learning Budget', 'Stock Options'],
    rating: 4.5,
    reviews: 2847,
    openJobs: 45
  },
  {
    id: 2,
    name: 'InnovateTech Solutions',
    description: 'Cutting-edge software development company specializing in mobile and web applications. Creating innovative solutions for modern businesses.',
    industry: 'Software Development',
    size: '500-1000 employees',
    location: 'Mumbai, Maharashtra',
    website: 'https://innovatetech.com',
    logo: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=100&h=100&fit=crop&crop=center',
    founded: 2015,
    isVerified: true,
    jobCount: 28,
    specialties: ['Mobile Development', 'Web Development', 'UI/UX Design', 'DevOps'],
    benefits: ['Health Insurance', 'Gym Membership', 'Team Outings', 'Professional Development'],
    rating: 4.3,
    reviews: 1523,
    openJobs: 28
  },
  {
    id: 3,
    name: 'FinTech Solutions Hub',
    description: 'Revolutionary fintech company transforming digital banking and payment solutions. Leading the future of financial technology.',
    industry: 'Finance',
    size: '200-500 employees',
    location: 'Mumbai, Maharashtra',
    website: 'https://fintechsolutions.in',
    logo: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=100&h=100&fit=crop&crop=center',
    founded: 2018,
    isVerified: true,
    jobCount: 22,
    specialties: ['Digital Banking', 'Payment Systems', 'Blockchain', 'Risk Management'],
    benefits: ['Competitive Salary', 'Performance Bonus', 'Health Coverage', 'Flexible Work'],
    rating: 4.4,
    reviews: 892,
    openJobs: 22
  },
  {
    id: 4,
    name: 'InvestBank Corp',
    description: 'Premier investment banking institution providing comprehensive financial services. Trusted partner for corporate finance and wealth management.',
    industry: 'Banking',
    size: '5000+ employees',
    location: 'Mumbai, Maharashtra',
    website: 'https://investbank.com',
    logo: 'https://images.unsplash.com/photo-1541354329998-f4d9a9f9297f?w=100&h=100&fit=crop&crop=center',
    founded: 1995,
    isVerified: true,
    jobCount: 67,
    specialties: ['Investment Banking', 'Corporate Finance', 'Wealth Management', 'Trading'],
    benefits: ['High Compensation', 'Bonuses', 'International Exposure', 'Career Growth'],
    rating: 4.1,
    reviews: 3254,
    openJobs: 67
  },
  {
    id: 5,
    name: 'HealthCare Innovations',
    description: 'Leading healthcare technology company revolutionizing patient care and medical solutions. Advancing medical technology for better health outcomes.',
    industry: 'Healthcare',
    size: '1000-5000 employees',
    location: 'Hyderabad, Telangana',
    website: 'https://healthcareinnovations.in',
    logo: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=100&h=100&fit=crop&crop=center',
    founded: 2012,
    isVerified: true,
    jobCount: 34,
    specialties: ['Medical Technology', 'Telemedicine', 'Healthcare Analytics', 'Drug Development'],
    benefits: ['Medical Benefits', 'Research Opportunities', 'Flexible Schedule', 'Learning Support'],
    rating: 4.6,
    reviews: 1876,
    openJobs: 34
  },
  {
    id: 6,
    name: 'PharmaLife Sciences',
    description: 'Pharmaceutical company focused on developing life-saving medications and treatments. Committed to improving global health through innovation.',
    industry: 'Pharmaceuticals',
    size: '500-1000 employees',
    location: 'Ahmedabad, Gujarat',
    website: 'https://pharmalife.com',
    logo: 'https://images.unsplash.com/photo-1582719471384-894fbb16e074?w=100&h=100&fit=crop&crop=center',
    founded: 2008,
    isVerified: true,
    jobCount: 19,
    specialties: ['Drug Discovery', 'Clinical Research', 'Regulatory Affairs', 'Quality Assurance'],
    benefits: ['Research Environment', 'Health Coverage', 'Professional Growth', 'Innovation Culture'],
    rating: 4.2,
    reviews: 654,
    openJobs: 19
  },
  {
    id: 7,
    name: 'E-Commerce Hub',
    description: 'Major e-commerce platform connecting millions of buyers and sellers across India. Revolutionizing online shopping and digital commerce.',
    industry: 'E-commerce',
    size: '2000-5000 employees',
    location: 'Bangalore, Karnataka',
    website: 'https://ecommercehub.in',
    logo: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=100&h=100&fit=crop&crop=center',
    founded: 2014,
    isVerified: true,
    jobCount: 89,
    specialties: ['E-commerce Platform', 'Logistics', 'Digital Marketing', 'Customer Experience'],
    benefits: ['Employee Discounts', 'Flexible Work', 'Career Advancement', 'Team Events'],
    rating: 4.0,
    reviews: 2145,
    openJobs: 89
  },
  {
    id: 8,
    name: 'Global Consulting Partners',
    description: 'Premier management consulting firm helping organizations transform and grow. Strategic advisors for business excellence and digital transformation.',
    industry: 'Consulting',
    size: '500-1000 employees',
    location: 'Delhi, NCR',
    website: 'https://globalconsulting.com',
    logo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=center',
    founded: 2005,
    isVerified: true,
    jobCount: 31,
    specialties: ['Strategy Consulting', 'Digital Transformation', 'Operations', 'Technology Consulting'],
    benefits: ['International Projects', 'Learning Opportunities', 'Travel Allowance', 'Mentorship'],
    rating: 4.3,
    reviews: 987,
    openJobs: 31
  },
  {
    id: 9,
    name: 'Advanced Manufacturing Co.',
    description: 'Leading manufacturing company specializing in automotive and aerospace components. Precision engineering for the future of transportation.',
    industry: 'Manufacturing',
    size: '1000-5000 employees',
    location: 'Chennai, Tamil Nadu',
    website: 'https://advancedmfg.com',
    logo: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=100&h=100&fit=crop&crop=center',
    founded: 1998,
    isVerified: true,
    jobCount: 42,
    specialties: ['Automotive Parts', 'Aerospace Components', 'Precision Engineering', 'Quality Control'],
    benefits: ['Skill Development', 'Safety Programs', 'Performance Incentives', 'Retirement Plans'],
    rating: 4.1,
    reviews: 756,
    openJobs: 42
  },
  {
    id: 10,
    name: 'Creative Media House',
    description: 'Dynamic media production company creating content for digital and traditional platforms. Storytellers for the digital age.',
    industry: 'Media',
    size: '200-500 employees',
    location: 'Mumbai, Maharashtra',
    website: 'https://creativemedia.in',
    logo: 'https://images.unsplash.com/photo-1551836022-deb4988cc6c0?w=100&h=100&fit=crop&crop=center',
    founded: 2016,
    isVerified: true,
    jobCount: 18,
    specialties: ['Content Creation', 'Video Production', 'Digital Marketing', 'Brand Strategy'],
    benefits: ['Creative Environment', 'Flexible Hours', 'Project Variety', 'Industry Networking'],
    rating: 4.4,
    reviews: 543,
    openJobs: 18
  },
  {
    id: 11,
    name: 'EduTech Innovations',
    description: 'EdTech company revolutionizing online learning and educational technology. Making quality education accessible to everyone.',
    industry: 'Education',
    size: '500-1000 employees',
    location: 'Bangalore, Karnataka',
    website: 'https://edutechinnovations.com',
    logo: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=100&h=100&fit=crop&crop=center',
    founded: 2017,
    isVerified: true,
    jobCount: 26,
    specialties: ['Online Learning', 'Educational Content', 'Learning Analytics', 'Mobile Education'],
    benefits: ['Learning Culture', 'Professional Development', 'Work-Life Balance', 'Impact-Driven Work'],
    rating: 4.5,
    reviews: 1234,
    openJobs: 26
  },
  {
    id: 12,
    name: 'GreenTech Startup',
    description: 'Innovative startup developing sustainable technology solutions for environmental challenges. Building a greener future through technology.',
    industry: 'Clean Technology',
    size: '50-200 employees',
    location: 'Pune, Maharashtra',
    website: 'https://greentechstartup.in',
    logo: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=100&h=100&fit=crop&crop=center',
    founded: 2020,
    isVerified: true,
    jobCount: 12,
    specialties: ['Renewable Energy', 'Sustainability', 'IoT Solutions', 'Environmental Tech'],
    benefits: ['Equity Participation', 'Flexible Culture', 'Innovation Freedom', 'Rapid Growth'],
    rating: 4.7,
    reviews: 87,
    openJobs: 12
  },
  {
    id: 13,
    name: 'DataFlow Analytics',
    description: 'Advanced analytics company specializing in big data processing and business intelligence solutions. Turning data into actionable insights.',
    industry: 'Data Science',
    size: '100-500 employees',
    location: 'Hyderabad, Telangana',
    website: 'https://dataflowanalytics.com',
    logo: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=100&h=100&fit=crop&crop=center',
    founded: 2019,
    isVerified: true,
    jobCount: 15,
    specialties: ['Big Data', 'Machine Learning', 'Business Intelligence', 'Predictive Analytics'],
    benefits: ['Data-Driven Culture', 'Learning Opportunities', 'Remote Work', 'Competitive Salary'],
    rating: 4.3,
    reviews: 432,
    openJobs: 15
  },
  {
    id: 14,
    name: 'CloudScale Technologies',
    description: 'Cloud infrastructure and DevOps company helping businesses scale their digital operations. Building the foundation for digital transformation.',
    industry: 'Cloud Computing',
    size: '200-500 employees',
    location: 'Bangalore, Karnataka',
    website: 'https://cloudscaletech.com',
    logo: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=100&h=100&fit=crop&crop=center',
    founded: 2016,
    isVerified: true,
    jobCount: 23,
    specialties: ['Cloud Infrastructure', 'DevOps', 'Microservices', 'Containerization'],
    benefits: ['Cloud Certifications', 'Flexible Work', 'Innovation Time', 'Team Building'],
    rating: 4.4,
    reviews: 678,
    openJobs: 23
  },
  {
    id: 15,
    name: 'SecureNet Solutions',
    description: 'Cybersecurity company protecting businesses from digital threats. Comprehensive security solutions for the modern enterprise.',
    industry: 'Cybersecurity',
    size: '100-300 employees',
    location: 'Gurgaon, Haryana',
    website: 'https://securenetsolutions.com',
    logo: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=100&h=100&fit=crop&crop=center',
    founded: 2018,
    isVerified: true,
    jobCount: 18,
    specialties: ['Network Security', 'Threat Detection', 'Incident Response', 'Security Audits'],
    benefits: ['Security Training', 'Remote Work', 'Health Benefits', 'Professional Growth'],
    rating: 4.6,
    reviews: 345,
    openJobs: 18
  }
];

// Database health check
export async function checkDatabaseHealth() {
  try {
    if (process.env.DATABASE_URL) {
      return {
        status: 'configured',
        database: 'postgresql',
        message: 'PostgreSQL configured but connection not tested'
      };
    }
    return {
      status: 'no-database',
      database: 'none',
      message: 'No database configured'
    };
  } catch (error) {
    console.error('Database health check failed:', error);
    return {
      status: 'error',
      database: 'unknown',
      message: 'Database check failed'
    };
  }
}

import { prisma } from '@/lib/prisma';

// Database service with mock data and PostgreSQL preparation
export const databaseService = {
  // Jobs
  async getJobs(query = '', location = '', company = '', jobType = '', experienceLevel = '', isRemote = false, sector = '', page = 1, limit = 20) {
    try {
      const skip = (page - 1) * limit;

      // Prefer real database via Prisma when configured
      if (process.env.DATABASE_URL) {
        const where: any = { isActive: true };

        if (query) {
          where.OR = [
            { title: { contains: query, mode: 'insensitive' } },
            { company: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
          ];
        }
        if (location) {
          where.location = { contains: location, mode: 'insensitive' };
        }
        if (company) {
          where.company = { contains: company, mode: 'insensitive' };
        }
        if (jobType) {
          where.jobType = { equals: jobType };
        }
        if (experienceLevel) {
          where.experienceLevel = { contains: experienceLevel, mode: 'insensitive' };
        }
        if (isRemote) {
          where.isRemote = true;
        }
        if (sector) {
          where.sector = { contains: sector, mode: 'insensitive' };
        }

        const [total, jobs] = await Promise.all([
          (prisma as any).job.count({ where }),
          (prisma as any).job.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
          }),
        ]);

        return {
          jobs,
          total,
          page,
          limit,
          source: 'db',
        };
      }

      // Fallback: mock data
      let filteredJobs = [...mockJobs];

      if (query) {
        filteredJobs = filteredJobs.filter(job =>
          job.title.toLowerCase().includes(query.toLowerCase()) ||
          job.company?.toLowerCase().includes(query.toLowerCase()) ||
          job.description.toLowerCase().includes(query.toLowerCase())
        );
      }
      if (location) {
        filteredJobs = filteredJobs.filter(job =>
          job.location?.toLowerCase().includes(location.toLowerCase())
        );
      }
      if (company) {
        filteredJobs = filteredJobs.filter(job =>
          job.company?.toLowerCase().includes(company.toLowerCase())
        );
      }
      if (jobType) {
        filteredJobs = filteredJobs.filter(job =>
          job.jobType?.toLowerCase() === jobType.toLowerCase()
        );
      }
      if (experienceLevel) {
        filteredJobs = filteredJobs.filter(job =>
          job.experience?.toLowerCase().includes(experienceLevel.toLowerCase())
        );
      }
      if (isRemote) {
        filteredJobs = filteredJobs.filter(job => job.isActive);
      }
      if (sector) {
        filteredJobs = filteredJobs.filter(job =>
          job.category?.toLowerCase().includes(sector.toLowerCase())
        );
      }

      const paginatedJobs = filteredJobs.slice(skip, skip + limit);
      return {
        jobs: paginatedJobs,
        total: filteredJobs.length,
        page,
        limit,
        source: 'mock',
        message: 'Mock data with filtering',
      };
    } catch (error) {
      console.warn('Database query failed, using fallback mock data:', error);
      const skip = (page - 1) * limit;
      const jobs = mockJobs.slice(skip, skip + limit);
      return { jobs, total: mockJobs.length, page, limit, source: 'mock-fallback' };
    }
  },

  async getJobById(id: number) {
    try {
      if (process.env.DATABASE_URL) {
        const job = await (prisma as any).job.findUnique({ where: { id } });
        return job || null;
      }
      return mockJobs.find(job => job.id === id) || null;
    } catch (error) {
      console.warn('Database query failed, using fallback mock data:', error);
      return mockJobs.find(job => job.id === id) || null;
    }
  },

  // Companies - Using mock data
  async getCompanies(page = 1, limit = 10) {
    console.log('🟡 Using Mock Data for Companies');
    const skip = (page - 1) * limit;
    const companies = mockCompanies.slice(skip, skip + limit);
    return { companies, total: mockCompanies.length, page, limit, source: 'mock' };
  },

  async getCompanyById(id: number) {
    console.log('🟡 Using Mock Data for Company');
    return mockCompanies.find(company => company.id === id) || null;
  },

  // Health check with mode detection
  async checkHealth() {
    const health = await checkDatabaseHealth();
    return {
      ...health,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'unknown',
      databaseUrl: process.env.DATABASE_URL ? 'configured' : 'not configured',
      note: 'Prisma client needs to be regenerated for full database functionality'
    };
  },

  // Disconnect
  async disconnect() {
    console.log('🟡 Mock database service - no connection to disconnect');
  },

  // Get current mode
  getCurrentMode() {
    if (process.env.DATABASE_URL) {
      return 'postgresql-configured-but-client-not-ready';
    } else {
      return 'development-mock';
    }
  }
};

// Export for backward compatibility
export default databaseService;