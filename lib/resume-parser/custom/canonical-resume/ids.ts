/**
 * Deterministic stable IDs for canonical resume graph nodes.
 *
 * Same content + index → same id across runs (no randomness, no timestamps).
 */

export type CanonicalNodeNamespace =
  | 'identity'
  | 'summary'
  | 'exp'
  | 'proj'
  | 'edu'
  | 'skill'
  | 'lang'
  | 'cert';

function normalizePart(value: string | null | undefined): string {
  return (value || '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

/** FNV-1a 32-bit — deterministic, fast, no crypto dependency. */
export function fnv1a32(input: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

export function deterministicNodeId(
  namespace: CanonicalNodeNamespace,
  index: number,
  signatureParts: Array<string | null | undefined>
): string {
  const signature = signatureParts.map(normalizePart).join('|');
  const seed = `${namespace}:${index}:${signature}`;
  const hash = fnv1a32(seed).toString(16).padStart(8, '0');
  return `${namespace}_${hash}`;
}

export function identityNodeId(data: {
  fullName?: string;
  email?: string;
  phone?: string;
}): string {
  return deterministicNodeId('identity', 0, [data.fullName, data.email, data.phone]);
}

export function summaryNodeId(summary: string): string {
  const snippet = (summary || '').slice(0, 120);
  return deterministicNodeId('summary', 0, [snippet, String((summary || '').length)]);
}

export function experienceNodeId(
  index: number,
  data: { company?: string; position?: string; startDate?: string }
): string {
  return deterministicNodeId('exp', index, [data.company, data.position, data.startDate]);
}

export function projectNodeId(
  index: number,
  data: { name?: string; url?: string; startDate?: string }
): string {
  return deterministicNodeId('proj', index, [data.name, data.url, data.startDate]);
}

export function educationNodeId(
  index: number,
  data: { institution?: string; degree?: string; endDate?: string }
): string {
  return deterministicNodeId('edu', index, [data.institution, data.degree, data.endDate]);
}

export function skillNodeId(index: number, name: string): string {
  return deterministicNodeId('skill', index, [name]);
}

export function languageNodeId(index: number, name: string, proficiency?: string): string {
  return deterministicNodeId('lang', index, [name, proficiency]);
}

export function certificationNodeId(
  index: number,
  data: { name?: string; issuer?: string; date?: string }
): string {
  return deterministicNodeId('cert', index, [data.name, data.issuer, data.date]);
}
