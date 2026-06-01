/**
 * Employer company profile completeness (display-only; does not gate workflows).
 */

export type CompanyProfileFieldKey =
  | 'name'
  | 'logo'
  | 'industry'
  | 'description'
  | 'website'
  | 'location';

export const COMPANY_PROFILE_COMPLETENESS_FIELDS: ReadonlyArray<{
  key: CompanyProfileFieldKey;
  label: string;
}> = [
  { key: 'name', label: 'Company Name' },
  { key: 'logo', label: 'Logo' },
  { key: 'industry', label: 'Industry' },
  { key: 'description', label: 'Description' },
  { key: 'website', label: 'Website' },
  { key: 'location', label: 'Location' },
] as const;

export type CompanyProfileCompletionInput = Partial<
  Record<CompanyProfileFieldKey, string | null | undefined>
>;

function isFilled(value: string | null | undefined): boolean {
  return typeof value === 'string' && value.trim().length > 0;
}

export function getCompanyProfileCompletion(company: CompanyProfileCompletionInput) {
  const total = COMPANY_PROFILE_COMPLETENESS_FIELDS.length;
  const complete = COMPANY_PROFILE_COMPLETENESS_FIELDS.filter(({ key }) =>
    isFilled(company[key])
  );
  const missing = COMPANY_PROFILE_COMPLETENESS_FIELDS.filter(
    ({ key, label }) => !isFilled(company[key]) && label
  ).map(({ label }) => label);

  const percent = total > 0 ? Math.round((complete.length / total) * 100) : 0;

  return { percent, missing, completeCount: complete.length, total };
}
