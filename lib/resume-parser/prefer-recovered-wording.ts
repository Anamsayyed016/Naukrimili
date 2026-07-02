/**
 * Prefer verbatim text-recovery wording over AI/parser paraphrases on matched sections.
 * Structural fields are backfilled from recovered text when the parser left them empty.
 */

import type { ExtractedResumeData } from '@/lib/enhanced-resume-ai';
import { isCustomParserImport } from '@/lib/resume-parser/custom-parser-import';
import {
  mergeOrphanExperienceEntries,
  mergeOrphanEducationEntries,
  collectExperienceBodyFields,
  reconcileExperienceHeaderFields,
  finalizeExperienceListForBuilder,
  finalizeEducationListForBuilder,
  unionExperienceBodyFields,
} from '@/lib/resume-parser/import-sanitize';
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
  const rLines = r.split('\n').filter((l) => l.trim()).length;
  const aLines = a.split('\n').filter((l) => l.trim()).length;
  if (rLines > aLines) return true;
  if (r.length > a.length * 1.08) return true;
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
  if (shouldPreferRecoveredWording(recJoin, aiJoin) || recList.length > aiList.length) return recList;

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

function experienceStartDateKey(rec: Record<string, unknown>): string {
  const raw = String(rec.startDate || rec.start_date || '').trim();
  const m = raw.match(/(19|20)\d{2}/);
  return m ? m[0] : '';
}

