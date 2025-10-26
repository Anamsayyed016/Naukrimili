import { NextRequest, NextResponse } from 'next/server';
import { fetchFromAdzuna, fetchFromIndeed, fetchFromZipRecruiter } from '@/lib/jobs/providers';

export async function POST(request: NextRequest) {
  try {
    const { query = 'software developer', location = 'India', country = 'IN' } = await request.json();
    
    console.log(`🚀 Importing jobs for: "${query}" in "${location}"`);
    
    // Fetch from working providers (3 APIs total)
    const [adzunaJobs, indeedJobs, ziprecruiterJobs] = await Promise.allSettled([
      fetchFromAdzuna(query, country.toLowerCase(), 1, { location }),
      fetchFromIndeed(query, location, 1),
      fetchFromZipRecruiter(query, location, 1)
    ]);
    
    const allJobs = [
      ...(adzunaJobs.status === 'fulfilled' ? adzunaJobs.value : []),
      ...(indeedJobs.status === 'fulfilled' ? indeedJobs.value : []),
      ...(ziprecruiterJobs.status === 'fulfilled' ? ziprecruiterJobs.value : [])
    ];
    
    // Remove duplicates based on title and company
    const uniqueJobs = allJobs.filter((job, index, self) => 
      index === self.findIndex(j => j.title === job.title && j.company === job.company)
    );
    
    return NextResponse.json({
      success: true,
      totalJobs: allJobs.length,
      uniqueJobs: uniqueJobs.length,
      jobs: uniqueJobs.slice(0, 50), // Return first 50 jobs
      providers: {
        adzuna: adzunaJobs.status === 'fulfilled' ? adzunaJobs.value.length : 0,
        indeed: indeedJobs.status === 'fulfilled' ? indeedJobs.value.length : 0,
        ziprecruiter: ziprecruiterJobs.status === 'fulfilled' ? ziprecruiterJobs.value.length : 0
      }
    });
  } catch (_error) {
    console.error('❌ Job import error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}