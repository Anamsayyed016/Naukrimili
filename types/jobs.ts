export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  type: 'full-time' | 'part-time' | 'contract' | 'internship' | 'remote';
  experience: string;
  salary?: {
    min: number;
    max: number;
    currency: string;
    period: 'hourly' | 'monthly' | 'yearly';
  };
  description: string;
  requirements: string[];
  responsibilities: string[];
  skills: string[];
  benefits?: string[];
  department?: string;
  industry?: string;
  education?: string;
  postedDate: string;
  closingDate?: string;
  status: 'draft' | 'published' | 'closed' | 'archived';
  applicationCount?: number;
  source?: 'direct' | 'reed' | 'indeed' | 'linkedin';
}

export interface JobSearchFilters {
  keywords?: string;
  location?: string;
  type?: string[];
  experience?: string[];
  salary?: {
    min?: number;
    max?: number;
    currency?: string;
  };
  skills?: string[];
  industry?: string[];
  postedWithin?: '24h' | '7d' | '14d' | '30d' | 'any';
  sortBy?: 'relevance' | 'date' | 'salary';
}

export interface JobSearchResponse {
  jobs: Job[];
  totalResults: number;
  currentPage: number;
  totalPages: number;
  filters: JobSearchFilters;
}

export interface JobApplication {
  id: string;
  jobId: string;
  userId: string;
  resumeUrl: string;
  coverLetter?: string;
  status: 'pending' | 'reviewing' | 'shortlisted' | 'rejected' | 'accepted';
  appliedDate: string;
  lastUpdated: string;
  notes?: string;
  additionalDocuments?: {
    name: string;
    url: string;
  }[];
}

export interface JobAlert {
  id: string;
  userId: string;
  keywords: string[];
  location?: string;
  jobTypes?: string[];
  salary?: {
    min?: number;
    max?: number;
    currency: string;
  };
  frequency: 'daily' | 'weekly' | 'monthly';
  status: 'active' | 'paused';
  lastSent?: string;
}

export interface JobAnalytics {
  jobId: string;
  views: number;
  applications: number;
  conversionRate: number;
  averageTimeToHire?: number;
  sourcesBreakdown: {
    source: string;
    count: number;
  }[];
  demographicData?: {
    experienceLevels: { [key: string]: number };
    locations: { [key: string]: number };
    skills: { [key: string]: number };
  };
}
