/**
 * Builder editor hydration — single source of truth priority.
 * Parser/import → session → localStorage draft. Never load stale draft over fresh import.
 */

import {
  coalesceBuilderImportPayload,
  hasImportableContent,
  backfillImportedExperienceForDisplay,
} from './import-transformer';
import {
  buildGallerySampleFormData,
  isGalleryEmptyFormData,
} from './gallery-demo';
import { syncExperienceEntryAliases } from './experience-entry-sync';
import {
  isValidatedContactName,
  sanitizePersonName,
  repairStuckContactNameParts,
} from '@/lib/resume-parser/import-sanitize';

const MAX_SESSION_EXPERIENCE_DESC = 6000;
const MAX_SESSION_ACHIEVEMENTS = 24;
const MAX_SESSION_RAW_TEXT = 120_000;

export const RESUME_IMPORT_STORAGE_KEY = 'resume-import-data';
export const RESUME_IMPORT_META_KEY = 'resume-import-meta';

export interface ResumeImportMeta {
  importId: string;
  importedAt: number;
  resumeId?: string | null;
  source: 'upload' | 'api' | 'unknown';
}

export type EditorHydrationSource = 'import' | 'payment' | 'local-draft' | 'empty';

function draftStorageKey(templateId: string): string {
  return `resume-${templateId}`;
}

