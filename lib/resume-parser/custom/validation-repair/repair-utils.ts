/**
 * Safe repair helpers — never overwrite a valid extracted value with a weaker one.
 */

export function hasFieldValue(value: string | null | undefined): boolean {
  return Boolean(String(value ?? '').trim());
}

export function isValidExtractedValue(
  value: string,
  validator?: (v: string) => boolean
): boolean {
  const trimmed = value.trim();
  if (!trimmed) return false;
  return validator ? validator(trimmed) : true;
}

/**
 * Apply a recovered value only when:
 * - current is empty, or
 * - current is invalid and recovered is valid with higher confidence.
 */
export function resolveSafeRepair(
  current: string,
  recovered: string,
  currentConfidence: number,
  recoveredConfidence: number,
  isValid?: (v: string) => boolean
): string {
  const cur = current.trim();
  const rec = recovered.trim();
  if (!rec) return cur;
  if (!cur) return rec;

  const curValid = isValidExtractedValue(cur, isValid);
  const recValid = isValid ? isValid(rec) : true;

  if (curValid) return cur;
  if (recValid && recoveredConfidence > currentConfidence) return rec;
  return cur;
}

/** Whether a repair that changes a non-empty field should be recorded/applied. */
export function shouldApplyRepair(
  current: string,
  recovered: string,
  currentConfidence: number,
  recoveredConfidence: number,
  isValid?: (v: string) => boolean
): boolean {
  const resolved = resolveSafeRepair(
    current,
    recovered,
    currentConfidence,
    recoveredConfidence,
    isValid
  );
  return resolved.trim() !== current.trim();
}
