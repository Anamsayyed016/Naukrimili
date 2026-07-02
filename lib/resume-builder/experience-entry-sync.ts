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
  entry: Record<string, unknown>
): Record<string, unknown> {
  const reconciled = reconcileExperienceHeaderFields(entry);

  const title =
    'title' in reconciled
      ? String(reconciled.title ?? '')
      : String(
          reconciled.position ??
            reconciled.Position ??
            reconciled.designation ??
            reconciled.role ??
            reconciled.jobTitle ??
            ''
        );
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
    company,
    Company: company,
    location,
    Location: location,
    description,
    Description: description,
  };

  if (!description.trim()) {
    synced.achievements = [];
    synced.bullets = [];
  }

  return synced;
}
