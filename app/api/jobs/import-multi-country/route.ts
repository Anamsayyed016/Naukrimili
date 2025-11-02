import { NextRequest, NextResponse } from 'next/server';
import { fetchFromAdzuna } from '@/lib/jobs/providers';
import { upsertNormalizedJobs } from '@/lib/jobs/upsertJob';

// Supported countries with their configurations
const SUPPORTED_COUNTRIES = {
  IN: { name: 'India', adzuna: 'in', jsearch: 'IN', google: 'India', jooble: 'India' },
  US: { name: 'United States', adzuna: 'us', jsearch: 'US', google: 'United States', jooble: 'United States' },
  UK: { name: 'United Kingdom', adzuna: 'gb', jsearch: 'GB', google: 'United Kingdom', jooble: 'United Kingdom' },
  AE: { name: 'United Arab Emirates', adzuna: 'ae', jsearch: 'AE', google: 'UAE', jooble: 'United Arab Emirates' },
  CA: { name: 'Canada', adzuna: 'ca', jsearch: 'CA', google: 'Canada', jooble: 'Canada' },
  AU: { name: 'Australia', adzuna: 'au', jsearch: 'AU', google: 'Australia', jooble: 'Australia' },
  DE: { name: 'Germany', adzuna: 'de', jsearch: 'DE', google: 'Germany', jooble: 'Germany' },
  FR: { name: 'France', adzuna: 'fr', jsearch: 'FR', google: 'France', jooble: 'France' },
  IT: { name: 'Italy', adzuna: 'it', jsearch: 'IT', google: 'Italy', jooble: 'Italy' },
  ES: { name: 'Spain', adzuna: 'es', jsearch: 'ES', google: 'Spain', jooble: 'Spain' },
  NL: { name: 'Netherlands', adzuna: 'nl', jsearch: 'NL', google: 'Netherlands', jooble: 'Netherlands' },
  BE: { name: 'Belgium', adzuna: 'be', jsearch: 'BE', google: 'Belgium', jooble: 'Belgium' },
  AT: { name: 'Austria', adzuna: 'at', jsearch: 'AT', google: 'Austria', jooble: 'Austria' },
  PL: { name: 'Poland', adzuna: 'pl', jsearch: 'PL', google: 'Poland', jooble: 'Poland' },
  SG: { name: 'Singapore', adzuna: 'sg', jsearch: 'SG', google: 'Singapore', jooble: 'Singapore' },
  MX: { name: 'Mexico', adzuna: 'mx', jsearch: 'MX', google: 'Mexico', jooble: 'Mexico' },
  NZ: { name: 'New Zealand', adzuna: 'nz', jsearch: 'NZ', google: 'New Zealand', jooble: 'New Zealand' },
  ZA: { name: 'South Africa', adzuna: 'za', jsearch: 'ZA', google: 'South Africa', jooble: 'South Africa' },
  BR: { name: 'Brazil', adzuna: 'br', jsearch: 'BR', google: 'Brazil', jooble: 'Brazil' }
};

