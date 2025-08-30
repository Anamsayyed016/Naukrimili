import { NextRequest, NextResponse } from 'next/server';
import { fetchFromAdzuna, fetchFromJSearch, fetchFromGoogleJobs } from '@/lib/jobs/providers';
import { upsertNormalizedJobs } from '@/lib/jobs/upsertJob';

// Supported countries with their configurations
const SUPPORTED_COUNTRIES = {
  IN: { name: 'India', adzuna: 'in', jsearch: 'IN', google: 'India' },
  US: { name: 'United States', adzuna: 'us', jsearch: 'US', google: 'United States' },
  UK: { name: 'United Kingdom', adzuna: 'gb', jsearch: 'GB', google: 'United Kingdom' },
  AE: { name: 'United Arab Emirates', adzuna: 'ae', jsearch: 'AE', google: 'UAE' },
  CA: { name: 'Canada', adzuna: 'ca', jsearch: 'CA', google: 'Canada' },
  AU: { name: 'Australia', adzuna: 'au', jsearch: 'AU', google: 'Australia' },
  DE: { name: 'Germany', adzuna: 'de', jsearch: 'DE', google: 'Germany' },
  FR: { name: 'France', adzuna: 'fr', jsearch: 'FR', google: 'France' },
  IT: { name: 'Italy', adzuna: 'it', jsearch: 'IT', google: 'Italy' },
  ES: { name: 'Spain', adzuna: 'es', jsearch: 'ES', google: 'Spain' },
  NL: { name: 'Netherlands', adzuna: 'nl', jsearch: 'NL', google: 'Netherlands' },
  BE: { name: 'Belgium', adzuna: 'be', jsearch: 'BE', google: 'Belgium' },
  AT: { name: 'Austria', adzuna: 'at', jsearch: 'AT', google: 'Austria' },
  PL: { name: 'Poland', adzuna: 'pl', jsearch: 'PL', google: 'Poland' },
  SG: { name: 'Singapore', adzuna: 'sg', jsearch: 'SG', google: 'Singapore' },
  MX: { name: 'Mexico', adzuna: 'mx', jsearch: 'MX', google: 'Mexico' },
  NZ: { name: 'New Zealand', adzuna: 'nz', jsearch: 'NZ', google: 'New Zealand' },
  ZA: { name: 'South Africa', adzuna: 'za', jsearch: 'ZA', google: 'South Africa' },
  BR: { name: 'Brazil', adzuna: 'br', jsearch: 'BR', google: 'Brazil' }
};

// Popular job queries for each country
const COUNTRY_SPECIFIC_QUERIES = {
  IN: ['software developer', 'data analyst', 'product manager', 'UI/UX designer', 'DevOps engineer', 'marketing manager', 'sales executive', 'content writer', 'graphic designer', 'digital marketer'],
  US: ['software engineer', 'data scientist', 'product manager', 'UX designer', 'DevOps engineer', 'marketing specialist', 'sales representative', 'content creator', 'graphic designer', 'digital marketing manager'],
  UK: ['software developer', 'data analyst', 'product manager', 'UX designer', 'DevOps engineer', 'marketing executive', 'sales consultant', 'content writer', 'graphic designer', 'digital marketing specialist'],
  AE: ['software engineer', 'data analyst', 'product manager', 'UX designer', 'DevOps engineer', 'marketing manager', 'sales executive', 'content writer', 'graphic designer', 'digital marketer'],
  CA: ['software developer', 'data scientist', 'product manager', 'UX designer', 'DevOps engineer', 'marketing specialist', 'sales representative', 'content creator', 'graphic designer', 'digital marketing manager'],
  AU: ['software engineer', 'data analyst', 'product manager', 'UX designer', 'DevOps engineer', 'marketing executive', 'sales consultant', 'content writer', 'graphic designer', 'digital marketing specialist']
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { 
      countries = ['IN', 'US', 'UK', 'AE'], 
      queries = [], 
      page = 1, 
      location = '', 
      radiusKm = 25,
      maxJobsPerCountry = 50
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
      let jsearchCount = 0;
      let googleCount = 0;

      // Fetch jobs for each query in this country
      for (const query of countryQueries) {
        try {
          // Fetch from Adzuna
          const adzunaJobs = await fetchFromAdzuna(query, countryConfig.adzuna, page, { 
            location: location || undefined, 
            distanceKm: radiusKm 
          });
          countryJobs.push(...adzunaJobs);
          adzunaCount += adzunaJobs.length;

          // Fetch from JSearch
          const jsearchJobs = await fetchFromJSearch(query, countryConfig.jsearch, page);
          countryJobs.push(...jsearchJobs);
          jsearchCount += jsearchJobs.length;

          // Fetch from Google Jobs
          const googleJobs = await fetchFromGoogleJobs(query, countryConfig.google, page);
          countryJobs.push(...googleJobs);
          googleCount += googleJobs.length;

        } catch (error) {
          console.error(`❌ Error fetching jobs for "${query}" in ${countryCode}:`, error);
        }
      }

      // Limit jobs per country to prevent overwhelming
      if (countryJobs.length > maxJobsPerCountry) {
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
          externalProvider1: adzunaCount,
          externalProvider2: jsearchCount,
          externalProvider3: googleCount
        }
      };

      console.log(`✅ ${countryConfig.name}: Found ${countryJobs.length} jobs (External Provider 1: ${adzunaCount}, External Provider 2: ${jsearchCount}, External Provider 3: ${googleCount})`);
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
        radiusKm: 25,
        maxJobsPerCountry: 50
      }
    }
  });
}
