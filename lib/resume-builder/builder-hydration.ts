/**
 * Builder editor hydration — single source of truth priority.
 * Parser/import → session → localStorage draft. Never load stale draft over fresh import.
 */

import {
  coalesceBuilderImportPayload,
  hasImportableContent,
} from './import-transformer';

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

export function writeImportSession(
  payload: Record<string, unknown>,
  meta?: Partial<ResumeImportMeta>
): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const importId =
      meta?.importId ||
      (typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `import-${Date.now()}`);
    const importedAt = meta?.importedAt ?? Date.now();
    const enriched = {
      ...payload,
      _imported: true,
      _importedAt: importedAt,
      _importSessionId: importId,
    };
    sessionStorage.setItem(RESUME_IMPORT_STORAGE_KEY, JSON.stringify(enriched));
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
  if (first || last) return out;

  const full = String(out.fullName || out.name || '').trim();
  if (!full) return out;

  const parts = full.split(/\s+/).filter(Boolean);
  out.firstName = parts[0] ?? '';
  out.lastName = parts.slice(1).join(' ');
  out.name = full;
  out['Full Name'] = full;
  return out;
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
    if (!hasImportableContent(coalesced)) return null;
    return ensureBuilderContactFields(coalesced);
  } catch {
    return null;
  }
}

export function logBuilderHydration(
  source: string,
  detail: Record<string, unknown>
): void {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[builder-hydration] ${source}`, detail);
  }
}
