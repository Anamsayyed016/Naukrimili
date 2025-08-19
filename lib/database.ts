/**
 * Unified Database Service with Real PostgreSQL + Mock Data Fallback
 * Automatically switches from mock data to PostgreSQL in production
 * Uses available Prisma client for real database operations
 */

import { prisma } from '@/lib/prisma';

// Mock data fallback when database is unavailable
const mockJobs = [
  {
    id: '1',
    title: 'Senior Software Engineer',
    company: 'Tech Corp',
    location: 'Mumbai, India',
    type: 'Full-time',
    salary: '15-25 LPA',
    description: 'We are looking for a senior software engineer...',
    requirements: ['React', 'Node.js', '5+ years experience'],
    postedAt: new Date('2024-01-15'),
    isActive: true,
    source: 'mock',
    sourceId: 'mock-1'
  },
  {
    id: '2',
    title: 'Frontend Developer',
    company: 'Startup Inc',
    location: 'Bangalore, India',
    type: 'Full-time',
    salary: '8-15 LPA',
    description: 'Join our fast-growing startup...',
    requirements: ['React', 'TypeScript', '2+ years experience'],
    postedAt: new Date('2024-01-14'),
    isActive: true,
    source: 'mock',
    sourceId: 'mock-2'
  },
  {
    id: '3',
    title: 'DevOps Engineer',
    company: 'Enterprise Ltd',
    location: 'Delhi, India',
    type: 'Full-time',
    salary: '12-20 LPA',
    description: 'Manage our cloud infrastructure...',
    requirements: ['AWS', 'Docker', 'Kubernetes', '3+ years experience'],
    postedAt: new Date('2024-01-13'),
    isActive: true,
    source: 'mock',
    sourceId: 'mock-3'
  }
];

const mockCompanies = [
  {
    id: '1',
    name: 'Tech Corp',
    industry: 'Technology',
    size: '100-500',
    location: 'Mumbai, India',
    description: 'Leading technology company...',
    website: 'https://techcorp.com',
    isActive: true
  },
  {
    id: '2',
    name: 'Startup Inc',
    industry: 'E-commerce',
    size: '10-50',
    location: 'Bangalore, India',
    description: 'Innovative startup...',
    website: 'https://startupinc.com',
    isActive: true
  }
];

// Database connection check
async function checkDatabaseConnection() {
  try {
    if (!process.env.DATABASE_URL) {
      return false;
    }
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    console.warn('Database connection failed, using mock data:', error);
    return false;
  }
}

// Enhanced getJobs with fallback
export async function getJobs(options: any = {}) {
  try {
    const isConnected = await checkDatabaseConnection();
    if (isConnected) {
      const jobs = await prisma.job.findMany({
        where: { isActive: true },
        orderBy: { postedAt: 'desc' },
        take: options.limit || 20,
        skip: options.skip || 0
      });
      return jobs;
    }
  } catch (error) {
    console.warn('Database query failed, using mock data:', error);
  }
  
  // Fallback to mock data
  return mockJobs;
}

// Enhanced getJobById with fallback
export async function getJobById(id: string) {
  try {
    const isConnected = await checkDatabaseConnection();
    if (isConnected) {
      const job = await prisma.job.findUnique({
        where: { id: parseInt(id) || 0 }
      });
      if (job) return job;
    }
  } catch (error) {
    console.warn('Database query failed, using mock data:', error);
  }
  
  // Fallback to mock data
  return mockJobs.find(job => job.id === id) || null;
}

// Enhanced getCompanies with fallback
export async function getCompanies() {
  try {
    const isConnected = await checkDatabaseConnection();
    if (isConnected) {
      const companies = await prisma.company.findMany();
      return companies;
    }
  } catch (error) {
    console.warn('Database query failed, using mock data:', error);
  }
  
  // Fallback to mock data
  return mockCompanies;
}

// Enhanced getCompanyById with fallback
export async function getCompanyById(id: string) {
  try {
    const isConnected = await checkDatabaseConnection();
    if (isConnected) {
      const company = await prisma.company.findUnique({
        where: { id }
      });
      if (company) return company;
    }
  } catch (error) {
    console.warn('Database query failed, using mock data:', error);
  }
  
  // Fallback to mock data
  return mockCompanies.find(company => company.id === id) || null;
}

// Mock data for other entities
export const mockUsers = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    role: 'jobseeker',
    isActive: true
  }
];

export const mockApplications = [
  {
    id: '1',
    jobId: '1',
    userId: '1',
    status: 'applied',
    appliedAt: new Date('2024-01-15')
  }
];

export const mockMessages = [
  {
    id: '1',
    senderId: '1',
    receiverId: '2',
    content: 'Hello, I am interested in your job posting.',
    createdAt: new Date('2024-01-15')
  }
];
