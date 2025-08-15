/**
 * Unified Database Service
 * Single source of truth for all database operations
 * Works with or without database connection
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
    description: 'Leading technology company in India',
    industry: 'Technology',
    size: '500-1000 employees',
    location: 'Bangalore, Karnataka',
    website: 'https://techcorp.in',
    logo: '/logos/techcorp.png',
    founded: 2010,
    isVerified: true,
    jobCount: 15
  },
  {
    id: 2,
    name: 'InnovateTech Solutions',
    description: 'Innovative software solutions provider',
    industry: 'Software Development',
    size: '100-500 employees',
    location: 'Mumbai, Maharashtra',
    website: 'https://innovatetech.com',
    logo: '/logos/innovatetech.png',
    founded: 2015,
    isVerified: true,
    jobCount: 8
  },
  {
    id: 3,
    name: 'AnalyticsPro',
    description: 'Data analytics and machine learning company',
    industry: 'Data Science',
    size: '50-200 employees',
    location: 'Hyderabad, Telangana',
    website: 'https://analyticspro.co',
    logo: '/logos/analyticspro.png',
    founded: 2018,
    isVerified: false,
    jobCount: 5
  }
];

// Database service with fallback to mock data
export const databaseService = {
  // Jobs
  async getJobs(page = 1, limit = 10, filters = {}) {
    try {
      // For now, always use mock data
      // TODO: Implement real database connection when ready
      const skip = (page - 1) * limit;
      const jobs = mockJobs.slice(skip, skip + limit);
      return { jobs, total: mockJobs.length, page, limit };
    } catch (error) {
      console.warn('Database operation failed, using mock data:', error);
      const skip = (page - 1) * limit;
      const jobs = mockJobs.slice(skip, skip + limit);
      return { jobs, total: mockJobs.length, page, limit };
    }
  },

  async getJobById(id: number) {
    try {
      // For now, always use mock data
      // TODO: Implement real database connection when ready
      return mockJobs.find(job => job.id === id) || null;
    } catch (error) {
      console.warn('Database operation failed, using mock data:', error);
      return mockJobs.find(job => job.id === id) || null;
    }
  },

  // Companies
  async getCompanies(page = 1, limit = 10) {
    try {
      // For now, always use mock data
      // TODO: Implement real database connection when ready
      const skip = (page - 1) * limit;
      const companies = mockCompanies.slice(skip, skip + limit);
      return { companies, total: mockCompanies.length, page, limit };
    } catch (error) {
      console.warn('Database operation failed, using mock data:', error);
      const skip = (page - 1) * limit;
      const companies = mockCompanies.slice(skip, skip + limit);
      return { companies, total: mockCompanies.length, page, limit };
    }
  },

  async getCompanyById(id: number) {
    try {
      // For now, always use mock data
      // TODO: Implement real database connection when ready
      return mockCompanies.find(company => company.id === id) || null;
    } catch (error) {
      console.warn('Database operation failed, using mock data:', error);
      return mockCompanies.find(company => company.id === id) || null;
    }
  },

  // Health check
  async checkHealth() {
    return { 
      isHealthy: true, 
      error: null,
      message: 'Using mock data - database connection not configured'
    };
  },

  // Disconnect
  async disconnect() {
    // Nothing to disconnect for mock data
    console.log('Mock database service - no connection to disconnect');
  }
};

// Export for backward compatibility
export default databaseService;