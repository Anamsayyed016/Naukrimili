export interface PageView {
  page: string;
  timestamp: Date;
  userId?: string;
  sessionId: string;
  duration: number; // seconds
  referrer?: string;
  device: {
    type: 'desktop' | 'mobile' | 'tablet';
    browser: string;
    os: string;
  };
}

export interface UserEngagement {
  userId: string;
  action: 'click' | 'scroll' | 'hover' | 'search' | 'apply' | 'save';
  element: string;
  page: string;
  timestamp: Date;
  duration?: number;
  metadata?: Record<string, any>;
}

export interface SearchAnalytics {
  query: string;
  filters?: Record<string, any>;
  timestamp: Date;
  userId?: string;
  sessionId: string;
  resultsCount: number;
  refinements?: string[];
  clickedResults?: string[];
}

export interface ApplicationAnalytics {
  jobId: string;
  userId: string;
  timestamp: Date;
  source: string;
  completionTime: number; // seconds
  steps: Array<{
    step: string;
    duration: number; // seconds
    completed: boolean;
  }>;
  successful: boolean;
}

export interface UserJourney {
  userId: string;
  sessionId: string;
  startTime: Date;
  endTime: Date;
  touchpoints: Array<{
    page: string;
    action: string;
    timestamp: Date;
  }>;
  conversion?: {
    type: 'application' | 'registration' | 'subscription';
    value?: number;
  };
}

export interface PerformanceMetrics {
  timestamp: Date;
  pageLoadTime: number; // ms
  apiResponseTime: number; // ms
  serverErrors: number;
  clientErrors: number;
  successfulRequests: number;
}

export interface AnalyticsTimeRange {
  start: Date;
  end: Date;
  interval: 'hour' | 'day' | 'week' | 'month';
}

export interface AnalyticsReport {
  timeRange: AnalyticsTimeRange;
  pageViews: {
    total: number;
    unique: number;
    byPage: Record<string, number>;
  };
  engagement: {
    averageSessionDuration: number; // seconds
    bounceRate: number; // 0..1
    mostEngagedPages: string[];
  };
  conversions: {
    applications: number;
    registrations: number;
    conversionRate: number; // 0..1
  };
  performance: {
    averageLoadTime: number; // ms
    errorRate: number; // 0..1
    availability: number; // 0..1
  };
}