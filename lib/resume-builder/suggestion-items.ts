/**
 * Immutable suggestion list state for resume-builder inline AI.
 * Apply marks items; fetch merges — never replace the whole list on apply.
 */

import { normalizeForCompare } from '@/lib/resume-builder/suggestion-orchestrator';

export interface SuggestionItem {
  id: string;
  text: string;
  applied: boolean;
}

export function createSuggestionId(): string {
  return `sg-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function markItemApplied(items: SuggestionItem[], text: string): SuggestionItem[] {
  const norm = normalizeForCompare(text);
  return items.map((item) => ({
    ...item,
    applied: item.applied || normalizeForCompare(item.text) === norm,
  }));
}

export function markAllApplied(items: SuggestionItem[]): SuggestionItem[] {
  return items.map((item) => ({ ...item, applied: true }));
}

/** Build items from API strings, preserving applied flags for matching text. */
export function stringsToItems(texts: string[], existing: SuggestionItem[] = []): SuggestionItem[] {
  const existingByNorm = new Map(
    existing.map((item) => [normalizeForCompare(item.text), item])
  );
  return texts.map((text) => {
    const norm = normalizeForCompare(text);
    const prev = existingByNorm.get(norm);
    if (prev) {
      return { ...prev, text };
    }
    return { id: createSuggestionId(), text, applied: false };
  });
}

export type MergeMode = 'replace-unapplied' | 'append-new' | 'replace-all';

/**
 * Merge API results into current list without dropping unrelated cards.
 */
export function mergeSuggestionItems(
  current: SuggestionItem[],
  fetchedTexts: string[],
  mode: MergeMode
): SuggestionItem[] {
  if (!fetchedTexts.length) {
    return current;
  }

  const fetchedItems = stringsToItems(fetchedTexts, current);

  if (mode === 'replace-all') {
    return fetchedItems;
  }

  if (mode === 'replace-unapplied') {
    const applied = current.filter((i) => i.applied);
    const appliedNorms = new Set(applied.map((i) => normalizeForCompare(i.text)));
    const fresh = fetchedItems.filter(
      (i) => !appliedNorms.has(normalizeForCompare(i.text))
    );
    return [...applied, ...fresh];
  }

  // append-new: keep entire current list, add unseen texts
  const seen = new Set(current.map((i) => normalizeForCompare(i.text)));
  const additions = fetchedItems.filter(
    (i) => !seen.has(normalizeForCompare(i.text))
  );
  return [...current, ...additions];
}

export function mergeStringSuggestions(
  current: string[],
  fetched: string[],
  mode: MergeMode
): string[] {
  const items = mergeSuggestionItems(
    stringsToItems(current),
    fetched,
    mode
  );
  return items.map((i) => i.text);
}

export function itemsToDisplayTexts(items: SuggestionItem[]): string[] {
  return items.map((i) => i.text);
}

export function pickMergeMode(
  current: SuggestionItem[],
  options?: { regenerate?: boolean; source?: 'auto' | 'manual' }
): MergeMode {
  if (options?.regenerate) return 'replace-unapplied';
  if (current.length === 0) return 'replace-unapplied';
  if (current.some((i) => i.applied) && options?.source === 'auto') {
    return 'append-new';
  }
  return 'replace-unapplied';
}
