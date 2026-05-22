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

/** Scalar string from annotation, location object, or plain string */
export function unwrapScalar(field: unknown): string {
  if (field == null) return '';
  const parsed = unwrapParsed(field);
  if (typeof parsed === 'string') return parsed.trim();
  if (typeof parsed === 'number') return String(parsed);
  if (isRecord(field)) {
    if (typeof field.formatted === 'string') return field.formatted.trim();
    if (typeof field.raw === 'string') return field.raw.trim();
    if (typeof field.text === 'string') return field.text.trim();
    const city = field.city as string | undefined;
    const state = field.state as string | undefined;
    const country = field.country as string | undefined;
    const joined = [city, state, country].filter(Boolean).join(', ');
    if (joined) return joined;
  }
  if (typeof field === 'string') return field.trim();
  return '';
}

/** Pick first defined value from snake_case / camelCase keys */
function pick<T>(obj: AnyRecord, ...keys: string[]): T | undefined {
  for (const key of keys) {
    if (obj[key] != null) return obj[key] as T;
  }
  return undefined;
}

function normalizeWorkExperienceItem(exp: AnyRecord): AnyRecord {
  const datesRaw = pick<AnyRecord>(exp, 'dates') || {};
  const datesUnwrapped = (unwrapParsed<AnyRecord>(datesRaw) ?? datesRaw) as AnyRecord;

  return {
    organization: unwrapScalar(pick(exp, 'organization', 'company', 'employer')),
    jobTitle: unwrapScalar(pick(exp, 'jobTitle', 'job_title', 'title', 'position', 'role')),
    location: {
      formatted: unwrapScalar(pick(exp, 'location')),
    },
    jobDescription: unwrapScalar(
      pick(exp, 'jobDescription', 'job_description', 'description', 'summary')
    ),
    dates: {
      startDate: unwrapScalar(pick(datesUnwrapped, 'startDate', 'start_date')),
      endDate: unwrapScalar(pick(datesUnwrapped, 'endDate', 'end_date')),
      raw: unwrapScalar(pick(datesUnwrapped, 'rawText', 'raw', 'raw_text')),
    },
  };
}

function normalizeEducationItem(edu: AnyRecord): AnyRecord {
  const accredRaw = pick(edu, 'accreditation') || {};
  const accred = (unwrapParsed<AnyRecord>(accredRaw) ?? accredRaw) as AnyRecord;
  const datesRaw = pick(edu, 'dates') || {};
  const dates = (unwrapParsed<AnyRecord>(datesRaw) ?? datesRaw) as AnyRecord;
  const gradeRaw = pick(edu, 'grade') || {};
  const grade = (unwrapParsed<AnyRecord>(gradeRaw) ?? gradeRaw) as AnyRecord;

  return {
    organization: unwrapScalar(pick(edu, 'organization', 'institution', 'school', 'university')),
    accreditation: {
      education: unwrapScalar(pick(accred, 'education', 'input', 'degree')),
      input: unwrapScalar(pick(accred, 'input', 'education')),
    },
    grade: { raw: unwrapScalar(pick(grade, 'raw', 'value')) },
    location: { formatted: unwrapScalar(pick(edu, 'location')) },
    dates: {
      startDate: unwrapScalar(pick(dates, 'startDate', 'start_date')),
      completionDate: unwrapScalar(
        pick(dates, 'completionDate', 'completion_date', 'endDate', 'end_date')
      ),
      raw: unwrapScalar(pick(dates, 'rawText', 'raw')),
    },
  };
}

function normalizeSkillItem(skill: unknown): { name: string } | null {
  if (typeof skill === 'string') {
    const name = skill.replace(/\s+\d{1,3}%?\s*$/i, '').trim();
    return name ? { name } : null;
  }
  if (!isRecord(skill)) return null;
  const unwrapped = unwrapParsed<AnyRecord>(skill) ?? skill;
  const name = unwrapScalar(pick(unwrapped, 'name', 'skill', 'label'));
  if (!name) return null;
  return { name: name.replace(/\s+\d{1,3}%?\s*$/i, '').trim() };
}

function normalizeWebsiteItem(site: unknown): { url: string; type?: string } | null {
  if (typeof site === 'string') {
    const url = site.trim();
    return url ? { url } : null;
  }
  if (!isRecord(site)) return null;
  const unwrapped = unwrapParsed<AnyRecord>(site) ?? site;
  const url = unwrapScalar(pick(unwrapped, 'url', 'link', 'value'));
  if (!url) return null;
  return {
    url,
    type: unwrapScalar(pick(unwrapped, 'type')),
  };
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

  const workExperienceRaw = unwrapParsedArray<AnyRecord>(
    pick(raw, 'workExperience', 'work_experience', 'experience')
  );
  const workExperience = workExperienceRaw.map((exp) =>
    normalizeWorkExperienceItem(isRecord(exp) ? exp : {})
  );

  const educationRaw = unwrapParsedArray<AnyRecord>(pick(raw, 'education'));
  const education = educationRaw.map((edu) =>
    normalizeEducationItem(isRecord(edu) ? edu : {})
  );

  const skillsRaw = unwrapParsedArray<unknown>(pick(raw, 'skills'));
  const skills = skillsRaw
    .map((s) => normalizeSkillItem(s))
    .filter((s): s is { name: string } => s != null);

  const websites = unwrapParsedArray<unknown>(pick(raw, 'websites', 'website'))
    .map((w) => normalizeWebsiteItem(w))
    .filter((w): w is { url: string; type?: string } => w != null);

  const certifications = unwrapParsedArray<string | AnyRecord>(
    pick(raw, 'certifications', 'certification')
  );
  const languages = unwrapParsedArray<string | AnyRecord>(pick(raw, 'languages', 'language'));
  const projects = unwrapParsedArray<AnyRecord>(pick(raw, 'projects', 'project'));

  const summary =
    unwrapScalar(pick(raw, 'summary', 'objective')) ||
    (typeof pick(raw, 'summary', 'objective') === 'string'
      ? (pick(raw, 'summary', 'objective') as string)
      : '');

  const rawText =
    (typeof pick(raw, 'rawText', 'raw_text') === 'string'
      ? (pick(raw, 'rawText', 'raw_text') as string)
      : '') || '';

  const profession = unwrapScalar(pick(raw, 'profession', 'jobTitle', 'job_title'));

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
    profession,
    skills,
    workExperience,
    education,
    certifications,
    languages,
    projects,
    rawText,
  };
}
