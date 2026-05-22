/**
 * Normalizes Affinda v3 document `data` (flat ResumeData, snake_case, or Annotation wrappers).
 */

type AnyRecord = Record<string, unknown>;

function isRecord(v: unknown): v is AnyRecord {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/** Unwrap Affinda Annotation fields: { parsed, text, ... } → parsed value */
export function unwrapParsed<T>(field: unknown): T | undefined {
  if (field == null) return undefined;
  if (isRecord(field) && 'parsed' in field) {
    const parsed = field.parsed;
    if (parsed != null) return parsed as T;
  }
  return field as T;
}

export function unwrapParsedArray<T>(field: unknown): T[] {
  if (!Array.isArray(field)) return [];
  return field
    .map((item) => unwrapParsed<T>(item))
    .filter((item): item is T => item != null && item !== '');
}

/** Pick first defined value from snake_case / camelCase keys */
function pick<T>(obj: AnyRecord, ...keys: string[]): T | undefined {
  for (const key of keys) {
    if (obj[key] != null) return obj[key] as T;
  }
  return undefined;
}

/**
 * Returns resume payload object from POST/GET document JSON body.
 */
export function extractAffindaResumePayload(body: unknown): AnyRecord {
  if (!isRecord(body)) return {};

  let data: unknown = body.data;
  if (data == null && isRecord(body.meta)) {
    data = body;
  }

  if (typeof data === 'string') {
    try {
      data = JSON.parse(data);
    } catch {
      return {};
    }
  }

  if (!isRecord(data)) return {};

  const unwrapped = unwrapParsed<AnyRecord>(data) ?? data;
  return unwrapped;
}

export function normalizeAffindaResumeFields(raw: AnyRecord): AnyRecord {
  const name = unwrapParsed<AnyRecord>(pick(raw, 'name')) ?? pick(raw, 'name');
  const location = unwrapParsed<AnyRecord>(pick(raw, 'location')) ?? pick(raw, 'location');

  const emails = unwrapParsedArray<string>(pick(raw, 'emails', 'email'));
  const phoneNumbers = unwrapParsedArray<string>(
    pick(raw, 'phoneNumbers', 'phone_numbers', 'phones')
  );
  const phoneNumberDetails = unwrapParsedArray<AnyRecord>(
    pick(raw, 'phoneNumberDetails', 'phone_number_details')
  );

  const workExperience = unwrapParsedArray<AnyRecord>(
    pick(raw, 'workExperience', 'work_experience')
  );
  const education = unwrapParsedArray<AnyRecord>(pick(raw, 'education'));
  const skills = unwrapParsedArray<AnyRecord | string>(pick(raw, 'skills'));
  const websites = unwrapParsedArray<string | AnyRecord>(pick(raw, 'websites', 'website'));
  const certifications = unwrapParsedArray<string | AnyRecord>(
    pick(raw, 'certifications', 'certification')
  );
  const languages = unwrapParsedArray<string | AnyRecord>(pick(raw, 'languages', 'language'));
  const projects = unwrapParsedArray<AnyRecord>(pick(raw, 'projects', 'project'));

  const summary =
    (unwrapParsed<string>(pick(raw, 'summary', 'objective')) as string | undefined) ||
    (typeof pick(raw, 'summary', 'objective') === 'string'
      ? (pick(raw, 'summary', 'objective') as string)
      : '');

  const rawText =
    (typeof pick(raw, 'rawText', 'raw_text') === 'string'
      ? (pick(raw, 'rawText', 'raw_text') as string)
      : '') || '';

  return {
    name,
    emails,
    phoneNumbers,
    phoneNumberDetails,
    phones: phoneNumberDetails.length
      ? phoneNumberDetails
      : phoneNumbers.map((n) => ({ rawPhone: n, number: n })),
    location,
    websites,
    summary,
    skills,
    workExperience,
    education,
    certifications,
    languages,
    projects,
    rawText,
  };
}
