import { NextRequest, NextResponse } from 'next/server';
import { safeLength } from './lib/safe-array-utils';

export function middleware(request: NextRequest) {
  try {
    // Safety check for request and nextUrl
    if (!request || !request.nextUrl) {
      console.error('❌ Invalid request object in middleware');
      return NextResponse.next();
    }

    const { pathname } = request.nextUrl;
    
    // Safety check for pathname
    if (!pathname || typeof pathname !== 'string') {
      console.error('❌ Invalid pathname in middleware:', pathname);
      return NextResponse.next();
    }

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
      // Special handling for sample jobs in SEO URLs
      // Look for pattern: -1759851700270-18 (timestamp-number) which indicates sample job
      const sampleTimestampMatch = slug.match(/-(\d{13})-(\d+)$/);
      if (sampleTimestampMatch) {
        const timestamp = sampleTimestampMatch[1];
        const number = sampleTimestampMatch[2];
        jobId = `sample-${timestamp}-${number}`;
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

  // Handle direct /jobs/[id] routes - let them pass through to regular job details
  const directJobPattern = /^\/jobs\/([a-zA-Z0-9_-]+)(?:\/(apply|external))?$/;
  const directJobMatch = pathname.match(directJobPattern);

  if (directJobMatch) {
    const jobId = directJobMatch[1];
    const action = directJobMatch[2]; // 'apply', 'external', or undefined
    
    // Check if it's a simple numeric ID (direct access)
    if (/^\d+$/.test(jobId)) {
      // Let it pass through to the regular job details page
      return NextResponse.next();
    }
    
    // For other IDs, check if they're SEO URLs or direct IDs
    if (jobId.includes('-') && !jobId.startsWith('sample-') && !jobId.startsWith('ext-')) {
      // This is likely a SEO URL, let it be handled by the SEO URL pattern above
      return NextResponse.next();
    }
    
    // For other direct IDs, let them pass through
    return NextResponse.next();
  }

  return NextResponse.next();
  
  } catch (error) {
    console.error('❌ Middleware error:', error);
    console.error('❌ Request URL:', request?.nextUrl?.href || 'unknown');
    console.error('❌ Request pathname:', request?.nextUrl?.pathname || 'unknown');
    // Always return NextResponse.next() to prevent middleware from breaking the app
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    '/jobs/:path*'
  ],
  // Use experimental-edge runtime for Next.js 15 compatibility
  runtime: 'experimental-edge',
};