/**
 * Job Data Normalizer
 * Ensures consistent job data structure across the application
 * Maintains backward compatibility with existing code
 */

import { JobResult } from '@/types/jobs';

/**
 * Normalize job data to ensure consistent structure
 * Handles various data formats from different sources
 */
export function normalizeJobData(job: any): JobResult {
  if (!job) {
    return getDefaultJobData();
  }

  // CRITICAL FIX: Handle large IDs properly to prevent precision loss
  // If ID is a large number (>10 digits), prefer sourceId if available
  // ALWAYS ensure ID is a string to prevent .startsWith() errors
  let normalizedId = job.id?.toString() || job.sourceId?.toString() || '';
  const idStr = normalizedId;
  const isExtComposite = /^ext-[^-]+-.+$/.test(idStr);
  const isLargeId = /^\d{11,}$/.test(idStr); // 11+ digits (beyond PostgreSQL INT max)

  if (isLargeId && job.sourceId && !isExtComposite) {
    normalizedId = String(job.sourceId);
  }

  return {
    id: normalizedId, // CRITICAL FIX: Always string to support .startsWith() calls
    sourceId: job.sourceId?.toString(), // CRITICAL FIX: Ensure sourceId is string
    title: job.title || 'Job Title',
    company: job.company || job.companyRelation?.name || 'Company',
    companyLogo: job.companyLogo || job.companyRelation?.logo,
    location: job.location || 'Location',
    description: job.description || 'No description available',
    salary: normalizeSalary(job),
    salary_formatted: normalizeSalary(job),
    // Preserve original salary fields for proper currency formatting
    salaryMin: job.salaryMin,
    salaryMax: job.salaryMax,
    salaryCurrency: job.salaryCurrency,
    country: job.country,
    time_ago: normalizeTimeAgo(job),
    redirect_url: normalizeRedirectUrl(job),
    is_remote: normalizeBoolean(job.is_remote, job.isRemote),
    is_hybrid: normalizeBoolean(job.is_hybrid, job.isHybrid),
    is_urgent: normalizeBoolean(job.is_urgent, job.isUrgent),
    is_featured: normalizeBoolean(job.is_featured, job.isFeatured),
    job_type: job.job_type || job.jobType,
    experience_level: job.experience_level || job.experienceLevel,
    skills: normalizeSkills(job.skills),
    sector: job.sector,
    posted_at: job.posted_at || job.postedAt,
    created_at: job.created_at || job.createdAt,
    source: job.source || 'manual', // CRITICAL: This determines if sourceId is used for URL
    source_url: job.source_url || job.applyUrl,
    jobType: job.jobType || job.job_type,
    experienceLevel: job.experienceLevel || job.experience_level,
    isExternal: job.isExternal || job.source !== 'manual',
    applyUrl: job.applyUrl || job.source_url || job.redirect_url
  };
}

/**
 * Normalize salary field - return raw data for proper currency formatting
 */
function normalizeSalary(job: any): string {
  // Return raw salary string if available (for proper currency formatting later)
  if (job.salary && typeof job.salary === 'string') return job.salary;
  if (job.salary_formatted && typeof job.salary_formatted === 'string') return job.salary_formatted;
  
  // For numeric salaries, return a simple range format without currency symbol
  if (job.salaryMin && job.salaryMax) {
    return `${job.salaryMin}-${job.salaryMax}`;
  }
  
  if (job.salaryMin) {
    return `${job.salaryMin}+`;
  }
  
  return 'Salary not specified';
}

/**
 * Normalize time ago field
 */
function normalizeTimeAgo(job: any): string {
  if (job.time_ago) return job.time_ago;
  
  const date = job.postedAt || job.posted_at || job.createdAt || job.created_at;
  if (date) {
    return formatTimeAgo(new Date(date));
  }
  
  return 'Recently posted';
}

/**
 * Format time ago from date
 */
