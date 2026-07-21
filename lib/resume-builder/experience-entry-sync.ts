import {
  isPlausibleExperienceCompany,
  readExperienceCompanySlot,
  readExperiencePositionSlot,
  reconcileExperienceHeaderFields,
  sanitizeExperienceCompanyValue,
} from '@/lib/resume-parser/import-sanitize';

/** Unified current-role flag across parser, builder, and editor aliases. */
export function readExperienceCurrentFlag(entry: Record<string, unknown>): boolean {
  return (
    entry.current === true ||
    entry.Current === true ||
    entry.isCurrent === true
  );
}

export function readExperienceStartDate(entry: Record<string, unknown>): string {
  return String(entry.startDate ?? entry.StartDate ?? '').trim();
}

export function readExperienceEndDate(entry: Record<string, unknown>): string {
  return String(entry.endDate ?? entry.EndDate ?? '').trim();
}

/**
 * Resolve a display duration for templates — prefer explicit YYYY-MM fields over
 * stale Duration tokens (e.g. bare "Present" on past roles).
 */
export function resolveExperienceDurationForDisplay(
  entry: Record<string, unknown>
): string {
  const startDate = readExperienceStartDate(entry);
  const endDate = readExperienceEndDate(entry);
  const isCurrent = readExperienceCurrentFlag(entry);
  const stored = String(entry.duration ?? entry.Duration ?? '').trim();

  if (startDate) {
    if (isCurrent) return `${startDate} - Present`;
    if (endDate) return `${startDate} - ${endDate}`;
    return startDate;
  }

  if (stored) {
    if (/^present$/i.test(stored)) {
      if (isCurrent) return 'Present';
      if (endDate) return endDate;
      return '';
    }
    if (/\d{4}/.test(stored) || /\s[-–—]\s/.test(stored)) {
      return stored;
    }
    return stored;
  }

  if (isCurrent) return 'Present';
  return endDate || '';
}

export function stableExperienceEntryId(entry: Record<string, unknown>, index: number): string {
  const existing =
    typeof entry._id === 'string' && entry._id.trim() ? entry._id.trim() : '';
  if (existing) return existing;

  const company = sanitizeExperienceCompanyValue(readExperienceCompanySlot(entry)).slice(0, 24);
  const title = readExperiencePositionSlot(entry).slice(0, 24);
  const start = String(entry.startDate || '').slice(0, 10);
  const fingerprint = [company, title, start, String(index)]
    .join('|')
    .toLowerCase()
    .replace(/[^a-z0-9|_-]/g, '');
  if (fingerprint.replace(/[|_-]/g, '').length > 0) {
    return `exp_${fingerprint}`;
  }

  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `exp_${index}`;
}

/**
 * Form editing uses `title` as the single live-editable field.
 * Parser aliases (position, designation, …) must NOT override while the user types.
 */
export function readExperienceTitleForForm(entry: Record<string, unknown>): string {
  if (Object.prototype.hasOwnProperty.call(entry, 'title')) {
    return String(entry.title ?? '');
  }
  if (Object.prototype.hasOwnProperty.call(entry, 'Title')) {
    return String(entry.Title ?? '');
  }
  return readExperiencePositionSlot(entry);
}

/**
 * Resolve canonical title for blur/save — prefer live `title`, then parser aliases.
 */
export function readExperienceTitleForSync(entry: Record<string, unknown>): string {
  const fromForm = readExperienceTitleForForm(entry).trim();
  if (fromForm) return fromForm;
  return readExperiencePositionSlot(entry).trim();
}

/**
 * Form editing uses `description` as the single live-editable field.
 * Parser alias `Description` must NOT override while the user types or applies AI suggestions.
 */
export function readExperienceDescriptionForForm(entry: Record<string, unknown>): string {
  if (Object.prototype.hasOwnProperty.call(entry, 'description')) {
    return String(entry.description ?? '');
  }
  if (Object.prototype.hasOwnProperty.call(entry, 'Description')) {
    return String(entry.Description ?? '');
  }
  return '';
}

/** Resolve canonical description for blur/save — prefer live `description`, then alias. */
export function readExperienceDescriptionForSync(entry: Record<string, unknown>): string {
  if (
    Object.prototype.hasOwnProperty.call(entry, 'description') ||
    Object.prototype.hasOwnProperty.call(entry, 'Description')
  ) {
    return readExperienceDescriptionForForm(entry).trim();
  }
  return String(entry.Description ?? entry.description ?? '').trim();
}

