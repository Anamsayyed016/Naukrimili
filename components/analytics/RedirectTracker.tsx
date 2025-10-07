'use client';

import { useEffect } from 'react';

interface RedirectTrackerProps {
  jobId: string;
  jobTitle: string;
  company: string;
  source: string;
  redirectUrl: string;
}

export function RedirectTracker({ jobId, jobTitle, company, source, redirectUrl }: RedirectTrackerProps) {
  useEffect(() => {
    // Track redirect for analytics
    if (typeof gtag !== 'undefined') {
      gtag('event', 'job_redirect', {
        job_id: jobId,
        job_title: jobTitle,
        company: company,
        source: source,
        redirect_url: redirectUrl
      });
    }
    
    // Track for internal analytics
    fetch('/api/analytics/job-redirect', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jobId,
        jobTitle,
        company,
        source,
        redirectUrl,
        timestamp: new Date().toISOString()
      })
    }).catch(error => {
      console.warn('Failed to track redirect:', error);
    });
  }, [jobId, jobTitle, company, source, redirectUrl]);

  return null;
}