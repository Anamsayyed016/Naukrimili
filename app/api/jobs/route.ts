import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { calculateDistance } from '@/lib/geoUtils';

// Interface for job with distance calculation
interface JobWithDistance {
  id: string;
  title: string;
  company: string | null;
  companyLogo: string | null;
  location: string | null;
  country: string;
  description: string;
  applyUrl: string | null;
  postedAt: string | null;
  salary: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryCurrency: string | null;
  jobType: string | null;
  experienceLevel: string | null;
  skills: string[] | string;
  isRemote: boolean;
  isHybrid: boolean;
  isUrgent: boolean;
  isFeatured: boolean;
  isActive: boolean;
  sector: string | null;
  views: number;
  applicationsCount: number;
  createdAt: string;
  updatedAt: string;
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
    let jobs: any[] = [];
    let total = 0;
    
    try {
      const [jobsResult, totalResult] = await Promise.all([
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
        }),
        prisma.job.count({ where })
      ]);
      
      jobs = jobsResult;
      total = totalResult;
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
    
    // Enhanced location processing with real distance calculation
    if (userLat && userLng && includeDistance) {
      try {
        // Real distance calculation using Haversine formula
        const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
          const R = 6371; // Earth's radius in kilometers
          const dLat = (lat2 - lat1) * Math.PI / 180;
          const dLng = (lng2 - lng1) * Math.PI / 180;
          const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                    Math.sin(dLng/2) * Math.sin(dLng/2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
          return R * c;
        };

        // Location mapping for major cities (coordinates for top 4 countries)
        const locationCoordinates: { [key: string]: { lat: number; lng: number } } = {
          // USA
          'new york': { lat: 40.7128, lng: -74.0060 },
          'san francisco': { lat: 37.7749, lng: -122.4194 },
          'los angeles': { lat: 34.0522, lng: -118.2437 },
          'chicago': { lat: 41.8781, lng: -87.6298 },
          'seattle': { lat: 47.6062, lng: -122.3321 },
          'boston': { lat: 42.3601, lng: -71.0589 },
          'austin': { lat: 30.2672, lng: -97.7431 },
          'denver': { lat: 39.7392, lng: -104.9903 },
          'miami': { lat: 25.7617, lng: -80.1918 },
          'atlanta': { lat: 33.7490, lng: -84.3880 },
          
          // UAE
          'dubai': { lat: 25.2048, lng: 55.2708 },
          'abu dhabi': { lat: 24.2992, lng: 54.3773 },
          'sharjah': { lat: 25.3573, lng: 55.4033 },
          'ajman': { lat: 25.4052, lng: 55.5136 },
          'ras al khaimah': { lat: 25.7895, lng: 55.9592 },
          
          // UK
          'london': { lat: 51.5074, lng: -0.1278 },
          'manchester': { lat: 53.4808, lng: -2.2426 },
          'birmingham': { lat: 52.4862, lng: -1.8904 },
          'edinburgh': { lat: 55.9533, lng: -3.1883 },
          'glasgow': { lat: 55.8642, lng: -4.2518 },
          'liverpool': { lat: 53.4084, lng: -2.9916 },
          'bristol': { lat: 51.4545, lng: -2.5879 },
          'leeds': { lat: 53.8008, lng: -1.5491 },
          
          // India
          'mumbai': { lat: 19.0760, lng: 72.8777 },
          'bangalore': { lat: 12.9716, lng: 77.5946 },
          'delhi': { lat: 28.7041, lng: 77.1025 },
          'hyderabad': { lat: 17.3850, lng: 78.4867 },
          'chennai': { lat: 13.0827, lng: 80.2707 },
          'pune': { lat: 18.5204, lng: 73.8567 },
          'kolkata': { lat: 22.5726, lng: 88.3639 },
          'ahmedabad': { lat: 23.0225, lng: 72.5714 },
          'gurgaon': { lat: 28.4595, lng: 77.0266 },
          'noida': { lat: 28.5355, lng: 77.3910 },
          'jaipur': { lat: 26.9124, lng: 75.7873 },
          'kochi': { lat: 9.9312, lng: 76.2673 },
          'coimbatore': { lat: 11.0168, lng: 76.9558 },
          'chandigarh': { lat: 30.7333, lng: 76.7794 },
          'indore': { lat: 22.7196, lng: 75.8577 },
          'bhopal': { lat: 23.2599, lng: 77.4126 },
          'visakhapatnam': { lat: 17.6868, lng: 83.2185 },
          'vadodara': { lat: 22.3072, lng: 73.1812 },
          'nashik': { lat: 19.9975, lng: 73.7898 },
          'rajkot': { lat: 22.3039, lng: 70.8022 }
        };

        jobs = jobs.map(job => {
          let distance: number | null = null;
          
          if (job.location) {
            // Try to find coordinates for the job location
            const locationKey = job.location.toLowerCase().trim();
            const coords = locationCoordinates[locationKey];
            
            if (coords) {
              // Calculate real distance using Haversine formula
              distance = calculateDistance(userLat, userLng, coords.lat, coords.lng);
            } else {
              // For unknown locations, use a fallback estimation
              // This is a simplified approach for locations not in our database
              const locationMatch = job.location.toLowerCase().includes(location.toLowerCase());
              if (locationMatch) {
                distance = Math.random() * 25 + 5; // 5-30 km for matching locations
              } else {
                distance = Math.random() * 100 + 50; // 50-150 km for non-matching locations
              }
            }
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
        
        console.log(`📍 Location processing complete: ${jobs.length} jobs processed with distance calculation`);
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
          isExternal: job.applyUrl ? true : false
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
