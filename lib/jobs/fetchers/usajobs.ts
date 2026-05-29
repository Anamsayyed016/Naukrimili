import axios from 'axios';
import { SkillsExtractionService } from '@/lib/services/skills-extraction';
import type { NormalizedJob } from '../types';
import { withRetry } from './helpers';

export async function fetchFromUSAJobs(
  query: string,
  page = 1
): Promise<NormalizedJob[]> {
  const apiKey = process.env.USAJOBS_API_KEY;
  const userAgent =
    process.env.USAJOBS_USER_AGENT || process.env.USAJOBS_EMAIL || process.env.ADMIN_EMAIL;

  if (!apiKey || !userAgent) {
    if (!userAgent) {
      console.warn('USAJOBS_USER_AGENT (contact email) not configured, skipping USAJobs fetch');
    }
    return [];
  }

  try {
    const data = await withRetry(async () => {
      const { data: res } = await axios.get('https://data.usajobs.gov/api/search', {
        params: {
          Keyword: query,
          Page: page,
          ResultsPerPage: 50,
          SortField: 'OpenDate',
          SortDirection: 'Desc',
        },
        headers: {
          Host: 'data.usajobs.gov',
          'User-Agent': userAgent,
          'Authorization-Key': apiKey,
        },
        timeout: 20000,
      });
      return res;
    });

    const items =
      (data.SearchResult?.SearchResultItems as { MatchedObjectDescriptor?: Record<string, unknown> }[]) ||
      [];

    return items.map((item, index): NormalizedJob => {
      const r = item.MatchedObjectDescriptor || {};
      const title = String(r.PositionTitle || '');
      const org = String(
        (r.OrganizationName as string) ||
          ((r.DepartmentName as string) || '')
      );
      const locations = (r.PositionLocationDisplay as string[]) || [];
      const loc = locations[0] || 'United States';
      const description = String(
        r.UserArea
          ? JSON.stringify(r.UserArea).slice(0, 4000)
          : r.PositionFormattedDescription || title
      );
      const applyUrl = String(r.PositionURI || '');
      const remuneration = (r.PositionRemuneration as { MinimumRange?: string; MaximumRange?: string }[])?.[0];

      return {
        source: 'usajobs',
        sourceId: String(r.PositionID || `usajobs-${Date.now()}-${index}`),
        title,
        company: org,
        location: loc,
        country: 'US',
        description,
        applyUrl,
        apply_url: null,
        source_url: applyUrl,
        postedAt: r.PositionStartDate
          ? new Date(String(r.PositionStartDate)).toISOString()
          : undefined,
        salary:
          remuneration?.MinimumRange || remuneration?.MaximumRange
            ? `${remuneration.MinimumRange || ''}-${remuneration.MaximumRange || ''}`
            : undefined,
        jobType: 'full-time',
        experienceLevel: 'mid',
        skills: SkillsExtractionService.extractSkills(description, title, org).map((s) => s.skill),
        isRemote: String(r.TeleworkEligible || '').toLowerCase() === 'true',
        isActive: true,
        sector: 'Government',
        raw: r,
      };
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('USAJobs API error:', message);
    return [];
  }
}
