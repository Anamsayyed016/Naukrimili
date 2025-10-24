/**
 * Event Integration Service
 * Integrates analytics event collection into existing application flows
 */

import { eventCollector } from './event-collector';

/**
 * Track job view event
 */
export async function trackJobView(
  userId: string | undefined,
  userRole: string | undefined,
  jobId: string,
  jobTitle: string,
  company: string,
  metadata?: Record<string, any>
): Promise<void> {
  try {
    await eventCollector.trackJobView(
      userId,
      userRole,
      jobId,
      jobTitle,
      company,
      metadata
    );
  } catch (error) {
    console.error('❌ Failed to track job view:', error);
  }
}

/**
 * Track job search event
 */
export async function trackJobSearch(
  userId: string | undefined,
  userRole: string | undefined,
  query: string,
  location: string,
  filters: Record<string, any>,
  resultCount: number,
  metadata?: Record<string, any>
): Promise<void> {
  try {
    await eventCollector.trackJobSearch(
      userId,
      userRole,
      query,
      location,
      filters,
      resultCount,
      metadata
    );
  } catch (error) {
    console.error('❌ Failed to track job search:', error);
  }
}

/**
 * Track job application event
 */
export async function trackJobApplication(
  userId: string,
  userRole: string,
  jobId: string,
  jobTitle: string,
  company: string,
  applicationId: string,
  metadata?: Record<string, any>
): Promise<void> {
  try {
    await eventCollector.trackJobApplication(
      userId,
      userRole,
      jobId,
      jobTitle,
      company,
      applicationId,
      metadata
    );
  } catch (error) {
    console.error('❌ Failed to track job application:', error);
  }
}

/**
 * Track job bookmark event
 */
export async function trackJobBookmark(
  userId: string,
  userRole: string,
  jobId: string,
  jobTitle: string,
  company: string,
  action: 'bookmark' | 'unbookmark',
  metadata?: Record<string, any>
): Promise<void> {
  try {
    await eventCollector.trackJobBookmark(
      userId,
      userRole,
      jobId,
      jobTitle,
      company,
      action,
      metadata
    );
  } catch (error) {
    console.error('❌ Failed to track job bookmark:', error);
  }
}

/**
 * Track profile update event
 */
export async function trackProfileUpdate(
  userId: string,
  userRole: string,
  updateType: string,
  metadata?: Record<string, any>
): Promise<void> {
  try {
    await eventCollector.trackProfileUpdate(
      userId,
      userRole,
      updateType,
      metadata
    );
  } catch (error) {
    console.error('❌ Failed to track profile update:', error);
  }
}

/**
 * Track job posting event
 */
export async function trackJobPosting(
  userId: string,
  userRole: string,
  jobId: string,
  jobTitle: string,
  company: string,
  action: 'create' | 'update' | 'delete',
  metadata?: Record<string, any>
): Promise<void> {
  try {
    await eventCollector.trackJobPosting(
      userId,
      userRole,
      jobId,
      jobTitle,
      company,
      action,
      metadata
    );
  } catch (error) {
    console.error('❌ Failed to track job posting:', error);
  }
}

/**
 * Track dashboard view event
 */
export async function trackDashboardView(
  userId: string,
  userRole: string,
  dashboardType: 'jobseeker' | 'employer' | 'admin',
  metadata?: Record<string, any>
): Promise<void> {
  try {
    await eventCollector.trackDashboardView(
      userId,
      userRole,
      dashboardType,
      metadata
    );
  } catch (error) {
    console.error('❌ Failed to track dashboard view:', error);
  }
}

/**
 * Track system health event
 */
export async function trackSystemHealth(
  eventType: string,
  metrics: Record<string, any>,
  metadata?: Record<string, any>
): Promise<void> {
  try {
    await eventCollector.trackSystemHealth(
      eventType,
      metrics,
      metadata
    );
  } catch (error) {
    console.error('❌ Failed to track system health:', error);
  }
}
