import { NextRequest, NextResponse } from 'next/server';
import { safeLength } from '@/lib/safe-array-utils';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect debug routes in production
  if (pathname.startsWith('/api/debug') || pathname.startsWith('/debug') || pathname.startsWith('/mobile-debug')) {
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    // In development, allow access but log it
    console.log(`🔧 Debug route accessed: ${pathname}`);
  }

  // Handle SEO-friendly job URLs
  // Pattern: /jobs/job-title-company-location-experience-salary-jobId or /jobs/job-title-company-location-experience-salary-jobId/apply
  const jobUrlPattern = /^\/jobs\/([^\/]+)(?:\/(apply|external))?$/;
  const jobMatch = pathname.match(jobUrlPattern);

  if (jobMatch) {
    // Extract job ID from the SEO URL
    const slug = jobMatch[1];
    const action = jobMatch[2]; // 'apply', 'external', or undefined
    
    // Enhanced regex patterns to handle different ID formats
    const patterns = [
      /-([a-zA-Z0-9_-]{20,})$/,           // Long alphanumeric IDs (most specific)
      /-([0-9]+\.[0-9]+)$/,               // Decimal numbers
      /-([0-9]+)$/,                       // Integer numbers
      /-([0-9]+)-([0-9]+)$/,              // Multi-number patterns (take last)
      /-([a-zA-Z0-9_-]+)$/                // Fallback pattern
    ];
    
    // Special handling for sample job IDs that contain hyphens
    const sampleJobMatch = slug.match(/-sample-([a-zA-Z0-9_-]+)$/);
    let jobId = null;
    
    if (sampleJobMatch) {
      jobId = `sample-${sampleJobMatch[1]}`;
    } else {
      // Try other patterns
      for (const pattern of patterns) {
        const match = slug.match(pattern);
        if (match) {
          jobId = match[safeLength(match || []) - 1]; // Get last capture group
          break;
        }
      }
    }
    
    if (jobId) {
      if (action === 'apply') {
        // Route to apply page
        const newUrl = new URL(`/jobs/${jobId}/apply`, request.url);
        return NextResponse.rewrite(newUrl);
      } else if (action === 'external') {
        // Route to external page
        const newUrl = new URL(`/jobs/${jobId}/external`, request.url);
        return NextResponse.rewrite(newUrl);
      } else {
        // Route to job details page
        const newUrl = new URL(`/jobs/seo/${slug}`, request.url);
        newUrl.searchParams.set('id', jobId);
        return NextResponse.rewrite(newUrl);
      }
    }
  }

  // Handle old /jobs/[id] routes - redirect to SEO URLs
  const oldJobPattern = /^\/jobs\/([a-zA-Z0-9_-]+)(?:\/(apply|external))?$/;
  const oldJobMatch = pathname.match(oldJobPattern);

  if (oldJobMatch) {
    const jobId = oldJobMatch[1];
    const action = oldJobMatch[2]; // 'apply', 'external', or undefined
    
    if (action === 'apply') {
      // Route to apply page
      const newUrl = new URL(`/jobs/${jobId}/apply`, request.url);
      return NextResponse.rewrite(newUrl);
    } else if (action === 'external') {
      // Route to external page
      const newUrl = new URL(`/jobs/${jobId}/external`, request.url);
      return NextResponse.rewrite(newUrl);
    } else {
      // Route to job details page
      const newUrl = new URL(`/jobs/seo/job-${jobId}`, request.url);
      newUrl.searchParams.set('id', jobId);
      return NextResponse.rewrite(newUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/jobs/:path*'
  ],
};