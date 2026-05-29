import axios from 'axios';
import { SkillsExtractionService } from '@/lib/services/skills-extraction';
import type { NormalizedJob } from '../types';
import {
  checkIfHybrid,
  checkIfRemote,
  checkIfUrgent,
  extractExperienceLevel,
  extractRequirements,
  extractSalaryMax,
  extractSalaryMin,
  getCurrency,
  mapJobType,
  safeUpper,
  withRetry,
} from './helpers';

const US_LOCATION = 'United States';

export async function fetchFromJooble(
  query: string,
  location: string = US_LOCATION,
  page = 1,
  options?: { radius?: number; salary?: string; countryCode?: string }
): Promise<NormalizedJob[]> {
  const apiKey = process.env.JOOBLE_API_KEY;

  if (!apiKey) {
    return [];
  }

  const countryCode = (options?.countryCode || 'US').toLowerCase();

  try {
    const data = await withRetry(async () => {
      const url = `https://jooble.org/api/${apiKey}`;
      const requestBody: Record<string, string> = {
        keywords: query || 'software engineer',
        location: location || US_LOCATION,
        page: page.toString(),
        ResultOnPage: '50',
        SearchMode: '1',
        companysearch: 'false',
      };
      if (options?.radius) requestBody.radius = options.radius.toString();
      if (options?.salary) requestBody.salary = options.salary;

      const { data: res } = await axios.post(url, requestBody, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 15000,
      });
      return res;
    });

    return (data.jobs || []).map((r: Record<string, unknown>, index: number): NormalizedJob => {
      const title = String(r.title || '');
      const snippet = String(r.snippet || r.description || '');
      const company = String(r.company || '');

      return {
        source: 'jooble',
        sourceId: String(r.id || `jooble-${Date.now()}-${index}`),
        title,
        company,
        location: String(r.location || location),
        country: safeUpper(countryCode),
        description: snippet,
        requirements: extractRequirements(snippet),
        applyUrl: String(r.link || ''),
        apply_url: null,
        source_url: String(r.link || ''),
        postedAt: r.updated ? new Date(String(r.updated)).toISOString() : undefined,
        salary: r.salary ? String(r.salary) : undefined,
        salaryMin: extractSalaryMin(String(r.salary || '')),
        salaryMax: extractSalaryMax(String(r.salary || '')),
        salaryCurrency: getCurrency(countryCode),
        jobType: mapJobType(String(r.type || '')),
        experienceLevel: extractExperienceLevel(title, snippet),
        skills: SkillsExtractionService.extractSkills(snippet, title, company).map(
          (s) => s.skill
        ),
        isRemote: checkIfRemote(title, snippet, String(r.location || '')),
        isHybrid: checkIfHybrid(title, snippet),
        isUrgent: checkIfUrgent(title, snippet),
        isActive: true,
        sector: 'General',
        raw: r,
      };
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Jooble API error:', message);
    return [];
  }
}
