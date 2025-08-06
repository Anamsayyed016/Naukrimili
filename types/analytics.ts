export interface PageView {
  page: string;
  timestamp: Date;
  userId?: string;
  sessionId: string;
  duration: number;
  referrer?: string;
  device: {
    type: 'desktop' | 'mobile' | 'tablet';
    browser: string;
    os: string}}

export interface UserEngagement {
  userId: string;
  action: 'click' | 'scroll' | 'hover' | 'search' | 'apply' | 'save';
  element: string;
  page: string;
  timestamp: Date;
  duration?: number;
  metadata?: Record<string, any>}

export interface SearchAnalytics {
  query: string;
  filters?: Record<string, any>;
  timestamp: Date;
  userId?: string;
  sessionId: string;
  resultsCount: number;
  refinements?: string[];
  clickedResults?: string[]}

export interface ApplicationAnalytics {
  jobId: string;
  userId: string;
  timestamp: Date;
  source: string;
  completionTime: number;
  steps: {
    step: string;
    duration: number;
    completed: boolean}[];
  successful: boolean}

export interface UserJourney {
  userId: string;
  sessionId: string;
  startTime: Date;
  endTime: Date;
  touchpoints: {
    page: string;
    action: string;
    timestamp: Date}[];
  conversion?: {
    type: 'application' | 'registration' | 'subscription';
    value?: number}}

export interface PerformanceMetrics {
  timestamp: Date;
  pageLoadTime: number;
  apiResponseTime: number;
  serverErrors: number;
  clientErrors: number;
  successfulRequests: number}

export interface AnalyticsTimeRange {
  start: Date;
  end: Date;
  interval: 'hour' | 'day' | 'week' | 'month'}

export interface AnalyticsReport {
  timeRange: AnalyticsTimeRange;
  pageViews: {
    total: number;
    unique: number;
    byPage: Record<string, number>};
  engagement: {
    averageSessionDuration: number;
    bounceRate: number;
    mostEngagedPages: string[]};
  conversions: {
    applications: number;
    registrations: number;
    conversionRate: number};
  performance: {
    averageLoadTime: number;
    errorRate: number;
    availability: number}}
