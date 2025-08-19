import { fetchFromAdzuna, fetchFromJSearch, fetchFromGoogleJobs, checkJobProvidersHealth } from './providers';
import { upsertNormalizedJobs } from './upsertJob';
import { GoogleSearchService } from '../google-search-service';

export interface FetchOptions {
  query: string;
  location?: string;
  radiusKm?: number;
  countryCode?: string;
  page?: number;
  limit?: number;
}

export interface NormalizedJob {
  source: string;
  sourceId: string;
  title: string;
  company?: string;
  location?: string;
  country: string;
  description: string;
  applyUrl?: string;
  postedAt?: string;
  salary?: string;
  raw: any;
}

// Normalize job data for deduplication
function normalizeKey(job: Pick<NormalizedJob, 'title' | 'company' | 'location'>): string {
  const clean = (s: string) => (s || '').toLowerCase().replace(/[^a-z0-9]/g, ' ').trim();
  return `${clean(job.title)}|${clean(job.company)}|${clean(job.location)}`;
}

// Retry wrapper for API calls
async function withRetry<T>(fn: () => Promise<T>, retries = 2): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (retries > 0) {
      // Retry attempt logged
      await new Promise(resolve => setTimeout(resolve, 1000));
      return withRetry(fn, retries - 1);
    }
    throw error;
  }
}

export async function fetchJobsAndUpsert(options: FetchOptions) {
  const query = options.query;
  const location = options.location || '';
  const radiusKm = options.radiusKm ?? 25;
  const page = options.page ?? 1;
  const adzunaCountry = (options.countryCode || 'IN').toLowerCase();
  const jsearchCountry = (options.countryCode || 'IN').toUpperCase();

      // Job fetch started logged
  
  const all: NormalizedJob[] = [];

  // 1. Fetch from Adzuna
  try {
    // // console.log(`📡 Fetching from Adzuna (${adzunaCountry.toUpperCase()})...`);
    const adz = await withRetry(() => fetchFromAdzuna(query, adzunaCountry, page, {
      location: location || undefined,
      distanceKm: radiusKm,
    }));
    all.push(...adz);
    // // console.log(`✅ Adzuna: Added ${adz.length} jobs`);
  } catch (e: any) {
    console.error('❌ Adzuna fetch failed:', e?.message || e);
  }

  // 2. Fetch from JSearch
  try {
    // // console.log(`📡 Fetching from JSearch (${jsearchCountry})...`);
    const js = await withRetry(() => fetchFromJSearch(`${query}${location ? ` in ${location}` : ''}`, jsearchCountry, page));
    all.push(...js);
    // // console.log(`✅ JSearch: Added ${js.length} jobs`);
  } catch (e: any) {
    console.error('❌ JSearch fetch failed:', e?.message || e);
  }

  // 3. Fetch from Google Jobs (using RapidAPI)
  try {
    // // console.log(`📡 Fetching from Google Jobs...`);
    const google = await withRetry(() => fetchFromGoogleJobs(query, location || 'India', page));
    all.push(...google);
    // // console.log(`✅ Google Jobs: Added ${google.length} jobs`);
  } catch (e: any) {
    console.error('❌ Google Jobs fetch failed:', e?.message || e);
  }

  // 4. Fallback: Google Jobs redirect (if no results from APIs)
  if (all.length === 0) {
    try {
      // // console.log(`🔄 No jobs found from APIs, generating Google Jobs fallback...`);
      const googleSearch = new GoogleSearchService();
      const fallback = await googleSearch.searchGoogleJobsEnhanced({ query, location: location || 'India' });
      if (fallback.success && fallback.searchUrl) {
        all.push({
          source: 'google-fallback',
          sourceId: `google-fallback-${Date.now()}`,
          title: 'Redirect to Google Jobs',
          company: 'Google',
          location: location || 'India',
          country: (options.countryCode || 'IN').toUpperCase(),
          description: 'No jobs found from providers. Use Google Jobs link provided.',
          applyUrl: fallback.searchUrl,
          postedAt: new Date().toISOString(),
          raw: { fallback },
        });
        // // console.log(`✅ Google Fallback: Created redirect job`);
      }
    } catch (e: any) {
      console.error('❌ Google fallback failed:', e?.message || e);
    }
  }

  // Skip malformed jobs (missing title or company)
  const filtered = all.filter(j => (j.title || '').trim() && (j.company || '').trim());
  // // console.log(`🔍 Filtered ${all.length} total jobs to ${filtered.length} valid jobs`);

  if (filtered.length === 0) {
    // // console.log(`⚠️ No valid jobs found for query: "${query}"`);
    return [];
  }

  // Deduplicate: first by source+sourceId, then by normalized title+company+location
  const uniqueBySource = new Map<string, NormalizedJob>();
  const uniqueByContent = new Map<string, NormalizedJob>();

  for (const job of filtered) {
    // First deduplication: source + sourceId
    const sourceKey = `${job.source}-${job.sourceId}`;
    if (!uniqueBySource.has(sourceKey)) {
      uniqueBySource.set(sourceKey, job);
    }

    // Second deduplication: normalized content
    const contentKey = normalizeKey(job);
    if (!uniqueByContent.has(contentKey)) {
      uniqueByContent.set(contentKey, job);
    }
  }

  // Use the more restrictive deduplication (by content)
  const finalJobs = Array.from(uniqueByContent.values());
  // // console.log(`🎯 Deduplication: ${filtered.length} → ${finalJobs.length} unique jobs`);

  // Upsert jobs to database
  try {
    // // console.log(`💾 Upserting ${finalJobs.length} jobs to database...`);
    const upserted = await upsertNormalizedJobs(finalJobs);
    // // console.log(`✅ Database: Successfully upserted ${upserted.length} jobs`);
    return upserted;
  } catch (error: any) {
    console.error('❌ Database upsert failed:', error.message);
    // Return jobs even if database fails
    return finalJobs;
  }
}

// Wrapper for backward compatibility
export async function fetchJobs(query: string, location?: string, radius: string = "25km") {
  const radiusKm = parseInt(radius.replace('km', '')) || 25;
  const options: FetchOptions = {
    query,
    location,
    radiusKm,
    countryCode: 'IN', // Default to India
    page: 1,
    limit: 20
  };
  
  return fetchJobsAndUpsert(options);
}

// Health check function
export async function getJobProvidersHealth() {
  return await checkJobProvidersHealth();
}


