import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Handle SEO-friendly job URLs
  // Pattern: /jobs/job-title-company-location-experience-salary-jobId
  const jobUrlPattern = /^\/jobs\/([^\/]+)$/;
  const jobMatch = pathname.match(jobUrlPattern);

  if (jobMatch && !pathname.includes('/apply') && !pathname.includes('/external')) {
    // Extract job ID from the SEO URL
    const slug = jobMatch[1];
    
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
          jobId = match[match.length - 1]; // Get last capture group
          break;
        }
      }
    }
    
    if (jobId) {
      // Redirect to the new SEO route handler
      const newUrl = new URL(`/jobs/seo/${slug}`, request.url);
      newUrl.searchParams.set('id', jobId);
      
      return NextResponse.rewrite(newUrl);
    }
  }

  // Handle old /jobs/[id] routes - redirect to SEO URLs
  const oldJobPattern = /^\/jobs\/([a-zA-Z0-9_-]+)$/;
  const oldJobMatch = pathname.match(oldJobPattern);

  if (oldJobMatch && !pathname.includes('/apply') && !pathname.includes('/external')) {
    const jobId = oldJobMatch[1];
    
    // Try to fetch job data to generate SEO URL
    // For now, we'll just redirect to the new route structure
    const newUrl = new URL(`/jobs/seo/job-${jobId}`, request.url);
    newUrl.searchParams.set('id', jobId);
    
    return NextResponse.rewrite(newUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/jobs/:path*',
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};