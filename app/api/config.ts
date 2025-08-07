// API Configuration for Job Portal
export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api',
  TIMEOUT: 10000,
  
  // External APIs
  EXTERNAL_APIS: {
    JOBS_API: process.env.JOBS_API_URL || 'https://api.reed.co.uk',
    LOCATION_API: process.env.LOCATION_API_URL || 'https://api.geoapify.com',
    SALARY_API: process.env.SALARY_API_URL || 'https://api.salaryapi.com'
  },
  
  // API Keys
  API_KEYS: {
    REED_API_KEY: process.env.REED_API_KEY || '',
    GEOAPIFY_KEY: process.env.GEOAPIFY_API_KEY || '',
    SALARY_API_KEY: process.env.SALARY_API_KEY || ''
  },
  
  // Pagination
  PAGINATION: {
    DEFAULT_PAGE_SIZE: 10,
    MAX_PAGE_SIZE: 100
  },
  
  // Cache settings
  CACHE: {
    JOBS_TTL: 300, // 5 minutes
    LOCATIONS_TTL: 3600, // 1 hour
    COMPANIES_TTL: 1800 // 30 minutes
  }
};

// Database configuration
export const DB_CONFIG = {
  CONNECTION_STRING: process.env.DATABASE_URL || 'sqlite:./job_portal.db',
  POOL_SIZE: 10,
  TIMEOUT: 5000
};

// Job search configuration
export const SEARCH_CONFIG = {
  DEFAULT_COUNTRY: 'IN',
  SUPPORTED_COUNTRIES: ['IN', 'US', 'GB', 'AE'],
  DEFAULT_CURRENCY: 'INR',
  
  SECTORS: [
    'Technology',
    'Healthcare',
    'Finance',
    'Education',
    'Marketing',
    'Sales',
    'Engineering',
    'Design',
    'Operations',
    'HR'
  ],
  
  EXPERIENCE_LEVELS: [
    'entry',
    'mid',
    'senior',
    'executive'
  ],
  
  JOB_TYPES: [
    'full-time',
    'part-time',
    'contract',
    'freelance',
    'internship',
    'remote'
  ]
};

export default API_CONFIG;