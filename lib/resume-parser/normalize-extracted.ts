/**
 * Resume extraction normalizer — dedupe, dates, confident-only fields.
 * Used by Affinda adapter, upload API, and import transformer.
 */

import type { ExtractedResumeData } from '@/lib/enhanced-resume-ai';

const PLACEHOLDER_PATTERNS = [
  /^n\/a$/i,
  /^not\s+(found|available|provided)/i,
  /^unknown$/i,
  /^tbd$/i,
  /^xxx+$/i,
  /^\[.*\]$/,
  /pdf parsing failed/i,
  /please complete your profile manually/i,
  /^resume:\s*.+\.(pdf|docx?|txt)\b/i,
  /not extracted/i,
];

export function isConfidentValue(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const trimmed = value.trim();
  if (trimmed.length < 2) return false;
  return !PLACEHOLDER_PATTERNS.some((p) => p.test(trimmed));
}

export function cleanString(value: unknown): string {
  if (value == null) return '';
  const s = String(value).replace(/\s+/g, ' ').trim();
  return isConfidentValue(s) ? s : '';
}

/** Normalize dates to YYYY-MM or YYYY when possible */
export function normalizeDate(value: unknown): string {
  const raw = cleanString(value);
  if (!raw) return '';

  const lower = raw.toLowerCase();
  if (['present', 'current', 'now', 'ongoing'].includes(lower)) {
    return 'Present';
  }

  const iso = raw.match(/^(\d{4})-(\d{2})(?:-\d{2})?$/);
  if (iso) return `${iso[1]}-${iso[2]}`;

  const monthYear = raw.match(/([A-Za-z]{3,9})\s+(\d{4})/);
  if (monthYear) {
    const months: Record<string, string> = {
      jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
      jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12',
    };
    const key = monthYear[1].slice(0, 3).toLowerCase();
    if (months[key]) return `${monthYear[2]}-${months[key]}`;
  }

  const yearOnly = raw.match(/\b(19|20)\d{2}\b/);
  if (yearOnly) return yearOnly[0];

  return raw;
}

export function dedupeStrings(items: string[], caseInsensitive = true): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of items) {
    const cleaned = cleanString(item);
    if (!cleaned) continue;
    const key = caseInsensitive ? cleaned.toLowerCase() : cleaned;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(cleaned);
  }
  return out;
}

function splitBullets(text: string): string[] {
  return text
    .split(/\n|•|·|▪|‣|(?:\s*[-–—]\s+)/)
    .map((s) => cleanString(s))
    .filter((s) => s.length > 8);
}

function experienceKey(exp: ExtractedResumeData['experience'][0]): string {
  return [
    (exp.company || '').toLowerCase(),
    (exp.position || '').toLowerCase(),
    normalizeDate(exp.startDate),
  ].join('|');
}

function educationKey(edu: ExtractedResumeData['education'][0]): string {
  return [
    (edu.institution || '').toLowerCase(),
    (edu.degree || '').toLowerCase(),
    normalizeDate(edu.endDate),
  ].join('|');
}

