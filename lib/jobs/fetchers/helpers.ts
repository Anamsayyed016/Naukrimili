import type { NormalizedJob } from '../types';
import type { EnhancedJobData } from '../enhanced-upsert';
import { cleanJobDescription } from '../clean-job-description';

export function safeUpper(a?: string): string {
  return (a || '').toUpperCase().slice(0, 2);
}

export function extractRequirements(description: string): string {
  if (!description) return '';
  const reqMatch = description.match(
    /(?:requirements?|qualifications?|skills?)[:\s]*(.*?)(?:\n\n|\n[A-Z]|$)/i
  );
  return reqMatch ? reqMatch[1].substring(0, 500) : '';
}

export function getCurrency(countryCode: string): string {
  const currencies: Record<string, string> = {
    in: 'INR',
    us: 'USD',
    gb: 'GBP',
    ae: 'AED',
  };
  return currencies[countryCode.toLowerCase()] || 'USD';
}

export function extractSalaryMin(salary: string): number | undefined {
  if (!salary) return undefined;
  const match = salary.match(/(\d+(?:,\d{3})*(?:\.\d{2})?)/);
  return match ? parseFloat(match[1].replace(/,/g, '')) : undefined;
}

export function extractSalaryMax(salary: string): number | undefined {
  if (!salary) return undefined;
  const matches = salary.match(/(\d+(?:,\d{3})*(?:\.\d{2})?)/g);
  if (matches && matches.length > 1) {
    return parseFloat(matches[1].replace(/,/g, ''));
  }
  return undefined;
}

export function mapJobType(type: string): string {
  const typeMap: Record<string, string> = {
    'full-time': 'full-time',
    'full time': 'full-time',
    'part-time': 'part-time',
    'part time': 'part-time',
    contract: 'contract',
    temporary: 'temporary',
    internship: 'internship',
    freelance: 'freelance',
    remote: 'full-time',
    hybrid: 'full-time',
  };
  return typeMap[type?.toLowerCase() || ''] || 'full-time';
}

export function extractExperienceLevel(title: string, description: string): string {
  const text = `${title} ${description}`.toLowerCase();
  if (
    text.includes('senior') ||
    text.includes('lead') ||
    text.includes('principal') ||
    text.includes('5+') ||
    text.includes('10+')
  ) {
    return 'senior';
  }
  if (
    text.includes('junior') ||
    text.includes('entry') ||
    text.includes('graduate') ||
    text.includes('0-2') ||
    text.includes('1-3')
  ) {
    return 'junior';
  }
  if (
    text.includes('mid') ||
    text.includes('intermediate') ||
    text.includes('3-5') ||
    text.includes('2-4')
  ) {
    return 'mid';
  }
  return 'mid';
}

export function checkIfRemote(title: string, description: string, location: string): boolean {
  const text = `${title} ${description} ${location}`.toLowerCase();
  return (
    text.includes('remote') ||
    text.includes('work from home') ||
    text.includes('wfh') ||
    location.toLowerCase().includes('remote')
  );
}

export function checkIfHybrid(title: string, description: string): boolean {
  const text = `${title} ${description}`.toLowerCase();
  return text.includes('hybrid') || text.includes('flexible') || text.includes('part remote');
}

export function checkIfUrgent(title: string, description: string): boolean {
  const text = `${title} ${description}`.toLowerCase();
  return (
    text.includes('urgent') ||
    text.includes('immediate') ||
    text.includes('asap') ||
    text.includes('hiring now')
  );
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  attempts = 3,
  baseDelayMs = 500
): Promise<T> {
  let lastError: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (i < attempts - 1) {
        await new Promise((r) => setTimeout(r, baseDelayMs * (i + 1)));
      }
    }
  }
  throw lastError;
}

export function toEnhancedJobData(job: NormalizedJob): EnhancedJobData {
  const skills = Array.isArray(job.skills)
    ? job.skills.join(', ')
    : typeof job.skills === 'string'
      ? job.skills
      : '';

  return {
    source: job.source,
    sourceId: job.sourceId,
    title: job.title,
    company: job.company ?? null,
    location: job.location ?? null,
    country: safeUpper(job.country) || 'IN',
    description: cleanJobDescription(job.description || ''),
    requirements: cleanJobDescription(job.requirements || ''),
    applyUrl: job.applyUrl ?? job.source_url ?? null,
    source_url: job.source_url ?? job.applyUrl ?? null,
    postedAt: job.postedAt ? new Date(job.postedAt) : null,
    salary: job.salary ?? null,
    salaryMin: job.salaryMin ?? null,
    salaryMax: job.salaryMax ?? null,
    salaryCurrency: job.salaryCurrency ?? null,
    jobType: job.jobType ?? 'full-time',
    experienceLevel: job.experienceLevel ?? 'mid',
    skills,
    isRemote: job.isRemote ?? false,
    isHybrid: job.isHybrid ?? false,
    isUrgent: job.isUrgent ?? false,
    isFeatured: job.isFeatured ?? false,
    sector: job.sector ?? 'General',
    rawJson: job.raw,
  };
}