// Comprehensive job queries for each country - EXPANDED for 5000-10000+ jobs
const COUNTRY_SPECIFIC_QUERIES = {
  IN: [
    // Technology (High volume)
    'software developer', 'software engineer', 'full stack developer', 'frontend developer', 'backend developer',
    'data analyst', 'data scientist', 'data engineer', 'machine learning engineer', 'AI engineer',
    'product manager', 'project manager', 'scrum master', 'business analyst', 'QA engineer',
    'UI/UX designer', 'graphic designer', 'web designer', 'product designer',
    'DevOps engineer', 'cloud engineer', 'system administrator', 'network engineer',
    'mobile developer', 'android developer', 'iOS developer', 'react developer', 'node developer',
    // Business & Marketing
    'marketing manager', 'digital marketing', 'SEO specialist', 'content writer', 'copywriter',
    'sales executive', 'business development', 'account manager', 'customer success',
    // Finance & Consulting
    'financial analyst', 'accountant', 'chartered accountant', 'tax consultant', 'auditor',
    'HR manager', 'recruiter', 'talent acquisition', 'operations manager',
    // Healthcare & Education
    'doctor', 'nurse', 'pharmacist', 'healthcare manager', 'medical representative',
    'teacher', 'professor', 'trainer', 'education counselor'
  ],
  US: [
    'software engineer', 'software developer', 'full stack engineer', 'frontend engineer', 'backend engineer',
    'data scientist', 'data analyst', 'data engineer', 'ML engineer', 'AI researcher',
    'product manager', 'program manager', 'scrum master', 'business analyst', 'QA engineer',
    'UX designer', 'UI designer', 'product designer', 'graphic designer',
    'DevOps engineer', 'cloud architect', 'SRE', 'infrastructure engineer',
    'mobile engineer', 'iOS developer', 'android developer', 'react developer',
    'marketing manager', 'digital marketing specialist', 'content strategist', 'SEO expert',
    'sales representative', 'account executive', 'business development manager',
    'financial analyst', 'accountant', 'financial advisor', 'investment analyst',
    'registered nurse', 'physician', 'healthcare administrator', 'medical assistant',
    'teacher', 'professor', 'instructor', 'education administrator'
  ],
  UK: [
    'software developer', 'software engineer', 'full stack developer', 'web developer',
    'data analyst', 'data scientist', 'business intelligence analyst', 'data engineer',
    'product manager', 'project manager', 'programme manager', 'business analyst',
    'UX designer', 'UI designer', 'graphic designer', 'web designer',
    'DevOps engineer', 'cloud engineer', 'systems engineer', 'network engineer',
    'marketing executive', 'digital marketing manager', 'SEO specialist', 'content writer',
    'sales consultant', 'account manager', 'business development executive',
    'financial analyst', 'accountant', 'finance manager', 'chartered accountant',
    'registered nurse', 'GP', 'consultant', 'healthcare manager',
    'teacher', 'lecturer', 'education officer', 'training coordinator'
  ],
  AE: [
    'software engineer', 'software developer', 'application developer', 'web developer',
    'data analyst', 'data scientist', 'BI analyst', 'analytics manager',
    'product manager', 'project manager', 'program manager', 'business analyst',
    'UX designer', 'UI designer', 'graphic designer', 'creative director',
    'DevOps engineer', 'cloud engineer', 'infrastructure engineer', 'IT manager',
    'marketing manager', 'digital marketing specialist', 'brand manager', 'content creator',
    'sales executive', 'business development manager', 'account director', 'relationship manager',
    'financial analyst', 'accountant', 'finance manager', 'investment analyst',
    'civil engineer', 'mechanical engineer', 'electrical engineer', 'architect',
    'HR manager', 'recruiter', 'talent acquisition specialist', 'operations manager',
    'hospitality manager', 'chef', 'restaurant manager', 'hotel manager'
  ],
  CA: ['software developer', 'data scientist', 'product manager', 'UX designer', 'DevOps engineer', 'marketing specialist', 'sales representative', 'financial analyst', 'nurse', 'teacher'],
  AU: ['software engineer', 'data analyst', 'product manager', 'UX designer', 'DevOps engineer', 'marketing executive', 'sales consultant', 'accountant', 'registered nurse', 'educator']
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { 
      countries = ['IN', 'US', 'GB', 'AE'], // GB for UK
      queries = [], 
      page = 1, 
      location = '', 
      radiusKm = 50,
      maxJobsPerCountry = 1500, // Increased to 1500 for 5000-10000 total jobs
      pagesPerQuery = 10 // Increased from 3 to 10 for more jobs per query
    } = body;

    console.log(`🚀 Starting multi-country job import for: ${countries.join(', ')}`);

    const allJobs: any[] = [];
    const countryResults: Record<string, any> = {};

    // Process each country
    for (const countryCode of countries) {
      if (!SUPPORTED_COUNTRIES[countryCode as keyof typeof SUPPORTED_COUNTRIES]) {
        console.warn(`⚠️ Unsupported country: ${countryCode}, skipping...`);
        continue;
      }

      const countryConfig = SUPPORTED_COUNTRIES[countryCode as keyof typeof SUPPORTED_COUNTRIES];
      const countryQueries = queries.length > 0 ? queries : COUNTRY_SPECIFIC_QUERIES[countryCode as keyof typeof COUNTRY_SPECIFIC_QUERIES] || ['software developer'];
      
      console.log(`🌍 Processing ${countryConfig.name} (${countryCode}) with ${countryQueries.length} queries...`);

      let countryJobs: any[] = [];
      let adzunaCount = 0;

      // Fetch jobs for each query in this country
      for (const query of countryQueries) {
        // Fetch multiple pages per query for more jobs
        for (let currentPage = page; currentPage < page + (pagesPerQuery || 1); currentPage++) {
          try {
            // Fetch from Adzuna
            const adzunaJobs = await fetchFromAdzuna(query, countryConfig.adzuna, currentPage, { 
              location: location || undefined, 
              distanceKm: radiusKm 
            });
            countryJobs.push(...adzunaJobs);
            adzunaCount += adzunaJobs.length;

            // Small delay to avoid rate limiting
            if (currentPage < page + (pagesPerQuery || 1) - 1) {
              await new Promise(resolve => setTimeout(resolve, 300));
            }

          } catch (_error) {
            console.error(`❌ Error fetching jobs for "${query}" page ${currentPage} in ${countryCode}:`, _error);
          }
        }
        
        // Delay between queries to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      // Limit jobs per country if specified (0 = unlimited)
      if (maxJobsPerCountry > 0 && countryJobs.length > maxJobsPerCountry) {
        countryJobs = countryJobs.slice(0, maxJobsPerCountry);
      }

      // Add country metadata to jobs
      const countryJobsWithMetadata = countryJobs.map(job => ({
        ...job,
        country: countryCode,
        countryName: countryConfig.name,
        importTimestamp: new Date().toISOString()
      }));

      allJobs.push(...countryJobsWithMetadata);

      countryResults[countryCode] = {
        name: countryConfig.name,
        totalJobs: countryJobs.length,
        providers: {
          adzuna: adzunaCount
        }
      };

      console.log(`✅ ${countryConfig.name}: Found ${countryJobs.length} jobs (Adzuna: ${adzunaCount})`);
    }

    // Upsert all jobs to database
    console.log(`💾 Upserting ${allJobs.length} jobs to database...`);
    const persistedJobs = await upsertNormalizedJobs(allJobs);

    // Calculate total statistics
    const totalJobs = allJobs.length;
    const totalPersisted = persistedJobs.length;
    const totalCountries = countries.length;

    console.log(`🎉 Multi-country job import completed!`);
    console.log(`📊 Total jobs found: ${totalJobs}`);
    console.log(`💾 Total jobs persisted: ${totalPersisted}`);
    console.log(`🌍 Countries processed: ${totalCountries}`);

    return NextResponse.json({
      success: true,
      summary: {
        totalJobs,
        totalPersisted,
        countriesProcessed: totalCountries,
        countries: countryResults
      },
      details: {
        countries,
        queries: queries.length > 0 ? queries : 'default',
        page,
        location,
        radiusKm,
        maxJobsPerCountry
      },
      recommendations: {
        nextImport: 'Consider running this import every 6-12 hours for fresh jobs',
        apiKeys: 'Ensure all API keys are configured for maximum job coverage',
        countries: 'Add more countries for broader job coverage'
      }
    });

  } catch (error: any) {
    console.error('❌ Multi-country job import failed:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Job import failed', 
        details: error?.message || 'Unknown error',
        timestamp: new Date().toISOString()
      }, 
      { status: 500 }
    );
  }
}

export async function GET() {
  // Return supported countries and their configurations
  return NextResponse.json({
    success: true,
    supportedCountries: SUPPORTED_COUNTRIES,
    countrySpecificQueries: COUNTRY_SPECIFIC_QUERIES,
    usage: {
      endpoint: 'POST /api/jobs/import-multi-country',
      description: 'Import real jobs from multiple countries and job providers',
      example: {
        countries: ['IN', 'US', 'UK', 'AE'],
        queries: ['software developer', 'data analyst'],
        page: 1,
        location: 'Bangalore',
        radiusKm: 50,
        maxJobsPerCountry: 200,
        pagesPerQuery: 3
      },
      notes: {
        maxJobsPerCountry: '200 jobs per country (0 for unlimited)',
        pagesPerQuery: '3 pages per query for more results',
        rateLimit: 'Automatic delays between requests to avoid API rate limits'
      }
    }
  });
}
