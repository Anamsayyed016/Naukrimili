import {
  isPlausibleExperienceCompany,
  reconcileExperienceHeaderFields,
} from '@/lib/resume-parser/import-sanitize';

/**
 * Keep experience entry canonical + alias fields in sync after editor updates.
 * When description is cleared, derived bullet arrays must clear too so preview/PDF
 * do not render orphaned achievements from import.
 */
export function syncExperienceEntryAliases(
  entry: Record<string, unknown>,
  options?: { reconcileHeaders?: boolean }
): Record<string, unknown> {
  const reconciled =
    options?.reconcileHeaders === false ? entry : reconcileExperienceHeaderFields(entry);

  const readTitle = (): string => {
    const fromTitle = String(reconciled.title ?? reconciled.Title ?? '').trim();
    if (fromTitle) return fromTitle;
    for (const key of [
      'position',
      'Position',
      'designation',
      'Designation',
      'role',
      'Role',
      'jobTitle',
      'JobTitle',
    ]) {
      const value = String(reconciled[key] ?? '').trim();
      if (value) return value;
    }
    return '';
  };
  const title = readTitle();
  let company =
    'company' in reconciled
      ? String(reconciled.company ?? '')
      : String(reconciled.Company ?? '');
  if (!company.trim()) {
    for (const key of [
      'organization',
      'Organization',
      'employer',
      'Employer',
      'companyName',
      'CompanyName',
    ] as const) {
      const candidate = String(reconciled[key] ?? '').trim();
      if (candidate && isPlausibleExperienceCompany(candidate)) {
        company = candidate;
        break;
      }
    }
  }
  const location =
    'location' in reconciled
      ? String(reconciled.location ?? '')
      : String(reconciled.Location ?? '');
  const description =
    'description' in reconciled
      ? String(reconciled.description ?? '')
      : String(reconciled.Description ?? '');

  const synced: Record<string, unknown> = {
    ...reconciled,
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
