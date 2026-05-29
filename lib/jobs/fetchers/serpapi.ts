import axios from 'axios';
import { SkillsExtractionService } from '@/lib/services/skills-extraction';
import type { NormalizedJob } from '../types';
import { checkIfRemote, safeUpper, withRetry } from './helpers';

/** SerpAPI Google Jobs — location is a free-text geo (e.g. India, United States). */
export async function fetchFromSerpApi(
  query: string,
  location: string,
  countryCode: string,
  page = 1
): Promise<NormalizedJob[]> {
  const apiKey = process.env.SERPAPI_KEY;
  if (!apiKey) {
    return [];
  }

  const cc = safeUpper(countryCode);

  try {
    const data = await withRetry(async () => {
      const { data: res } = await axios.get('https://serpapi.com/search.json', {
        params: {
          engine: 'google_jobs',
          q: query,
          location,
          api_key: apiKey,
          start: (page - 1) * 10,
        },
        timeout: 20000,
      });
      return res;
    });

    const results = (data.jobs_results || data.jobs || []) as Record<string, unknown>[];

    return results.map((r, index): NormalizedJob => {
      const title = String(r.title || '');
      const description = String(
        r.description || r.job_highlights || (Array.isArray(r.related_links) ? '' : '') || ''
      );
      const company = String(r.company_name || r.company || '');
      const loc = String(r.location || location);
      const applyLink =
        (r.apply_options as { link?: string }[] | undefined)?.[0]?.link ||
        String(r.share_link || r.apply_link || '');

      return {
        source: 'serpapi',
        sourceId: String(r.job_id || `serpapi-${cc}-${Date.now()}-${index}`),
        title,
        company,
        location: loc,
        country: cc,
        description: description || title,
        applyUrl: applyLink,
        apply_url: null,
        source_url: applyLink,
        postedAt: r.detected_extensions
          ? undefined
          : undefined,
        jobType: 'full-time',
        experienceLevel: 'mid',
        skills: SkillsExtractionService.extractSkills(description, title, company).map(
          (s) => s.skill
        ),
        isRemote: checkIfRemote(title, description, loc),
        isActive: true,
        sector: 'General',
        raw: r,
      };
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`SerpAPI error (${location}):`, message);
    return [];
  }
}
