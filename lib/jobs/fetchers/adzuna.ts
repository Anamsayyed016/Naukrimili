import axios from 'axios';
import { SkillsExtractionService } from '@/lib/services/skills-extraction';
import type { NormalizedJob } from '../types';
import {
  extractRequirements,
  getCurrency,
  safeUpper,
  withRetry,
} from './helpers';

const TARGET_COUNTRIES = ['in', 'us', 'gb', 'ae'] as const;

function mapAdzunaRecord(
  r: Record<string, unknown>,
  cc: string,
  index = 0
): NormalizedJob {
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
}

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

    return (data.results || []).map((r: Record<string, unknown>, index: number) =>
      mapAdzunaRecord(r, cc, index)
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Adzuna API error for ${cc}:`, message);
    return [];
  }
}

/** Fetch a single Adzuna job by numeric id (view endpoint, tries IN/US/GB/AE). */
export async function fetchAdzunaJobById(
  rawId: string,
  countryHint?: string
): Promise<NormalizedJob | null> {
  const app_id = process.env.ADZUNA_APP_ID;
  const app_key = process.env.ADZUNA_APP_KEY;
  if (!app_id || !app_key) return null;

  const numericId =
    String(rawId)
      .replace(/^adzuna[-_]/i, '')
      .match(/(\d+)$/)?.[1] || String(rawId);

  if (!/^\d+$/.test(numericId)) return null;

  let countries = [...TARGET_COUNTRIES];
  const hint = countryHint?.toLowerCase().slice(0, 2);
  const hintMap: Record<string, (typeof TARGET_COUNTRIES)[number]> = {
    in: 'in',
    us: 'us',
    gb: 'gb',
    uk: 'gb',
    ae: 'ae',
  };
  if (hint && hintMap[hint]) {
    const preferred = hintMap[hint];
    countries = [preferred, ...countries.filter((c) => c !== preferred)];
  }

  for (const cc of countries) {
    try {
      const url = `https://api.adzuna.com/v1/api/jobs/${cc}/view/${numericId}`;
      const { data } = await axios.get(url, {
        params: { app_id, app_key },
        timeout: 15000,
      });
      if (data && (data.id || data.title)) {
        return mapAdzunaRecord(data as Record<string, unknown>, cc);
      }
    } catch {
      // try next country
    }
  }

  return null;
}
