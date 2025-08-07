export interface JobAnalytics {
  jobId: string;
  views: {
    total: number;
    unique: number;
    byDate: {
      date: string;
      count: number
}
}}}
}[]}
  applications: {
  ;
    total: number;
    status: {
      pending: number;
      reviewing: number;
      shortlisted: number;
      rejected: number;
      hired: number
}
}
    byDate: {
  ;
      date: string;
      count: number
}
}[]}
  demographics: {
  ;
    locations: {
      city: string;
      count: number
}
}[];
    experience: {
  ;
      range: string;
      count: number
}
}[];
    education: {
  ;
      level: string;
      count: number
}
}[]}
  engagement: {
  ;
    averageTimeOnPage: number;
    bookmarks: number;
    shares: number
}
}
  sourceAnalytics: {
  ;
    source: string;
    views: number;
    applications: number;
    conversionRate: number
}
}[];
  performanceMetrics: {
  ;
    timeToHire?: number;
    costPerHire?: number;
    applicantQuality: {
      qualified: number;
      underqualified: number;
}
      overqualified: number}
}}
export interface JobAnalyticsFilter {
  startDate?: string;
  endDate?: string;
  source?: string[];
  location?: string[];
  jobType?: string[];
}
}
}
export interface AnalyticsTimeframe {
  daily: JobAnalytics[];
  weekly: JobAnalytics[];
  monthly: JobAnalytics[];
  yearly: JobAnalytics[]
}
}
}
export interface ComparisonAnalytics {
  current: JobAnalytics;
  previous: JobAnalytics;
  change: {
    views: number;
    applications: number
}
}}
    conversionRate: number}
}