import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/database-service';

const importBodySchema = z.object({
  queries: z.array(z.string().min(2)).min(1).max(5).default(['software developer']),
  country: z.string().length(2).default('IN'),
  page: z.number().int().positive().max(50).default(1),
  source: z.enum(['adzuna', 'jsearch', 'reed', 'all']).default('all'),
});

interface JobData {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  salary?: string;
  jobType?: string;
  applyUrl?: string;
  postedAt?: Date;
  source: string;
}

// Adzuna API Integration
async function fetchFromAdzuna(query: string, country: string, page: number): Promise<JobData[]> {
  const appId = process.env.ADZUNA_APP_ID;
  const appKey = process.env.ADZUNA_APP_KEY;
  
  if (!appId || !appKey) {
    console.warn('Adzuna API credentials not configured');
    return [];
  }

  try {
    const url = `https://api.adzuna.com/v1/api/jobs/${country}/search/${page}?app_id=${appId}&app_key=${appKey}&what=${encodeURIComponent(query)}&results_per_page=20`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'JobPortal/1.0'
      }
    });

    if (!response.ok) {
      throw new Error(`Adzuna API error: ${response.status}`);
    }

    const data = await response.json();
    return data.results?.map((job: any) => ({
      id: `adzuna_${job.id}`,
      title: job.title,
      company: job.company?.display_name || 'Unknown Company',
      location: job.location?.display_name || 'Unknown Location',
      description: job.description || '',
      salary: job.salary_max ? `${job.salary_min || 0}-${job.salary_max}` : null,
      jobType: job.contract_type || null,
      applyUrl: job.redirect_url,
      postedAt: job.created ? new Date(job.created) : null,
      source: 'adzuna'
    })) || [];
  } catch (error) {
    console.error('Adzuna API error:', error);
    return [];
  }
}

// JSearch (RapidAPI) Integration
async function fetchFromJSearch(query: string, country: string, page: number): Promise<JobData[]> {
  const rapidApiKey = process.env.RAPIDAPI_KEY;
  
  if (!rapidApiKey) {
    console.warn('RapidAPI key not configured');
    return [];
  }

  try {
    const url = 'https://jsearch.p.rapidapi.com/search';
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': rapidApiKey,
        'X-RapidAPI-Host': 'jsearch.p.rapidapi.com'
      },
      body: JSON.stringify({
        query: `${query} in ${country}`,
        page: page.toString(),
        num_pages: '1'
      })
    });

    if (!response.ok) {
      throw new Error(`JSearch API error: ${response.status}`);
    }

    const data = await response.json();
    return data.data?.map((job: any) => ({
      id: `jsearch_${job.job_id}`,
      title: job.job_title,
      company: job.employer_name || 'Unknown Company',
      location: job.job_city || job.job_country || 'Unknown Location',
      description: job.job_description || '',
      salary: job.job_salary || null,
      jobType: job.job_employment_type || null,
      applyUrl: job.job_apply_link,
      postedAt: job.job_posted_at_datetime_utc ? new Date(job.job_posted_at_datetime_utc) : null,
      source: 'jsearch'
    })) || [];
  } catch (error) {
    console.error('JSearch API error:', error);
    return [];
  }
}

// Reed API Integration
async function fetchFromReed(query: string, page: number): Promise<JobData[]> {
  const reedApiKey = process.env.REED_API_KEY;
  
  if (!reedApiKey) {
    console.warn('Reed API key not configured');
    return [];
  }

  try {
    const url = `https://www.reed.co.uk/api/1.0/search?keywords=${encodeURIComponent(query)}&resultsToSkip=${(page - 1) * 20}&resultsToTake=20`;
    const response = await fetch(url, {
      headers: {
        'Authorization': `Basic ${Buffer.from(reedApiKey + ':').toString('base64')}`
      }
    });

    if (!response.ok) {
      throw new Error(`Reed API error: ${response.status}`);
    }

    const data = await response.json();
    return data.results?.map((job: any) => ({
      id: `reed_${job.jobId}`,
      title: job.jobTitle,
      company: job.employerName || 'Unknown Company',
      location: job.locationName || 'Unknown Location',
      description: job.jobDescription || '',
      salary: job.minimumSalary && job.maximumSalary ? `${job.minimumSalary}-${job.maximumSalary}` : null,
      jobType: job.jobType || null,
      applyUrl: job.jobUrl,
      postedAt: job.date ? new Date(job.date) : null,
      source: 'reed'
    })) || [];
  } catch (error) {
    console.error('Reed API error:', error);
    return [];
  }
}

// Save jobs to database
async function saveJobsToDatabase(jobs: JobData[]): Promise<number> {
  let savedCount = 0;
  
  for (const job of jobs) {
    try {
      await prisma.job.upsert({
        where: {
          source_sourceId: {
            source: job.source,
            sourceId: job.id
          }
        },
        update: {
          title: job.title,
          company: job.company,
          location: job.location,
          description: job.description,
          salary: job.salary,
          jobType: job.jobType,
          applyUrl: job.applyUrl,
          postedAt: job.postedAt,
          updatedAt: new Date()
        },
        create: {
          source: job.source,
          sourceId: job.id,
          title: job.title,
          company: job.company,
          location: job.location,
          description: job.description,
          salary: job.salary,
          jobType: job.jobType,
          applyUrl: job.applyUrl,
          postedAt: job.postedAt,
          rawJson: job,
          isActive: true
        }
      });
      savedCount++;
    } catch (error) {
      console.error(`Failed to save job ${job.id}:`, error);
    }
  }
  
  return savedCount;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const parsed = importBodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid body', 
        details: parsed.error.flatten() 
      }, { status: 400 });
    }
    
    const { queries, country, page, source } = parsed.data;
    let allJobs: JobData[] = [];

    // Fetch from different sources based on configuration
    for (const query of queries) {
      if (source === 'all' || source === 'adzuna') {
        const adzunaJobs = await fetchFromAdzuna(query, country, page);
        allJobs.push(...adzunaJobs);
      }
      
      if (source === 'all' || source === 'jsearch') {
        const jsearchJobs = await fetchFromJSearch(query, country, page);
        allJobs.push(...jsearchJobs);
      }
      
      if ((source === 'all' || source === 'reed') && country === 'GB') {
        const reedJobs = await fetchFromReed(query, page);
        allJobs.push(...reedJobs);
      }
    }

    // Remove duplicates based on title and company
    const uniqueJobs = allJobs.filter((job, index, self) => 
      index === self.findIndex(j => 
        j.title.toLowerCase() === job.title.toLowerCase() && 
        j.company.toLowerCase() === job.company.toLowerCase()
      )
    );

    // Save to database
    const savedCount = await saveJobsToDatabase(uniqueJobs);

    return NextResponse.json({ 
      success: true, 
      imported: savedCount,
      fetched: allJobs.length,
      unique: uniqueJobs.length,
      country, 
      page, 
      queries,
      source
    });
  } catch (e: any) {
    console.error('Job import error:', e);
    return NextResponse.json({ 
      success: false, 
      error: e?.message || 'Import failed' 
    }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
