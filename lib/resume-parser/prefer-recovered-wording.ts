/**
 * Prefer verbatim text-recovery wording over AI/parser paraphrases on matched sections.
 * Structural fields (company, titles, dates, institutions) are never changed here.
 */

import type { ExtractedResumeData } from '@/lib/enhanced-resume-ai';
import { isConfidentValue } from '@/lib/resume-parser/normalize-extracted';

const MIN_WORDING_LENGTH = 3;

export function wordingQuality(text: string): number {
  const t = text.trim();
  if (!t) return 0;
  const lines = t.split('\n').filter((l) => l.trim().length > 0);
  return t.length + Math.max(0, lines.length - 1) * 15;
}

export function isMeaningfulRecoveredWording(text: unknown): boolean {
  if (text == null) return false;
  const s = String(text).trim();
  if (s.length < MIN_WORDING_LENGTH) return false;
  return isConfidentValue(s);
}

/** True when recovered text should replace AI/parser text for the same section. */
export function shouldPreferRecoveredWording(recovered: unknown, ai: unknown): boolean {
  const r = String(recovered ?? '').trim();
  if (!isMeaningfulRecoveredWording(r)) return false;
  const a = String(ai ?? '').trim();
  if (!a) return true;
  if (r === a) return true;
  return wordingQuality(r) >= wordingQuality(a) * 0.85;
}

export function preferRecoveredWording(recovered: unknown, ai: unknown): string {
  const a = String(ai ?? '').trim();
  const r = String(recovered ?? '').trim();
  if (shouldPreferRecoveredWording(r, a)) return r;
  return a;
}

function normalizeStringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (typeof item === 'string') return item.trim();
      if (item && typeof item === 'object') {
        const rec = item as Record<string, unknown>;
        return String(rec.title ?? rec.description ?? rec.text ?? '').trim();
      }
      return '';
    })
    .filter((s) => s.length >= MIN_WORDING_LENGTH);
}

function bulletKeysMatch(a: string, b: string): boolean {
  const na = a.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim().slice(0, 48);
  const nb = b.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim().slice(0, 48);
  if (!na || !nb) return false;
  if (na === nb) return true;
  const wa = na.split(/\s+/).filter((w) => w.length >= 3).slice(0, 4);
  const wb = nb.split(/\s+/).filter((w) => w.length >= 3).slice(0, 4);
  if (!wa.length || !wb.length) return false;
  const overlap = wa.filter((w) => wb.includes(w)).length;
  return overlap >= Math.min(wa.length, wb.length, 2);
}

export function preferRecoveredStringList(recovered: unknown, ai: unknown): string[] {
  const aiList = normalizeStringList(ai);
  const recList = normalizeStringList(recovered);
  if (!recList.length) return aiList;
  if (!aiList.length) return recList;

  const recJoin = recList.join('\n');
  const aiJoin = aiList.join('\n');
  if (shouldPreferRecoveredWording(recJoin, aiJoin)) return recList;

  const usedRec = new Set<number>();
  const merged = aiList.map((aiItem) => {
    const idx = recList.findIndex((r, i) => !usedRec.has(i) && bulletKeysMatch(aiItem, r));
    if (idx < 0) return aiItem;
    usedRec.add(idx);
    return preferRecoveredWording(recList[idx], aiItem);
  });
  for (let i = 0; i < recList.length; i++) {
    if (usedRec.has(i)) continue;
    if (isMeaningfulRecoveredWording(recList[i])) merged.push(recList[i]);
  }
  return merged;
}