/** Append an AI suggestion to the live description body (never replaces existing content). */
export function appendExperienceDescriptionSuggestion(
  entry: Record<string, unknown>,
  suggestion: string
): Record<string, unknown> {
  const trimmedSuggestion = suggestion.trim();
  if (!trimmedSuggestion) return entry;

  const currentDesc = readExperienceDescriptionForForm(entry).trim();
  const newDesc = currentDesc ? `${currentDesc}\n\n${trimmedSuggestion}` : trimmedSuggestion;
  return { ...entry, description: newDesc };
}

/**
 * Keep experience entry canonical + alias fields in sync after import / blur / save.
 * Do NOT call on every keystroke — use finalizeExperienceEntryForBuilder instead.
 */
export function syncExperienceEntryAliases(
  entry: Record<string, unknown>,
  options?: { reconcileHeaders?: boolean }
): Record<string, unknown> {
  const reconciled =
    options?.reconcileHeaders === false ? entry : reconcileExperienceHeaderFields(entry);

  const title = readExperienceTitleForSync(reconciled);
  let company = sanitizeExperienceCompanyValue(readExperienceCompanySlot(reconciled));

  if (!company.trim()) {
    for (const key of [
      'organization',
      'Organization',
      'employer',
      'Employer',
      'companyName',
      'CompanyName',
    ] as const) {
      const candidate = sanitizeExperienceCompanyValue(reconciled[key]);
      if (candidate && isPlausibleExperienceCompany(candidate)) {
        company = candidate;
        break;
      }
    }
  }

  const location = String(reconciled.location ?? reconciled.Location ?? '').trim();
  const description = readExperienceDescriptionForSync(reconciled);
  const id = stableExperienceEntryId(reconciled, Number(reconciled._index ?? 0));
  const isCurrent = readExperienceCurrentFlag(reconciled);
  const startDate = readExperienceStartDate(reconciled);
  const endDate = readExperienceEndDate(reconciled);
  const duration = resolveExperienceDurationForDisplay({
    ...reconciled,
    startDate,
    endDate,
    current: isCurrent,
    isCurrent,
  });

  const existingAchievements = Array.isArray(reconciled.achievements)
    ? (reconciled.achievements as unknown[]).filter(
        (item) => typeof item === 'string' && item.trim().length > 0
      )
    : [];

  const synced: Record<string, unknown> = {
    ...reconciled,
    _id: id,
    title,
    position: title,
    Position: title,
    designation: title,
    Designation: title,
    company,
    Company: company,
    organization: company,
    Organization: company,
    employer: company,
    Employer: company,
    location,
    Location: location,
    description,
    Description: description,
    startDate,
    StartDate: startDate,
    endDate,
    EndDate: endDate,
    current: isCurrent,
    Current: isCurrent,
    isCurrent,
    duration,
    Duration: duration,
    achievements: existingAchievements,
    bullets: existingAchievements,
    bulletPoints: existingAchievements,
    Achievements: existingAchievements,
  };

  return synced;
}

/** Read display values without mutating or re-syncing (safe during live typing). */
export function readExperienceEntryForForm(
  entry: Record<string, unknown>,
  index: number
): {
  id: string;
  title: string;
  company: string;
  location: string;
  startDate: string;
  endDate: string;
  description: string;
  current: boolean;
} {
  const title = readExperienceTitleForForm(entry);
  const company = String(
    entry.company !== undefined && String(entry.company).trim()
      ? entry.company
      : entry.Company !== undefined && String(entry.Company).trim()
        ? entry.Company
        : readExperienceCompanySlot(entry)
  );
  const location = String(entry.location ?? entry.Location ?? '').trim();
  const startDate = readExperienceStartDate(entry);
  const endDate = readExperienceEndDate(entry);
  const description = readExperienceDescriptionForForm(entry).trim();
  const current = readExperienceCurrentFlag(entry);

  return {
    id: stableExperienceEntryId(entry, index),
    title,
    company,
    location,
    startDate,
    endDate,
    description,
    current,
  };
}

export function finalizeExperienceEntryForBuilder(
  entry: Record<string, unknown>,
  index: number
): Record<string, unknown> {
  return syncExperienceEntryAliases(
    { ...entry, _id: stableExperienceEntryId(entry, index) },
    { reconcileHeaders: false }
  );
}
