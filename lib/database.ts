// Database service for production use
// This will be used to connect to PostgreSQL on the server

export interface DatabaseConfig {
  user: string;
  host: string;
  database: string;
  password: string;
  port: number;
}

export interface Company {
  id: number;
  name: string;
  location: string;
  industry: string;
  description: string;
  website: string;
  employeeCount: string;
  foundedYear: number;
  isVerified: boolean;
  logoUrl?: string;
  jobCount: number;
}

export interface Job {
  id: number;
  title: string;
  companyName: string;
  location: string;
  country: string;
  description: string;
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
  applyUrl: string;
  views: number;
  applications: number;
  postedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface User {
  id: number;
  email: string;
  name?: string;
  passwordHash: string;
  role: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserProfile {
  id: number;
  userId: number;
  fullName: string;
  phone: string;
  location: string;
  jobTitle: string;
  skills: string[];
  education: string[];
  experience: string[];
  linkedin: string;
  portfolio: string;
  expectedSalary: string;
  preferredJobType: string;
  resumeUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Mock data for development - will be replaced with real database on server
const mockCompanies: Company[] = [
  { id: 1, name: 'TechCorp', location: 'Bangalore', industry: 'Technology', description: 'Leading tech company specializing in AI and cloud solutions', website: 'https://techcorp.com', employeeCount: '1000+', foundedYear: 2010, isVerified: true, logoUrl: 'https://via.placeholder.com/150', jobCount: 25 },
  { id: 2, name: 'InnovateSoft', location: 'Mumbai', industry: 'Software', description: 'Innovative software solutions for enterprise clients', website: 'https://innovatesoft.com', employeeCount: '500+', foundedYear: 2015, isVerified: true, logoUrl: 'https://via.placeholder.com/150', jobCount: 18 },
  { id: 3, name: 'Digital Solutions', location: 'Delhi', industry: 'IT Services', description: 'Digital transformation experts helping businesses grow', website: 'https://digitalsolutions.com', employeeCount: '750+', foundedYear: 2012, isVerified: true, logoUrl: 'https://via.placeholder.com/150', jobCount: 22 },
  { id: 4, name: 'Future Systems', location: 'Hyderabad', industry: 'Technology', description: 'Building the future with cutting-edge technology', website: 'https://futuresystems.com', employeeCount: '300+', foundedYear: 2018, isVerified: false, logoUrl: 'https://via.placeholder.com/150', jobCount: 12 }
];

const mockJobs: Job[] = [
  { id: 1, title: 'Senior Software Engineer', companyName: 'TechCorp', location: 'Bangalore', country: 'IN', description: 'Build and scale web applications using modern technologies', salary: '15-25 LPA', salaryMin: 1500000, salaryMax: 2500000, salaryCurrency: 'INR', jobType: 'full-time', experienceLevel: 'senior', skills: ['React', 'Node.js', 'TypeScript'], isRemote: true, isHybrid: false, isUrgent: false, isFeatured: true, sector: 'IT', applyUrl: '/jobs/1/apply', views: 150, applications: 12, postedAt: new Date(), createdAt: new Date(), updatedAt: new Date() },
  { id: 2, title: 'Product Manager', companyName: 'InnovateSoft', location: 'Mumbai', country: 'IN', description: 'Lead product roadmap and drive innovation', salary: '20-35 LPA', salaryMin: 2000000, salaryMax: 3500000, salaryCurrency: 'INR', jobType: 'full-time', experienceLevel: 'mid', skills: ['Agile', 'Analytics', 'Product Strategy'], isRemote: false, isHybrid: true, isUrgent: true, isFeatured: true, sector: 'Product', applyUrl: '/jobs/2/apply', views: 200, applications: 18, postedAt: new Date(), createdAt: new Date(), updatedAt: new Date() },
  { id: 3, title: 'Data Scientist', companyName: 'Digital Solutions', location: 'Delhi', country: 'IN', description: 'Develop ML/AI models for business insights', salary: '18-30 LPA', salaryMin: 1800000, salaryMax: 3000000, salaryCurrency: 'INR', jobType: 'full-time', experienceLevel: 'mid', skills: ['Python', 'Machine Learning', 'SQL'], isRemote: false, isHybrid: false, isUrgent: false, isFeatured: false, sector: 'Data', applyUrl: '/jobs/3/apply', views: 120, applications: 8, postedAt: new Date(), createdAt: new Date(), updatedAt: new Date() },
  { id: 4, title: 'UX Designer', companyName: 'Future Systems', location: 'Hyderabad', country: 'IN', description: 'Design delightful user experiences', salary: '12-20 LPA', salaryMin: 1200000, salaryMax: 2000000, salaryCurrency: 'INR', jobType: 'full-time', experienceLevel: 'mid', skills: ['Figma', 'Prototyping', 'User Research'], isRemote: true, isHybrid: false, isUrgent: false, isFeatured: false, sector: 'Design', applyUrl: '/jobs/4/apply', views: 90, applications: 6, postedAt: new Date(), createdAt: new Date(), updatedAt: new Date() }
];

// Database operations
export class DatabaseService {
  // Companies
  async getCompanies(search?: string, location?: string, industry?: string, page: number = 1, limit: number = 20) {
    let filtered = mockCompanies;
    
    if (search) {
      filtered = filtered.filter(company => 
        company.name.toLowerCase().includes(search.toLowerCase()) ||
        company.description.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    if (location) {
      filtered = filtered.filter(company => 
        company.location.toLowerCase().includes(location.toLowerCase())
      );
    }
    
    if (industry) {
      filtered = filtered.filter(company => 
        company.industry.toLowerCase().includes(industry.toLowerCase())
      );
    }
    
    const total = filtered.length;
    const skip = (page - 1) * limit;
    const paginated = filtered.slice(skip, skip + limit);
    
    return {
      companies: paginated,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    };
  }

  // Jobs
  async getJobs(query?: string, location?: string, company?: string, jobType?: string, experienceLevel?: string, isRemote?: boolean, sector?: string, page: number = 1, limit: number = 20) {
    let filtered = mockJobs;
    
    if (query) {
      filtered = filtered.filter(job => 
        job.title.toLowerCase().includes(query.toLowerCase()) ||
        job.description.toLowerCase().includes(query.toLowerCase()) ||
        job.companyName.toLowerCase().includes(query.toLowerCase()) ||
        job.skills.some(skill => skill.toLowerCase().includes(query.toLowerCase()))
      );
    }
    
    if (location) {
      filtered = filtered.filter(job => 
        job.location.toLowerCase().includes(location.toLowerCase())
      );
    }
    
    if (company) {
      filtered = filtered.filter(job => 
        job.companyName.toLowerCase().includes(company.toLowerCase())
      );
    }
    
    if (jobType) {
      filtered = filtered.filter(job => job.jobType === jobType);
    }
    
    if (experienceLevel) {
      filtered = filtered.filter(job => job.experienceLevel === experienceLevel);
    }
    
    if (isRemote !== undefined) {
      filtered = filtered.filter(job => job.isRemote === isRemote);
    }
    
    if (sector) {
      filtered = filtered.filter(job => 
        job.sector.toLowerCase().includes(sector.toLowerCase())
      );
    }
    
    const total = filtered.length;
    const skip = (page - 1) * limit;
    const paginated = filtered.slice(skip, skip + limit);
    
    return {
      jobs: paginated,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    };
  }

  async getJobById(id: number) {
    return mockJobs.find(job => job.id === id) || null;
  }

  // Users and Profiles
  async createUser(email: string, name: string, passwordHash: string) {
    const user: User = {
      id: Date.now(),
      email,
      name,
      passwordHash,
      role: 'user',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    return user;
  }

  async getUserByEmail(email: string) {
    // Mock implementation - will be replaced with real database
    return null;
  }

  async createUserProfile(userId: number, profileData: Partial<UserProfile>) {
    const profile: UserProfile = {
      id: Date.now(),
      userId,
      fullName: profileData.fullName || '',
      phone: profileData.phone || '',
      location: profileData.location || '',
      jobTitle: profileData.jobTitle || '',
      skills: profileData.skills || [],
      education: profileData.education || [],
      experience: profileData.experience || [],
      linkedin: profileData.linkedin || '',
      portfolio: profileData.portfolio || '',
      expectedSalary: profileData.expectedSalary || '',
      preferredJobType: profileData.preferredJobType || '',
      resumeUrl: profileData.resumeUrl,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    return profile;
  }

  async updateUserProfile(userId: number, profileData: Partial<UserProfile>) {
    // Mock implementation - will be replaced with real database
    return this.createUserProfile(userId, profileData);
  }

  async getUserProfile(userId: number) {
    // Mock implementation - will be replaced with real database
    return null;
  }
}

// Export singleton instance
export const databaseService = new DatabaseService();

// Health check
export async function checkDatabaseHealth() {
  return { status: 'healthy' as const, details: { readyState: 1, host: 'mock', name: 'mockdb' } };
}

export default databaseService;