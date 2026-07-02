/**
 * Detect upload profiles produced by the custom resume parser so the Builder
 * mapping layer can skip legacy OCR / text-recovery merges.
 */

export function isCustomParserImport(
  data: Record<string, unknown> | null | undefined
): boolean {
  if (!data || typeof data !== 'object') return false;
  if (data.customParserUsed === true) return true;
  if (data.selectedParser === 'custom') return true;
  const provider = String(data._aiProvider || data.aiProvider || '')
    .trim()
    .toLowerCase();
  return provider === 'custom-parser' || provider === 'custom';
}
