/**
 * Map OptimizationReport to per-field inline suggestion lists (report-first, no API)
 */

import type { OptimizationReport } from './types';

export type SuggestionField = 'summary' | 'skills' | 'experience' | 'keywords';

export function getFieldSuggestionsFromReport(
  report: OptimizationReport,
  field: SuggestionField,
  formData: Record<string, unknown>,
  searchValue = ''
): { suggestions: string[]; keywords: string[] } {
  const searchLower = searchValue.toLowerCase().trim();

  switch (field) {
    case 'summary': {
      const items: string[] = [];
      if (report.summary?.suggested?.trim()) {
        items.push(report.summary.suggested.trim());
      }
      return { suggestions: items, keywords: report.atsKeywords || [] };
    }

    case 'skills': {
      const existing = Array.isArray(formData.skills)
        ? (formData.skills as string[]).map((s) => s.toLowerCase().trim())
        : [];
      const pool = [
        ...(report.suggestedSkills || []),
        ...(report.missingSkills || []),
      ];
      const available = pool.filter((skill) => {
        const skillLower = skill.toLowerCase().trim();
        return (
          skillLower.length > 0 &&
          !existing.includes(skillLower) &&
          !existing.some(
            (e) => e.includes(skillLower) || skillLower.includes(e)
          )
        );
      });

      if (searchLower.length >= 2) {
        const scored = available
          .map((skill) => {
            const skillLower = skill.toLowerCase();
            let score = 0;
            if (skillLower === searchLower) score = 100;
            else if (skillLower.startsWith(searchLower)) score = 90;
            else if (skillLower.includes(searchLower)) score = 70;
            return { skill, score };
          })
          .filter((x) => x.score > 0)
          .sort((a, b) => b.score - a.score)
          .map((x) => x.skill);
        return {
          suggestions: (scored.length > 0 ? scored : available).slice(0, 15),
          keywords: [],
        };
      }

      return { suggestions: [...new Set(available)].slice(0, 14), keywords: [] };
    }

    case 'experience': {
      const bullets = (report.experienceBullets || [])
        .map((b) => b.improved)
        .filter(Boolean);
      return { suggestions: bullets.slice(0, 8), keywords: [] };
    }

    case 'keywords': {
      const kw = [
        ...new Set([
          ...(report.atsKeywords || []),
          ...(report.missingKeywords || []),
        ]),
      ];
      return { suggestions: [], keywords: kw.slice(0, 25) };
    }

    default:
      return { suggestions: [], keywords: [] };
  }
}

export function canUseReportForField(
  report: OptimizationReport | null,
  isReportStale: boolean,
  field: SuggestionField
): boolean {
  if (!report || isReportStale) return false;
  switch (field) {
    case 'summary':
      return !!report.summary?.suggested?.trim();
    case 'skills':
      return (
        (report.suggestedSkills?.length ?? 0) > 0 ||
        (report.missingSkills?.length ?? 0) > 0
      );
    case 'experience':
      return (report.experienceBullets?.length ?? 0) > 0;
    case 'keywords':
      return (
        (report.atsKeywords?.length ?? 0) > 0 ||
        (report.missingKeywords?.length ?? 0) > 0
      );
    default:
      return false;
  }
}
