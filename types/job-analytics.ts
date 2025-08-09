export interface JobAnalytics {
  jobId: string;
  views: {
    total: number;
    unique: number;
    byDate: Array<{
      date: string;
      count: number;
    }>;
  };
  applications: {
    total: number;
    status: {
      pending: number;
      reviewing: number;
      shortlisted: number;
      rejected: number;
      hired: number;
    };
    byDate: Array<{
      date: string;
      count: number;
    }>;
  };
  demographics: {
    locations: Array<{
      city: string;
      count: number;
    }>;
    experience: Array<{
      range: string; // e.g. "0-2", "3-5", "6+"
      count: number;
    }>;
    education: Array<{
      level: string; // e.g. "Bachelor", "Master", "PhD"
      count: number;
    }>;
  };
  engagement: {
    averageTimeOnPage: number; // seconds
    bookmarks: number;
    shares: number;
  };
  sourceAnalytics: Array<{
    source: string; // e.g. "LinkedIn", "Indeed", "Direct"
    views: number;
    applications: number;
    conversionRate: number; // 0..1
  }>;
  performanceMetrics: {
    timeToHire?: number; // days
    costPerHire?: number; // currency-agnostic
    applicantQuality: {
      qualified: number;
      underqualified: number;
      overqualified: number;
    };
  };
}

export interface JobAnalyticsFilter {
  startDate?: string; // ISO date
  endDate?: string;   // ISO date
  source?: string[];
  location?: string[];
  jobType?: string[];
}

export interface AnalyticsTimeframe {
  daily: JobAnalytics[];
  weekly: JobAnalytics[];
  monthly: JobAnalytics[];
  yearly: JobAnalytics[];
}

export interface ComparisonAnalytics {
  current: JobAnalytics;
  previous: JobAnalytics;
  change: {
    views: number;
    applications: number;
    conversionRate: number; // percentage change represented as -1..1
  };
}