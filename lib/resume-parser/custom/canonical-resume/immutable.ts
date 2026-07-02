/**
 * Immutability helpers — CanonicalResume is frozen at construction.
 */

import type { CanonicalResume, CanonicalResumeSnapshot } from './types';

function freezeDeep<T>(value: T): T {
  if (value === null || typeof value !== 'object') return value;

  if (Array.isArray(value)) {
    for (const item of value) freezeDeep(item);
    return Object.freeze(value) as T;
  }

  const record = value as Record<string, unknown>;
  for (const key of Object.keys(record)) {
    freezeDeep(record[key]);
  }
  return Object.freeze(value) as T;
}

export function freezeCanonicalResume(resume: CanonicalResume): CanonicalResume {
  return freezeDeep(resume);
}

export function isFrozenCanonicalResume(resume: CanonicalResume): boolean {
  return Object.isFrozen(resume);
}

export function cloneCanonicalSnapshot(resume: CanonicalResume): CanonicalResumeSnapshot {
  return JSON.parse(JSON.stringify(resume)) as CanonicalResumeSnapshot;
}
