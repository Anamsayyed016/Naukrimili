export interface Job {
  id: string
  title: string
  description: string
  company: {
    id: string
    name: string
    logo?: string
    website?: string
  }
  location: {
    city: string
    state?: string
    country: string
    type: 'onsite' | 'remote' | 'hybrid'
  }
  employmentDetails: {
    type: 'full-time' | 'part-time' | 'contract' | 'internship'
    schedule?: string
    workHours?: string
    overtime?: boolean
  }
  compensation: {
    salary?: {
      min: number
      max: number
      currency: string
      period: 'hourly' | 'monthly' | 'yearly'
    }
    benefits?: string[]
    equity?: string
    bonus?: string
  }
  requirements: {
    education?: string[]
    experience: string
    skills: string[]
    certifications?: string[]
    languages?: Array<{
      name: string
      level: 'basic' | 'intermediate' | 'fluent' | 'native'
    }>
  }
  responsibilities: string[]
  status: {
    isActive: boolean
    isVerified: boolean
    isFeatured: boolean
    closingDate?: string
  }
  applicationProcess: {
    type: 'direct' | 'email' | 'external'
    url?: string
    email?: string
    instructions?: string
    requiredDocuments?: string[]
  }
  metadata: {
    postedDate: string
    lastModified: string
    views: number
    applications: number
    source?: string
  }
  tags?: string[]
  applications?: number // Add this for compatibility
  
  // New fields for internal/external job handling
  apply_url?: string    // Internal application URL
  source_url?: string   // External source URL (replaces redirect_url)
  isExternal?: boolean  // Whether this job comes from external provider
}

export interface JobFilters {
  query?: string;
  location?: string;
  company?: string;
  jobType?: 'full-time' | 'part-time' | 'contract' | 'internship';
  experience?: string;
  salary?: {
    min?: number;
    max?: number;
    currency?: string;
  };
  skills?: string[];
  remote?: boolean;
  industry?: string;
  datePosted?: 'today' | 'week' | 'month' | '3months';
  isVerified?: boolean;
  isFeatured?: boolean;
  sortBy?: 'relevance' | 'date' | 'salary' | 'company';
  sortOrder?: 'asc' | 'desc';
}

export interface JobSummary {
  id: string;
  title: string;
  company: {
    name: string;
    logo?: string;
  };
  location: string;
  salary?: {
    min?: number;
    max?: number;
    currency: string;
  };
  jobType: string;
  experience: string;
  postedDate: string;
  isRemote: boolean;
  isVerified: boolean;
  isFeatured: boolean;
  applications: number;
  views: number;
  tags: string[];
}