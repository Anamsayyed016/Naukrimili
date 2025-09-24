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
    const jobIdMatch = slug.match(/-([a-zA-Z0-9_-]+)$/);
    
    if (jobIdMatch) {
      const jobId = jobIdMatch[1];
      
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