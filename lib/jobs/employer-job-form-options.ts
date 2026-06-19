/**
 * Canonical dropdown options for employer job forms.
 * Matches AIJobPostingForm (Create Job page) for job type and experience level.
 */

export const EMPLOYER_JOB_TYPES = [
  'Full-time',
  'Part-time',
  'Contract',
  'Internship',
  'Freelance',
  'Permanent',
  'Temporary',
  'Fresher',
] as const;

export const EMPLOYER_EXPERIENCE_LEVELS = [
  'Entry Level (0-2 years)',
  'Mid Level (3-5 years)',
  'Senior Level (6-10 years)',
  'Lead (11-15 years)',
  'Executive (15+ years)',
] as const;

export const EMPLOYER_JOB_SECTORS = [
  'Technology',
  'Healthcare',
  'Finance & Banking',
  'Education',
  'IT & Software',
  'Manufacturing',
  'Retail & E-commerce',
  'Marketing & Advertising',
  'Sales',
  'Customer Service & BPO',
  'Real Estate',
  'Construction',
  'Hospitality & Tourism',
  'Transportation & Logistics',
  'Media & Entertainment',
  'Telecommunications',
  'Legal',
  'Consulting',
  'Human Resources',
  'Agriculture',
  'Energy & Utilities',
  'Government & Public Sector',
  'Non-Profit & NGO',
  'General',
  'Other',
] as const;

export type EmployerJobType = (typeof EMPLOYER_JOB_TYPES)[number];
export type EmployerExperienceLevel = (typeof EMPLOYER_EXPERIENCE_LEVELS)[number];
export type EmployerJobSector = (typeof EMPLOYER_JOB_SECTORS)[number];

function normalizeKey(value: string): string {
  return value.toLowerCase().replace(/[\s_-]+/g, '');
}

const JOB_TYPE_ALIASES: Record<string, EmployerJobType> = {
  fulltime: 'Full-time',
  full: 'Full-time',
  parttime: 'Part-time',
  part: 'Part-time',
  contract: 'Contract',
  internship: 'Internship',
  intern: 'Internship',
  freelance: 'Freelance',
  permanent: 'Permanent',
  temporary: 'Temporary',
  temp: 'Temporary',
  fresher: 'Fresher',
  remote: 'Full-time',
  hybrid: 'Full-time',
};

const EXPERIENCE_ALIASES: Record<string, EmployerExperienceLevel> = {
  entry: 'Entry Level (0-2 years)',
  entrylevel: 'Entry Level (0-2 years)',
  junior: 'Entry Level (0-2 years)',
  mid: 'Mid Level (3-5 years)',
  midlevel: 'Mid Level (3-5 years)',
  intermediate: 'Mid Level (3-5 years)',
  senior: 'Senior Level (6-10 years)',
  seniorlevel: 'Senior Level (6-10 years)',
  lead: 'Lead (11-15 years)',
  leadlevel: 'Lead (11-15 years)',
  manager: 'Lead (11-15 years)',
  director: 'Executive (15+ years)',
  executive: 'Executive (15+ years)',
  internship: 'Entry Level (0-2 years)',
};

export function normalizeEmployerJobType(value: string): string {
  if (!value?.trim()) return '';

  const trimmed = value.trim();
  const exact = EMPLOYER_JOB_TYPES.find((type) => type === trimmed);
  if (exact) return exact;

  const byKey = EMPLOYER_JOB_TYPES.find((type) => normalizeKey(type) === normalizeKey(trimmed));
  if (byKey) return byKey;

  const alias = JOB_TYPE_ALIASES[normalizeKey(trimmed)];
  return alias ?? trimmed;
}

export function normalizeEmployerExperienceLevel(value: string): string {
  if (!value?.trim()) return '';

  const trimmed = value.trim();
  const exact = EMPLOYER_EXPERIENCE_LEVELS.find((level) => level === trimmed);
  if (exact) return exact;

  const byKey = EMPLOYER_EXPERIENCE_LEVELS.find(
    (level) => normalizeKey(level) === normalizeKey(trimmed)
  );
  if (byKey) return byKey;

  const alias = EXPERIENCE_ALIASES[normalizeKey(trimmed)];
  if (alias) return alias;

  const lower = trimmed.toLowerCase();
  if (lower.includes('entry') || lower.includes('fresher') || lower.includes('0-2')) {
    return 'Entry Level (0-2 years)';
  }
  if (lower.includes('mid') || lower.includes('3-5') || lower.includes('2-5')) {
    return 'Mid Level (3-5 years)';
  }
  if (lower.includes('senior') || lower.includes('6-10') || lower.includes('5-10')) {
    return 'Senior Level (6-10 years)';
  }
  if (lower.includes('lead') || lower.includes('11-15') || lower.includes('10-15')) {
    return 'Lead (11-15 years)';
  }
  if (lower.includes('executive') || lower.includes('15+')) {
    return 'Executive (15+ years)';
  }

  return trimmed;
}

export function normalizeEmployerJobSector(value: string): string {
  if (!value?.trim()) return '';

  const trimmed = value.trim();
  const exact = EMPLOYER_JOB_SECTORS.find((sector) => sector === trimmed);
  if (exact) return exact;

  const byKey = EMPLOYER_JOB_SECTORS.find(
    (sector) => normalizeKey(sector) === normalizeKey(trimmed)
  );
  if (byKey) return byKey;

  return trimmed;
}

/** Include a legacy stored value once when it cannot be mapped to a canonical option. */
export function withLegacyOption<T extends string>(options: readonly T[], currentValue: string): T[] {
  if (!currentValue?.trim()) return [...options];
  if (options.includes(currentValue as T)) return [...options];
  return [...options, currentValue as T];
}
