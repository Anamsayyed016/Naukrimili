import {
  isPlausibleExperienceCompany,
  readExperienceCompanySlot,
  readExperiencePositionSlot,
  reconcileExperienceHeaderFields,
  sanitizeExperienceCompanyValue,
} from '@/lib/resume-parser/import-sanitize';

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
 * Keep experience entry canonical + alias fields in sync after import / blur / save.
 * Do NOT call on every keystroke — use finalizeExperienceEntryForBuilder instead.
 */
export function syncExperienceEntryAliases(
  entry: Record<string, unknown>,
  options?: { reconcileHeaders?: boolean }
): Record<string, unknown> {
  const reconciled =
    options?.reconcileHeaders === false ? entry : reconcileExperienceHeaderFields(entry);

  const title = readExperiencePositionSlot(reconciled);
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
  const description = String(
    reconciled.description ?? reconciled.Description ?? ''
  ).trim();
  const id = stableExperienceEntryId(reconciled, Number(reconciled._index ?? 0));

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
  };

  if (!description.trim()) {
    synced.achievements = [];
    synced.bullets = [];
    synced.bulletPoints = [];
  }

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
  const title = readExperiencePositionSlot(entry);
  const company = String(
    entry.company !== undefined && String(entry.company).trim()
      ? entry.company
      : entry.Company !== undefined && String(entry.Company).trim()
        ? entry.Company
        : readExperienceCompanySlot(entry)
  );
  const location = String(entry.location ?? entry.Location ?? '').trim();
  const startDate = String(entry.startDate ?? '').trim();
  const endDate = String(entry.endDate ?? '').trim();
  const description = String(entry.description ?? entry.Description ?? '').trim();
  const current = entry.current === true || entry.Current === true;

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