function slugWords(s: unknown): string[] {
  return String(s || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter((w) => w.length >= 3);
}

export function experienceSectionMatch(a: Record<string, unknown>, b: Record<string, unknown>): boolean {
  const ac = slugWords(a.company || a.organization);
  const bc = slugWords(b.company || b.organization);
  const ap = slugWords(a.position || a.job_title || a.title || a.role);
  const bp = slugWords(b.position || b.job_title || b.title || b.role);
  const sharesCompany = ac.length > 0 && bc.length > 0 && ac.some((w) => bc.includes(w));
  const sharesPosition = ap.length > 0 && bp.length > 0 && ap.some((w) => bp.includes(w));
  return sharesCompany || sharesPosition;
}

function educationInstitutionSlug(rec: Record<string, unknown>): string {
  return String(rec.institution || rec.school || rec.Institution || rec.School || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function educationDegreeSlug(rec: Record<string, unknown>): string {
  return String(rec.degree || rec.Degree || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export function educationSectionMatch(a: Record<string, unknown>, b: Record<string, unknown>): boolean {
  const ai = educationInstitutionSlug(a);
  const bi = educationInstitutionSlug(b);
  const ad = educationDegreeSlug(a);
  const bd = educationDegreeSlug(b);
  const sharesInst = ai.length >= 4 && bi.length >= 4 && (ai.includes(bi) || bi.includes(ai));
  const sharesDegree = ad.length >= 3 && bd.length >= 3 && (ad.includes(bd) || bd.includes(ad));
  return sharesInst || sharesDegree;
}

export function projectSectionMatch(a: Record<string, unknown>, b: Record<string, unknown>): boolean {
  const an = String(a.name || a.title || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
  const bn = String(b.name || b.title || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
  return !!(an && bn && (an === bn || an.includes(bn) || bn.includes(an)));
}

export function certificationSectionMatch(a: Record<string, unknown>, b: Record<string, unknown>): boolean {
  const an = String(a.name || a.title || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
  const bn = String(b.name || b.title || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
  if (!an || !bn) return false;
  if (an === bn) return true;
  const aw = an.split(/\s+/).filter((w) => w.length >= 4);
  const bw = bn.split(/\s+/).filter((w) => w.length >= 4);
  return aw.length > 0 && bw.length > 0 && aw.some((w) => bw.includes(w));
}

type ExpLike = ExtractedResumeData['experience'][number];
type EduLike = ExtractedResumeData['education'][number];
type ProjectLike = NonNullable<ExtractedResumeData['projects']>[number];
type CertLike = NonNullable<ExtractedResumeData['certifications']>[number];

function applyExperienceWording(parser: ExpLike, recovered: ExpLike): ExpLike {
  return {
    ...parser,
    description: preferRecoveredWording(recovered.description, parser.description),
    achievements: preferRecoveredStringList(recovered.achievements, parser.achievements),
  };
}

function applyEducationWording(parser: EduLike, recovered: EduLike): EduLike {
  return {
    ...parser,
    description: preferRecoveredWording(recovered.description, parser.description),
  };
}

function applyProjectWording(parser: ProjectLike, recovered: ProjectLike): ProjectLike {
  return {
    ...parser,
    description: preferRecoveredWording(recovered.description, parser.description),
  };
}

function applyCertWording(parser: CertLike, recovered: CertLike): CertLike {
  const recDesc = (recovered as { description?: string }).description;
  const parserDesc = (parser as { description?: string }).description;
  if (recDesc == null && parserDesc == null) return parser;
  return {
    ...parser,
    description: preferRecoveredWording(recDesc, parserDesc),
  } as CertLike;
}

function mergeListWithRecoveredWording<T extends Record<string, unknown>>(
  parserList: T[],
  recoveredList: T[],
  matchFn: (a: T, b: T) => boolean,
  applyWording: (parser: T, recovered: T) => T,
  appendUnmatched = true
): T[] {
  if (!recoveredList.length) return parserList;
  if (!parserList.length) return recoveredList;

  const usedRec = new Set<number>();
  const merged = parserList.map((item) => {
    const idx = recoveredList.findIndex((r, i) => !usedRec.has(i) && matchFn(item, r));
    if (idx < 0) return item;
    usedRec.add(idx);
    return applyWording(item, recoveredList[idx]);
  });

  if (appendUnmatched) {
    for (let i = 0; i < recoveredList.length; i++) {
      if (usedRec.has(i)) continue;
      merged.push(recoveredList[i]);
    }
  }
  return merged;
}

/** Merge parser structure with text-recovery wording (upload + document-parser paths). */
export function mergeParserWithRecoveredWording(
  parser: ExtractedResumeData,
  recovered: ExtractedResumeData
): ExtractedResumeData {
  const parserExp = (parser.experience || []).map((e) => ({ ...e }));
  const recExp = recovered.experience || [];
  const parserEdu = (parser.education || []).map((e) => ({ ...e }));
  const recEdu = recovered.education || [];
  const parserProj = (parser.projects || []).map((p) => ({ ...p }));
  const recProj = recovered.projects || [];
  const parserCerts = (parser.certifications || []).map((c) => ({ ...c }));
  const recCerts = recovered.certifications || [];

  return {
    ...parser,
    experience: mergeListWithRecoveredWording(
      parserExp as unknown as Record<string, unknown>[],
      recExp as unknown as Record<string, unknown>[],
      experienceSectionMatch,
      (p, r) => applyExperienceWording(p as ExpLike, r as ExpLike) as unknown as Record<string, unknown>
    ) as unknown as ExpLike[],
    education: mergeListWithRecoveredWording(
      parserEdu as unknown as Record<string, unknown>[],
      recEdu as unknown as Record<string, unknown>[],
      educationSectionMatch,
      (p, r) => applyEducationWording(p as EduLike, r as EduLike) as unknown as Record<string, unknown>
    ) as unknown as EduLike[],
    projects: mergeListWithRecoveredWording(
      parserProj as unknown as Record<string, unknown>[],
      recProj as unknown as Record<string, unknown>[],
      projectSectionMatch,
      (p, r) => applyProjectWording(p as ProjectLike, r as ProjectLike) as unknown as Record<string, unknown>
    ) as unknown as ProjectLike[],
    certifications: mergeListWithRecoveredWording(
      parserCerts as unknown as Record<string, unknown>[],
      recCerts as unknown as Record<string, unknown>[],
      certificationSectionMatch,
      (p, r) => applyCertWording(p as CertLike, r as CertLike) as unknown as Record<string, unknown>
    ) as unknown as CertLike[],
    achievements: preferRecoveredStringList(recovered.achievements, parser.achievements),
    rawText: (recovered.rawText || '').length > (parser.rawText || '').length
      ? recovered.rawText
      : parser.rawText,
  };
}

/** Apply recovered wording onto an upload profile object (ultimate-upload / import-transformer). */
export function applyRecoveredWordingToProfile(
  profile: Record<string, unknown>,
  recovered: ExtractedResumeData
): Record<string, unknown> {
  const out = { ...profile };

  const parserExp = (Array.isArray(out.experience) ? out.experience : []) as Record<string, unknown>[];
  const recExp = (recovered.experience || []) as unknown as Record<string, unknown>[];
  out.experience = mergeListWithRecoveredWording(
    parserExp,
    recExp,
    experienceSectionMatch,
    (p, r) => {
      const merged = applyExperienceWording(p as unknown as ExpLike, r as unknown as ExpLike);
      return {
        ...p,
        description: merged.description,
        achievements: merged.achievements,
      };
    },
    false
  );

  const parserEdu = (Array.isArray(out.education) ? out.education : []) as Record<string, unknown>[];
  const recEdu = (recovered.education || []) as unknown as Record<string, unknown>[];
  out.education = mergeListWithRecoveredWording(
    parserEdu,
    recEdu,
    educationSectionMatch,
    (p, r) => ({
      ...p,
      description: preferRecoveredWording(
        (r as { description?: string }).description,
        (p as { description?: string }).description
      ),
    }),
    false
  );

  const parserProj = (Array.isArray(out.projects) ? out.projects : []) as Record<string, unknown>[];
  const recProj = (recovered.projects || []) as unknown as Record<string, unknown>[];
  out.projects = mergeListWithRecoveredWording(
    parserProj,
    recProj,
    projectSectionMatch,
    (p, r) => {
      const desc = preferRecoveredWording(
        (r as { description?: string }).description,
        (p as { description?: string; summary?: string }).description ||
          (p as { summary?: string }).summary
      );
      return { ...p, description: desc, summary: desc };
    },
    false
  );

  const parserCerts = (Array.isArray(out.certifications) ? out.certifications : []) as Record<
    string,
    unknown
  >[];
  const recCerts = (recovered.certifications || []) as unknown as Record<string, unknown>[];
  out.certifications = mergeListWithRecoveredWording(
    parserCerts,
    recCerts,
    certificationSectionMatch,
    (p, r) => {
      const recDesc = (r as { description?: string }).description;
      const parserDesc = (p as { description?: string }).description;
      if (recDesc == null && parserDesc == null) return p;
      return { ...p, description: preferRecoveredWording(recDesc, parserDesc) };
    },
    false
  );

  out.achievements = preferRecoveredStringList(
    recovered.achievements,
    out.achievements
  );

  return out;
}
