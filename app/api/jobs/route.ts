import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { calculateDistance } from '@/lib/geoUtils';

// Interface for job with distance calculation
interface JobWithDistance {
  id: number;
  title: string;
  company: string | null;
  companyLogo: string | null;
  location: string | null;
  country: string;
  description: string;
  applyUrl: string | null;
  postedAt: Date | null;
  salary: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryCurrency: string | null;
  jobType: string | null;
  experienceLevel: string | null;
  skills: string[];
  isRemote: boolean;
  isHybrid: boolean;
  isUrgent: boolean;
  isFeatured: boolean;
  isActive: boolean;
  sector: string | null;
  views: number;
  applicationsCount: number;
  createdAt: Date;
  updatedAt: Date;
  companyRelation?: {
    name: string | null;
    logo: string | null;
    location: string | null;
    industry: string | null;
  } | null;
  distance?: number | null;
}

export async function GET(request: NextRequest) {
  try {
    // Validate request
    if (!request.url) {
      console.error('❌ Invalid request URL in jobs API');
      return NextResponse.json(
        { success: false, error: 'Invalid request URL' },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);
    
    // Validate and parse parameters with defaults
    const query = searchParams.get('query') || searchParams.get('q') || '';
    const location = searchParams.get('location') || '';
    const company = searchParams.get('company') || '';
    const jobType = searchParams.get('jobType') || '';
    const experienceLevel = searchParams.get('experienceLevel') || '';
    const isRemote = searchParams.get('isRemote') === 'true';
    const sector = searchParams.get('sector') || '';
    const country = searchParams.get('country') || 'IN';
    
    // Validate numeric parameters
    let page = 1;
    let limit = 20;
    let radius = 25;
    let userLat = 0;
    let userLng = 0;
    
    try {
      page = Math.max(1, parseInt(searchParams.get('page') || '1'));
      limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')));
      radius = Math.min(100, Math.max(1, parseInt(searchParams.get('radius') || '25')));
      userLat = parseFloat(searchParams.get('lat') || '0');
      userLng = parseFloat(searchParams.get('lng') || '0');
    } catch (parseError) {
      console.warn('⚠️ Parameter parsing error, using defaults:', parseError);
    }
    
    const sortByDistance = searchParams.get('sortByDistance') === 'true';
    const includeDistance = searchParams.get('includeDistance') === 'true';
    
    const skip = (page - 1) * limit;
    
    // Build where clause with validation
    const where: any = { isActive: true };
    
    if (query && query.trim().length > 0) {
      where.OR = [
        { title: { contains: query.trim(), mode: 'insensitive' } },
        { company: { contains: query.trim(), mode: 'insensitive' } },
        { description: { contains: query.trim(), mode: 'insensitive' } }
      ];
    }
    
    // Enhanced location filtering with smart matching
    if (location && location.trim().length > 0) {
      try {
        const locationVariations = generateLocationVariations(location.trim());
        where.OR = [
          { location: { contains: location.trim(), mode: 'insensitive' } },
          ...locationVariations.map(loc => ({ location: { contains: loc, mode: 'insensitive' } }))
        ];
      } catch (error) {
        console.warn('⚠️ Location variation generation failed:', error);
        // Fallback to simple location search
        where.location = { contains: location.trim(), mode: 'insensitive' };
      }
    }
    
    if (company && company.trim().length > 0) {
      where.company = { contains: company.trim(), mode: 'insensitive' };
    }
    
    if (jobType && jobType.trim().length > 0) {
      where.jobType = { contains: jobType.trim(), mode: 'insensitive' };
    }
    
    if (experienceLevel && experienceLevel.trim().length > 0) {
      where.experienceLevel = { contains: experienceLevel.trim(), mode: 'insensitive' };
    }
    
    if (isRemote) {
      where.isRemote = true;
    }
    
    if (sector && sector.trim().length > 0) {
      where.sector = { contains: sector.trim(), mode: 'insensitive' };
    }
    
    if (country && country.trim().length > 0) {
      where.country = country.trim();
    }
    
    console.log(`🔍 Jobs API: Searching with filters:`, { query, location, company, jobType, experienceLevel, isRemote, sector, country, page, limit });
    
    // Get jobs with pagination and error handling
    let jobs: JobWithDistance[] = [];
    let total = 0;
    
    try {
      [jobs, total] = await Promise.all([
        prisma.job.findMany({
          where,
          skip,
          take: limit,
          orderBy: sortByDistance && userLat && userLng ? undefined : { createdAt: 'desc' },
          include: {
            companyRelation: {
              select: {
                name: true,
                logo: true,
                location: true,
                industry: true
              }
            }
          }
        }) as Promise<JobWithDistance[]>,
        prisma.job.count({ where })
      ]);
    } catch (dbError: any) {
      console.error('❌ Database query failed:', dbError);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Database query failed',
          details: process.env.NODE_ENV === 'development' ? dbError.message : undefined
        },
        { status: 500 }
      );
    }
    
    // Enhanced location processing with error handling
    if (userLat && userLng && includeDistance) {
      try {
        jobs = jobs.map(job => {
          // For now, we'll use a placeholder distance calculation
          // In the future, you can add latitude/longitude fields to the Job model
          // or create a separate Location model with coordinates
          
          // Placeholder: calculate rough distance based on location string matching
          // This is a simplified approach - in production, you'd want proper coordinates
          let distance: number | null = null;
          
          if (job.location) {
            // Simple distance estimation based on location similarity
            // This is a placeholder - replace with real coordinate-based calculation
            const locationMatch = job.location.toLowerCase().includes(location.toLowerCase());
            distance = locationMatch ? Math.random() * 50 : Math.random() * 100 + 50;
          }
          
          return { ...job, distance };
        });
        
        // Sort by distance if requested
        if (sortByDistance) {
          jobs.sort((a, b) => {
            if (a.distance === null && b.distance === null) return 0;
            if (a.distance === null) return 1;
            if (b.distance === null) return -1;
            return a.distance - b.distance;
          });
        }
        
        // Filter by radius if specified
        if (radius > 0) {
          jobs = jobs.filter(job => job.distance === null || job.distance <= radius);
        }
      } catch (locationError) {
        console.warn('⚠️ Location processing failed, continuing without distance:', locationError);
      }
    }
    
    // Format jobs with error handling
    let formattedJobs = [];
    try {
      formattedJobs = jobs.map(job => {
        const baseJob = {
          id: job.id,
          title: job.title,
          company: job.company || job.companyRelation?.name,
          companyLogo: job.companyLogo || job.companyRelation?.logo,
          location: job.location,
          country: job.country,
          description: job.description,
          applyUrl: job.applyUrl,
          postedAt: job.postedAt,
          salary: job.salary,
          salaryMin: job.salaryMin,
          salaryMax: job.salaryMax,
          salaryCurrency: job.salaryCurrency,
          jobType: job.jobType,
          experienceLevel: job.experienceLevel,
          skills: job.skills,
          isRemote: job.isRemote,
          isHybrid: job.isHybrid,
          isUrgent: job.isUrgent,
          isFeatured: job.isFeatured,
          isActive: job.isActive,
          sector: job.sector,
          views: job.views,
          applicationsCount: job.applicationsCount,
          createdAt: job.createdAt,
          updatedAt: job.updatedAt,
          companyLocation: job.companyRelation?.location,
          companyIndustry: job.companyRelation?.industry,
          // Add new fields for internal/external handling
          apply_url: job.apply_url || null,
          source_url: job.source_url || null,
          isExternal: job.source !== 'manual',
          source: job.source
        };
        
        // Add distance if available
        if (job.distance !== undefined) {
          return { ...baseJob, distance: job.distance };
        }
        
        return baseJob;
      });
    } catch (formatError) {
      console.error('❌ Job formatting failed:', formatError);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Job formatting failed',
          details: process.env.NODE_ENV === 'development' ? formatError.message : undefined
        },
        { status: 500 }
      );
    }
    
    const totalPages = Math.ceil(total / limit);
    
    // Enhanced response with location insights
    const response = {
      success: true,
      jobs: formattedJobs,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      },
      location: {
        userCoordinates: userLat && userLng ? { lat: userLat, lng: userLng } : null,
        searchRadius: radius,
        jobsInRadius: userLat && userLng ? jobs.filter(j => j.distance !== null && j.distance <= radius).length : null,
        totalJobsFound: total
      },
      search: {
        query,
        location,
        filters: {
          jobType,
          experienceLevel,
          isRemote,
          sector,
          country
        }
      },
      meta: {
        timestamp: new Date().toISOString(),
        endpoint: '/api/jobs',
        version: '1.0'
      }
    };
    
    console.log(`✅ Jobs API: Successfully returned ${formattedJobs.length} jobs (${total} total)`);
    return NextResponse.json(response);
    
  } catch (error: any) {
    console.error('❌ Jobs API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch jobs', 
        details: process.env.NODE_ENV === 'development' ? error?.message : undefined,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// Helper function to generate location variations for smart matching
function generateLocationVariations(location: string): string[] {
  try {
    const variations: string[] = [];
    const lowerLocation = location.toLowerCase();
    
         // Common location synonyms
     const synonyms: Record<string, string[]> = {
       'mumbai': ['bombay', 'bombai'],
       'delhi': ['new delhi', 'dilli', 'dehli'],
       'bangalore': ['bengaluru', 'bangaluru'],
       'calcutta': ['kolkata'],
       'madras': ['chennai']
     };
    
    // Add synonyms if found
    for (const [key, values] of Object.entries(synonyms)) {
      if (lowerLocation.includes(key)) {
        variations.push(...values);
      }
    }
    
    // Add common abbreviations
    if (lowerLocation.includes('new york')) variations.push('nyc', 'ny');
    if (lowerLocation.includes('los angeles')) variations.push('la', 'l.a.');
    if (lowerLocation.includes('san francisco')) variations.push('sf', 'san fran');
    if (lowerLocation.includes('united states')) variations.push('usa', 'us', 'america');
    if (lowerLocation.includes('united kingdom')) variations.push('uk', 'england', 'britain');
    
    return variations;
  } catch (error) {
    console.warn('⚠️ Location variation generation failed:', error);
    return [];
  }
}
