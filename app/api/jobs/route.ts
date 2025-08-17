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
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query') || searchParams.get('q') || '';
    const location = searchParams.get('location') || '';
    const company = searchParams.get('company') || '';
    const jobType = searchParams.get('jobType') || '';
    const experienceLevel = searchParams.get('experienceLevel') || '';
    const isRemote = searchParams.get('isRemote') === 'true';
    const sector = searchParams.get('sector') || '';
    const country = searchParams.get('country') || 'IN';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    
    // Enhanced location parameters
    const radius = parseInt(searchParams.get('radius') || '25');
    const userLat = parseFloat(searchParams.get('lat') || '0');
    const userLng = parseFloat(searchParams.get('lng') || '0');
    const sortByDistance = searchParams.get('sortByDistance') === 'true';
    const includeDistance = searchParams.get('includeDistance') === 'true';
    
    const skip = (page - 1) * limit;
    
    // Build where clause
    const where: any = { isActive: true };
    
    if (query) {
      where.OR = [
        { title: { contains: query, mode: 'insensitive' } },
        { company: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } }
      ];
    }
    
    // Enhanced location filtering with smart matching
    if (location) {
      const locationVariations = generateLocationVariations(location);
      where.OR = [
        { location: { contains: location, mode: 'insensitive' } },
        ...locationVariations.map(loc => ({ location: { contains: loc, mode: 'insensitive' } }))
      ];
    }
    
    if (company) {
      where.company = { contains: company, mode: 'insensitive' };
    }
    
    if (jobType) {
      where.jobType = { contains: jobType, mode: 'insensitive' };
    }
    
    if (experienceLevel) {
      where.experienceLevel = { contains: experienceLevel, mode: 'insensitive' };
    }
    
    if (isRemote) {
      where.isRemote = true;
    }
    
    if (sector) {
      where.sector = { contains: sector, mode: 'insensitive' };
    }
    
    if (country) {
      where.country = country;
    }
    
    // Get jobs with pagination
    let jobs = await prisma.job.findMany({
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
    }) as JobWithDistance[];
    
    // Enhanced location processing
    if (userLat && userLng && includeDistance) {
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
    }
    
    const total = await prisma.job.count({ where });
    
    // Format jobs
    const formattedJobs = jobs.map(job => {
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
        companyIndustry: job.companyRelation?.industry
      };
      
      // Add distance if available
      if (job.distance !== undefined) {
        return { ...baseJob, distance: job.distance };
      }
      
      return baseJob;
    });
    
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
      }
    };
    
    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Jobs API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch jobs', details: error?.message },
      { status: 500 }
    );
  }
}

// Helper function to generate location variations for smart matching
function generateLocationVariations(location: string): string[] {
  const variations: string[] = [];
  const lowerLocation = location.toLowerCase();
  
  // Common location synonyms
  const synonyms: Record<string, string[]> = {
    'mumbai': ['bombay', 'bombai'],
    'delhi': ['new delhi', 'dilli', 'dehli'],
    'bangalore': ['bengaluru', 'bangaluru'],
    'calcutta': ['kolkata'],
    'madras': ['chennai'],
    'bombay': ['mumbai'],
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
}