export function normalizeExtractedResumeData(data: ExtractedResumeData): ExtractedResumeData {
  const skills = dedupeStrings(data.skills || []);

  const experienceMap = new Map<string, ExtractedResumeData['experience'][0]>();
  for (const exp of data.experience || []) {
    const company = cleanString(exp.company);
    const position = cleanString(exp.position);
    if (!company && !position) continue;

    const startDate = normalizeDate(exp.startDate);
    const endDate = normalizeDate(exp.endDate);
    const current =
      exp.current ||
      !endDate ||
      endDate.toLowerCase() === 'present';

    let achievements = Array.isArray(exp.achievements)
      ? exp.achievements.map((a) => cleanString(a)).filter(Boolean)
      : [];
    const desc = cleanString(exp.description);
    if (desc) {
      const bullets = splitBullets(desc);
      if (bullets.length > 1) {
        achievements = dedupeStrings([...achievements, ...bullets]);
      }
    }

    const normalized = {
      company,
      position,
      location: cleanString(exp.location),
      startDate,
      endDate: current ? 'Present' : endDate,
      current,
      description: desc,
      achievements: dedupeStrings(achievements),
    };

    const key = experienceKey(normalized);
    if (!experienceMap.has(key)) {
      experienceMap.set(key, normalized);
    }
  }

  const educationMap = new Map<string, ExtractedResumeData['education'][0]>();
  for (const edu of data.education || []) {
    const institution = cleanString(edu.institution);
    const degree = cleanString(edu.degree);
    if (!institution && !degree) continue;

    const normalized = {
      institution,
      degree,
      field: cleanString(edu.field),
      startDate: normalizeDate(edu.startDate),
      endDate: normalizeDate(edu.endDate),
      gpa: cleanString(edu.gpa),
      description: cleanString(edu.description),
    };
    const key = educationKey(normalized);
    if (!educationMap.has(key)) {
      educationMap.set(key, normalized);
    }
  }

  const certifications = (data.certifications || [])
    .map((c) => ({
      name: cleanString(c.name),
      issuer: cleanString(c.issuer),
      date: normalizeDate(c.date),
      url: cleanString(c.url),
    }))
    .filter((c) => c.name);

  const certNames = new Set<string>();
  const uniqueCerts: typeof certifications = [];
  for (const c of certifications) {
    const k = c.name.toLowerCase();
    if (certNames.has(k)) continue;
    certNames.add(k);
    uniqueCerts.push(c);
  }

  const summary = cleanString(data.summary);

  return {
    ...data,
    fullName: cleanString(data.fullName),
    email: cleanString(data.email),
    phone: cleanString(data.phone),
    location: cleanString(data.location),
    linkedin: cleanString(data.linkedin),
    portfolio: cleanString(data.portfolio),
    summary,
    skills,
    experience: Array.from(experienceMap.values()),
    education: Array.from(educationMap.values()),
    projects: (data.projects || []).filter((p) => cleanString(p.name)),
    certifications: uniqueCerts,
    languages: dedupeStrings(data.languages || []),
    confidence: data.confidence ?? 0,
    rawText: data.rawText || '',
  };
}

/** Normalize upload API profile object (post-mapping) */
export function normalizeUploadProfile(profile: Record<string, any>): Record<string, any> {
  const skills = dedupeStrings(Array.isArray(profile.skills) ? profile.skills : []);

  const experience = (Array.isArray(profile.experience) ? profile.experience : [])
    .map((exp: any) => ({
      ...exp,
      company: cleanString(exp.company || exp.Company || exp.organization),
      position: cleanString(exp.position || exp.Position || exp.job_title || exp.title || exp.role),
      startDate: normalizeDate(exp.startDate || exp.start_date),
      endDate: normalizeDate(exp.endDate || exp.end_date),
      description: cleanString(exp.description || exp.Description),
    }))
    .filter((exp: any) => exp.company || exp.position);

  const seenExp = new Set<string>();
  const uniqueExp = experience.filter((exp: any) => {
    const key = `${exp.company}|${exp.position}|${exp.startDate}`.toLowerCase();
    if (seenExp.has(key)) return false;
    seenExp.add(key);
    return true;
  });

  const education = (Array.isArray(profile.education) ? profile.education : [])
    .map((edu: any) => ({
      ...edu,
      institution: cleanString(edu.institution || edu.Institution || edu.school),
      degree: cleanString(edu.degree || edu.Degree),
      field: cleanString(edu.field || edu.Field),
      endDate: normalizeDate(edu.endDate || edu.year || edu.end_date),
    }))
    .filter((edu: any) => {
      const inst = edu.institution || '';
      const deg = edu.degree || '';
      return (inst || deg) && !/\.(pdf|docx?)\b/i.test(deg) && !/parsing failed/i.test(deg);
    });

  return {
    ...profile,
    fullName: cleanString(profile.fullName || profile.name),
    name: cleanString(profile.fullName || profile.name),
    email: cleanString(profile.email),
    phone: cleanString(profile.phone),
    location: cleanString(profile.location || profile.address),
    linkedin: cleanString(profile.linkedin),
    portfolio: cleanString(profile.portfolio || profile.website),
    summary: cleanString(profile.summary),
    skills,
    experience: uniqueExp,
    education,
    languages: Array.isArray(profile.languages)
      ? profile.languages
          .map((l: any) => (typeof l === 'string' ? { name: cleanString(l), proficiency: 'Fluent' } : { ...l, name: cleanString(l.name) }))
          .filter((l: any) => l.name)
      : [],
  };
}