function experienceLocationSlug(rec: Record<string, unknown>): string {
  return String(rec.location || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function preferNonemptyField(parserVal: unknown, recoveredVal: unknown): string {
  const p = String(parserVal ?? '').trim();
  if (p) return p;
  return String(recoveredVal ?? '').trim();
}

/** Deterministic match score: company (40) + designation (30) + start year (20) + location (10). */
export function experienceMatchScore(a: Record<string, unknown>, b: Record<string, unknown>): number {
  const ac = slugWords(a.company || a.organization);
  const bc = slugWords(b.company || b.organization);
  const ap = slugWords(a.position || a.job_title || a.title || a.role);
  const bp = slugWords(b.position || b.job_title || b.title || b.role);
  const sharesCompany = ac.length > 0 && bc.length > 0 && ac.some((w) => bc.includes(w));
  const sharesPosition = ap.length > 0 && bp.length > 0 && ap.some((w) => bp.includes(w));

  // Never match on designation alone.
  if (!sharesCompany && sharesPosition) return 0;

  let score = 0;
  if (sharesCompany) score += 40;
  if (sharesPosition) score += 30;
  if (
    experienceStartDateKey(a).length > 0 &&
    experienceStartDateKey(a) === experienceStartDateKey(b)
  ) {
    score += 20;
  }
  const al = experienceLocationSlug(a);
  const bl = experienceLocationSlug(b);
  if (al.length >= 3 && bl.length >= 3 && (al.includes(bl) || bl.includes(al))) {
    score += 10;
  }
  return score;
}

export function experienceSectionMatch(a: Record<string, unknown>, b: Record<string, unknown>): boolean {
  const score = experienceMatchScore(a, b);
  if (score < 40) return false;

  const ac = slugWords(a.company || a.organization);
  const bc = slugWords(b.company || b.organization);
  const ap = slugWords(a.position || a.job_title || a.title || a.role);
  const bp = slugWords(b.position || b.job_title || b.title || b.role);
  const aHasBoth = ac.length > 0 && ap.length > 0;
  const bHasBoth = bc.length > 0 && bp.length > 0;

  if (aHasBoth && bHasBoth) return score >= 70;
  return score >= 40;
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

function educationYearKey(rec: Record<string, unknown>): string {
  const raw = String(rec.endDate || rec.year || rec.end_date || '').trim();
  const m = raw.match(/(19|20)\d{2}/);
  return m ? m[0] : '';
}

export function educationMatchScore(a: Record<string, unknown>, b: Record<string, unknown>): number {
  const ai = educationInstitutionSlug(a);
  const bi = educationInstitutionSlug(b);
  const ad = educationDegreeSlug(a);
  const bd = educationDegreeSlug(b);
  const sharesInst = ai.length >= 4 && bi.length >= 4 && (ai.includes(bi) || bi.includes(ai));
  const sharesDegree = ad.length >= 3 && bd.length >= 3 && (ad.includes(bd) || bd.includes(ad));

  if (ai.length >= 4 && bi.length >= 4 && !sharesInst) return 0;

  let score = 0;
  if (sharesInst) score += 40;
  if (sharesDegree) score += 30;
  if (educationYearKey(a) && educationYearKey(a) === educationYearKey(b)) score += 20;
  return score;
}

export function educationSectionMatch(a: Record<string, unknown>, b: Record<string, unknown>): boolean {
  const score = educationMatchScore(a, b);
  const ai = educationInstitutionSlug(a);
  const bi = educationInstitutionSlug(b);
  const ad = educationDegreeSlug(a);
  const bd = educationDegreeSlug(b);
  const bothHaveInst = ai.length >= 4 && bi.length >= 4;
  const bothHaveDeg = ad.length >= 3 && bd.length >= 3;

  if (bothHaveInst && bothHaveDeg) return score >= 70;
  if (bothHaveInst) return score >= 40;
  if (bothHaveDeg) return score >= 30;
  return false;
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

function resolveExperienceContent(
  parser: Record<string, unknown>,
  recovered: Record<string, unknown>
): { description: string; achievements: string[] } {
  const parserBody = collectExperienceBodyFields(parser);
  const recoveredBody = collectExperienceBodyFields(recovered);
  return unionExperienceBodyFields(parserBody, recoveredBody);
}

function applyExperienceWording(parser: ExpLike, recovered: ExpLike): ExpLike {
  const parserLoc = String(parser.location || '').trim();
  const recoveredLoc = String(recovered.location || '').trim();
  const content = resolveExperienceContent(
    parser as unknown as Record<string, unknown>,
    recovered as unknown as Record<string, unknown>
  );
  return {
    ...parser,
    description: content.description,
    achievements: content.achievements,
    location: parserLoc || recoveredLoc || parser.location,
  };
}

function applyExperienceStructuralMerge(
  parser: Record<string, unknown>,
  recovered: Record<string, unknown>
): Record<string, unknown> {
  const wording = applyExperienceWording(
    parser as unknown as ExpLike,
    recovered as unknown as ExpLike
  );
  const position = preferNonemptyField(
    parser.position || parser.title || parser.role || parser.job_title,
    recovered.position
  );
  const company = preferNonemptyField(
    parser.company ||
      parser.Company ||
      parser.organization ||
      parser.Organization ||
      parser.employer,
    recovered.company || (recovered as { organization?: string }).organization
  );
  const startDate = preferNonemptyField(parser.startDate || parser.start_date, recovered.startDate);
  const endDate = preferNonemptyField(parser.endDate || parser.end_date, recovered.endDate);
  return reconcileExperienceHeaderFields({
    ...parser,
    company,
    organization: company,
    position,
    title: position,
    job_title: position,
    location: preferNonemptyField(parser.location, wording.location || recovered.location),
    startDate,
    start_date: startDate,
    endDate,
    end_date: endDate,
    current:
      parser.current === true ||
      recovered.current === true ||
      (!endDate && (parser.current || recovered.current)),
    description: wording.description,
    achievements: wording.achievements,
  });
}

function applyEducationStructuralMerge(
  parser: Record<string, unknown>,
  recovered: Record<string, unknown>
): Record<string, unknown> {
  const institution = preferNonemptyField(
    parser.institution || parser.school || parser.Institution,
    recovered.institution
  );
  const degree = preferNonemptyField(parser.degree || parser.Degree, recovered.degree);
  const field = preferNonemptyField(parser.field || parser.Field, recovered.field);
  const recoveredYear = String(
    (recovered as { endDate?: string }).endDate ||
      (recovered as { year?: string }).year ||
      (recovered as { Year?: string }).Year ||
      ''
  ).trim();
  const parserYear = String(
    parser.endDate || parser.year || parser.end_date || parser.Year || ''
  ).trim();
  const endDate = preferNonemptyField(parserYear, recoveredYear);
  const startDate = preferNonemptyField(parser.startDate || parser.start_date, recovered.startDate);
  const parserDesc = String((parser as { description?: string }).description ?? '').trim();
  const recoveredDesc = String((recovered as { description?: string }).description ?? '').trim();
  const description =
    !parserDesc && recoveredDesc
      ? recoveredDesc
      : preferRecoveredWording(recoveredDesc, parserDesc);
  return {
    ...parser,
    institution,
    school: institution,
    Institution: institution,
    degree,
    Degree: degree,
    field,
    Field: field,
    year: endDate || parser.year || parser.Year,
    endDate,
    end_date: endDate,
    startDate,
    gpa: preferNonemptyField(parser.gpa || parser.GPA, recovered.gpa),
    description,
  };
}

/** Score parser rows missing company against recovered rows (title + year proximity). */
function experienceHeaderBackfillScore(
  parser: Record<string, unknown>,
  recovered: Record<string, unknown>
): number {
  const parserCompany = String(
    parser.company || parser.Company || parser.organization || parser.Organization || ''
  ).trim();
  if (parserCompany) return 0;

  const recCompany = String(
    recovered.company || recovered.Company || recovered.organization || recovered.Organization || ''
  ).trim();
  if (!recCompany) return 0;

  const ap = slugWords(parser.position || parser.title || parser.job_title);
  const bp = slugWords(recovered.position || recovered.title || recovered.job_title);
  const sharesPosition = ap.length > 0 && bp.length > 0 && ap.some((w) => bp.includes(w));
  if (!sharesPosition) return 0;

  let score = 35;
  if (
    experienceStartDateKey(parser).length > 0 &&
    experienceStartDateKey(parser) === experienceStartDateKey(recovered)
  ) {
    score += 25;
  }
  const al = experienceLocationSlug(parser);
  const bl = experienceLocationSlug(recovered);
  if (al.length >= 3 && bl.length >= 3 && (al.includes(bl) || bl.includes(al))) {
    score += 15;
  }
  return score;
}

/** Union recovered experience bodies onto every matched row (never drop lines). */
function fillMissingExperienceFromRecovered(
  parserList: Record<string, unknown>[],
  recoveredList: Record<string, unknown>[],
  usedRec: Set<number> = new Set<number>()
): Record<string, unknown>[] {
  return parserList.map((item) => {
    const reconciled = reconcileExperienceHeaderFields(item);

    let idx = findBestRecoveredMatchIndex(
      reconciled,
      recoveredList,
      usedRec,
      experienceMatchScore,
      experienceSectionMatch
    );

    if (idx < 0) {
      let bestIdx = -1;
      let bestScore = 0;
      for (let i = 0; i < recoveredList.length; i++) {
        if (usedRec.has(i)) continue;
        const score = experienceHeaderBackfillScore(reconciled, recoveredList[i]);
        if (score >= 35 && score > bestScore) {
          bestScore = score;
          bestIdx = i;
        }
      }
      idx = bestIdx;
    }

    if (idx >= 0) {
      usedRec.add(idx);
      return applyExperienceStructuralMerge(reconciled, recoveredList[idx]);
    }
    return reconciled;
  });
}

function fillMissingEducationFromRecovered(
  parserList: Record<string, unknown>[],
  recoveredList: Record<string, unknown>[]
): Record<string, unknown>[] {
  return parserList.map((item) => {
    const hasInst = !!String(item.institution || item.school || item.Institution || '').trim();
    const hasDeg = !!String(item.degree || item.Degree || '').trim();
    const hasYear = !!String(
      item.year || item.endDate || item.end_date || item.Year || ''
    ).trim();
    const hasField = !!String(item.field || item.Field || '').trim();
    if (hasInst && hasDeg && hasYear && hasField) return item;

    const idx = findBestRecoveredMatchIndex(
      item,
      recoveredList,
      new Set<number>(),
      educationMatchScore,
      (a, b) => educationMatchScore(a, b) >= 30
    );
    if (idx < 0) return item;
    return applyEducationStructuralMerge(item, recoveredList[idx]);
  });
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

/** Pick the highest-scoring unused recovered row — never match by array index alone. */
export function findBestRecoveredMatchIndex<T extends Record<string, unknown>>(
  item: T,
  recoveredList: T[],
  usedRec: Set<number>,
  scoreFn: (a: T, b: T) => number,
  matchFn: (a: T, b: T) => boolean
): number {
  let bestIdx = -1;
  let bestScore = 0;
  for (let i = 0; i < recoveredList.length; i++) {
    if (usedRec.has(i)) continue;
    const candidate = recoveredList[i];
    if (!matchFn(item, candidate)) continue;
    const score = scoreFn(item, candidate);
    if (score > bestScore) {
      bestScore = score;
      bestIdx = i;
    }
  }
  return bestIdx;
}

function mergeListWithRecoveredWording<T extends Record<string, unknown>>(
  parserList: T[],
  recoveredList: T[],
  matchFn: (a: T, b: T) => boolean,
  scoreFn: (a: T, b: T) => number,
  applyMerge: (parser: T, recovered: T) => T,
  appendUnmatched = true,
  usedRec: Set<number> = new Set<number>()
): T[] {
  if (!recoveredList.length) return parserList;
  if (!parserList.length) return recoveredList;

  const merged = parserList.map((item) => {
    const idx = findBestRecoveredMatchIndex(item, recoveredList, usedRec, scoreFn, matchFn);
    if (idx < 0) return item;
    usedRec.add(idx);
    return applyMerge(item, recoveredList[idx]);
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

  const merged = {
    ...parser,
    experience: mergeListWithRecoveredWording(
      parserExp as unknown as Record<string, unknown>[],
      recExp as unknown as Record<string, unknown>[],
      experienceSectionMatch,
      experienceMatchScore,
      (p, r) => applyExperienceStructuralMerge(p, r) as unknown as Record<string, unknown>
    ) as unknown as ExpLike[],
    education: mergeListWithRecoveredWording(
      parserEdu as unknown as Record<string, unknown>[],
      recEdu as unknown as Record<string, unknown>[],
      educationSectionMatch,
      educationMatchScore,
      (p, r) => applyEducationStructuralMerge(p, r) as unknown as Record<string, unknown>
    ) as unknown as EduLike[],
    projects: mergeListWithRecoveredWording(
      parserProj as unknown as Record<string, unknown>[],
      recProj as unknown as Record<string, unknown>[],
      projectSectionMatch,
      () => 50,
      (p, r) => applyProjectWording(p as ProjectLike, r as ProjectLike) as unknown as Record<string, unknown>
    ) as unknown as ProjectLike[],
    certifications: mergeListWithRecoveredWording(
      parserCerts as unknown as Record<string, unknown>[],
      recCerts as unknown as Record<string, unknown>[],
      certificationSectionMatch,
      () => 50,
      (p, r) => applyCertWording(p as CertLike, r as CertLike) as unknown as Record<string, unknown>
    ) as unknown as CertLike[],
    achievements: preferRecoveredStringList(recovered.achievements, parser.achievements),
    rawText: (recovered.rawText || '').length > (parser.rawText || '').length
      ? recovered.rawText
      : parser.rawText,
  };
  return {
    ...merged,
    experience: finalizeExperienceListForBuilder(
      (merged.experience || []) as unknown as Record<string, unknown>[]
    ) as unknown as ExpLike[],
    education: finalizeEducationListForBuilder(
      (merged.education || []) as unknown as Record<string, unknown>[]
    ) as unknown as EduLike[],
  };
}

/** Apply recovered wording onto an upload profile object (ultimate-upload / import-transformer). */
export function applyRecoveredWordingToProfile(
  profile: Record<string, unknown>,
  recovered: ExtractedResumeData
): Record<string, unknown> {
  if (isCustomParserImport(profile)) {
    return profile;
  }

  const out = { ...profile };

  const parserExp = (Array.isArray(out.experience) ? out.experience : []) as Record<string, unknown>[];
  const recExp = (recovered.experience || []) as unknown as Record<string, unknown>[];
  const usedRec = new Set<number>();
  out.experience = mergeOrphanExperienceEntries(
    fillMissingExperienceFromRecovered(
      mergeListWithRecoveredWording(
        parserExp,
        recExp,
        experienceSectionMatch,
        experienceMatchScore,
        (p, r) => applyExperienceStructuralMerge(p, r),
        false,
        usedRec
      ) as Record<string, unknown>[],
      recExp,
      usedRec
    )
  );

  const parserEdu = mergeOrphanEducationEntries(
    (Array.isArray(out.education) ? out.education : []) as Record<string, unknown>[]
  );
  const recEdu = (recovered.education || []) as unknown as Record<string, unknown>[];
  out.education = mergeOrphanEducationEntries(
    fillMissingEducationFromRecovered(
      mergeListWithRecoveredWording(
        parserEdu,
        recEdu,
        educationSectionMatch,
        educationMatchScore,
        (p, r) => applyEducationStructuralMerge(p, r),
        false
      ) as Record<string, unknown>[],
      recEdu
    )
  );

  const parserProj = (Array.isArray(out.projects) ? out.projects : []) as Record<string, unknown>[];
  const recProj = (recovered.projects || []) as unknown as Record<string, unknown>[];
  out.projects = mergeListWithRecoveredWording(
    parserProj,
    recProj,
    projectSectionMatch,
    () => 50,
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
    () => 50,
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

  out.experience = finalizeExperienceListForBuilder(
    (out.experience as Record<string, unknown>[]) || []
  );
  out.education = finalizeEducationListForBuilder(
    (out.education as Record<string, unknown>[]) || []
  );

  return out;
}
