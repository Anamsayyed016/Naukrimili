import { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { handleApiError } from '@/lib/error-handler';
import { checkRateLimit } from '@/lib/rate-limit';

// Types for job sectors
interface JobSector {
  name: string;
  keywords: string[];
  icon: string;
}

interface SectorClassification {
  sectorId: string;
  confidence: number;
  matchedKeywords: string[];
}

// Global cache for sector classifications
const GLOBAL_CACHE = new Map<string, {
  matches: SectorClassification[];
  timestamp: number;
}>();

// Cache configuration
const CACHE_MAX_SIZE = 1000;
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

// Input validation schemas
const sectorQuerySchema = z.object({
  format: z.enum(['simple', 'detailed']).optional().default('detailed'),
  sector: z.string().optional()
});

const classifyJobSchema = z.object({
  jobTitle: z.string().min(1, 'Job title is required').max(200),
  description: z.string().optional()
});

const JOB_SECTORS = {
  'technology': {
    name: 'Technology & IT',
    keywords: ['software developer', 'web developer', 'data scientist', 'devops engineer', 'cybersecurity', 'AI engineer', 'mobile developer', 'full stack developer', 'backend developer', 'frontend developer', 'cloud engineer', 'database administrator'],
    icon: '💻'
  },
  'healthcare': {
    name: 'Healthcare & Medical',
    keywords: ['nurse', 'doctor', 'pharmacist', 'medical assistant', 'healthcare administrator', 'therapist', 'surgeon', 'radiologist', 'dentist', 'veterinarian', 'paramedic', 'medical technician'],
    icon: '🏥'
  },
  'finance': {
    name: 'Finance & Banking',
    keywords: ['accountant', 'financial analyst', 'investment banker', 'insurance agent', 'tax advisor', 'auditor', 'financial planner', 'loan officer', 'credit analyst', 'compliance officer'],
    icon: '💰'
  },
  'education': {
    name: 'Education & Training',
    keywords: ['teacher', 'professor', 'tutor', 'education coordinator', 'school administrator', 'librarian', 'curriculum developer', 'academic advisor', 'teaching assistant', 'principal'],
    icon: '📚'
  },
  'engineering': {
    name: 'Engineering',
    keywords: ['mechanical engineer', 'civil engineer', 'electrical engineer', 'chemical engineer', 'aerospace engineer', 'structural engineer', 'environmental engineer', 'biomedical engineer', 'industrial engineer'],
    icon: '⚙️'
  },
  'marketing': {
    name: 'Marketing & Communications',
    keywords: ['digital marketer', 'content creator', 'SEO specialist', 'brand manager', 'social media manager', 'marketing coordinator', 'PR specialist', 'copywriter', 'email marketer', 'growth hacker'],
    icon: '📈'
  },
  'sales': {
    name: 'Sales & Business Development',
    keywords: ['sales representative', 'account manager', 'business development', 'sales director', 'retail associate', 'sales executive', 'inside sales', 'outside sales', 'account executive', 'sales consultant'],
    icon: '🤝'
  },
  'construction': {
    name: 'Construction & Trades',
    keywords: ['construction worker', 'project manager', 'architect', 'carpenter', 'electrician', 'plumber', 'roofer', 'painter', 'welder', 'mason', 'heavy equipment operator'],
    icon: '🏗️'
  },
  'hospitality': {
    name: 'Hospitality & Tourism',
    keywords: ['hotel manager', 'chef', 'waiter', 'event coordinator', 'travel agent', 'housekeeper', 'concierge', 'bartender', 'tour guide', 'restaurant manager', 'catering manager'],
    icon: '🏨'
  },
  'logistics': {
    name: 'Logistics & Transportation',
    keywords: ['supply chain manager', 'warehouse worker', 'delivery driver', 'logistics coordinator', 'freight forwarder', 'dispatcher', 'inventory manager', 'shipping clerk', 'truck driver'],
    icon: '🚛'
  },
  'legal': {
    name: 'Legal Services',
    keywords: ['lawyer', 'paralegal', 'legal assistant', 'compliance officer', 'contract manager', 'attorney', 'legal counsel', 'court reporter', 'legal secretary', 'judge'],
    icon: '⚖️'
  },
  'design': {
    name: 'Design & Creative',
    keywords: ['graphic designer', 'UX designer', 'interior designer', 'fashion designer', 'web designer', 'UI designer', 'product designer', 'art director', 'animator', 'photographer', 'video editor'],
    icon: '🎨'
  },
  'manufacturing': {
    name: 'Manufacturing & Production',
    keywords: ['production manager', 'quality control', 'machine operator', 'maintenance technician', 'assembly worker', 'supervisor', 'quality inspector', 'plant manager', 'process engineer'],
    icon: '🏭'
  },
  'retail': {
    name: 'Retail & Customer Service',
    keywords: ['store manager', 'cashier', 'inventory specialist', 'customer service', 'visual merchandiser', 'retail associate', 'store supervisor', 'buyer', 'loss prevention'],
    icon: '🛍️'
  },
  'government': {
    name: 'Government & Public Service',
    keywords: ['civil servant', 'policy analyst', 'public administrator', 'social worker', 'urban planner', 'government clerk', 'public health inspector', 'city planner', 'federal agent'],
    icon: '🏛️'
  },
  'media': {
    name: 'Media & Communications',
    keywords: ['journalist', 'video editor', 'photographer', 'content writer', 'broadcaster', 'radio host', 'news anchor', 'producer', 'sound technician', 'camera operator'],
    icon: '📺'
  },
  'automotive': {
    name: 'Automotive Industry',
    keywords: ['automotive technician', 'car salesperson', 'parts specialist', 'service advisor', 'auto mechanic', 'body shop technician', 'car detailer', 'service manager'],
    icon: '🚗'
  },
  'agriculture': {
    name: 'Agriculture & Food',
    keywords: ['farmer', 'agricultural scientist', 'veterinarian', 'farm manager', 'food inspector', 'crop specialist', 'livestock manager', 'food scientist', 'agricultural engineer'],
    icon: '🌾'
  },
  'real-estate': {
    name: 'Real Estate & Property',
    keywords: ['real estate agent', 'property manager', 'appraiser', 'mortgage broker', 'real estate developer', 'leasing agent', 'property inspector', 'real estate analyst'],
    icon: '🏠'
  },
  'telecommunications': {
    name: 'Telecommunications',
    keywords: ['network engineer', 'telecom technician', 'call center agent', 'field technician', 'network administrator', 'telecom analyst', 'systems engineer', 'technical support'],
    icon: '📱'
  },
  'energy': {
    name: 'Energy & Utilities',
    keywords: ['power plant operator', 'utility worker', 'renewable energy technician', 'electrical lineman', 'energy analyst', 'solar installer', 'wind technician', 'gas technician'],
    icon: '⚡'
  },
  'non-profit': {
    name: 'Non-Profit & NGO',
    keywords: ['program coordinator', 'fundraiser', 'volunteer coordinator', 'community outreach', 'grant writer', 'social services', 'humanitarian worker', 'charity worker'],
    icon: '❤️'
  },
  'sports': {
    name: 'Sports & Recreation',
    keywords: ['personal trainer', 'coach', 'sports therapist', 'fitness instructor', 'recreation coordinator', 'athletic trainer', 'sports analyst', 'gym manager'],
    icon: '⚽'
  },
  'security': {
    name: 'Security & Safety',
    keywords: ['security guard', 'security officer', 'safety inspector', 'loss prevention', 'private investigator', 'emergency responder', 'safety coordinator', 'security analyst'],
    icon: '🛡️'
  },
  'human-resources': {
    name: 'Human Resources',
    keywords: ['HR manager', 'recruiter', 'talent acquisition', 'HR generalist', 'compensation analyst', 'training coordinator', 'employee relations', 'HR assistant'],
    icon: '👥'
  }
};

export async function GET(request: NextRequest) {
  try {
    // Check rate limit
    const rateLimitResult = checkRateLimit(request, 'api');
    
    if (!rateLimitResult.allowed) {
      return Response.json({
        success: false,
        error: 'Rate limit exceeded',
        retryAfter: Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)
      }, { 
        status: 429,
        headers: {
          'Retry-After': String(Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000))
        }
      });
    }

    const { searchParams } = new URL(request.url);
    
    // Validate query parameters
    const queryResult = sectorQuerySchema.safeParse({
      format: searchParams.get('format'),
      sector: searchParams.get('sector')
    });

    if (!queryResult.success) {
      return Response.json({
        success: false,
        error: 'Invalid query parameters',
        details: queryResult.error.issues
      }, { status: 400 });
    }

    const { format, sector } = queryResult.data;

    // If specific sector requested
    if (sector) {
      const sectorData = JOB_SECTORS[sector as keyof typeof JOB_SECTORS];
      if (!sectorData) {
        return Response.json({
          success: false,
          error: 'Sector not found'
        }, { status: 404 });
      }

      return Response.json({
        success: true,
        sector: {
          id: sector,
          ...sectorData
        }
      });
    }

    // Return all sectors
    if (format === 'simple') {
      const sectors = Object.keys(JOB_SECTORS);
      return Response.json({
        success: true,
        sectors,
        count: sectors.length,
        timestamp: new Date().toISOString()
      });
    }

    // Detailed format (default)
    const sectorsWithDetails = Object.entries(JOB_SECTORS).map(([key, value]) => ({
      id: key,
      ...value,
      jobCount: value.keywords.length
    }));

    return Response.json({
      success: true,
      sectors: sectorsWithDetails,
      count: sectorsWithDetails.length,
      totalKeywords: sectorsWithDetails.reduce((sum, sector) => sum + sector.jobCount, 0),
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    return handleApiError(error, { endpoint: 'GET /api/sectors' });
  }
}

export async function POST(request: NextRequest) {
  let requestBody: unknown;
  
  try {
    // Check rate limit
    const rateLimitResult = checkRateLimit(request, 'api');
    
    if (!rateLimitResult.allowed) {
      return Response.json({
        success: false,
        error: 'Rate limit exceeded',
        retryAfter: Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)
      }, { 
        status: 429,
        headers: {
          'Retry-After': String(Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000))
        }
      });
    }

    // Parse and validate request body
    requestBody = await request.json().catch(() => ({}));
    const validationResult = classifyJobSchema.safeParse(requestBody);

    if (!validationResult.success) {
      return Response.json({
        success: false,
        error: 'Validation failed',
        details: validationResult.error.issues
      }, { status: 400 });
    }

    const { jobTitle, description } = validationResult.data;

    // Normalize input text for matching
    const text = `${jobTitle} ${description || ''}`.toLowerCase().trim();
    
    // Enhanced sector classification with improved matching and caching
    const cacheKey = text.slice(0, 100); // Use first 100 chars as cache key
    const now = Date.now();
    
    // Check cache and validate TTL
    const cachedResult = GLOBAL_CACHE.get(cacheKey);
    if (cachedResult && (now - cachedResult.timestamp) < CACHE_TTL) {
      return processMatches(cachedResult.matches);
    }

    // Clean up expired cache entries
    if (GLOBAL_CACHE.size >= CACHE_MAX_SIZE) {
      const expiredKeys = Array.from(GLOBAL_CACHE.entries())
        .filter(([_, value]) => (now - value.timestamp) >= CACHE_TTL)
        .map(([key]) => key);
      
      expiredKeys.forEach(key => GLOBAL_CACHE.delete(key));
      
      // If still too large, remove oldest entries
      if (GLOBAL_CACHE.size >= CACHE_MAX_SIZE) {
        const oldestKeys = Array.from(GLOBAL_CACHE.entries())
          .sort((a, b) => a[1].timestamp - b[1].timestamp)
          .slice(0, Math.floor(CACHE_MAX_SIZE * 0.2))
          .map(([key]) => key);
        
        oldestKeys.forEach(key => GLOBAL_CACHE.delete(key));
      }
    }

    // Prepare text for matching
    const words = text.toLowerCase()
      .replace(/[^\w\s-]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2);

    const wordSet = new Set(words);
    
    const sectorMatches = Object.entries(JOB_SECTORS).map(([sectorId, sectorData]) => {
      const matchedKeywords = sectorData.keywords.filter(keyword => {
        const keywordLower = keyword.toLowerCase();
        
        // Exact match check
        if (text.includes(keywordLower)) {
          return true;
        }
        
        // Word-level matching
        const keywordWords = keywordLower
          .replace(/[^\w\s-]/g, ' ')
          .split(/\s+/)
          .filter(word => word.length > 2);
        
        // Check for word matches and compound words
        const wordMatches = keywordWords.filter(word => 
          wordSet.has(word) || 
          [...wordSet].some(textWord => 
            (textWord.includes(word) && textWord.length <= word.length * 1.5) ||
            (word.includes(textWord) && word.length <= textWord.length * 1.5)
          )
        );
        
        return wordMatches.length >= Math.ceil(keywordWords.length * 0.5);
      });
      
      // Calculate weighted confidence score
      const exactMatches = matchedKeywords.filter(k => 
        text.includes(k.toLowerCase())
      );
      
      const confidenceScore = (
        (exactMatches.length * 3) + 
        (matchedKeywords.length - exactMatches.length)
      ) / (sectorData.keywords.length * 3);
      
      return {
        sectorId,
        confidence: Math.min(confidenceScore, 1),
        matchedKeywords
      };
    }).filter(match => match.confidence > 0.1) // Minimum confidence threshold
      .sort((a, b) => b.confidence - a.confidence);
      
      // Cache the results
      GLOBAL_CACHE.set(cacheKey, {
        matches: sectorMatches,
        timestamp: Date.now()
      });

    // If no matches found, return unclassified
    if (sectorMatches.length === 0) {
      return Response.json({
        success: true,
        sector: {
          id: 'unclassified',
          name: 'Unclassified',
          confidence: 0,
          matchedKeywords: [],
          possibleSectors: Object.keys(JOB_SECTORS).slice(0, 3) // Suggest top 3 sectors
        }
      });
    }

    const bestMatch = sectorMatches[0];
    if (!bestMatch) {
      throw new Error('Unexpected: bestMatch is undefined');
    }
    
    const sectorData = JOB_SECTORS[bestMatch.sectorId as keyof typeof JOB_SECTORS];
    if (!sectorData) {
      throw new Error(`Sector data not found for id: ${bestMatch.sectorId}`);
    }

    return Response.json({
      success: true,
      sector: {
        id: bestMatch.sectorId,
        ...sectorData,
        confidence: Number(bestMatch.confidence.toFixed(2)),
        matchedKeywords: bestMatch.matchedKeywords,
        alternativeSectors: sectorMatches.slice(1, 4).map(match => ({
          id: match.sectorId,
          name: JOB_SECTORS[match.sectorId as keyof typeof JOB_SECTORS].name,
          confidence: Number(match.confidence.toFixed(2))
        }))
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    if (error instanceof Error) {
      return handleApiError(error, {
        endpoint: 'POST /api/sectors',
        context: {
          error: error.message,
          timestamp: new Date().toISOString()
        }
      });
    }
    return handleApiError(new Error('Unknown error occurred'), {
      endpoint: 'POST /api/sectors'
    });
  }
}

// Common response headers
const COMMON_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Cache-Control': 'no-store',
};

// Helper function to process sector matches
function processMatches(matches: SectorClassification[]): Response {
  if (matches.length === 0) {
    // Return unclassified with suggested sectors based on job title keywords
    const randomSectors = Object.keys(JOB_SECTORS)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);

    return Response.json({
      success: true,
      sector: {
        id: 'unclassified',
        name: 'Unclassified',
        confidence: 0,
        matchedKeywords: [],
        possibleSectors: randomSectors.map(id => ({
          id,
          name: JOB_SECTORS[id as keyof typeof JOB_SECTORS].name
        }))
      },
      timestamp: new Date().toISOString()
    }, { 
      headers: COMMON_HEADERS 
    });
  }

  const bestMatch = matches[0];
  if (!bestMatch) {
    throw new Error('Unexpected: bestMatch is undefined');
  }
  
  const sectorData = JOB_SECTORS[bestMatch.sectorId as keyof typeof JOB_SECTORS];
  if (!sectorData) {
    throw new Error(`Sector data not found for id: ${bestMatch.sectorId}`);
  }

  return Response.json({
    success: true,
    sector: {
      id: bestMatch.sectorId,
      ...sectorData,
      confidence: Number(bestMatch.confidence.toFixed(2)),
      matchedKeywords: bestMatch.matchedKeywords,
      alternativeSectors: matches.slice(1, 4).map(match => ({
        id: match.sectorId,
        name: JOB_SECTORS[match.sectorId as keyof typeof JOB_SECTORS].name,
        confidence: Number(match.confidence.toFixed(2))
      }))
    },
    timestamp: new Date().toISOString()
  }, { 
    headers: COMMON_HEADERS 
  });
}

// Cache control headers
export const fetchCache = 'force-no-store';
export const revalidate = 0;

// Headers for CORS and caching
export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      ...COMMON_HEADERS,
      'Access-Control-Max-Age': '86400',
    },
  });
}