export function readPendingImportRaw(): Record<string, unknown> | null {
  if (typeof window === 'undefined') return null;
  const raw = sessionStorage.getItem(RESUME_IMPORT_STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}

export function readImportMeta(): ResumeImportMeta | null {
  if (typeof window === 'undefined') return null;
  const raw = sessionStorage.getItem(RESUME_IMPORT_META_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as ResumeImportMeta;
  } catch {
    return null;
  }
}

/** Shrink oversized import payloads so sessionStorage writes succeed in the browser. */
export function prepareBuilderSessionPayload(
  payload: Record<string, unknown>
): Record<string, unknown> {
  const backfilled = backfillImportedExperienceForDisplay(payload);
  const out: Record<string, unknown> = {
    ...ensureBuilderContactFields(backfilled),
    _builderCoalesced: true,
  };

  if (out.customParserUsed !== true) {
    const provider = String(out._aiProvider || out.aiProvider || '')
      .trim()
      .toLowerCase();
    if (provider === 'custom-parser' || provider === 'custom' || out.selectedParser === 'custom') {
      out.customParserUsed = true;
    }
  }

  if (Array.isArray(out.experience)) {
    out.experience = (out.experience as Record<string, unknown>[]).map((exp) => {
      if (!exp || typeof exp !== 'object') return exp;
      const row = { ...exp };
      const desc = String(row.description ?? row.Description ?? '');
      if (desc.length > MAX_SESSION_EXPERIENCE_DESC) {
        const trimmed = desc.slice(0, MAX_SESSION_EXPERIENCE_DESC);
        row.description = trimmed;
        row.Description = trimmed;
      }
      for (const key of ['achievements', 'bullets', 'bulletPoints', 'Achievements'] as const) {
        if (Array.isArray(row[key]) && (row[key] as unknown[]).length > 12) {
          row[key] = (row[key] as unknown[]).slice(0, 12);
        }
      }
      return row;
    });
    out['Work Experience'] = out.experience;
    out.Experience = out.experience;
  }

  if (Array.isArray(out.achievements) && out.achievements.length > MAX_SESSION_ACHIEVEMENTS) {
    out.achievements = out.achievements.slice(0, MAX_SESSION_ACHIEVEMENTS);
    out.Achievements = out.achievements;
  }

  if (typeof out.rawText === 'string' && out.rawText.length > MAX_SESSION_RAW_TEXT) {
    out.rawText = out.rawText.slice(0, MAX_SESSION_RAW_TEXT);
  }

  return out;
}

function tryWriteSessionJson(key: string, data: Record<string, unknown>): boolean {
  try {
    sessionStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch (error) {
    const isQuota =
      (error instanceof DOMException &&
        (error.name === 'QuotaExceededError' || error.code === 22)) ||
      (error instanceof Error && /quota/i.test(error.message));
    if (!isQuota) return false;

    const { rawText: _rawText, ...withoutRawText } = data;
    try {
      sessionStorage.setItem(key, JSON.stringify(withoutRawText));
      return true;
    } catch {
      return false;
    }
  }
}

export function writeImportSession(
  payload: Record<string, unknown>,
  meta?: Partial<ResumeImportMeta>
): boolean {
  if (typeof window === 'undefined') return false;
  const importId =
    meta?.importId ||
    (typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `import-${Date.now()}`);
  const importedAt = meta?.importedAt ?? Date.now();
  const enriched = prepareBuilderSessionPayload({
    ...payload,
    _imported: true,
    _importedAt: importedAt,
    _importSessionId: importId,
  });

  if (!tryWriteSessionJson(RESUME_IMPORT_STORAGE_KEY, enriched)) {
    return false;
  }

  try {
    const metaPayload: ResumeImportMeta = {
      importId,
      importedAt,
      resumeId: meta?.resumeId ?? null,
      source: meta?.source ?? 'unknown',
    };
    sessionStorage.setItem(RESUME_IMPORT_META_KEY, JSON.stringify(metaPayload));
    return true;
  } catch {
    return false;
  }
}

export function hasPendingImportSession(): boolean {
  return readPendingImportRaw() != null;
}

export function shouldForceImportHydration(options: {
  shouldPrefill: boolean;
  sourceImport: boolean;
}): boolean {
  if (options.shouldPrefill || options.sourceImport) return true;
  return hasPendingImportSession();
}

export function isImportFresherThanDraft(
  draft: Record<string, unknown> | null,
  importMeta: ResumeImportMeta | null
): boolean {
  if (!importMeta) return false;
  if (draft?._userEdited === true) {
    const draftEditedAt = Number(draft._userEditedAt ?? 0);
    if (draftEditedAt > importMeta.importedAt) return false;
  }
  const draftImportedAt = Number(draft?._importedAt ?? 0);
  return importMeta.importedAt >= draftImportedAt;
}

export function commitBuilderDraft(
  templateId: string,
  formData: Record<string, unknown>
): void {
  if (typeof window === 'undefined' || !templateId) return;
  const payload = {
    ...formData,
    _imported: formData._imported ?? true,
    _importedAt: formData._importedAt ?? Date.now(),
  };
  try {
    localStorage.setItem(draftStorageKey(templateId), JSON.stringify(payload));
  } catch {
    /* quota */
  }
}

export function readLocalDraft(templateId: string): Record<string, unknown> | null {
  if (typeof window === 'undefined' || !templateId) return null;
  const raw = localStorage.getItem(draftStorageKey(templateId));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function builderFormChecksum(data: Record<string, unknown>): string {
  const snapshot = {
    firstName: data.firstName,
    lastName: data.lastName,
    email: data.email,
    summary: data.summary,
    experience: data.experience,
    education: data.education,
    skills: data.skills,
    projects: data.projects,
    certifications: data.certifications,
    languages: data.languages,
    achievements: data.achievements,
    hobbies: data.hobbies,
    extendedSections: data.extendedSections,
    awards: data.awards,
    professionalHighlights: data.professionalHighlights,
  };
  const str = JSON.stringify(snapshot);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return `bf-${Math.abs(hash)}`;
}

export function isImportFlowActive(options: {
  shouldPrefill: boolean;
  sourceImport: boolean;
}): boolean {
  return shouldForceImportHydration(options);
}

/** Split fullName/name into firstName/lastName for ContactsStep when import only has combined name. */
export function ensureBuilderContactFields(
  data: Record<string, unknown>
): Record<string, unknown> {
  const out = { ...data };
  const first = String(out.firstName ?? '').trim();
  const last = String(out.lastName ?? '').trim();
  const combined = [first, last].filter(Boolean).join(' ').trim();
  const locationHint = String(out.location || out.address || '');

  if (combined && isValidatedContactName(combined, locationHint)) {
    return out;
  }

  // Partial or stale first/last parts — rebuild from fullName when available.
  const fullEarly = String(out.fullName || out.name || '').trim();
  if (fullEarly && (!first || !last)) {
    const safeFullEarly = sanitizePersonName(fullEarly, 120);
    if (safeFullEarly && isValidatedContactName(safeFullEarly, locationHint)) {
      const parts = safeFullEarly.split(/\s+/).filter(Boolean);
      const repairedEarly = repairStuckContactNameParts(
        parts[0] ?? '',
        parts.slice(1).join(' '),
        safeFullEarly
      );
      out.firstName = (repairedEarly.firstName || parts[0]) ?? '';
      out.lastName = repairedEarly.lastName || parts.slice(1).join(' ');
      out.name = [out.firstName, out.lastName].filter(Boolean).join(' ').trim() || safeFullEarly;
      out.fullName = out.name;
      out['Full Name'] = out.name;
      return out;
    }
  }

  const full = String(out.fullName || out.name || '').trim();
  if (!full) return out;

  const safeFull = sanitizePersonName(full, 120);
  if (!safeFull) {
    out.firstName = '';
    out.lastName = '';
    out.fullName = '';
    out.name = '';
    return out;
  }

  const parts = safeFull.split(/\s+/).filter(Boolean);
  const repaired = repairStuckContactNameParts(
    parts[0] ?? '',
    parts.slice(1).join(' '),
    safeFull
  );
  out.firstName = (repaired.firstName || parts[0]) ?? '';
  out.lastName = repaired.lastName || parts.slice(1).join(' ');
  out.name = [out.firstName, out.lastName].filter(Boolean).join(' ').trim() || safeFull;
  out.fullName = out.name;
  out['Full Name'] = out.name;
  return out;
}

/** Keep canonical contact aliases in sync whenever import data is normalized. */
export function syncBuilderContactAliases(
  data: Record<string, unknown>
): Record<string, unknown> {
  const out = ensureBuilderContactFields({ ...data });
  const first = String(out.firstName ?? '').trim();
  const last = String(out.lastName ?? '').trim();
  const combined = [first, last].filter(Boolean).join(' ').trim();
  const full = String(out.fullName || out.name || combined || '').trim();
  if (full) {
    out.fullName = full;
    out.name = full;
    out['Full Name'] = full;
  }
  return out;
}

/** Sync experience aliases so editor forms match template preview fields. */
export function normalizeImportedFormForEditor(
  data: Record<string, unknown>
): Record<string, unknown> {
  const out = syncBuilderContactAliases({ ...data });
  const withExperience = backfillImportedExperienceForDisplay(out);
  if (Array.isArray(withExperience.experience)) {
    const normalized = (withExperience.experience as Record<string, unknown>[]).map((entry) =>
      syncExperienceEntryAliases(entry && typeof entry === 'object' ? entry : {}, {
        reconcileHeaders: false,
      })
    );
    withExperience.experience = normalized;
    withExperience['Work Experience'] = normalized;
    withExperience.Experience = normalized;
  }
  return withExperience;
}

/**
 * Gallery + editor must use the same coalesced builder payload.
 * Safe to call synchronously on the client before template load.
 */
export function resolveEditorFormFromImport(): Record<string, unknown> | null {
  const raw = readPendingImportRaw();
  if (!raw) return null;
  try {
    const coalesced = coalesceBuilderImportPayload(raw);
    if (hasImportableContent(coalesced)) {
      return normalizeImportedFormForEditor(coalesced);
    }
  } catch {
    /* fall through — gallery uses the same raw-session fallback */
  }
  if (hasImportableContent(raw)) {
    try {
      return normalizeImportedFormForEditor(ensureBuilderContactFields(raw));
    } catch {
      return ensureBuilderContactFields(raw);
    }
  }
  return null;
}

/**
 * Resolve form data for template gallery previews — once per gallery render, not per card.
 * Skips heavy re-coalesce when the session payload is already finalized.
 */
export function prepareGalleryPreviewFormData(
  formData: Record<string, unknown>
): Record<string, unknown> {
  if (isGalleryEmptyFormData(formData)) {
    return {};
  }
  if (formData._builderCoalesced === true) {
    return backfillImportedExperienceForDisplay(ensureBuilderContactFields(formData));
  }
  try {
    const coalesced = coalesceBuilderImportPayload(formData);
    const base = hasImportableContent(coalesced) ? coalesced : formData;
    return backfillImportedExperienceForDisplay(ensureBuilderContactFields(base));
  } catch {
    return backfillImportedExperienceForDisplay(ensureBuilderContactFields(formData));
  }
}

/** Per-template demo payload when gallery has no user import data. */
export function prepareGalleryTemplatePreviewData(
  formData: Record<string, unknown>,
  templateId: string
): Record<string, unknown> {
  if (isGalleryEmptyFormData(formData)) {
    return buildGallerySampleFormData(templateId);
  }
  return prepareGalleryPreviewFormData(formData);
}

export function logBuilderHydration(
  source: string,
  detail: Record<string, unknown>
): void {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[builder-hydration] ${source}`, detail);
  }
}
