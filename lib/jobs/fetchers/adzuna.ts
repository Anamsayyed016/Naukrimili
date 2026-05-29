import axios from 'axios';
import { SkillsExtractionService } from '@/lib/services/skills-extraction';
import type { NormalizedJob } from '../types';
import {
  extractRequirements,
  getCurrency,
  safeUpper,
  withRetry,
} from './helpers';

export async function fetchFromAdzuna(
  query: string,
  countryCode = 'gb',
  page = 1,
  options?: { location?: string; distanceKm?: number }
): Promise<NormalizedJob[]> {
  const app_id = process.env.ADZUNA_APP_ID;
  const app_key = process.env.ADZUNA_APP_KEY;

  if (!app_id || !app_key) {
    return [];
  }

  const cc = countryCode.toLowerCase();

  try {
    const data = await withRetry(async () => {
      const url = `https://api.adzuna.com/v1/api/jobs/${cc}/search/${page}`;
      const { data: res } = await axios.get(url, {
        params: {
          app_id,
          app_key,
          what: query,
          results_per_page: 50,
          sort_by: 'date',
          ...(options?.location ? { where: options.location } : {}),
          ...(options?.distanceKm ? { distance: options.distanceKm } : {}),
        },
        timeout: 15000,
      });
      return res;
    });

    return (data.results || []).map((r: Record<string, unknown>, index: number): NormalizedJob => {
      const company = r.company as { display_name?: string } | string | undefined;
      const location = r.location as { area?: string[]; display_name?: string } | undefined;
      const companyName =
        typeof company === 'object' && company !== null
          ? company.display_name
          : (company as string) || '';
      const description = String(r.description || r.redirect_url || '');

      return {
        source: 'adzuna',
        sourceId: r.id ? `adzuna-${r.id}` : `adzuna-${Date.now()}-${index}`,
        title: String(r.title || r.position || ''),
        company: companyName,
        location: [location?.area?.slice(-1)?.[0], location?.display_name]
          .filter(Boolean)
          .join(', '),
        country: safeUpper(cc),
        description,
        requirements: extractRequirements(description),
        applyUrl: String(r.redirect_url || r.url || ''),
        apply_url: null,
        source_url: String(r.redirect_url || r.url || ''),
        postedAt: r.created ? new Date(String(r.created)).toISOString() : undefined,
        salary:
          r.salary_min || r.salary_max
            ? `${r.salary_min || ''}-${r.salary_max || ''}`
            : undefined,
        salaryMin: typeof r.salary_min === 'number' ? r.salary_min : undefined,
        salaryMax: typeof r.salary_max === 'number' ? r.salary_max : undefined,
        salaryCurrency: getCurrency(cc),
        jobType: 'full-time',
        experienceLevel: 'mid',
        skills: SkillsExtractionService.extractSkills(
          description,
          String(r.title || ''),
          companyName
        ).map((s) => s.skill),
        isRemote: false,
        isHybrid: false,
        isActive: true,
        sector: 'General',
        raw: r,
      };
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Adzuna API error for ${cc}:`, message);
    return [];
  }
}
