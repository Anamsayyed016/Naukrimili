/**
 * External Job Application Tracker
 * Tracks when users click on external job applications for analytics and UX improvement
 */

export interface ExternalApplicationEvent {
  jobId: string;
  source: string;
  company: string;
  title: string;
  timestamp: string;
  userAgent: string;
  isMobile: boolean;
  referrer: string;
}

export interface ExternalApplicationStats {
  totalApplications: number;
  applicationsBySource: Record<string, number>;
  applicationsByCompany: Record<string, number>;
  mobileVsDesktop: { mobile: number; desktop: number };
  recentApplications: ExternalApplicationEvent[];
}

class ExternalApplicationTracker {
  private storageKey = 'external_job_applications';
  private maxStoredEvents = 100;

  /**
   * Track an external job application click
   */
  trackApplication(jobData: {
    jobId: string;
    source: string;
    company: string;
    title: string;
  }): void {
    try {
      const event: ExternalApplicationEvent = {
        ...jobData,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        isMobile: this.isMobileDevice(),
        referrer: document.referrer || 'direct'
      };

      // Store locally for analytics
      this.storeEvent(event);

      // Log for debugging
      console.log('📊 External job application tracked:', event);

      // Send to analytics service if configured
      this.sendToAnalytics(event);

    } catch (error) {
      console.error('Failed to track external application:', error);
    }
  }

  /**
   * Get application statistics
   */
  getStats(): ExternalApplicationStats {
    try {
      const events = this.getStoredEvents();
      
      const stats: ExternalApplicationStats = {
        totalApplications: events.length,
        applicationsBySource: {},
        applicationsByCompany: {},
        mobileVsDesktop: { mobile: 0, desktop: 0 },
        recentApplications: events.slice(-10).reverse()
      };

      events.forEach(event => {
        // Count by source
        stats.applicationsBySource[event.source] = (stats.applicationsBySource[event.source] || 0) + 1;
        
        // Count by company
        stats.applicationsByCompany[event.company] = (stats.applicationsByCompany[event.company] || 0) + 1;
        
        // Count mobile vs desktop
        if (event.isMobile) {
          stats.mobileVsDesktop.mobile++;
        } else {
          stats.mobileVsDesktop.desktop++;
        }
      });

      return stats;
    } catch (error) {
      console.error('Failed to get application stats:', error);
      return {
        totalApplications: 0,
        applicationsBySource: {},
        applicationsByCompany: {},
        mobileVsDesktop: { mobile: 0, desktop: 0 },
        recentApplications: []
      };
    }
  }

  /**
   * Clear stored application data
   */
  clearData(): void {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(this.storageKey);
      }
      console.log('External application data cleared');
    } catch (error) {
      console.error('Failed to clear application data:', error);
    }
  }

  /**
   * Export application data
   */
  exportData(): string {
    try {
      const events = this.getStoredEvents();
      return JSON.stringify(events, null, 2);
    } catch (error) {
      console.error('Failed to export application data:', error);
      return '[]';
    }
  }

  /**
   * Check if device is mobile
   */
  private isMobileDevice(): boolean {
    if (typeof window === 'undefined') return false;
    
    const userAgent = navigator.userAgent.toLowerCase();
    const mobileKeywords = ['mobile', 'android', 'iphone', 'ipad', 'windows phone'];
    
    return mobileKeywords.some(keyword => userAgent.includes(keyword)) || 
           window.innerWidth <= 768;
  }

  /**
   * Store application event locally
   */
  private storeEvent(event: ExternalApplicationEvent): void {
    try {
      if (typeof localStorage === 'undefined') return;

      const events = this.getStoredEvents();
      events.push(event);

      // Keep only recent events
      if (events.length > this.maxStoredEvents) {
        events.splice(0, events.length - this.maxStoredEvents);
      }

      localStorage.setItem(this.storageKey, JSON.stringify(events));
    } catch (error) {
      console.error('Failed to store application event:', error);
    }
  }

  /**
   * Get stored application events
   */
  private getStoredEvents(): ExternalApplicationEvent[] {
    try {
      if (typeof localStorage === 'undefined') return [];

      const stored = localStorage.getItem(this.storageKey);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to get stored events:', error);
      return [];
    }
  }

  /**
   * Send event to analytics service
   */
  private sendToAnalytics(event: ExternalApplicationEvent): void {
    try {
      // Google Analytics 4
      if (typeof gtag !== 'undefined') {
        gtag('event', 'external_job_application', {
          job_id: event.jobId,
          job_source: event.source,
          company: event.company,
          job_title: event.title,
          device_type: event.isMobile ? 'mobile' : 'desktop'
        });
      }

      // Google Tag Manager
      if (typeof dataLayer !== 'undefined') {
        dataLayer.push({
          event: 'external_job_application',
          job_id: event.jobId,
          job_source: event.source,
          company: event.company,
          job_title: event.title,
          device_type: event.isMobile ? 'mobile' : 'desktop'
        });
      }

      // Custom analytics endpoint
      this.sendToCustomEndpoint(event);

    } catch (error) {
      console.error('Failed to send to analytics:', error);
    }
  }

  /**
   * Send to custom analytics endpoint
   */
  private async sendToCustomEndpoint(event: ExternalApplicationEvent): Promise<void> {
    try {
      // Only send if we have a custom analytics endpoint configured
      const analyticsEndpoint = process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT;
      if (!analyticsEndpoint) return;

      await fetch(analyticsEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
      });
    } catch (error) {
      // Silently fail - analytics shouldn't break user experience
      console.debug('Analytics endpoint not available:', error);
    }
  }
}

// Export singleton instance
export const externalApplicationTracker = new ExternalApplicationTracker();

// Export convenience function
export const trackExternalApplication = (jobData: {
  jobId: string;
  source: string;
  company: string;
  title: string;
}) => externalApplicationTracker.trackApplication(jobData);