function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
  
  if (diffInDays === 0) return 'Today';
  if (diffInDays === 1) return 'Yesterday';
  if (diffInDays < 7) return `${diffInDays} days ago`;
  if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
  if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} months ago`;
  
  return `${Math.floor(diffInDays / 365)} years ago`;
}

/**
 * Normalize redirect URL
 */
function normalizeRedirectUrl(job: any): string {
  return job.redirect_url || job.source_url || job.applyUrl || '#';
}

/**
 * Normalize boolean fields
 */
function normalizeBoolean(value1: any, value2: any): boolean {
  if (typeof value1 === 'boolean') return value1;
  if (typeof value2 === 'boolean') return value2;
  if (value1 === 'true' || value1 === 1) return true;
  if (value2 === 'true' || value2 === 1) return true;
  return false;
}

/**
 * Normalize skills array
 */
function normalizeSkills(skills: any): string[] {
  if (!skills) return [];
  
  if (Array.isArray(skills)) {
    return skills.filter(skill => skill && typeof skill === 'string');
  }
  
  if (typeof skills === 'string') {
    try {
      // Try to parse as JSON first
      const parsed = JSON.parse(skills);
      if (Array.isArray(parsed)) {
        return parsed.filter(skill => skill && typeof skill === 'string');
      }
    } catch {
      // If JSON parsing fails, split by comma
      return skills.split(',')
        .map(skill => skill.trim())
        .filter(skill => skill.length > 0);
    }
  }
  
  return [];
}

/**
 * Get default job data for fallback
 */
function getDefaultJobData(): JobResult {
  return {
    id: '',
    title: 'Job Title',
    company: 'Company',
    location: 'Location',
    description: 'No description available',
    salary: 'Salary not specified',
    salary_formatted: 'Salary not specified',
    time_ago: 'Recently posted',
    redirect_url: '#',
    is_remote: false,
    is_hybrid: false,
    is_urgent: false,
    is_featured: false,
    skills: [],
    source: 'manual',
    isExternal: false
  };
}

/**
 * Validate job data structure
 */
export function validateJobData(job: any): boolean {
  if (!job) return false;
  
  const requiredFields = ['id', 'title', 'company'];
  return requiredFields.every(field => job[field] && job[field].toString().trim().length > 0);
}

/** Canonical keys: full_time, part_time, contract, internship, freelance, etc. */
export function normalizeJobTypeKey(jobType: string): string {
  if (!jobType?.trim()) return '';
  const compact = jobType.toLowerCase().trim().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
  const aliases: Record<string, string> = {
    fulltime: 'full_time',
    parttime: 'part_time',
    full_time: 'full_time',
    part_time: 'part_time',
    contract: 'contract',
    internship: 'internship',
    intern: 'internship',
    freelance: 'freelance',
    permanent: 'permanent',
    temporary: 'temporary',
    fresher: 'fresher',
  };
  return aliases[compact] || compact;
}

/** Search variants for Prisma `contains` filters (full-time / Full Time / full_time). */
export function jobTypeSearchVariants(filter: string): string[] {
  const key = normalizeJobTypeKey(filter);
  if (!key) return [];
  const variants = [
    key,
    key.replace(/_/g, '-'),
    key.replace(/_/g, ' '),
    filter.trim(),
    filter.trim().replace(/-/g, '_'),
    filter.trim().replace(/_/g, '-'),
  ];
  return [...new Set(variants.map((v) => v.trim()).filter(Boolean))];
}

export function jobTypeMatchesFilter(
  stored: string | null | undefined,
  filter: string
): boolean {
  if (!filter || filter === 'all') return true;
  if (!stored?.trim()) return false;
  return normalizeJobTypeKey(stored) === normalizeJobTypeKey(filter);
}

/** Canonical keys: entry, mid, senior, lead, executive (matches employer post-job storage). */
export function normalizeExperienceLevelKey(level: string): string {
  if (!level?.trim()) return '';
  const t = level.toLowerCase().trim();
  if (/\b(entry|fresher|junior|graduate|intern)\b/.test(t) || /^entry\b/.test(t)) return 'entry';
  if (/\b(executive|director)\b/.test(t) || /^executive\b/.test(t)) return 'executive';
  if (/\b(lead|principal|staff)\b/.test(t) || /^lead\b/.test(t)) return 'lead';
  if (/\b(senior|sr\.?)\b/.test(t) || /^senior\b/.test(t)) return 'senior';
  if (/\b(mid|middle|intermediate)\b/.test(t) || /^mid\b/.test(t)) return 'mid';
  const first = t.split(/[\s_(/-]+/)[0];
  if (first === 'fresher' || first === 'junior') return 'entry';
  if (['entry', 'mid', 'senior', 'lead', 'executive'].includes(first)) return first;
  return first;
}

export function experienceLevelSearchVariants(filter: string): string[] {
  const key = normalizeExperienceLevelKey(filter);
  if (!key) return [];
  const variants = [key, filter.trim()];
  if (key === 'entry') variants.push('entry level', 'fresher', 'junior');
  if (key === 'mid') variants.push('mid level', 'middle');
  if (key === 'senior') variants.push('senior level');
  if (key === 'lead') variants.push('lead level');
  if (key === 'executive') variants.push('executive level');
  return [...new Set(variants.map((v) => v.trim()).filter(Boolean))];
}

export function experienceLevelMatchesFilter(
  stored: string | null | undefined,
  filter: string
): boolean {
  if (!filter || filter === 'all') return true;
  if (!stored?.trim()) return false;
  return normalizeExperienceLevelKey(stored) === normalizeExperienceLevelKey(filter);
}

/** Single-term OR across all searchable Job fields (shared by listing APIs). */
export function buildJobTextSearchOr(term: string) {
  const t = term.trim();
  if (!t) return [];
  return [
    { title: { contains: t, mode: 'insensitive' as const } },
    { description: { contains: t, mode: 'insensitive' as const } },
    { requirements: { contains: t, mode: 'insensitive' as const } },
    { company: { contains: t, mode: 'insensitive' as const } },
    { companyRelation: { name: { contains: t, mode: 'insensitive' as const } } },
    { companyRelation: { industry: { contains: t, mode: 'insensitive' as const } } },
    { location: { contains: t, mode: 'insensitive' as const } },
    { skills: { contains: t, mode: 'insensitive' as const } },
    { sector: { contains: t, mode: 'insensitive' as const } },
  ];
}

/**
 * Text search: full phrase OR all-terms AND (widens recall; ranking orders by relevance).
 * Single-word queries use the same OR-across-fields path as before.
 */
export function applyJobTextSearchToWhere(
  where: Record<string, unknown>,
  query: string
): void {
  const trimmed = query.trim();
  if (!trimmed) return;
  const terms = trimmed.split(/\s+/).filter((t) => t.length > 0);
  const and = (where.AND as unknown[]) || [];
  if (terms.length <= 1) {
    and.push({ OR: buildJobTextSearchOr(terms[0] || trimmed) });
  } else {
    and.push({
      OR: [
        { OR: buildJobTextSearchOr(trimmed) },
        {
          AND: terms.map((term) => ({ OR: buildJobTextSearchOr(term) })),
        },
      ],
    });
  }
  where.AND = and;
}

export function buildJobLocationConditions(location: string) {
  const parts = location.split(',').map((p) => p.trim()).filter(Boolean);
  return parts.flatMap((part) => [
    { location: { contains: part, mode: 'insensitive' as const } },
    { companyRelation: { location: { contains: part, mode: 'insensitive' as const } } },
    { companyRelation: { city: { contains: part, mode: 'insensitive' as const } } },
  ]);
}

/** Employer boost: city match OR internal rows with unset location (still text-filtered). */
export function applyEmployerLocationToWhere(
  where: Record<string, unknown>,
  location: string
): void {
  if (!location.trim()) return;
  const locationConditions = buildJobLocationConditions(location);
  const and = (where.AND as unknown[]) || [];
  and.push({
    OR: [
      ...locationConditions,
      { location: null },
      { location: '' },
    ],
  });
  where.AND = and;
}

export function applyJobLocationToWhere(
  where: Record<string, unknown>,
  location: string
): void {
  if (!location.trim()) return;
  const locationConditions = buildJobLocationConditions(location);
  const and = (where.AND as unknown[]) || [];
  if (where.OR) {
    and.push({ OR: where.OR });
    delete where.OR;
  }
  and.push({ OR: locationConditions });
  where.AND = and;
}

/** Post-merge location check for external API rows (DB rows already filtered in Prisma). */
export function jobMatchesListingLocation(
  job: {
    location?: string | null;
    country?: string | null;
    companyRelation?: { location?: string | null; city?: string | null } | null;
  },
  location: string
): boolean {
  if (!location.trim()) return true;
  const parts = location
    .split(',')
    .map((p) => p.trim().toLowerCase())
    .filter(Boolean);
  const jobLoc = (
    job.location ||
    job.companyRelation?.location ||
    job.companyRelation?.city ||
    ''
  ).toLowerCase();
  return parts.some((part) => jobLoc.includes(part));
}

const COUNTRY_NAME_ALIASES: Record<string, string[]> = {
  IN: ['IN', 'INDIA'],
  US: ['US', 'USA', 'UNITED STATES'],
  GB: ['GB', 'UK', 'UNITED KINGDOM'],
  AE: ['AE', 'UAE', 'UNITED ARAB EMIRATES'],
};

/** Quick-filter country match (explicit chip only); supports code and full name. */
export function applyExplicitCountryToWhere(
  where: Record<string, unknown>,
  countryCode: string
): void {
  const code = countryCode.trim().toUpperCase();
  if (!code || code === 'ALL') return;
  const aliases = COUNTRY_NAME_ALIASES[code] || [code];
  const and = (where.AND as unknown[]) || [];
  and.push({
    OR: [
      { source: { in: ['manual', 'employer'] } },
      ...aliases.map((alias) => ({
        country: { contains: alias, mode: 'insensitive' as const },
      })),
    ],
  });
  where.AND = and;
}

/** jobType filter with legacy/null tolerance for employer-posted jobs. */
export function applyJobTypeFilterToWhere(
  where: Record<string, unknown>,
  jobType: string
): void {
  if (!jobType || jobType === 'all') return;
  const variants = jobTypeSearchVariants(jobType);
  const and = (where.AND as unknown[]) || [];
  and.push({
    OR: [
      ...variants.map((variant) => ({
        jobType: { contains: variant, mode: 'insensitive' as const },
      })),
      {
        AND: [
          { source: { in: ['manual', 'employer'] } },
          { OR: [{ jobType: null }, { jobType: '' }] },
        ],
      },
    ],
  });
  where.AND = and;
}

/** experienceLevel filter with legacy/null tolerance for employer-posted jobs. */
export function applyExperienceLevelFilterToWhere(
  where: Record<string, unknown>,
  experienceLevel: string
): void {
  if (!experienceLevel || experienceLevel === 'all') return;
  const variants = experienceLevelSearchVariants(experienceLevel);
  const and = (where.AND as unknown[]) || [];
  and.push({
    OR: [
      ...variants.map((variant) => ({
        experienceLevel: { contains: variant, mode: 'insensitive' as const },
      })),
      {
        AND: [
          { source: { in: ['manual', 'employer'] } },
          { OR: [{ experienceLevel: null }, { experienceLevel: '' }] },
        ],
      },
    ],
  });
  where.AND = and;
}

/** Sources excluded from public job listings (DB-level + quality check). */
export const EXCLUDED_LISTING_SOURCES = ['sample', 'dynamic', 'seeded'] as const;

/**
 * Base Prisma where for listing APIs — flat shape (nested AND/OR source filter returned 0 rows in production).
 * Matches the working pattern in real-job-search / simple-unlimited.
 */
export function buildJobListingBaseWhere(): Record<string, unknown> {
  return {
    isActive: true,
    // Flat filter — matches /api/jobs/real (nested AND/OR + notIn returned 0 rows in production).
    source: { not: 'sample' },
  };
}

/** Listing quality: required fields only; never drop employer manual jobs for AI/generic wording. */
export function passesJobListingQualityCheck(job: {
  title?: string | null;
  company?: string | null;
  companyRelation?: { name?: string | null } | null;
  description?: string | null;
  source?: string | null;
}): boolean {
  const companyLabel = (job.company || job.companyRelation?.name || '').trim();
  if (!job.title?.trim() || !companyLabel) return false;
  const source = (job.source || '').toLowerCase();
  if (EXCLUDED_LISTING_SOURCES.includes(source as (typeof EXCLUDED_LISTING_SOURCES)[number])) {
    return false;
  }
  if (source === 'manual' || source === 'employer') return true;
  // Lightweight list queries omit description (view=list) — title+company already validated above.
  if (!Object.prototype.hasOwnProperty.call(job, 'description')) return true;
  return !!String(job.description || '').trim();
}

/**
 * Sanitize job data for display
 */
export function sanitizeJobData(job: any): any {
  if (!job) return null;
  
  const sanitized = { ...job };
  
  // Sanitize string fields
  const stringFields = ['title', 'company', 'location', 'description', 'salary'];
  stringFields.forEach(field => {
    if (sanitized[field] && typeof sanitized[field] === 'string') {
      sanitized[field] = sanitized[field].trim();
    }
  });
  
  // Ensure ID is string
  if (sanitized.id) {
    sanitized.id = sanitized.id.toString();
  }
  
  return sanitized;
}
