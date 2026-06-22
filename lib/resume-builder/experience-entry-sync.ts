/**
 * Keep experience entry canonical + alias fields in sync after editor updates.
 * When description is cleared, derived bullet arrays must clear too so preview/PDF
 * do not render orphaned achievements from import.
 */

export function syncExperienceEntryAliases(
  entry: Record<string, unknown>
): Record<string, unknown> {
  const title =
    'title' in entry
      ? String(entry.title ?? '')
      : String(entry.position ?? entry.Position ?? '');
  const company =
    'company' in entry
      ? String(entry.company ?? '')
      : String(entry.Company ?? '');
  const location =
    'location' in entry
      ? String(entry.location ?? '')
      : String(entry.Location ?? '');
  const description =
    'description' in entry
      ? String(entry.description ?? '')
      : String(entry.Description ?? '');

  const synced: Record<string, unknown> = {
    ...entry,
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
